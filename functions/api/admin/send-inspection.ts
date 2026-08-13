/**
 * POST /api/admin/send-inspection — email a first-service & inspection report.
 *
 * Auth-gated: requires a valid admin session cookie (set by /api/admin/login).
 *
 * Same shape as send-proposal.ts: the admin's browser renders the report to a
 * PDF and posts it here as base64; we attach it and send via Resend, BCC'ing the
 * business inbox so there's always a sent-copy on record. No database.
 *
 * Reuses the SAME env vars as the proposal sender (RESEND_API_KEY,
 * PROPOSAL_FROM_EMAIL, PROPOSAL_REPLY_TO, CONTACT_TO_EMAIL) — no new Cloudflare
 * configuration is needed to turn this on.
 *
 * Empty means invisible: a reading, list or section with no content is omitted
 * from the email entirely, exactly as it is from the PDF.
 */
import {
  type AdminContext,
  json,
  isAllowedOrigin,
  readBoundedText,
  requireSession,
  sendViaResend,
} from './_shared';

// PDFs are small, but base64 inflates ~33%. 6 MB covers a report with photos
// while still rejecting obvious abuse.
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const FIELD_MAX = 4000;

type Customer = { name?: string; address?: string; email?: string; phone?: string };
type Visit = {
  date?: string;
  technician?: string;
  summary?: string;
  workPerformed?: string;
  overall?: string;
};
type Chemistry = Record<string, string | undefined>;
type Surface = {
  material?: string;
  condition?: string;
  observations?: string[];
  notes?: string;
};
type Findings = {
  issues?: Array<{ label?: string; severity?: string; note?: string }>;
  recommendations?: Array<{ label?: string; priority?: string; note?: string }>;
};

type SendInspectionPayload = {
  customer?: Customer;
  visit?: Visit;
  chemistry?: Chemistry;
  surface?: Surface;
  findings?: Findings;
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

    let payload: SendInspectionPayload;
    try {
      payload = JSON.parse(await readBoundedText(request, MAX_BODY_BYTES)) as SendInspectionPayload;
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400);
    }

    const customer = payload.customer ?? {};
    const toEmail = String(customer.email ?? '').trim();
    if (!EMAIL_RE.test(toEmail)) {
      return json({ ok: false, error: 'invalid_customer_email' }, 400);
    }

    const apiKey = env.RESEND_API_KEY;
    // Reports send from service@ (a monitored inbox) so a customer replying with
    // questions reaches a real mailbox. Overridable via PROPOSAL_FROM_EMAIL.
    const fromEmail = env.PROPOSAL_FROM_EMAIL || 'service@suncoastpoolpros.com';
    const replyTo = env.PROPOSAL_REPLY_TO || env.CONTACT_TO_EMAIL;
    const bcc = env.CONTACT_TO_EMAIL || env.PROPOSAL_REPLY_TO;
    if (!apiKey || !fromEmail) {
      const missing = [!apiKey && 'RESEND_API_KEY', !fromEmail && 'PROPOSAL_FROM_EMAIL/CONTACT_FROM_EMAIL']
        .filter(Boolean)
        .join(', ');
      return json({ ok: false, error: 'email_config_missing', detail: missing }, 500);
    }
    const from = fromEmail.includes('<') ? fromEmail : `${BIZ.name} <${fromEmail}>`;

    const { html, text } = composeInspectionEmail(payload);
    const attachments =
      typeof payload.pdfBase64 === 'string' && payload.pdfBase64.length > 0
        ? [
            {
              filename: sanitizeFilename(payload.filename) || 'Suncoast-First-Service-Report.pdf',
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
        subject: 'Your First Service & Pool Inspection Report — Suncoast Pool Pros',
        html,
        text,
        attachments,
        tags: [{ name: 'source', value: 'admin_inspection' }],
      });
    } catch (err) {
      console.log('[admin/send-inspection] delivery_failed:', String(err).slice(0, 300));
      return json({ ok: false, error: 'delivery_failed', detail: String(err).slice(0, 300) }, 502);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.log('[admin/send-inspection] server_error:', String(err).slice(0, 300));
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
};

