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
import { approveUrl, saveQuote } from '../_quotes';
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
    const token = await saveQuote((env as { DB?: unknown }).DB, {
      customer,
      pool: payload.pool ?? {},
      proposal: payload.proposal ?? {},
    });
    const acceptLink = token ? approveUrl(new URL(request.url).origin, token) : '';

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
        subject: hasTiers(payload)
          ? 'Your Pool Service Plans — Suncoast Pool Pros'
          : 'Your Pool Service Proposal — Suncoast Pool Pros',
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
const BASE_BENEFITS = [
  'Vetted, consistent technicians — a familiar face, not a rotating crew',
  'A photo service report in your inbox after every visit',
  'All standard service chemicals included',
  'Filter cleaning, backwashing & salt-cell cleaning — all included',
];

// Kept LAST, matching src/components/admin/proposalBenefits.ts. Backed by
// section 6 of the Service Agreement — see the note there before editing.
const GUARANTEE_BENEFIT =
  'A two-week money-back guarantee — not happy in your first two weeks and we refund every penny';

// Mirrors filterServiceLine in src/components/admin/filterService.ts — the email
// must name the SAME filter the PDF does, or the two documents contradict each
// other in the same message.
const FILTER_SERVICE: Record<string, { value: number; basis: string }> = {
  Cartridge: { value: 120, basis: 'based on an 8–18 month element life' },
  DE: { value: 150, basis: 'based on an annual split cadence' },
};

const valueClause = (type: string): string => {
  const v = FILTER_SERVICE[type];
  return v ? ` — a $${v.value} value, ${v.basis}` : '';
};

const filterServiceLine = (type: string, included: boolean): string | null => {
  if (!included) return null;
  switch (type) {
    case 'Cartridge':
      return `Cartridge filter replacement included in your monthly cost${valueClause(type)}`;
    case 'DE':
      return `DE filter split, clean and recharge included in your monthly cost${valueClause(type)}`;
    case 'Sand':
      return `Sand media replacement included in your monthly cost${valueClause(type)}`;
    default:
      return null;
  }
};

const includedBenefits = (type: string, included: boolean): string[] => {
  const line = filterServiceLine(type, included);
  return line ? [...BASE_BENEFITS, line, GUARANTEE_BENEFIT] : [...BASE_BENEFITS, GUARANTEE_BENEFIT];
};

const benefitsNote = (type: string, included: boolean): string =>
  filterServiceLine(type, included)
    ? "It's all covered in your flat rate — including the filter parts and labour most companies bill separately. That's why the monthly figure may read a little higher than a bare-bones quote, and why you won't get a surprise invoice on top of it."
    : "It's all covered in your flat rate — no surprise fees.";

// Prefix a bare number with "$" (425 → $425, 185/mo → $185/mo) while leaving
// values that already start with a symbol/word untouched ($425, "Call for price").
const formatPrice = (raw: string): string => {
  const s = raw.trim();
  if (!s) return '';
  return /^[0-9]/.test(s) ? `$${s}` : s;
};

// Mirrors src/components/admin/includedExtras.ts — the value stack: work that
// routinely arrives as a separate invoice elsewhere, priced and struck through.
const EXTRAS_HEADING = 'What Others Charge Extra For';
const EXTRAS_INTRO =
  'We build our service to be all-inclusive on purpose. When something is a known maintenance item — a filter element, a treatment your pool needs every year — we price it into your monthly cost rather than invoicing it separately. Splitting those out only makes a monthly rate look cheaper than it really is, and it costs you time approving work your pool was always going to need.';
const EXTRAS_NOTE =
  'The figures above are what you would typically be quoted for these elsewhere. Routine treatments are included; major remediation such as a green-to-clean recovery is quoted separately.';

