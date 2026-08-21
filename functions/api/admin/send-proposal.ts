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
import { proposalNumberOrNull, quoteUrl, saveQuote, saveQuotePhotos } from '../_quotes';
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
/**
 * Carries the rendered PDF **and** the photos that went into it, so it needs
 * room for both. 6 MB was sized for the PDF alone; with eight photos also on
 * the payload the two together can pass it, and the send would fail after the
 * PDF had already been rendered.
 */
const MAX_BODY_BYTES = 14 * 1024 * 1024;
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
  filterType?: string;
  filterServiceIncluded?: boolean | string;
  filter?: string;
  heater?: string;
  automation?: string;
  equipmentNotes?: string;
};
type Tier = {
  name?: string;
  price?: string;
  tagline?: string;
  priceNote?: string;
  includes?: string[];
  recommended?: boolean;
  valueNote?: string;
  finePrint?: string;
};

type Proposal = {
  scope?: string;
  price?: string;
  addOns?: Array<{ label?: string; price?: string }>;
  includeBenefits?: boolean;
  emailNote?: string;
  pricingMode?: string;
  tiers?: Tier[];
};

type SendProposalPayload = {
  customer?: Customer;
  pool?: Pool;
  proposal?: Proposal;
  /** Reserved by the builder before it rendered the PDF, and printed on it. */
  proposalNumber?: number | null;
  pdfBase64?: string;
  /** Downscaled data URLs, stored so the customer's own download matches. */
  photos?: string[];
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
    // Proposals send from service@ (a monitored inbox) rather than the no-reply
    // contact address, so a customer who replies outside the "APPROVED" flow
    // still reaches a real mailbox. Overridable via PROPOSAL_FROM_EMAIL.
    const fromEmail = env.PROPOSAL_FROM_EMAIL || 'service@suncoastpoolpros.com';
    // Reply-To must NEVER fall back to CONTACT_TO_EMAIL: that's the contact
    // form's delivery inbox and is deliberately a personal gmail address, which
    // would then be visible to every customer who gets a proposal. Fall back to
    // the public service@ address instead (it forwards to the same inbox).
    const replyTo = env.PROPOSAL_REPLY_TO || 'service@suncoastpoolpros.com';
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

    // Stored before sending so the email can carry a one-click accept link.
    // Returns null when D1 isn't bound or the write fails — the proposal then
    // sends exactly as it always has, minus the link.
    // Trust the number the builder sent rather than reserving a second one:
    // it's already printed on the attached PDF, and a fresh reservation here
    // would store a number the customer's document doesn't show.
    const proposalNumber = proposalNumberOrNull(payload.proposalNumber);
    const token = await saveQuote((env as { DB?: unknown }).DB, {
      customer,
      pool: payload.pool ?? {},
      proposal: payload.proposal ?? {},
      number: proposalNumber,
    });
    /**
     * The BREAKDOWN-first link, not the plans-first one.
     *
     * /approve-… exists for a customer who has already read the proposal and
     * only needs to sign. That used to describe every emailed customer, because
     * the email itself carried the Difference box, the value stack and the
     * plans. It no longer does — so dropping them straight onto two priced
     * cards would be asking them to choose between numbers they have not been
     * given a reason for.
     */
    const acceptLink = token ? quoteUrl(new URL(request.url).origin, token, proposalNumber) : '';
    // After the response, never before it. The photos are already inside the
    // PDF being attached, so this is purely the archival copy for a later
    // re-download — it must not add seconds to the send the operator is
    // waiting on, and it must not be able to fail it.
    if (token && Array.isArray(payload.photos) && payload.photos.length > 0) {
      ctx.waitUntil?.(saveQuotePhotos((env as { DB?: unknown }).DB, token, payload.photos));
    }

    const { html, text } = composeProposalEmail(payload, env, acceptLink);
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
        /**
         * Short, and it does NOT repeat the sender. The From name already
         * displays "Suncoast Pool Pros" beside the subject, so the 22
         * characters this used to spend saying it again bought nothing — and
         * phone inboxes truncate around 35–40, which put the proposal NUMBER,
         * the one part worth reading, at risk of being cut.
         *
         * One wording for both pricing modes. It used to say "Plans" or
         * "Proposal", which on a single-price send read "Your Pool Service
         * Proposal — Proposal #1042": the same word twice in six.
         */
        subject: `Your pool service proposal${proposalNumber ? ` — #${proposalNumber}` : ''}`,
        html,
        text,
        attachments,
        tags: [{ name: 'source', value: 'admin_proposal' }],
      });
    } catch (err) {
      console.log('[admin/send-proposal] delivery_failed:', String(err).slice(0, 300));
      return json({ ok: false, error: 'delivery_failed', detail: String(err).slice(0, 300) }, 502);
    }

    /**
     * `stored` is the honest half of this response. A storage failure
     * deliberately does NOT fail the send — the customer still gets their
     * proposal and PDF — but it means the email went out WITHOUT an accept
     * link and the quote is in no list anywhere. Reporting only `ok: true`
     * made that indistinguishable from a clean send, so the one case that
     * needs the operator's attention was the one case they never saw.
     */
    return json({ ok: true, stored: !!token, url: acceptLink || null }, 200);
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

