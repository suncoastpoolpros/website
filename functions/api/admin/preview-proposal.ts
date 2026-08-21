/**
 * POST /api/admin/preview-proposal — render the covering email WITHOUT sending
 * it and without saving anything.
 *
 * Auth-gated, same as the send.
 *
 * WHY THIS IS A SEPARATE ENDPOINT and not a `preview: true` flag on
 * /send-proposal: a flag that is misread, dropped in a refactor, or lost in a
 * bad merge emails a customer. Here there is no flag to get wrong — this route
 * calls neither Resend nor saveQuote, so the worst a bug in it can do is
 * render the wrong words on your own screen.
 *
 * It does import the SENDER'S composer rather than describing the email a
 * second time, which is the whole point: a preview written from its own copy
 * of the template is a preview of something the customer never receives.
 * (Importing a route module doesn't register its handlers — Pages routes by
 * file path, so /preview-proposal only ever runs what is exported here.)
 *
 * The payload is the same shape as the send MINUS the PDF and the photos. The
 * email body never contained either (the PDF is an attachment, the photos are
 * inside it), so asking the browser to upload megabytes to preview a few
 * hundred words would make the review step feel like the send it precedes.
 */
import { proposalNumberOrNull, quoteUrl } from '../_quotes';
import {
  type AdminContext,
  json,
  isAllowedOrigin,
  readBoundedText,
  requireSession,
} from './_shared';
import { composeProposalEmail, proposalSubject, type SendProposalPayload } from './send-proposal';

/**
 * No PDF and no photos ride on this request, so the cap is sized for the
 * proposal JSON and the operator's note rather than for an attachment.
 */
const MAX_BODY_BYTES = 512 * 1024;

/**
 * A placeholder for the accept link, because the real one does not exist yet:
 * the token is minted by saveQuote at send time, and minting one here would
 * leave a row behind for every proposal that was previewed and then reworded.
 *
 * Valid Crockford base32 (the alphabet has no i, l, o or u) so it renders in
 * the same shape the customer will see, and all-zero so it can't be mistaken
 * for a working link. Nothing can follow it: the review step renders this HTML
 * in a fully sandboxed iframe, which blocks navigation outright.
 */
const SAMPLE_TOKEN = '0000000';

export const onRequestPost = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    const denied = await requireSession(request, env);
    if (denied) return denied;

    let payload: SendProposalPayload;
    try {
      payload = JSON.parse(await readBoundedText(request, MAX_BODY_BYTES)) as SendProposalPayload;
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400);
    }

    // Deliberately NOT validated against EMAIL_RE. The review step opens before
    // the address is checked so a typo in it is one of the things you are there
    // to catch — refusing to render the email you are proofreading, because of
    // a field the email does not contain, would be the wrong place to say so.
    const acceptLink = quoteUrl(
      new URL(request.url).origin,
      SAMPLE_TOKEN,
      proposalNumberOrNull(payload.proposalNumber),
    );
    const { html, text, defaultGreeting } = composeProposalEmail(payload, env, acceptLink);

    return json(
      { ok: true, subject: proposalSubject(payload), html, text, defaultGreeting },
      200,
    );
  } catch (err) {
    console.log('[admin/preview-proposal] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