const includedExtras = (
  type: string,
  included: boolean,
  sanitization: string,
): Array<{ label: string; typical: string; basis: string }> => {
  const rows = [
    {
      label: 'Algaecide & phosphate treatments',
      typical: '$35–$400',
      basis: 'depending on severity and pool size',
    },
  ];
  // Matches "salt" loosely so older drafts ("Salt (chlorine generator)") resolve.
  if (/salt/i.test(sanitization)) {
    rows.push({
      label: 'Salt cell acid wash',
      typical: '$100',
      basis: '$25 a wash, typically washed quarterly',
    });
  }
  const priced = included ? FILTER_SERVICE[type] : undefined;
  if (priced) {
    rows.push({
      label: type === 'DE' ? 'DE filter split, clean & recharge' : 'Cartridge filter replacement',
      typical: `$${priced.value}`,
      basis: type === 'DE' ? 'a year' : 'per replacement, every 8–18 months',
    });
  }
  return rows;
};

const renderExtras = (rows: Array<{ label: string; typical: string; basis: string }>): string =>
  rows.length
    ? `<div style="margin:0 0 20px;">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9aa4b2;font-weight:700;margin-bottom:8px;">${escapeHtml(EXTRAS_HEADING)}</div>
            <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(EXTRAS_INTRO)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #cfe3f2;border-radius:12px;">
              <tr>
                <td style="padding:8px 16px 4px;"></td>
                <td align="right" style="padding:8px 16px 4px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#9aa4b2;white-space:nowrap;">Others charge</td>
                <td align="right" style="padding:8px 16px 4px;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#9aa4b2;white-space:nowrap;">Your cost</td>
              </tr>
              ${rows
                .map(
                  (r) => `<tr>
                <td style="padding:9px 16px;border-top:1px solid #eef1f5;">
                  <div style="font-size:14px;font-weight:600;color:#0a1628;">${escapeHtml(r.label)}</div>
                  <div style="font-size:12px;color:#9aa4b2;margin-top:2px;line-height:1.45;">${escapeHtml(r.basis)}</div>
                </td>
                <td align="right" style="padding:9px 16px;border-top:1px solid #eef1f5;white-space:nowrap;font-size:14px;color:#6b7280;text-decoration:line-through;">${escapeHtml(r.typical)}</td>
                <td align="right" style="padding:9px 16px;border-top:1px solid #eef1f5;white-space:nowrap;font-size:13px;font-weight:700;color:#1d7a33;">Included</td>
              </tr>`,
                )
                .join('')}
              <tr><td colspan="3" style="padding:0 16px 12px;font-size:12px;font-style:italic;color:#9aa4b2;line-height:1.55;">${escapeHtml(EXTRAS_NOTE)}</td></tr>
            </table>
          </div>`
    : '';

const hasTiers = (p: SendProposalPayload): boolean =>
  p.proposal?.pricingMode === 'tiers' && (p.proposal?.tiers?.length ?? 0) > 0;

/**
 * Upgrade cost as a headline ("+$12/mo"). Mirrors tierDelta in src/lib/adminApi.ts
 * (functions can't import from the client tree). Selling the delta rather than
 * the total is the whole point — "+$12" reads as trivial, "$177" reads as a
 * price rise. Blank when either price isn't numeric.
 */
const pricePeriod = (raw: string): string => {
  if (/\/\s*(mo|month)/i.test(raw)) return '/mo';
  if (/\/\s*(yr|year|annually)/i.test(raw)) return '/yr';
  return '';
};

