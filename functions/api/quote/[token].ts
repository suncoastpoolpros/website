/**
 * GET /api/quote/:token — the quote behind an emailed approve link.
 *
 * PUBLIC and unauthenticated by necessity: the customer has no login. The token
 * IS the credential, which is why it's 256 random bits and expires. Everything
 * returned is already in the PDF sitting in their inbox, so a leaked link
 * exposes nothing they weren't sent — but it must not expose anything MORE, so
 * the acceptance evidence columns (IP, user agent) are never returned.
 */
import { getQuote, isExpired, isThrottled, recordLookupFailure, recordQuoteOpen } from '../_quotes';
import { hasAdminSession } from '../admin/_shared';

type Ctx = {
  request: Request;
  env: { DB?: unknown; ADMIN_SESSION_SECRET?: string };
  params: { token?: string | string[] };
  /** Pages keeps the worker alive for this after the response is sent. */
  waitUntil?: (p: Promise<unknown>) => void;
};

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // A quote link is per-customer and changes when accepted.
      'cache-control': 'no-store',
    },
  });

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const raw = ctx.params?.token;
  const token = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  if (!token) return json({ ok: false, error: 'not_found' }, 404);

  /**
   * The token is 7 characters — short enough to text, and only safe because
   * guessing is limited here. See newQuoteToken in ../_quotes.ts: the length and
   * this throttle are load-bearing for each other.
   *
   * Only MISSES are counted, so a customer refreshing their own quote is never
   * affected. The limit is 30 failures in 10 minutes per IP, far above anything
   * a person following a broken link produces, and the whole thing degrades open
   * if storage is unavailable.
   */
  const ip = ctx.request.headers.get('cf-connecting-ip') ?? '';
  if (await isThrottled(ctx.env.DB, ip)) {
    return json({ ok: false, error: 'not_found' }, 429);
  }

  const row = await getQuote(ctx.env.DB, token);
  // Same response for "no such token" and "storage unavailable": a probe
  // shouldn't be able to tell the difference.
  if (!row) {
    // Not awaited on the response path — the customer's 404 shouldn't wait on a
    // bookkeeping write, and Pages keeps the worker alive for it.
    ctx.waitUntil?.(recordLookupFailure(ctx.env.DB, ip));
    return json({ ok: false, error: 'not_found' }, 404);
  }
  if (isExpired(row)) return json({ ok: false, error: 'expired' }, 410);

  /**
   * Note that the customer looked.
   *
   * After the expiry check, so opening a dead link isn't logged as interest,
   * and skipped entirely when the request carries a valid admin session — the
   * owner previewing their own quote is not a customer opening it, and that
   * cookie IS sent here (same-site, __Host-, SameSite=Strict).
   *
   * waitUntil, never awaited: the customer's quote must load whether or not we
   * manage to record that they loaded it.
   */
  // row.id, not the request token: getQuote resolves a short token
  // case-insensitively, so a link that came back capitalised would otherwise
  // update zero rows and record nothing at all.
  const isOwner = await hasAdminSession(ctx.request, ctx.env);
  ctx.waitUntil?.(recordQuoteOpen(ctx.env.DB, row.id, isOwner));

  let pool: unknown = {};
  let proposal: unknown = {};
  try {
    pool = JSON.parse(row.pool_json);
    proposal = JSON.parse(row.proposal_json);
  } catch {
    return json({ ok: false, error: 'unreadable' }, 500);
  }

  return json(
    {
      ok: true,
      quote: {
        // Their own contact details, shown back so they can check we have them
        // right before accepting. All of it is already in the PDF they were
        // sent, so a leaked link exposes nothing new — but the acceptance
        // evidence columns (IP, user agent) are still never returned.
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        customerAddress: row.customer_address,
        // The proposal number, so the page and the PDF it regenerates say the
        // same thing as the document already in their inbox.
        number: row.number ?? null,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        pool,
        proposal,
        // Enough for the page to show "already accepted" without leaking who or
        // from where.
        acceptedAt: row.accepted_at,
        acceptedPlan: row.accepted_plan,
      },
    },
    200,
  );
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
