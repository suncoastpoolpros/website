/**
 * GET /api/admin/quotes — every quote sent, with its status.
 *
 * Auth-gated by the same PIN session as the rest of /api/admin. This returns
 * customer contact details for every quote ever sent, so it must never be
 * reachable the way the public /api/quote/:token endpoint is.
 *
 * Shapes the rows for display here rather than in the browser: the price shown
 * on a row depends on which plan was accepted (or which was recommended, if
 * none has been), and that logic belongs next to the data rather than
 * duplicated in a component.
 */
import { listQuotes } from '../_quotes';
import { type AdminContext, json, isAllowedOrigin, requireSession } from './_shared';

type Tier = { name?: string; price?: string; recommended?: boolean };
type StoredProposal = { tiers?: Tier[]; price?: string; pricingMode?: string };

export const onRequestGet = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    const rows = await listQuotes((env as unknown as { DB?: unknown }).DB);
    // null means storage isn't configured — a different situation from "no
    // quotes yet", and the UI says so.
    if (rows === null) return json({ ok: true, storage: false, quotes: [] }, 200);

    const quotes = rows.map((row) => {
      let proposal: StoredProposal = {};
      try {
        proposal = JSON.parse(row.proposal_json) as StoredProposal;
      } catch {
        /* a row we can't parse still deserves to be listed */
      }
      const tiers = proposal.tiers ?? [];
      const accepted = row.accepted_plan?.trim() ?? '';
      // The price that matters: what they accepted, else what we recommended,
      // else the single quoted price.
      const acceptedTier = tiers.find((t) => (t.name ?? '').trim() === accepted);
      const headline = tiers.find((t) => t.recommended) ?? tiers[0];
      const price = (acceptedTier?.price ?? headline?.price ?? proposal.price ?? '').trim();

      return {
        id: row.id,
        name: row.customer_name,
        email: row.customer_email,
        phone: row.customer_phone,
        address: row.customer_address,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        acceptedAt: row.accepted_at,
        acceptedPlan: row.accepted_plan,
        price,
        planNames: tiers.map((t) => (t.name ?? '').trim()).filter(Boolean),
      };
    });

    return json({ ok: true, storage: true, quotes }, 200, { 'cache-control': 'no-store' });
  } catch (err) {
    console.log('[admin/quotes] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