// Mirrors CHEMISTRY_FIELDS in src/components/admin/inspectionPresets.ts.
const CHEM_FIELDS: Array<{ key: string; label: string; unit: string }> = [
  { key: 'freeChlorine', label: 'Free Chlorine', unit: 'ppm' },
  { key: 'totalChlorine', label: 'Total Chlorine', unit: 'ppm' },
  { key: 'ph', label: 'pH', unit: '' },
  { key: 'alkalinity', label: 'Total Alkalinity', unit: 'ppm' },
  { key: 'cya', label: 'Cyanuric Acid', unit: 'ppm' },
  { key: 'calciumHardness', label: 'Calcium Hardness', unit: 'ppm' },
  { key: 'salt', label: 'Salt', unit: 'ppm' },
  { key: 'waterTemp', label: 'Water Temp', unit: '°F' },
  { key: 'filterPressure', label: 'Filter Pressure', unit: 'PSI' },
  { key: 'waterLevel', label: 'Water Level', unit: '' },
];

// Mirrors SEVERITY_CHIPS / PRIORITY_CHIPS in inspectionPresets.ts.
const SEVERITY_LABELS: Record<string, string> = {
  urgent: 'Needs Attention',
  soon: 'Repair Soon',
  monitor: 'Monitor',
};
const PRIORITY_LABELS: Record<string, string> = {
  now: 'Recommended',
  soon: 'When Convenient',
  optional: 'Optional',
};
const SEVERITY_STYLE: Record<string, string> = {
  urgent: 'background:#fdecec;border:1px solid #f3c4c4;color:#a32020;',
  soon: 'background:#fdf4e6;border:1px solid #efd7a6;color:#8a5a10;',
  monitor: 'background:#eef2f7;border:1px solid #d8e0ea;color:#4b5b70;',
};
const PRIORITY_STYLE: Record<string, string> = {
  now: 'background:#eaf3fb;border:1px solid #c8dff2;color:#0f4d80;',
  soon: 'background:#eef2f7;border:1px solid #d8e0ea;color:#4b5b70;',
  optional: 'background:#f5f5f4;border:1px solid #e3e3e0;color:#6b7280;',
};

const clean = (v: unknown, max = FIELD_MAX): string => String(v ?? '').trim().slice(0, max);

