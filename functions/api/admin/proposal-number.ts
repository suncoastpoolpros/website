/**
 * POST /api/admin/proposal-number — reserve the next proposal number.
 *
 * Called by the builder immediately before it renders the PDF, because the
 * number has to be printed ON that PDF and the quote row doesn't exist yet.
 * The same number then travels with the send payload and is stored with the
 * quote, so the PDF, the email and the approve page all say the same thing.
 *
 * POST rather than GET: this mutates a counter. A GET that increments something
 * is the kind of thing a link prefetcher will happily burn a hundred of.
 *
 * Returns { number: null } rather than an error when storage isn't available.
 * Numbering is a nicety; failing the send over it would be the tail wagging the
 * dog, and the builder is written to carry on without one.
 */
import { reserveProposalNumber } from '../_quotes';
import { type AdminContext, json, isAllowedOrigin, requireSession } from './_shared';

export const onRequestPost = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) return json({ ok: false, error: 'forbidden' }, 403);
    const denied = await requireSession(request, env);
    if (denied) return denied;

    const number = await reserveProposalNumber((env as unknown as { DB?: unknown }).DB);
    return json({ ok: true, number }, 200, { 'cache-control': 'no-store' });
  } catch (err) {
    console.log('[admin/proposal-number] server_error:', String(err).slice(0, 300));
    // Still a 200 with a null number: the caller's job is to send a proposal,
    // not to care why numbering didn't work.
    return json({ ok: true, number: null }, 200, { 'cache-control': 'no-store' });
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
