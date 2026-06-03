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
type Proposal = {
  scope?: string;
  price?: string;
  addOns?: Array<{ label?: string; price?: string }>;
  includeBenefits?: boolean;
};

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
    const fromEmail = env.PROPOSAL_FROM_EMAIL || env.CONTACT_FROM_EMAIL;
    const replyTo = env.PROPOSAL_REPLY_TO || env.CONTACT_TO_EMAIL;
    const bcc = env.CONTACT_TO_EMAIL || env.PROPOSAL_REPLY_TO;
    if (!apiKey || !fromEmail) {
      const missing = [!apiKey && 'RESEND_API_KEY', !fromEmail && 'PROPOSAL_FROM_EMAIL/CONTACT_FROM_EMAIL']
        .filter(Boolean)
        .join(', ');
      return json({ ok: false, error: 'email_config_missing', detail: missing }, 500);
    }
    // Show the business name in the inbox ("Suncoast Pool Pros") instead of the
    // bare noreply@ address. Resend accepts "Display Name <email@domain>".
    const from = fromEmail.includes('<') ? fromEmail : `${BIZ.name} <${fromEmail}>`;

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

// Business NAP — kept in sync with src/lib/contact.ts (functions can't import
// from the client src tree, so these are duplicated here intentionally).
const BIZ = {
  name: 'Suncoast Pool Pros',
  phoneDisplay: '(727) 295-3621',
  phoneHref: 'tel:+17272953621',
  websiteDisplay: 'suncoastpoolpros.com',
  websiteHref: 'https://www.suncoastpoolpros.com',
  logo: 'https://suncoastpoolpros.com/email-logo.png',
  address: '1701 Central Ave, Unit 279 · St. Petersburg, FL 33713',
  hours: 'Mon–Sat, 8 AM–6 PM',
  serviceAgreementHref: 'https://suncoastpoolpros.com/service-agreement',
  serviceAgreementDisplay: 'suncoastpoolpros.com/service-agreement',
};

// "What's included" highlight — mirrors src/components/admin/proposalBenefits.ts.
const BENEFITS_HEADING = 'The Suncoast Difference';
const INCLUDED_BENEFITS = [
  'The same technician every week — never a rotating crew',
  'A photo service report in your inbox after every visit',
  'All standard service chemicals included',
  'Filter cleaning, backwashing & salt-cell cleaning — all included',
];
const BENEFITS_NOTE = "It's all covered in your flat rate — no surprise fees.";

// Prefix a bare number with "$" (425 → $425, 185/mo → $185/mo) while leaving
// values that already start with a symbol/word untouched ($425, "Call for price").
const formatPrice = (raw: string): string => {
  const s = raw.trim();
  if (!s) return '';
  return /^[0-9]/.test(s) ? `$${s}` : s;
};

