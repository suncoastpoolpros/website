/**
 * GET /api/admin/aerial?bbox=minLng,minLat,maxLng,maxLat&w=320&h=240
 *
 * One lot's view from the county's latest aerial photo (Aerials2026, about
 * 3 inches a pixel), for the lead finder's pool check. Proxied so the image is
 * same-origin: the browser can then read its pixels to look for water inside
 * the lot outline, which a cross-origin image would forbid.
 *
 * Behind the PIN session (it spends requests on the county's image server),
 * and bounded: Pinellas only, a box no bigger than a few lots, at most 640px.
 */
import { type AdminContext, json, requireSession } from './_shared';

const IMAGE = 'https://egis.pinellas.gov/gis/rest/services/Aerials2026/ImageServer/exportImage';
/** About 1 km either way: far more than any house lot needs. */
const MAX_SPAN = 0.01;

export const onRequestGet = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  const denied = await requireSession(request, env);
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const box = (params.get('bbox') ?? '').split(',').map(Number);
  const w = Number(params.get('w'));
  const h = Number(params.get('h'));
  const [minX, minY, maxX, maxY] = box;
  const ok =
    box.length === 4 &&
    box.every(Number.isFinite) &&
    minX < maxX &&
    minY < maxY &&
    maxX - minX <= MAX_SPAN &&
    maxY - minY <= MAX_SPAN &&
    minY > 27.5 &&
    maxY < 28.3 &&
    minX > -83 &&
    maxX < -82.4 &&
    Number.isInteger(w) &&
    Number.isInteger(h) &&
    w >= 32 &&
    w <= 640 &&
    h >= 32 &&
    h <= 640;
  if (!ok) return json({ ok: false, error: 'bad_request' }, 400);

  const url = new URL(IMAGE);
  url.search = new URLSearchParams({
    bbox: box.join(','),
    bboxSR: '4326',
    size: `${w},${h}`,
    format: 'jpg',
    f: 'image',
  }).toString();
  try {
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(20_000) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('image/')) {
      console.log('[admin/aerial] county_status:', res.status, type.slice(0, 40));
      return json({ ok: false, error: 'county_unavailable' }, 502);
    }
    return new Response(res.body, {
      status: 200,
      // A lot's photo doesn't change between searches: keep it a day, privately.
      headers: { 'content-type': type, 'cache-control': 'private, max-age=86400' },
    });
  } catch (err) {
    console.log('[admin/aerial] county_failed:', err instanceof Error ? err.name : 'unknown');
    return json({ ok: false, error: 'county_unavailable' }, 502);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