const deltaLabel = (a: string, b: string): string => {
  // Different periods can't be subtracted: $1,980/yr minus $165/mo is not
  // "+$1,815" of anything. This is exactly the annual-prepay case.
  const period = pricePeriod(b);
  if (period !== pricePeriod(a)) return '';
  const num = (raw: string): number | null => {
    const m = /-?\d[\d,]*(\.\d+)?/.exec(raw.replace(/\s/g, ''));
    if (!m) return null;
    const n = Number(m[0].replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const x = num(a);
  const y = num(b);
  if (x === null || y === null || y <= x) return '';
  const diff = y - x;
  return `+$${Number.isInteger(diff) ? diff : diff.toFixed(2)}${period}`;
};

/**
 * The plan comparison, as nested tables — Gmail and Outlook strip flexbox and
 * grid, so the two cards are cells in a single row. The upgrade lists only what
 * it ADDS, under "Everything in <base>, plus:", so the base plan is never
 * presented as the stripped-down option.
 */
const renderTiers = (tiers: Tier[]): string => {
  const clean = tiers.map((t) => ({
    name: safe(String(t?.name ?? '').trim(), 60),
    price: formatPrice(safe(String(t?.price ?? '').trim(), 40)),
    rawPrice: safe(String(t?.price ?? '').trim(), 40),
    tagline: safe(String(t?.tagline ?? '').trim(), 200),
    priceNote: safe(String(t?.priceNote ?? '').trim(), 200),
    includes: (t?.includes ?? []).map((i) => safe(String(i ?? '').trim(), 200)).filter(Boolean),
    recommended: t?.recommended === true,
    finePrint: safe(String(t?.finePrint ?? '').trim(), 600),
  }));
  const width = Math.floor(100 / Math.max(clean.length, 1));

  const cells = clean
    .map((t, i) => {
      const prev = clean[i - 1];
      const delta = prev ? deltaLabel(prev.rawPrice, t.rawPrice) : '';
      const border = t.recommended ? '#1669AE' : '#e3e8ef';
      const bg = t.recommended ? '#f1f7fc' : '#ffffff';
      return `<td width="${width}%" valign="top" style="padding:0 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${border};border-radius:12px;background:${bg};">
          <tr><td style="padding:14px 16px;">
            ${t.recommended ? '<div style="display:inline-block;background:#1669AE;color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 7px;border-radius:4px;margin-bottom:8px;">Recommended</div>' : ''}
            <div style="font-size:17px;font-weight:700;color:#0a1628;">${escapeHtml(t.name)}</div>
            ${t.tagline ? `<div style="font-size:13.5px;color:#6b7280;margin-top:3px;line-height:1.5;">${escapeHtml(t.tagline)}</div>` : ''}
            ${t.price ? `<div style="font-size:24px;font-weight:800;color:#0f4d80;margin-top:8px;">${escapeHtml(t.price)}</div>` : ''}
            ${
              t.priceNote
                ? `<div style="font-size:13.5px;font-weight:700;color:#1669AE;margin-top:4px;">${escapeHtml(t.priceNote)}</div>`
                : delta
                  ? `<div style="font-size:13.5px;font-weight:700;color:#1669AE;margin-top:4px;">${escapeHtml(delta)} more than ${escapeHtml(prev.name)}</div>`
                  : ''
            }
            <div style="border-top:1px solid #e3e8ef;margin:10px 0;"></div>
            ${prev ? `<div style="font-size:13.5px;font-weight:700;color:#0a1628;margin-bottom:8px;">Everything in ${escapeHtml(prev.name)}, plus:</div>` : ''}
            ${t.includes
              .map(
                (item) =>
                  `<div style="font-size:14px;color:#374151;line-height:1.55;margin-bottom:8px;"><span style="color:#1d7a33;">&bull;</span>&nbsp;&nbsp;${escapeHtml(item)}</div>`,
              )
              .join('')}
          </td></tr>
        </table>
      </td>`;
    })
    .join('');

  // Terms go FULL WIDTH under the comparison, not inside the cards — the same
  // sentence is a couple of lines across the page but many inside a column.
  const terms = clean.filter((t) => t.finePrint);
  const termsHtml = terms.length
    ? `<div style="margin:0 0 18px;">${terms
        .map(
          (t) =>
            `<div style="font-size:11.5px;color:#9aa4b2;line-height:1.5;margin-bottom:5px;">${
              terms.length > 1 ? `<strong style="color:#6b7280;">${escapeHtml(t.name)}:</strong> ` : ''
            }${escapeHtml(t.finePrint)}</div>`,
        )
        .join('')}</div>`
    : '';

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;"><tr>${cells}</tr></table>${termsHtml}`;
};

// Exported (not just module-local) so the email can be rendered and eyeballed
// offline — it's a pure function of the payload, and it's customer-facing HTML
// that no test would otherwise cover.
export const composeProposalEmail = (
  p: SendProposalPayload,
  _env: AdminEnv,
  /** One-click accept URL. Empty when quote storage isn't available. */
  acceptLink = '',
): { html: string; text: string } => {
  const name = safe(String(p.customer?.name ?? '').trim(), 120);
  const greetingName = name ? name.split(/\s+/)[0] : 'there';
  const price = formatPrice(safe(String(p.proposal?.price ?? '').trim(), 40));
  const scope = safe(String(p.proposal?.scope ?? '').trim(), FIELD_MAX);
  // Email only — deliberately absent from the PDF, which is the formal document.
  const emailNote = safe(String(p.proposal?.emailNote ?? '').trim(), FIELD_MAX);
  const emailNoteParas = emailNote.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const filterType = safe(String(p.pool?.filterType ?? '').trim(), 40);
  // Accepts the tri-state string and the boolean older drafts still send.
  const filterIncluded =
    p.pool?.filterServiceIncluded === true || p.pool?.filterServiceIncluded === 'yes';
  const benefitsList = includedBenefits(filterType, filterIncluded);
  const benefitsNoteText = benefitsNote(filterType, filterIncluded);
  const extras = includedExtras(filterType, filterIncluded, safe(String(p.pool?.sanitization ?? '').trim(), 60));
  const tiered = hasTiers(p);
  const tiers = tiered ? (p.proposal?.tiers ?? []) : [];
  // In tier mode the box IS the service definition (both plans include the same
  // service), so it always renders there regardless of the toggle.
  const includeBenefits = p.proposal?.includeBenefits !== false || tiered;
  const recommendedTier = tiers.find((t) => t?.recommended === true) ?? tiers[tiers.length - 1];
  // The reply words. Recommended first: the first option named is the one most
  // people repeat back.
  const acceptWords = tiers
    .map((t) => safe(String(t?.name ?? '').trim(), 60).toUpperCase())
    .filter(Boolean)
    .sort((a, b) => {
      const rec = safe(String(recommendedTier?.name ?? '').trim(), 60).toUpperCase();
      return a === rec ? -1 : b === rec ? 1 : 0;
    });
  // Every plan's note, in card order: the base plan explains what the all-in
  // rate covers, the recommended one sells the offer.
  const valueNotes = tiers
    .map((t) => ({
      text: safe(String(t?.valueNote ?? '').trim(), 800),
      recommended: t?.recommended === true,
    }))
    .filter((n) => n.text !== '');
  const valueNote = valueNotes.map((n) => n.text).join('\n\n');
  // A single price alongside a plan comparison is a contradiction — suppress it.
  const showSinglePrice = !tiered && price !== '';

  const text = [
    `Hi ${greetingName},`,
    ``,
    ...(emailNote ? [emailNote, ``] : []),
    `Thank you for the opportunity to earn your business. Your proposal from`,
    `Suncoast Pool Pros is attached as a PDF.`,
    ``,
    ...(includeBenefits
      ? [`${BENEFITS_HEADING}:`, ...benefitsList.map((b) => `  - ${b}`), benefitsNoteText, ``]
      : []),
    scope ? `Scope of work: ${scope}` : '',
    ...(tiered
      ? tiers.flatMap((t) => {
          const name = safe(String(t?.name ?? '').trim(), 60);
          const tp = formatPrice(safe(String(t?.price ?? '').trim(), 40));
          return [
            ``,
            `${name}${tp ? ` — ${tp}` : ''}${t?.recommended ? '  (recommended)' : ''}`,
            ...(t?.includes ?? [])
              .map((i) => safe(String(i ?? '').trim(), 200))
              .filter(Boolean)
              .map((i) => `  - ${i}`),
          ];
        })
      : []),
    tiered && valueNote ? `` : '',
    tiered && valueNote ? valueNote : '',
    showSinglePrice ? `Total: ${price}` : '',
    ``,
    acceptLink ? `To accept, choose your plan here: ${acceptLink}` : '',
    acceptLink
      ? `Prefer email? ${
          acceptWords.length > 1
            ? `Just reply with ${acceptWords.join(' or ')}.`
            : 'Just reply "APPROVED".'
        }`
      : acceptWords.length > 1
        ? `To accept, reply to this email with the plan you'd like — ${acceptWords.join(' or ')} — and we'll get you scheduled.`
        : `To accept, simply reply "APPROVED" to this email and we'll get you scheduled.`,
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;">${
    tiered
      ? `Two plan options from Suncoast Pool Pros — PDF attached. Reply ${escapeHtml(acceptWords[0] ?? '')} to accept.`
      : 'Your pool service proposal from Suncoast Pool Pros — PDF attached. Reply APPROVED to accept.'
  }</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <!-- Header -->
        <tr><td style="background:#0a1628;padding:26px 32px;">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8ea2c0;">Suncoast Pool Pros</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;">${
            tiered ? 'Your Pool Service Plans' : 'Your Pool Service Proposal'
          }</div>
        </td></tr>
        <!-- Brand accent bar -->
        <tr><td style="height:4px;background:#1669AE;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;color:#111827;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 14px;">Hi ${escapeHtml(greetingName)},</p>
          ${
            /* The personal note opens the message — it's the human sentence, so
               the boilerplate below it reads as the handoff into the content. */
            emailNoteParas
              .map(
                (para) =>
                  `<p style="margin:0 0 14px;color:#374151;">${escapeHtml(para).replace(/\n/g, '<br>')}</p>`,
              )
              .join('')
          }
          <p style="margin:0 0 18px;color:#374151;">Thank you for the opportunity to earn your business. ${
            tiered
              ? 'Here are your two plan options — the full details are attached as a PDF.'
              : 'Your full proposal is attached to this email as a PDF.'
          }</p>

          ${includeBenefits ? `
          <!-- What's included highlight -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:16px 20px;background:#eef6fb;border:1px solid #cfe3f2;border-radius:12px;">
              <div style="font-size:15px;font-weight:700;color:#0f4d80;margin-bottom:8px;">${BENEFITS_HEADING}</div>
              ${benefitsList.map((b) => `<div style="font-size:14px;color:#1f2937;font-weight:600;line-height:1.55;margin:10px 0;"><span style="color:#1d7a33;">&#10003;</span>&nbsp;&nbsp;${escapeHtml(b)}</div>`).join('')}
              <div style="font-size:13px;color:#6b7280;font-style:italic;margin-top:10px;line-height:1.55;">${escapeHtml(benefitsNoteText)}</div>
            </td></tr>
          </table>` : ''}

          ${tiered ? renderTiers(tiers) : ''}

          ${
            tiered
              ? valueNotes
                  .map(
                    (n) =>
                      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;">
            <tr><td style="padding:14px 18px;background:${n.recommended ? '#fff8ec' : '#f1f7fc'};border:1px solid ${n.recommended ? '#f0dcb4' : '#d4e6f4'};border-radius:12px;font-size:14px;color:${n.recommended ? '#8a5a10' : '#0f4d80'};line-height:1.55;">${escapeHtml(n.text)}</td></tr>
          </table>`,
                  )
                  .join('')
              : ''
          }

          ${includeBenefits ? renderExtras(extras) : ''}

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

          ${showSinglePrice ? `
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
              ${
                acceptLink
                  ? `<strong style="color:#1d7a33;">To accept:</strong> choose your plan below and we&rsquo;ll get you on the schedule.
                     <div style="margin-top:14px;">
                       <a href="${escapeHtml(acceptLink)}" style="display:inline-block;background:#1d7a33;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:13px 26px;border-radius:10px;">Review &amp; accept your plan</a>
                     </div>
                     <div style="margin-top:10px;font-size:13px;color:#3f7a4f;">Prefer email? ${
                       acceptWords.length > 1
                         ? `Just reply with ${acceptWords.map((w) => `<strong>${escapeHtml(w)}</strong>`).join(' or ')}.`
                         : 'Just reply <strong>&ldquo;APPROVED&rdquo;</strong>.'
                     }</div>`
                  : acceptWords.length > 1
                    ? `<strong style="color:#1d7a33;">To accept:</strong> reply to this email with the plan you&rsquo;d like &mdash; ${acceptWords
                        .map((w) => `<strong>${escapeHtml(w)}</strong>`)
                        .join(' or ')} &mdash; and we&rsquo;ll get you on the schedule.`
                    : `<strong style="color:#1d7a33;">To accept:</strong> just reply <strong>&ldquo;APPROVED&rdquo;</strong> to this email and we&rsquo;ll get you on the schedule.`
              }
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
