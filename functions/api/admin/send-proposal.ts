/**
 * POST /api/admin/send-proposal — email a built proposal to the customer.
 *
 * Auth-gated: requires a valid admin session cookie (set by /api/admin/login).
 *
 * The admin's browser renders the proposal to a PDF and posts it here as base64.
 * We attach it and send via Resend, BCC'ing the business inbox so there's always
 * a sent-copy on record (the design is stateless — no proposal database). The
 * customer approves by replying "approved", so Reply-To points at the business
 * inbox, not the no-reply From address.
 */
import {
  type AdminContext,
  type AdminEnv,
  json,
  isAllowedOrigin,
  readBoundedText,
  requireSession,
  sendViaResend,
} from './_shared';

// PDFs are small one-pagers, but base64 inflates ~33%. 6 MB covers a generous
// proposal with a logo while still rejecting obvious abuse.
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const FIELD_MAX = 4000;

type Customer = { name?: string; address?: string; email?: string; phone?: string };
type Pool = {
  gallons?: string;
  length?: string;
  width?: string;
  avgDepth?: string;
  shape?: string;
  sanitization?: string;
  pump?: string;
  filter?: string;
  heater?: string;
  automation?: string;
  equipmentNotes?: string;
};
type Proposal = { scope?: string; price?: string };

type SendProposalPayload = {
  customer?: Customer;
  pool?: Pool;
  proposal?: Proposal;
  pdfBase64?: string;
  filename?: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

    const customer = payload.customer ?? {};
    const toEmail = String(customer.email ?? '').trim();
    if (!EMAIL_RE.test(toEmail)) {
      return json({ ok: false, error: 'invalid_customer_email' }, 400);
    }

    const apiKey = env.RESEND_API_KEY;
    const from = env.PROPOSAL_FROM_EMAIL || env.CONTACT_FROM_EMAIL;
    const replyTo = env.PROPOSAL_REPLY_TO || env.CONTACT_TO_EMAIL;
    const bcc = env.CONTACT_TO_EMAIL || env.PROPOSAL_REPLY_TO;
    if (!apiKey || !from) {
      const missing = [!apiKey && 'RESEND_API_KEY', !from && 'PROPOSAL_FROM_EMAIL/CONTACT_FROM_EMAIL']
        .filter(Boolean)
        .join(', ');
      return json({ ok: false, error: 'email_config_missing', detail: missing }, 500);
    }

    const { html, text } = composeProposalEmail(payload, env);
    const attachments =
      typeof payload.pdfBase64 === 'string' && payload.pdfBase64.length > 0
        ? [
            {
              filename: sanitizeFilename(payload.filename) || 'Suncoast-Pool-Proposal.pdf',
              // Strip a data: URI prefix if the client left one on.
              content: payload.pdfBase64.replace(/^data:[^;]+;base64,/, ''),
            },
          ]
        : undefined;

    try {
      await sendViaResend(apiKey, {
        from,
        to: toEmail,
        replyTo: replyTo || undefined,
        bcc: bcc || undefined,
        subject: `Your Pool Service Proposal — Suncoast Pool Pros`,
        html,
        text,
        attachments,
        tags: [{ name: 'source', value: 'admin_proposal' }],
      });
    } catch (err) {
      console.log('[admin/send-proposal] delivery_failed:', String(err).slice(0, 300));
      return json({ ok: false, error: 'delivery_failed', detail: String(err).slice(0, 300) }, 502);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.log('[admin/send-proposal] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);

// ----- email body -------------------------------------------------------

const composeProposalEmail = (
  p: SendProposalPayload,
  _env: AdminEnv,
): { html: string; text: string } => {
  const name = safe(String(p.customer?.name ?? '').trim(), 120);
  const greetingName = name ? name.split(/\s+/)[0] : 'there';
  const price = safe(String(p.proposal?.price ?? '').trim(), 40);
  const scope = safe(String(p.proposal?.scope ?? '').trim(), FIELD_MAX);

  const text = [
    `Hi ${greetingName},`,
    ``,
    `Thank you for the opportunity to earn your business. Your proposal from`,
    `Suncoast Pool Pros is attached as a PDF.`,
    ``,
    scope ? `Scope: ${scope}` : '',
    price ? `Total: ${price}` : '',
    ``,
    `To accept, simply reply "APPROVED" to this email and we'll get you scheduled.`,
    ``,
    `Questions? Just reply to this message.`,
    ``,
    `— Suncoast Pool Pros`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f6f8fc;padding:24px 0;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0a1628;color:#fff;padding:22px 24px;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;">Suncoast Pool Pros</div>
      <div style="font-size:19px;font-weight:600;margin-top:4px;">Your Pool Service Proposal</div>
    </div>
    <div style="padding:24px;color:#111827;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 14px;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 14px;">Thank you for the opportunity to earn your business. Your full proposal from Suncoast Pool Pros is attached to this email as a PDF.</p>
      ${scope ? `<p style="margin:0 0 14px;color:#374151;"><span style="color:#6b7280;">Scope:</span> ${escapeHtml(scope).replace(/\n/g, '<br>')}</p>` : ''}
      ${price ? `<div style="margin:18px 0;padding:14px 18px;background:#f1f6fb;border:1px solid #d6e6f3;border-radius:10px;font-size:16px;"><span style="color:#6b7280;">Total:</span> <strong style="color:#0f4d80;">${escapeHtml(price)}</strong></div>` : ''}
      <div style="margin:20px 0;padding:16px 18px;background:#eefaf0;border:1px solid #bfe7c6;border-radius:10px;">
        <strong style="color:#1d7a33;">To accept:</strong> just reply <strong>"APPROVED"</strong> to this email and we'll get you on the schedule.
      </div>
      <p style="margin:14px 0 0;color:#6b7280;font-size:13px;">Questions about anything? Simply reply to this message.</p>
    </div>
    <div style="padding:14px 24px;border-top:1px solid #f1f3f4;color:#9ca3af;font-size:12px;">Suncoast Pool Pros &middot; St. Petersburg, FL</div>
  </div>
</body></html>`.trim();

  return { html, text };
};

const sanitizeFilename = (name: unknown): string =>
  typeof name === 'string' ? name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) : '';

const safe = (s: string, max: number): string => s.slice(0, max);
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
