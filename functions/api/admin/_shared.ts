/**
 * Shared helpers for the admin (proposal) Pages Functions.
 *
 * Lives at `functions/api/admin/_shared.ts`. The leading underscore means
 * Cloudflare Pages does NOT route it as an endpoint — it's an importable module
 * for the sibling functions (login.ts, session.ts, send-proposal.ts).
 *
 * Much of this mirrors the proven logic in `functions/api/contact.ts` (origin
 * check, Turnstile verify, Resend send + retry). It's duplicated rather than
 * shared so the working public contact form is untouched by this feature; a
 * later cleanup could hoist the common bits into one module.
 *
 * Auth model: a 6-digit PIN is checked SERVER-SIDE here (never in the client
 * bundle). On success we hand back an HMAC-signed session cookie; every
 * /api/admin/* call re-verifies it before doing anything. No database.
 */

// Env is whatever's configured in the Pages dashboard / wrangler. Every admin
// function reads some subset of these.
export type AdminEnv = {
  // Auth
  ADMIN_PIN?: string;              // the 6-digit code (secret)
  ADMIN_SESSION_SECRET?: string;   // HMAC key for signing session cookies (secret)
  // Bot check (shared with the contact form). Optional — see login.ts note.
  TURNSTILE_SECRET_KEY?: string;
  // Email (Resend) — reuse contact-form keys where a proposal-specific one isn't set.
  RESEND_API_KEY?: string;
  PROPOSAL_FROM_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  PROPOSAL_REPLY_TO?: string;
  CONTACT_TO_EMAIL?: string;
  ALLOWED_ORIGINS?: string;
};

export interface AdminContext {
  request: Request;
  env: AdminEnv;
  waitUntil?: (promise: Promise<unknown>) => void;
}

// ----- HTTP helpers ------------------------------------------------------

export const json = (
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });

export const isAllowedOrigin = (request: Request, env: AdminEnv): boolean => {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // same-origin fetches don't always send Origin
  const allowList = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (allowList.length === 0) {
    const url = new URL(request.url);
    return origin === `${url.protocol}//${url.host}`;
  }
  return allowList.includes(origin);
};

export const readBoundedText = async (request: Request, maxBytes: number): Promise<string> => {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let total = 0;
  let out = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) throw new Error('body too large');
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
};

export const verifyTurnstile = async (
  token: string,
  secret: string,
  ip?: string,
): Promise<boolean> => {
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

// ----- base64url + HMAC (Web Crypto, no deps) ----------------------------

const b64urlFromBytes = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const b64urlEncodeString = (s: string): string =>
  b64urlFromBytes(new TextEncoder().encode(s));

const importHmacKey = (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

const hmacB64url = async (secret: string, data: string): Promise<string> => {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64urlFromBytes(new Uint8Array(sig));
};

/** Constant-time string compare (avoids leaking match length via timing). */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  // Compare against a fixed length so the loop count doesn't depend on inputs.
  const len = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  }
  return diff === 0;
};

// ----- session token + cookie -------------------------------------------

// __Host- prefix hardens the cookie: browsers only accept it over HTTPS, with
// Path=/ and no Domain — it can't be set or overridden by a subdomain. Chrome
// treats http://localhost as secure, so `wrangler pages dev` works too.
export const SESSION_COOKIE = '__Host-scpp_admin';

// token = base64url({exp}) + "." + base64url(HMAC-SHA256(payload, secret))
export const signSession = async (secret: string, ttlSeconds: number): Promise<string> => {
  const payload = b64urlEncodeString(JSON.stringify({ exp: Date.now() + ttlSeconds * 1000 }));
  const sig = await hmacB64url(secret, payload);
  return `${payload}.${sig}`;
};

export const verifySession = async (token: string | null, secret: string): Promise<boolean> => {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacB64url(secret, payload);
  if (!timingSafeEqual(sig, expected)) return false;
  try {
    const bin = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = decodeURIComponent(
      bin
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
};

export const serializeSessionCookie = (token: string, maxAgeSeconds: number): string =>
  `${SESSION_COOKIE}=${token}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; Secure; SameSite=Strict`;

export const clearSessionCookie = (): string =>
  `${SESSION_COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;

const readCookie = (request: Request, name: string): string | null => {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
};

/**
 * Gate helper for protected endpoints. Returns a 401 Response when the request
 * has no valid session cookie, or null when the session is good (caller proceeds).
 */
export const requireSession = async (request: Request, env: AdminEnv): Promise<Response | null> => {
  const secret = env.ADMIN_SESSION_SECRET;
  if (!secret) return json({ ok: false, error: 'auth_not_configured' }, 500);
  const token = readCookie(request, SESSION_COOKIE);
  const ok = await verifySession(token, secret);
  return ok ? null : json({ ok: false, error: 'unauthorized' }, 401);
};

// ----- Resend send -------------------------------------------------------

export type Attachment = { filename: string; content: string /* base64 */ };

export type SendOpts = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  bcc?: string;
  attachments?: Attachment[];
  tags?: Array<{ name: string; value: string }>;
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Send one email via Resend's HTTPS API. One attempt + one retry on transient
 * (5xx / network) failure; 4xx is permanent (bad data) and not retried. Mirrors
 * the retry strategy in functions/api/contact.ts.
 */
export const sendViaResend = async (apiKey: string, opts: SendOpts): Promise<void> => {
  const payload: Record<string, unknown> = {
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.text) payload.text = opts.text;
  if (opts.replyTo) payload.reply_to = opts.replyTo;
  if (opts.bcc) payload.bcc = opts.bcc;
  if (opts.attachments?.length) payload.attachments = opts.attachments;
  if (opts.tags?.length) payload.tags = opts.tags;

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
        body: JSON.stringify(payload),
      });
      if (res.ok) return;
      const body = await res.text();
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`resend_${res.status}: ${body.slice(0, 250)}`);
      }
      lastErr = new Error(`resend_${res.status}: ${body.slice(0, 250)}`);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
};
