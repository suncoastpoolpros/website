/**
 * POST /api/contact — server-side handler for every form submission on the site.
 *
 * Cloudflare Pages Function. Auto-routed by file path: this file at
 * `functions/api/contact.ts` becomes the endpoint `POST /api/contact`.
 *
 * Why it exists:
 *  - The webhook URLs were previously baked into the client bundle, meaning
 *    bots could scrape them and POST directly. Moving the send-side to a
 *    server function hides the destination behind our domain.
 *  - Lets us layer in Turnstile verification, origin checks, and rate limits
 *    without changing every form.
 *
 * What it does (in order):
 *   1. Reject anything that isn't POST.
 *   2. Verify the request came from our own origin (cheap CSRF guard).
 *   3. Parse the JSON body. Reject malformed payloads.
 *   4. Drop honeypot-tripped submissions silently (return success so bots don't learn).
 *   5. Verify the Turnstile token with Cloudflare's siteverify API.
 *   6. Compose an email and send via Resend's HTTPS API.
 *      Retries once on transient (5xx / network) failure.
 *   7. Return 200 on success; 4xx for client errors; 5xx if email send genuinely failed.
 */

// Cloudflare Pages Function context type. Env is whatever's configured in
// the Pages dashboard / wrangler.toml; we only read the ones we need.
type Env = {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  CONTACT_TO_EMAIL: string;        // e.g. service@suncoastpoolpros.com
  CONTACT_FROM_EMAIL: string;      // e.g. noreply@suncoastpoolpros.com
  ALLOWED_ORIGINS?: string;        // comma-separated, e.g. https://suncoastpoolpros.com,https://www.suncoastpoolpros.com
};

interface PagesContext {
  request: Request;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}

// Maximum body size we'll accept. Anything bigger is almost certainly abuse —
// even the largest legitimate submission (commercial + every conditional
// field filled with verbose notes) is well under 8 KB.
const MAX_BODY_BYTES = 16 * 1024;

// Field length caps. Protects the email composer from being asked to render
// novels, and gives Resend a predictable upper bound on body size.
const FIELD_MAX = 2000;
const SUBJECT_MAX = 200;

type SubmissionPayload = {
  source?: string;
  submittedAt?: string;
  turnstileToken?: string;
  website?: string; // honeypot
  [key: string]: unknown;
};

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  // Top-level guard: a Pages Function that throws (or exceeds a limit)
  // before returning a Response makes Cloudflare serve a bare `error code:
  // 502` HTML page instead of our JSON. That page is opaque to the client
  // and impossible to debug from the browser. Wrapping the whole handler
  // guarantees we always return our own JSON with a `detail` we can read.
  try {
    return await handlePost(ctx);
  } catch (err) {
    console.log('[contact] server_error:', String(err).slice(0, 300));
    return json(
      { ok: false, error: 'server_error', detail: String(err).slice(0, 300) },
      500
    );
  }
};

const handlePost = async (ctx: PagesContext): Promise<Response> => {
  const { request, env } = ctx;

  // 1. Origin allow-list. Cheap CSRF / curl-from-script guard. In production
  //    we trust the Origin header; for OPTIONS we'd handle CORS, but this
  //    endpoint is same-origin only so we never need to.
  if (!isAllowedOrigin(request, env)) {
    return json({ ok: false, error: 'forbidden' }, 403);
  }

  // 2. Read + size-cap the body. Reject too-large or malformed payloads.
  let payload: SubmissionPayload;
  try {
    const raw = await readBoundedText(request, MAX_BODY_BYTES);
    payload = JSON.parse(raw) as SubmissionPayload;
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // 3. Honeypot — bots fill `website`, humans never see it. Silent success
  //    so the bot doesn't learn that the field was the trap.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  // 4. Turnstile verification. If a token is present we verify it; if no
  //    token AND the form is configured as Turnstile-protected, we reject.
  //    During the development window before Turnstile is set up, missing
  //    tokens are accepted — flip TURNSTILE_REQUIRED behavior by setting
  //    the secret to a non-empty string.
  if (env.TURNSTILE_SECRET_KEY) {
    const token = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
    if (!token) {
      return json({ ok: false, error: 'captcha_missing' }, 400);
    }
    const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP') ?? undefined);
    if (!ok) {
      return json({ ok: false, error: 'captcha_failed' }, 400);
    }
  }

  // 5. Compose + send the email via Resend. Retry once on transient failure.
  try {
    await sendViaResend(payload, env);
  } catch (err) {
    // Log to the Pages real-time log stream so the failure reason is visible
    // in the dashboard even when the edge replaces our JSON body with a
    // generic error page. console.log shows up in the deployment's
    // Real-time Logs `logs` array.
    console.log('[contact] delivery_failed:', String(err).slice(0, 300));
    return json({ ok: false, error: 'delivery_failed', detail: String(err).slice(0, 300) }, 502);
  }

  return json({ ok: true }, 200);
};

// Catch-all for non-POST verbs. Returning 405 (not 404) so monitoring tools
// can distinguish "endpoint exists but wrong method" from "endpoint missing".
export const onRequest = (): Response =>
  json({ ok: false, error: 'method_not_allowed' }, 405);

// ----- helpers -----------------------------------------------------------

const json = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const isAllowedOrigin = (request: Request, env: Env): boolean => {
  // If no allow-list is configured, accept same-origin (the default).
  // Pages Functions are served from the same origin as the static site,
  // so any cross-origin request is definitionally suspicious.
  const origin = request.headers.get('Origin');
  if (!origin) return true; // same-origin fetches don't always send Origin
  const allowList = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowList.length === 0) {
    // Default-allow the request's host, matching it against the URL the
    // Function itself is serving from.
    const url = new URL(request.url);
    return origin === `${url.protocol}//${url.host}`;
  }
  return allowList.includes(origin);
};

