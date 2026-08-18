/**
 * GET /api/admin/quote/:id — one quote, in full.
 *
 * The list endpoint (/api/admin/quotes) deliberately selects only the columns it
 * needs to draw a row; this is the "open it" view, and it returns everything
 * stored: the pool as surveyed, every tier quoted, and — once accepted — the
 * signature, terms version, IP and user agent.
 *
 * That evidence is exactly why this lives under /api/admin and not next to the
 * public /api/quote/:token endpoint. Same id, two very different answers: the
 * customer gets their proposal back, the owner gets the record of it.
 *
 * Path is /api/admin/quote (singular) rather than a child of /api/admin/quotes
 * so there's no ambiguity between the collection file and a dynamic child route.
 */
import { deleteQuote, getQuote } from '../../_quotes';
import { type AdminContext, json, isAllowedOrigin, requireSession } from '../_shared';

type Ctx = AdminContext & { params: { id?: string | string[] } };

/** Stored JSON is only ever written by us, but a bad row shouldn't 500 the page. */
const parse = (raw: string | null | undefined): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

export const onRequestGet = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    const raw = ctx.params?.id;
    const id = (Array.isArray(raw) ? raw[0] : raw) ?? '';
    if (!id) return json({ ok: false, error: 'not_found' }, 404);

    const row = await getQuote((env as unknown as { DB?: unknown }).DB, id);
    // getQuote returns null both for "no such row" and "storage unavailable".
    // The list screen already tells the owner which of those is true, so a plain
    // 404 here is honest enough.
    if (!row) return json({ ok: false, error: 'not_found' }, 404);

    return json(
      {
        ok: true,
        quote: {
          id: row.id,
          number: row.number ?? null,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          customer: {
            name: row.customer_name,
            email: row.customer_email,
            phone: row.customer_phone,
            address: row.customer_address,
          },
          pool: parse(row.pool_json) ?? {},
          proposal: parse(row.proposal_json) ?? {},
          accepted: row.accepted_at
            ? {
                at: row.accepted_at,
                plan: row.accepted_plan,
                // Acceptance evidence. Owner-only, and the reason this endpoint
                // is auth-gated.
                ip: row.accepted_ip,
                userAgent: row.accepted_ua,
                termsVersion: row.terms_version,
                onboarding: parse(row.onboarding_json),
              }
            : null,
        },
      },
      200,
      { 'cache-control': 'no-store' },
    );
  } catch (err) {
    console.log('[admin/quote] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

/**
 * DELETE /api/admin/quote/:id — remove a quote for good.
 *
 * Same auth and same Origin check as the GET. The session cookie is
 * `__Host-` prefixed and SameSite=Strict, so a cross-site page can't ride it
 * even if it could guess an id — but the Origin check runs anyway, because a
 * destructive verb shouldn't rely on a single control.
 *
 * Reads the row first so an unknown id is an honest 404 rather than a
 * successful-looking DELETE that matched nothing.
 *
 * Deleting an ACCEPTED quote destroys the signed record with it: the typed
 * signature, the timestamp, the IP and the agreed terms version. The owner
 * confirms that in the UI; this endpoint doesn't refuse it, because it's a
 * record they own — but the handoff email remains the durable copy.
 */
export const onRequestDelete = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    const raw = ctx.params?.id;
    const id = (Array.isArray(raw) ? raw[0] : raw) ?? '';
    if (!id) return json({ ok: false, error: 'not_found' }, 404);

    const db = (env as unknown as { DB?: unknown }).DB;
    const row = await getQuote(db, id);
    if (!row) return json({ ok: false, error: 'not_found' }, 404);

    const gone = await deleteQuote(db, id);
    if (!gone) return json({ ok: false, error: 'delete_failed' }, 500);

    console.log(`[admin/quote] deleted ${id} (${row.customer_email})`);
    return json({ ok: true }, 200, { 'cache-control': 'no-store' });
  } catch (err) {
    console.log('[admin/quote] delete_server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