// The Suncoast Difference, the value stack and the plan cards used to be
// duplicated here so the EMAIL could render them beside the PDF. The email no
// longer renders the proposal — it carries a note and a link — so the copies
// are gone rather than left to rot. They live once, in src/components/admin/,
// and reach the customer through the PDF and the approve page.


const hasTiers = (p: SendProposalPayload): boolean =>
  p.proposal?.pricingMode === 'tiers' && (p.proposal?.tiers?.length ?? 0) > 0;

// Exported (not just module-local) so the email can be rendered and eyeballed
// offline — it's a pure function of the payload, and it's customer-facing HTML
// that no test would otherwise cover.
/**
 * The covering email — a short note and a way in, NOT the proposal itself.
 *
 * It used to render the whole thing: the Difference box, the value stack, both
 * plan cards and the scope. Two problems with that, and the second is the one
 * that decided it.
 *
 * It duplicated the PDF, which is why scripts/check-mirrors.mjs had to exist —
 * every promise and every price written twice, in two languages, drifting
 * quietly apart.
 *
 * And it let a customer read the entire proposal, decide, and reply without
 * ever opening the link. Quote activity then showed "Not opened yet" on a quote
 * that had been read twice, which is worse than no signal at all: it reads as
 * cold and invites chasing someone who is already sold, or writing off someone
 * who is still deciding.
 *
 * So the body carries the customer's own note, the number, and one button. The
 * proposal lives in two places the customer must actually open — the attached
 * PDF, and the link — and both are things we can see them do.
 */
