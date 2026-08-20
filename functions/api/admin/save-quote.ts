/**
 * POST /api/admin/save-quote — record a quote and hand back its link, WITHOUT
 * emailing anything.
 *
 * For the lead who texted asking for a price. Until this existed a quote could
 * only come into being as a side effect of sending an email, so a customer with
 * no email address couldn't be quoted at all — send-proposal rejects a missing
 * one outright, and saveQuote only ran inside that path.
 *
 * A SEPARATE endpoint rather than a `deliver: false` flag on send-proposal.
 * That endpoint's job is to put a proposal in someone's inbox; giving it a mode
 * where it deliberately doesn't is how a real proposal eventually goes
 * unsent-but-reported-fine. Two names, two jobs.
 *
 * No PDF is rendered here. The approve page regenerates it from the stored
 * quote on demand, so there is nothing to attach and nothing to carry.
 *
 * EMAIL IS OPTIONAL here and required by send-proposal, which is the whole
 * point of the split. The column is NOT NULL, so an absent address is stored as
 * '' — and the acceptance flow already treats a blank address as "no customer
 * copy to send" without failing the acceptance.
 */
import { approveUrl, proposalNumberOrNull, saveQuote } from '../_quotes';
import {
  type AdminContext,
  json,
  isAllowedOrigin,
  readBoundedText,
  requireSession,
} from './_shared';

// No PDF in this payload, so it's small — but a bound is still a bound.
const MAX_BODY_BYTES = 256 * 1024;

type Payload = {
  customer?: { name?: string; address?: string; email?: string; phone?: string };
  pool?: unknown;
  proposal?: unknown;
  proposalNumber?: number | null;
};

export const onRequestPost = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    let payload: Payload;
    try {
      payload = JSON.parse(await readBoundedText(request, MAX_BODY_BYTES)) as Payload;
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400);
    }

    const customer = payload.customer ?? {};
    // A name is the one thing required: the quote is addressed to somebody, and
    // "PREPARED FOR" with nothing after it is not a document you'd hand over.
    if (!String(customer.name ?? '').trim()) {
      return json({ ok: false, error: 'customer_name_required' }, 400);
    }

    const token = await saveQuote((env as { DB?: unknown }).DB, {
      customer,
      pool: payload.pool ?? {},
      proposal: payload.proposal ?? {},
      number: proposalNumberOrNull(payload.proposalNumber),
    });

    // Unlike send-proposal, a failed save here is a hard failure: the link IS
    // the deliverable. There's no email going out to fall back on.
    if (!token) return json({ ok: false, error: 'storage_unavailable' }, 503);

    return json(
      { ok: true, token, url: approveUrl(new URL(request.url).origin, token) },
      200,
      { 'cache-control': 'no-store' },
    );
  } catch (err) {
    console.log('[admin/save-quote] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