const readBoundedText = async (request: Request, maxBytes: number): Promise<string> => {
  // Streams the body and trips if it exceeds maxBytes. Cheaper than reading
  // the whole thing then checking length.
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let total = 0;
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      throw new Error('body too large');
    }
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
};

const verifyTurnstile = async (token: string, secret: string, ip?: string): Promise<boolean> => {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
};

const sendViaResend = async (payload: SubmissionPayload, env: Env): Promise<void> => {
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    // Report WHICH var is missing so a misconfigured deploy is diagnosable
    // from the response body instead of a generic failure.
    const missing = [
      !apiKey && 'RESEND_API_KEY',
      !to && 'CONTACT_TO_EMAIL',
      !from && 'CONTACT_FROM_EMAIL',
    ]
      .filter(Boolean)
      .join(', ');
    throw new Error(`email_config_missing: ${missing}`);
  }

  const subject = composeSubject(payload);
  const { html, text } = composeBody(payload);

  // One attempt + one retry. 200ms backoff on retry, only for transient
  // (5xx / network) failures. 4xx from Resend means we sent bad data and
  // retrying won't help.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(200);
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: safe(subject, SUBJECT_MAX),
          html,
          text,
          // Tag for searchability in Resend's dashboard. Keep tag values
          // alphanumeric (Resend rejects others).
          tags: [{ name: 'source', value: safeTag(String(payload.source ?? 'unknown')) }],
        }),
      });
      if (res.ok) return; // success — bail out of retry loop
      const body = await res.text();
      // 4xx → permanent failure (bad data, unverified sender domain, bad
      // API key, etc.), don't retry. The body carries Resend's reason.
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`resend_${res.status}: ${body.slice(0, 250)}`);
      }
      // 5xx → transient, retry once
      lastErr = new Error(`resend_${res.status}: ${body.slice(0, 250)}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
};

// A signup-page submission is a confirmed customer onboarding (their quote is
// already approved), NOT a new lead asking for a price — so its email shouldn't
// read "quote request". Label by source; every other source stays a quote request.
const submissionLabels = (p: SubmissionPayload): { subject: string; heading: string } => {
  if (String(p.source ?? '') === 'signup-page') {
    return { subject: 'New customer signup', heading: 'New Customer Signup' };
  }
  return { subject: 'New quote request', heading: 'New Quote Request' };
};

const composeSubject = (p: SubmissionPayload): string => {
  const source = String(p.source ?? 'website');
  const service = String(p.service ?? '').trim();
  const name = String(p.name ?? '').trim();
  const parts: string[] = [submissionLabels(p).subject];
  if (service) parts.push(`(${humanizeService(service)})`);
  if (name) parts.push(`— ${name}`);
  parts.push(`[${source}]`);
  return parts.join(' ');
};

const composeBody = (p: SubmissionPayload): { html: string; text: string } => {
  // Strip honeypot + turnstile from the rendered email — they're submission
  // artifacts, not data the recipient needs to see.
  const omit = new Set(['website', 'turnstileToken']);
  const rows: Array<[string, string]> = [];
  for (const [k, v] of Object.entries(p)) {
    if (omit.has(k)) continue;
    if (v == null) continue;
    const s = String(v).trim();
    if (!s) continue;
    rows.push([humanizeKey(k), safe(s, FIELD_MAX)]);
  }

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  const heading = submissionLabels(p).heading;
  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f6f8fc;padding:24px 0;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#0a1628;color:#fff;padding:20px 24px;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9ca3af;">Suncoast Pool Pros</div>
      <div style="font-size:18px;font-weight:600;margin-top:4px;">${heading}</div>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows
          .map(
            ([k, v]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f3f4;color:#6b7280;width:38%;vertical-align:top;">${escapeHtml(k)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f3f4;color:#111827;font-weight:500;">${escapeHtml(v).replace(/\n/g, '<br>')}</td>
        </tr>`
          )
          .join('')}
      </table>
    </div>
  </div>
</body></html>`.trim();

  return { html, text };
};

const humanizeService = (slug: string): string => {
  const map: Record<string, string> = {
    weekly: 'Weekly Cleaning',
    green: 'Green Pool Recovery',
    repair: 'Equipment Repair',
    commercial: 'Commercial / HOA',
    other: 'Other',
  };
  return map[slug] ?? slug;
};

const humanizeKey = (key: string): string => {
  // Convert "greenSeverity" → "Green Severity"
  // Convert "commercialPropertyType" → "Commercial Property Type"
  // Special-case a few short labels for clarity.
  const overrides: Record<string, string> = {
    email: 'Email',
    phone: 'Phone',
    name: 'Name',
    address: 'Address',
    zip: 'Zip',
    service: 'Service',
    source: 'Source',
    submittedAt: 'Submitted',
  };
  if (overrides[key]) return overrides[key];
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
};

const safe = (s: string, max: number): string => s.slice(0, max);
const safeTag = (s: string): string => s.replace(/[^a-z0-9_-]/gi, '_').slice(0, 50);
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