const composeInspectionEmail = (p: SendInspectionPayload): { html: string; text: string } => {
  const name = clean(p.customer?.name, 120);
  const greetingName = name ? name.split(/\s+/)[0] : 'there';
  const overall = clean(p.visit?.overall, 40);
  const summary = clean(p.visit?.summary);

  // Only readings that were actually taken — an untested value is omitted, and
  // if nothing was tested the chemistry block never renders.
  const readings = CHEM_FIELDS.map((f) => ({ ...f, value: clean(p.chemistry?.[f.key], 40) })).filter(
    (f) => f.value !== '',
  );

  const issues = (p.findings?.issues ?? [])
    .map((i) => ({
      label: clean(i?.label, 200),
      severity: clean(i?.severity, 20),
      note: clean(i?.note, 400),
    }))
    .filter((i) => i.label !== '');

  const recs = (p.findings?.recommendations ?? [])
    .map((r) => ({
      label: clean(r?.label, 200),
      priority: clean(r?.priority, 20),
      note: clean(r?.note, 400),
    }))
    .filter((r) => r.label !== '');

  const text = [
    `Hi ${greetingName},`,
    ``,
    `Your first service is done — the full report is attached as a PDF.`,
    overall ? `Overall condition: ${overall}` : '',
    summary ? `` : '',
    summary,
    readings.length ? `` : '',
    readings.length ? `Water chemistry:` : '',
    ...readings.map((f) => `  - ${f.label}: ${f.value}${f.unit ? ` ${f.unit}` : ''}`),
    issues.length ? `` : '',
    issues.length ? `What needs attention:` : '',
    ...issues.map(
      (i) =>
        `  - [${SEVERITY_LABELS[i.severity] ?? 'Noted'}] ${i.label}${i.note ? ` — ${i.note}` : ''}`,
    ),
    recs.length ? `` : '',
    recs.length ? `Our recommendations:` : '',
    ...recs.map(
      (r) =>
        `  - [${PRIORITY_LABELS[r.priority] ?? 'Suggested'}] ${r.label}${r.note ? ` — ${r.note}` : ''}`,
    ),
    ``,
    `Questions about anything in here? Just reply to this email.`,
    ``,
    `Suncoast Pool Pros`,
    `${BIZ.phoneDisplay} · ${BIZ.websiteDisplay}`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const chemistryHtml = readings.length
    ? `
          <div style="margin:0 0 20px;">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9aa4b2;font-weight:700;margin-bottom:8px;">Water Chemistry</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3e8ef;border-radius:10px;overflow:hidden;">
              ${readings
                .map(
                  (f, i) => `<tr style="background:${i % 2 ? '#fbfcfe' : '#ffffff'};">
                <td style="padding:8px 14px;font-size:14px;color:#374151;">${escapeHtml(f.label)}</td>
                <td align="right" style="padding:8px 14px;font-size:14px;font-weight:700;color:#0a1628;white-space:nowrap;">${escapeHtml(f.value)}${f.unit ? ` ${escapeHtml(f.unit)}` : ''}</td>
              </tr>`,
                )
                .join('')}
            </table>
          </div>`
    : '';

  const listHtml = (
    heading: string,
    rows: Array<{ label: string; note: string; chip: string; chipStyle: string }>,
  ) =>
    rows.length
      ? `
          <div style="margin:0 0 20px;">
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#9aa4b2;font-weight:700;margin-bottom:8px;">${heading}</div>
            ${rows
              .map(
                (r) => `<div style="padding:10px 0;border-bottom:1px solid #eef1f5;">
              <span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:2px 6px;border-radius:4px;${r.chipStyle}">${escapeHtml(r.chip)}</span>
              <span style="font-size:15px;font-weight:600;color:#0a1628;margin-left:8px;">${escapeHtml(r.label)}</span>
              ${r.note ? `<div style="font-size:14px;color:#6b7280;margin-top:4px;line-height:1.5;">${escapeHtml(r.note)}</div>` : ''}
            </div>`,
              )
              .join('')}
          </div>`
      : '';

  const html = `
<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;">
  <!-- Hidden inbox-preview line -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef2f7;">Your first service is complete — full inspection report attached.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e3e8ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <!-- Header -->
        <tr><td style="background:#0a1628;padding:26px 32px;">
          <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8ea2c0;">Suncoast Pool Pros</div>
          <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:6px;">Your First Service &amp; Inspection Report</div>
        </td></tr>
        <!-- Brand accent bar -->
        <tr><td style="height:4px;background:#1669AE;line-height:4px;font-size:0;">&nbsp;</td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;color:#111827;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 14px;">Hi ${escapeHtml(greetingName)},</p>
          <p style="margin:0 0 18px;color:#374151;">Your first service is done. Here&rsquo;s where your pool stands — the full report is attached as a PDF.</p>

          ${
            summary || overall
              ? `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:16px 20px;background:#eef6fb;border:1px solid #cfe3f2;border-radius:12px;">
              <div style="font-size:15px;font-weight:700;color:#0f4d80;margin-bottom:${summary ? '8px' : '0'};">Where Your Pool Stands${overall ? ` &mdash; ${escapeHtml(overall)}` : ''}</div>
              ${summary ? `<div style="font-size:14px;color:#374151;line-height:1.6;">${escapeHtml(summary).replace(/\n/g, '<br>')}</div>` : ''}
            </td></tr>
          </table>`
              : ''
          }

          <!-- Attachment chip -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr><td style="padding:12px 16px;background:#f3f6fb;border:1px solid #dce7f2;border-radius:10px;font-size:14px;color:#0f4d80;">
              <span style="font-size:16px;">📎</span>&nbsp;&nbsp;<strong>Your full report is attached</strong> as a PDF
            </td></tr>
          </table>

          ${chemistryHtml}

          ${listHtml(
            'What Needs Attention',
            issues.map((i) => ({
              label: i.label,
              note: i.note,
              chip: SEVERITY_LABELS[i.severity] ?? 'Noted',
              chipStyle: SEVERITY_STYLE[i.severity] ?? SEVERITY_STYLE.monitor,
            })),
          )}

          ${listHtml(
            'Our Recommendations',
            recs.map((r) => ({
              label: r.label,
              note: r.note,
              chip: PRIORITY_LABELS[r.priority] ?? 'Suggested',
              chipStyle: PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.optional,
            })),
          )}

          <!-- Closing callout -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">
            <tr><td style="padding:16px 20px;background:#eefaf0;border:1px solid #bfe7c6;border-radius:12px;font-size:15px;color:#176a2c;line-height:1.55;">
              <strong style="color:#1d7a33;">Questions?</strong> Just reply to this email &mdash; we&rsquo;re happy to walk through anything in the report${issues.length || recs.length ? ', and we can put together pricing on anything you&rsquo;d like handled' : ''}.
            </td></tr>
          </table>
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

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