export const composeProposalEmail = (
  p: SendProposalPayload,
  _env: AdminEnv,
  /** Where the proposal is read and accepted. Empty when storage is down. */
  acceptLink = '',
): { html: string; text: string } => {
  const proposalNumber = proposalNumberOrNull(p.proposalNumber);
  const name = safe(String(p.customer?.name ?? '').trim(), 120);
  const greetingName = name ? name.split(/\s+/)[0] : 'there';
  // Email only — deliberately absent from the PDF, which is the formal document.
  const emailNote = safe(String(p.proposal?.emailNote ?? '').trim(), FIELD_MAX);
  const emailNoteParas = emailNote.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const numberLabel = proposalNumber ? `Proposal #${proposalNumber}` : 'Your proposal';

  /**
   * Without a link there is no way in but the attachment, so the email has to
   * fall back to the reply-to-accept route it always had. Storage being down
   * must never cost the customer a way to say yes.
   */
  const hasLink = acceptLink !== '';
  /**
   * "Choose your plan" is only true when the proposal offers more than one. On
   * a single-price proposal there is nothing to choose, and telling someone to
   * pick a plan they were never given is the same class of error as promising a
   * salt cell to a chlorine pool.
   */
  const choose = hasTiers(p) ? 'choose your plan and ' : '';

  const text = [
    `Hi ${greetingName},`,
    ``,
    ...(emailNoteParas.length ? [...emailNoteParas, ``] : []),
    `We appreciate the opportunity to quote your pool service.`,
    ``,
    `Your proposal is ready — the scope of the work, what's included in your rate, and what it costs.`,
    ``,
    ...(hasLink
      ? [
          `When you're ready to move forward, you can ${choose}approve it from the same link, and we'll be in touch to schedule.`,
          ``,
          `Read it here: ${acceptLink}`,
          ``,
          `A copy is attached to this email as a PDF.`,
        ]
      : [
          `It's attached to this email as a PDF.`,
          ``,
          `To accept, simply reply "APPROVED" to this email and we'll be in touch to schedule.`,
        ]),
    ``,
    `Questions? Just reply to this message.`,
    ``,
    `Suncoast Pool Pros`,
    `${BIZ.phoneDisplay} · ${BIZ.websiteDisplay}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  /**
   * The one control in the email, in brand blue #1669AE — the same solid the
   * site's buttons use.
   *
   * SOLID, not the site's blue gradient. Gradients are unreliable across mail
   * clients and Outlook drops them to a bare background colour, so the single
   * thing this email exists to get clicked would render differently per inbox.
   *
   * The <td> repeats the colour as a fallback for clients that strip background
   * off an <a>, and this is built OUTSIDE the html template so the reasoning
   * lives in a TypeScript comment rather than an HTML one — an HTML comment
   * here would be sent to every customer.
   */
  const button = hasLink
    ? `<tr><td style="padding:0 28px 6px 28px;" align="center">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#1669AE;">
            <a href="${escapeHtml(acceptLink)}" style="display:inline-block;background:#1669AE;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:10px;">View your proposal</a>
          </td></tr></table>
        </td></tr>`
    : '';

  const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <!-- Hidden inbox-preview line -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;">${escapeHtml(
    numberLabel,
  )} from Suncoast Pool Pros — everything included, ready to read.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <tr><td style="background:#0a1628;padding:22px 28px;">
          <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#9fb3c8;font-weight:700;">Suncoast Pool Pros</div>
          <div style="font-size:22px;font-weight:800;color:#ffffff;margin-top:6px;">${escapeHtml(numberLabel)}</div>
        </td></tr>
        <tr><td style="padding:26px 28px 4px 28px;">
          <p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#0a1628;">Hi ${escapeHtml(greetingName)},</p>
          ${emailNoteParas
            .map(
              (para) =>
                `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#374151;">${escapeHtml(para)}</p>`,
            )
            .join('')}
          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.65;color:#374151;">We appreciate the opportunity to quote your pool service.</p>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.65;color:#374151;">${
            hasLink
              ? `Your proposal is ready &mdash; the scope of the work, what&rsquo;s included in your rate, and what it costs. When you&rsquo;re ready to move forward, you can ${choose}approve it from the same link, and we&rsquo;ll be in touch to schedule.`
              : `Your proposal is attached to this email as a PDF &mdash; the scope of the work, what&rsquo;s included in your rate, and what it costs.`
          }</p>
        </td></tr>
        ${button}
        <tr><td style="padding:18px 28px 26px 28px;">
          <!-- Centred, and one line: this is a caption to the button above it,
               offering the other way in. Body copy stays left-aligned — centring
               a multi-line paragraph costs the reader the left edge their eye
               returns to on every line. -->
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">${
            hasLink
              ? '<span style="font-size:15px;">📎</span>&nbsp;&nbsp;A copy is attached to this email as a PDF.'
              : 'To accept, simply reply &ldquo;APPROVED&rdquo; to this email and we&rsquo;ll be in touch to schedule.'
          }</p>
        </td></tr>
        <!-- Centred, and short enough to hold one line on a phone. It was
             left-aligned and carried the phone number: the odd element in a
             column where the button, the attachment caption and the sign-off
             below are all centred, and the second place the same number
             appeared within two lines. The sign-off keeps the number. -->
        <tr><td style="padding:16px 28px 22px 28px;border-top:1px solid #eef2f7;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;text-align:center;">Questions? Just reply to this message.</p>
        </td></tr>
      </table>
      <div style="font-size:12px;color:#9aa4b2;margin-top:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        Suncoast Pool Pros &middot; ${escapeHtml(BIZ.phoneDisplay)} &middot; ${escapeHtml(BIZ.websiteDisplay)}
      </div>
    </td></tr>
  </table>
</body>
</html>`.trim();

  return { html, text };
};

const sanitizeFilename = (name: unknown): string =>
  typeof name === 'string' ? name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80) : '';

const safe = (s: string, max: number): string => s.slice(0, max);
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
