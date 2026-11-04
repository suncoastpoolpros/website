/**
 * POST /api/admin/county-sales — recent Pinellas sales around one point, for
 * the lead finder. Body: { lat, lng, radius (miles), days (how far back) }.
 *
 * Behind the PIN session: it returns owner names and mailing addresses, which
 * are public record but are still a list of people, and it spends requests on
 * the county's server. The search point is used for the query and not stored.
 *
 * The filtering by price, property type and qualified sale happens in the
 * browser (leads/leadEngine.ts), so the page can count what each filter
 * removed. This only does what the county can do better: the radius and the
 * date window. See _countySales.ts for the two layers it reads.
 */
import { fetchCountySales } from '../_countySales';
import { type AdminContext, json, isAllowedOrigin, readBoundedText, requireSession } from './_shared';

/** Pinellas with a margin: a point outside this is a mistake, not a search. */
const inPinellas = (lat: number, lng: number) => lat > 27.5 && lat < 28.3 && lng > -83 && lng < -82.4;

/** Today in Florida as YYYY-MM-DD, and N days before it. */
const etDay = (offsetDays = 0): string => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
};

export const onRequestPost = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(await readBoundedText(request, 2048)) as Record<string, unknown>;
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400);
    }
    const { lat, lng, radius, days } = body;
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !inPinellas(lat, lng) ||
      typeof radius !== 'number' ||
      !(radius > 0 && radius <= 10) ||
      typeof days !== 'number' ||
      !(Number.isInteger(days) && days >= 1 && days <= 1460)
    ) {
      return json({ ok: false, error: 'bad_request' }, 400);
    }

    const today = etDay();
    try {
      const result = await fetchCountySales({
        lat,
        lng,
        radius,
        from: etDay(days),
        thisYear: Number(today.slice(0, 4)),
      });
      return json({ ok: true, today, ...result }, 200, { 'cache-control': 'no-store' });
    } catch (err) {
      console.log('[admin/county-sales] county_failed:', String(err).slice(0, 200));
      return json({ ok: false, error: 'county_unavailable' }, 502);
    }
  } catch (err) {
    console.log('[admin/county-sales] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