const composeProposalEmail = (
  p: SendProposalPayload,
  _env: AdminEnv,
): { html: string; text: string } => {
  const name = safe(String(p.customer?.name ?? '').trim(), 120);
  const greetingName = name ? name.split(/\s+/)[0] : 'there';
  const price = formatPrice(safe(String(p.proposal?.price ?? '').trim(), 40));
  const scope = safe(String(p.proposal?.scope ?? '').trim(), FIELD_MAX);
  const includeBenefits = p.proposal?.includeBenefits !== false;

  const text = [
    `Hi ${greetingName},`,
    ``,
    `Thank you for the opportunity to earn your business. Your proposal from`,
    `Suncoast Pool Pros is attached as a PDF.`,
    ``,
    ...(includeBenefits
      ? [`${BENEFITS_HEADING}:`, ...INCLUDED_BENEFITS.map((b) => `  - ${b}`), BENEFITS_NOTE, ``]
      : []),
    scope ? `Scope of work: ${scope}` : '',
    price ? `Total: ${price}` : '',
    ``,
    `To accept, simply reply "APPROVED" to this email and we'll get you scheduled.`,
    ``,
    `Questions? Just reply to this message.`,
    ``,
    `Suncoast Pool Pros`,
    `${BIZ.phoneDisplay} · ${BIZ.websiteDisplay}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <!-- Hidden inbox-preview line -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;">Your pool service proposal from Suncoast Pool Pros — PDF attached. Reply APPROVED to accept.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <!-- Header -->
        <tr><td style="background:#0a1628;padding:26px 32px;">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8ea2c0;">Suncoast Pool Pros</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;">Your Pool Service Proposal</div>
        </td></tr>
        <!-- Brand accent bar -->
        <tr><td style="height:4px;background:#1669AE;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;color:#111827;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 14px;">Hi ${escapeHtml(greetingName)},</p>
          <p style="margin:0 0 18px;color:#374151;">Thank you for the opportunity to earn your business. Your full proposal is attached to this email as a PDF.</p>

          ${includeBenefits ? `
          <!-- What's included highlight -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:16px 20px;background:#eef6fb;border:1px solid #cfe3f2;border-radius:12px;">
              <div style="font-size:15px;font-weight:700;color:#0f4d80;margin-bottom:8px;">${BENEFITS_HEADING}</div>
              ${INCLUDED_BENEFITS.map((b) => `<div style="font-size:14px;color:#1f2937;font-weight:600;margin:5px 0;"><span style="color:#1d7a33;">&#10003;</span>&nbsp;&nbsp;${escapeHtml(b)}</div>`).join('')}
              <div style="font-size:12px;color:#6b7280;font-style:italic;margin-top:8px;">${escapeHtml(BENEFITS_NOTE)}</div>
            </td></tr>
          </table>` : ''}

          <!-- Attachment chip -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:12px 16px;background:#f3f6fb;border:1px solid #dce7f2;border-radius:10px;font-size:14px;color:#0f4d80;">
              <span style="font-size:16px;">📎</span>&nbsp;&nbsp;<strong>Your proposal is attached</strong> as a PDF
            </td></tr>
          </table>

          ${scope ? `
          <div style="margin:0 0 18px;">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9aa4b2;font-weight:700;margin-bottom:6px;">Scope of Work</div>
            <div style="font-size:15px;color:#374151;line-height:1.6;">${escapeHtml(scope).replace(/\n/g, '<br>')}</div>
          </div>` : ''}

          ${price ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:16px 20px;background:#f1f6fb;border:1px solid #d6e6f3;border-radius:12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Total</td>
                <td align="right" style="font-size:24px;font-weight:800;color:#0f4d80;">${escapeHtml(price)}</td>
              </tr></table>
            </td></tr>
          </table>` : ''}

          <!-- Accept callout -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">
            <tr><td style="padding:16px 20px;background:#eefaf0;border:1px solid #bfe7c6;border-radius:12px;font-size:15px;color:#176a2c;line-height:1.55;">
              <strong style="color:#1d7a33;">To accept:</strong> just reply <strong>&ldquo;APPROVED&rdquo;</strong> to this email and we&rsquo;ll get you on the schedule.
            </td></tr>
          </table>

          <p style="margin:14px 0 0;color:#6b7280;font-size:13px;">Questions about anything? Simply reply to this message.</p>
        </td></tr>
        <!-- Footer — navy so the logo's white wordmark stays visible. -->
        <tr><td style="padding:24px 32px;background:#0a1628;">
          <img src="${BIZ.logo}" alt="Suncoast Pool Pros" width="118" height="84" style="display:block;border:0;outline:none;width:118px;height:auto;margin-bottom:14px;">
          <div style="font-size:13px;line-height:1.7;color:#aab8cc;">
            <a href="${BIZ.phoneHref}" style="color:#7fb4e0;text-decoration:none;font-weight:600;">${BIZ.phoneDisplay}</a>
            &nbsp;&middot;&nbsp;
            <a href="${BIZ.websiteHref}" style="color:#7fb4e0;text-decoration:none;font-weight:600;">${BIZ.websiteDisplay}</a><br>
            <span style="color:#aab8cc;">${BIZ.address}</span><br>
            <span style="color:#7e8ea6;">${BIZ.hours}</span>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`.trim();

  return { html, text };
};

const sanitizeFilename = (name: unknown): string =>
  typeof name === 'string' ? name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) : '';

const safe = (s: string, max: number): string => s.slice(0, max);
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
