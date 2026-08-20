/**
 * GET /api/quote/photo?t=<token>&i=<index> — one photo from a stored proposal.
 *
 * Exists so the customer's "Download full proposal" produces the SAME document
 * they were emailed. The photos are not in the quote JSON (see migrations/0005)
 * and nothing fetches them until that button is pressed.
 *
 * Query parameters rather than a nested /:token/photo/:idx route, so this does
 * not sit underneath the existing [token].ts dynamic route and leave the
 * matching order to be reasoned about.
 *
 * ONE PHOTO PER REQUEST. Eight downscaled phone photos are 2–3 MB; a single
 * response that large risks D1's result limit and stalls badly on a phone. The
 * caller walks indexes from 0 and stops at the first empty answer, so no count
 * is needed and page load pays nothing.
 *
 * Same trust model as the quote itself: the token IS the credential, and these
 * are photographs of the customer's own property, taken to produce the proposal
 * they were sent. Nothing here is returned that was not already in their inbox.
 */
import { getQuote, getQuotePhoto, isExpired, isThrottled, recordLookupFailure } from '../_quotes';

type Ctx = {
  request: Request;
  env: { DB?: unknown };
  waitUntil?: (p: Promise<unknown>) => void;
};

/** Matches the builder's MAX_PHOTOS. A ceiling, so a crafted index can't walk. */
const MAX_INDEX = 7;

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  try {
    const url = new URL(request.url);
    const token = (url.searchParams.get('t') ?? '').trim();
    const idx = Number(url.searchParams.get('i'));
    if (!token || !Number.isInteger(idx) || idx < 0 || idx > MAX_INDEX) {
      return json({ ok: false, error: 'not_found' }, 404);
    }

    // Throttled on the same budget as the quote lookup: this endpoint confirms
    // whether a token exists just as clearly, so leaving it open would be
    // another way around the limit.
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    if (await isThrottled(env.DB, ip)) return json({ ok: false, error: 'not_found' }, 429);

    const row = await getQuote(env.DB, token);
    if (!row) {
      ctx.waitUntil?.(recordLookupFailure(env.DB, ip));
      return json({ ok: false, error: 'not_found' }, 404);
    }
    if (isExpired(row)) return json({ ok: false, error: 'expired' }, 410);

    // A real token asking for an index past the end is the caller's normal
    // stop signal, not a miss — it must never count toward the throttle, or a
    // customer downloading their own proposal would throttle themselves.
    const dataUrl = await getQuotePhoto(env.DB, token, idx);
    return json({ ok: true, dataUrl: dataUrl ?? null }, 200);
  } catch (err) {
    console.log('[quote/photo] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
