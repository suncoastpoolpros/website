/**
 * POST /api/admin/save-commercial — record a commercial bid.
 *
 * Auth-gated. Saves on download, because that is the moment the bid becomes a
 * real thing you handed to somebody.
 *
 * WHY THE SAME TABLE AS RESIDENTIAL QUOTES. The question the record has to
 * answer is identical whichever kind it is — "what did we quote this property,
 * for how much, and when" — and the answer belongs in one place. A second table
 * would mean a second list, a second numbering story, and two things to check
 * before saying what is outstanding. The document kind lives inside
 * proposal_json (see docKindOf), so this needed no migration.
 *
 * NO CUSTOMER LINK IS ISSUED. The row has a token because the token is the
 * primary key, but a commercial bid is not accepted by tapping a link — it goes
 * into a board packet and comes back countersigned — and the approve page is
 * built to render a residential proposal. Serving one there would show a board
 * a broken version of their own bid, so /api/quote/:token refuses these rows
 * outright.
 */
import { proposalNumberOrNull, saveQuote, updateQuote } from '../_quotes';
import {
  type AdminContext,
  json,
  isAllowedOrigin,
  readBoundedText,
  requireSession,
} from './_shared';

/** No PDF and no photos ride on this — it is the bid's data, not its rendering. */
const MAX_BODY_BYTES = 512 * 1024;

type Payload = {
  /** Present on a re-save: the row to overwrite rather than duplicate. */
  token?: string | null;
  property?: { name?: string; address?: string; email?: string; phone?: string };
  bodies?: unknown;
  bid?: unknown;
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

    const property = payload.property ?? {};
    /**
     * The property name is what makes the row findable in a list of bids, and
     * unlike a residential quote there is no address-only case to accommodate:
     * you cannot survey an association's pools without learning what it is
     * called. An unnamed row would be indistinguishable from every other.
     */
    if (!String(property.name ?? '').trim()) {
      return json({ ok: false, error: 'property_name_required' }, 400);
    }

    const record = {
      customer: {
        name: String(property.name ?? '').trim(),
        email: String(property.email ?? '').trim(),
        address: String(property.address ?? '').trim(),
        phone: String(property.phone ?? '').trim(),
      },
      // The bodies of water go where a residential quote keeps its pool: it is
      // the same question, asked of a property with more than one answer.
      pool: { bodies: payload.bodies ?? [] },
      proposal: { docKind: 'commercial', bid: payload.bid ?? {}, bodies: payload.bodies ?? [] },
    };

    const db = (env as { DB?: unknown }).DB;
    const existing = String(payload.token ?? '').trim();

    // Re-download after fixing a typo is the normal case, so an existing row is
    // edited rather than duplicated. If it has since been deleted, fall through
    // and insert — losing the record entirely would be the worse outcome.
    if (existing && (await updateQuote(db, existing, record))) {
      return json({ ok: true, token: existing, updated: true }, 200);
    }

    const token = await saveQuote(db, {
      ...record,
      number: proposalNumberOrNull(payload.proposalNumber),
    });
    if (!token) return json({ ok: false, error: 'storage_unavailable' }, 503);

    return json({ ok: true, token, updated: false }, 200);
  } catch (err) {
    console.log('[admin/save-commercial] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
