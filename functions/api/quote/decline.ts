/**
 * POST /api/quote/decline — the customer tells us why a quote went away.
 *
 * "Awaiting" was a bucket everything fell into and nothing ever left. A quote
 * opened four times and never accepted looked identical to one sent yesterday,
 * and the difference between them is the most useful thing a small service
 * business can learn: price, timing, a competitor, sold the house. Each implies
 * a different action, and two of them are recoverable.
 *
 * DELIBERATELY NOT DESTRUCTIVE. Nothing is deleted, the link keeps working, and
 * the quote can still be accepted afterwards — people change their minds, and
 * someone who declined on price in March and rings back in June should not find
 * a dead link. Declining twice overwrites the reason, because the later answer
 * is the truer one.
 *
 * NO SIGNATURE, NO CONSENT GATE, NO EMAIL TO THE CUSTOMER. Accepting is an
 * agreement and is evidenced accordingly; declining is a favour, and every
 * additional field is a reason to close the tab instead. The business is
 * notified — that is the whole point — but the customer's side ends here.
 */
import {
  getQuote,
  isDeclineReason,
  isThrottled,
  recordDecline,
  recordLookupFailure,
} from '../_quotes';
import { sendViaResend } from '../admin/_shared';

type Ctx = {
  request: Request;
  env: {
    DB?: unknown;
    RESEND_API_KEY?: string;
    PROPOSAL_FROM_EMAIL?: string;
    PROPOSAL_REPLY_TO?: string;
    CONTACT_TO_EMAIL?: string;
  };
  waitUntil?: (p: Promise<unknown>) => void;
};

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));

/** Free text is optional and capped. Long enough for a real paragraph, short
 *  enough that a paste of someone's novel doesn't land in the database. */
const NOTE_MAX = 2000;

export const onRequestPost = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;

  let body: { token?: string; reason?: string; note?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  const token = String(body.token ?? '').trim();
  const reason = String(body.reason ?? '').trim();
  if (!token || !isDeclineReason(reason)) return json({ ok: false, error: 'bad_request' }, 400);
  const note = String(body.note ?? '').slice(0, NOTE_MAX).trim();

  /**
   * Same throttle as accepting, and for the same reason: this endpoint also
   * reveals whether a token exists (404 versus 200), so leaving it open would
   * make the limit on the GET decorative — an attacker would simply guess here
   * instead. Counted only when the TOKEN misses, so a real customer never
   * touches it.
   */
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (await isThrottled(env.DB, ip)) return json({ ok: false, error: 'not_found' }, 429);

  const row = await getQuote(env.DB, token);
  if (!row) {
    ctx.waitUntil?.(recordLookupFailure(env.DB, ip));
    return json({ ok: false, error: 'not_found' }, 404);
  }

  /**
   * A quote they already accepted is not declined by a later tap. Reported back
   * rather than recorded: the acceptance is the agreement, and letting a stray
   * click on an old tab overwrite it would lose a signed decision.
   */
  if (row.accepted_at) {
    return json({ ok: true, alreadyAccepted: true, at: row.accepted_at }, 200);
  }

  // A stale price does NOT block a decline. The whole value is hearing why, and
  // "I looked at this three weeks late" is still worth knowing — refusing the
  // one piece of feedback we asked for would be perverse.
  const recorded = await recordDecline(env.DB, row.id, reason, note);

  // After the response, never before it. The customer has done us a favour;
  // they should not wait on our bookkeeping or our email.
  if (recorded) ctx.waitUntil?.(notify(env, row, reason, note));

  // `recorded: false` is reported honestly but is NOT an error for the
  // customer — they answered, and telling them it failed would be asking them
  // to do it again for our benefit.
  return json({ ok: true, recorded }, 200);
};

/** Tell the business. This is the entire point of the feature. */
async function notify(
  env: Ctx['env'],
  row: { id: string; number?: number | null; customer_name: string; customer_email: string },
  reason: string,
  note: string,
): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL || env.PROPOSAL_REPLY_TO;
  const from = env.PROPOSAL_FROM_EMAIL || 'service@suncoastpoolpros.com';
  if (!apiKey || !to) return;

  const who = row.customer_name?.trim() || row.customer_email?.trim() || 'A customer';
  const num = row.number ? ` #${row.number}` : '';
  try {
    await sendViaResend(apiKey, {
      from: from.includes('<') ? from : `Suncoast Pool Pros <${from}>`,
      to,
      // Says the reason in the subject, because the reason IS the news and this
      // is a notification you want to triage from the lock screen.
      subject: `Quote${num} declined — ${reason}`,
      html: `<p><strong>${esc(who)}</strong> declined quote${esc(num)}.</p>
<p>Reason: <strong>${esc(reason)}</strong></p>
${note ? `<p>They added:</p><blockquote>${esc(note)}</blockquote>` : '<p>No note left.</p>'}
<p>The link still works and the quote can still be accepted.</p>`,
      text: [
        `${who} declined quote${num}.`,
        ``,
        `Reason: ${reason}`,
        note ? `They added: ${note}` : `No note left.`,
        ``,
        `The link still works and the quote can still be accepted.`,
      ].join('\n'),
      tags: [{ name: 'source', value: 'quote_declined' }],
    });
  } catch (err) {
    console.log('[quote/decline] notify_failed:', String(err).slice(0, 300));
  }
}

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
