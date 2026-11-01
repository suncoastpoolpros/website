/**
 * GET /api/address-suggest?q=4424 19th — address suggestions for the quote
 * form's address field, from Mapbox's geocoding API.
 *
 * Proxied rather than called from the browser so the Mapbox token never ships
 * in page code, and so lookups can be capped: every keystroke (debounced) is a
 * billed Mapbox request, and an open endpoint would let a script run up the
 * bill. Any failure (no token, over a cap, Mapbox down) returns an empty list,
 * and the field just works as a plain text box.
 *
 * THE TOKEN: read from VITE_MAPBOX_TOKEN, the name it was given in the Pages
 * dashboard. The VITE_ prefix would normally mean "public", but Vite only
 * bakes a VITE_ var into the client bundle where client code reads it, and
 * nothing in src/ does. Keep it that way: never read
 * import.meta.env.VITE_MAPBOX_TOKEN in src/. MAPBOX_TOKEN is accepted too, in
 * case it's renamed to the clearer server-only name later. The token must have
 * NO URL restrictions: server requests carry no Referer, so a URL-restricted
 * token rejects them.
 */
import { consume } from './_leads';

type Ctx = {
  request: Request;
  env: { DB?: unknown; VITE_MAPBOX_TOKEN?: string; MAPBOX_TOKEN?: string };
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Typing one address with the form's debounce is roughly 5–15 lookups, so 120
 * an hour per IP is generous for a person and a hard stop for a script. The
 * daily cap bounds the whole bill. Both FAIL CLOSED (no storage, no lookups):
 * suggestions are a nicety, the bill is not.
 */
const LIMITS = {
  perIp: { max: 120, windowMs: HOUR },
  perDay: { max: 3000, windowMs: DAY },
};

// Pinellas only, where every service area is: Fort De Soto up to Tarpon
// Springs at the Pasco line, ranked nearest St. Petersburg first (or the
// `near` city, below). A box can't
// trace the county (Tampa's Rocky Point and Westshore sit inside any box that
// reaches Oldsmar and St. Pete's east shore, and its top edge clips Pasco), so
// the box is a first cut and COUNTY does the rest: ask for extra results, drop
// those Mapbox places in another county, keep the best SHOW.
const PROXIMITY = '-82.64,27.77';
// A city page can rank its own city first (?near=clearwater). Named anchors
// only, never raw coordinates from the request.
const NEAR: Record<string, string> = {
  clearwater: '-82.80,27.97',
};
const BBOX = '-82.87,27.6,-82.54,28.18';
const COUNTY = 'Pinellas County';
const FETCH = 10; // Mapbox's maximum
const SHOW = 5;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const none = () => json({ suggestions: [] });

type MapboxFeature = {
  id?: string;
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    context?: {
      place?: { name?: string };
      /** The county, for US addresses. */
      district?: { name?: string };
      region?: { region_code?: string; name?: string };
      postcode?: { name?: string };
    };
  };
};

// `city` is Mapbox's place name, which the form matches against src/lib/cities.ts
// to say "we service this area" (only on an exact match).
export type AddressSuggestion = { id: string; line1: string; line2: string; full: string; city: string };

/**
 * "4424 19th St N, St. Petersburg, FL 33713": the shape splitAddress in
 * _poollogic.ts parses into street / city / state / ZIP. Mapbox's own
 * full_address spells the state out and appends the country, which that
 * parser can't split, so build it from the parts when they're all there.
 */
const toSuggestion = (f: MapboxFeature): AddressSuggestion | null => {
  const p = f.properties;
  const street = p?.name?.trim();
  if (!p || !street) return null;
  const city = p.context?.place?.name;
  const state = p.context?.region?.region_code;
  const zip = p.context?.postcode?.name;
  const full =
    city && state ? `${street}, ${city}, ${state}${zip ? ` ${zip}` : ''}` : (p.full_address ?? street).replace(/, United States$/, '');
  return {
    id: p.mapbox_id ?? f.id ?? full,
    line1: street,
    line2: city && state ? `${city}, ${state}${zip ? ` ${zip}` : ''}` : (p.place_formatted ?? '').replace(/, United States$/, ''),
    full,
    city: city ?? '',
  };
};

export const onRequestGet = async ({ request, env }: Ctx): Promise<Response> => {
  const token = env.VITE_MAPBOX_TOKEN || env.MAPBOX_TOKEN;
  if (!token) return none();

  // Cheap guard against other sites calling this from a browser. Not a
  // security boundary (scripts can send anything); the caps are.
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return none();

  const params = new URL(request.url).searchParams;
  const q = (params.get('q') ?? '').trim().replace(/\s+/g, ' ');
  const proximity = NEAR[params.get('near') ?? ''] ?? PROXIMITY;
  if (q.length < 3 || q.length > 120) return none();

  const ip = request.headers.get('cf-connecting-ip') ?? '';
  if (!(await consume(env.DB, `addr:ip:${ip}`, LIMITS.perIp))) return none();
  if (!(await consume(env.DB, 'addr:day', LIMITS.perDay))) return none();

  const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
  url.search = new URLSearchParams({
    q,
    autocomplete: 'true',
    country: 'us',
    types: 'address',
    limit: String(FETCH),
    proximity,
    bbox: BBOX,
    access_token: token,
  }).toString();

  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      // Status only: the URL carries the token, so it's never logged.
      console.log('[address-suggest] mapbox_status:', res.status);
      return none();
    }
    const data = (await res.json()) as { features?: MapboxFeature[] };
    // A result with no county named is kept: the box has already ruled out
    // anything far away, and dropping it could hide a real Pinellas address.
    const suggestions = (data.features ?? [])
      .filter((f) => {
        const county = f.properties?.context?.district?.name;
        return !county || county === COUNTY;
      })
      .map(toSuggestion)
      .filter((s): s is AddressSuggestion => !!s)
      .slice(0, SHOW);
    return json({ suggestions });
  } catch (err) {
    // The error's name only: a fetch error's message can echo the URL, token included.
    console.log('[address-suggest] mapbox_failed:', err instanceof Error ? err.name : 'unknown');
    return none();
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
