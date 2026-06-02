/**
 * POST /api/admin/login — exchange the 6-digit PIN for a session cookie.
 *
 * Flow:
 *   1. Reject cross-origin requests (cheap CSRF guard).
 *   2. (Optionally) verify a Turnstile token — currently BYPASSED, see below.
 *   3. Constant-time compare the submitted PIN to the ADMIN_PIN secret.
 *   4. On match, Set-Cookie an HMAC-signed session (30-day "remember device").
 *
 * The PIN is only ever checked here, server-side. It is never shipped to the
 * browser, so the /admin bundle being public is harmless.
 */
import {
  type AdminContext,
  json,
  isAllowedOrigin,
  readBoundedText,
  verifyTurnstile,
  timingSafeEqual,
  signSession,
  serializeSessionCookie,
} from './_shared';

// --- TEMPORARY: Turnstile bot-check is bypassed on the admin login. ----------
// Set this back to `true` (and mount the widget in AdminKeypad.tsx) to restore
// brute-force protection before this goes to real production use. While false,
// a 6-digit PIN has no per-attempt friction, so keep ADMIN_PIN private and the
// /admin URL unadvertised.
const REQUIRE_TURNSTILE = false;
// -----------------------------------------------------------------------------

// Session lifetime: 30 days. Long enough that the owner rarely re-enters the
// PIN on their own phone; short enough that a stolen cookie eventually dies.
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

const MAX_BODY_BYTES = 4 * 1024;

type LoginPayload = { pin?: string; turnstileToken?: string };

export const onRequestPost = async (ctx: AdminContext): Promise<Response> => {
  const { request, env } = ctx;
  try {
    if (!isAllowedOrigin(request, env)) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    let payload: LoginPayload;
    try {
      payload = JSON.parse(await readBoundedText(request, MAX_BODY_BYTES)) as LoginPayload;
    } catch {
      return json({ ok: false, error: 'bad_request' }, 400);
    }

    if (REQUIRE_TURNSTILE && env.TURNSTILE_SECRET_KEY) {
      const token = typeof payload.turnstileToken === 'string' ? payload.turnstileToken : '';
      if (!token) return json({ ok: false, error: 'captcha_missing' }, 400);
      const ok = await verifyTurnstile(
        token,
        env.TURNSTILE_SECRET_KEY,
        request.headers.get('CF-Connecting-IP') ?? undefined,
      );
      if (!ok) return json({ ok: false, error: 'captcha_failed' }, 400);
    }

    const expected = env.ADMIN_PIN;
    const secret = env.ADMIN_SESSION_SECRET;
    if (!expected || !secret) {
      return json({ ok: false, error: 'auth_not_configured' }, 500);
    }

    const submitted = typeof payload.pin === 'string' ? payload.pin : '';
    if (!timingSafeEqual(submitted, expected)) {
      return json({ ok: false, error: 'invalid_pin' }, 401);
    }

    const token = await signSession(secret, SESSION_TTL_SECONDS);
    return json({ ok: true }, 200, {
      'Set-Cookie': serializeSessionCookie(token, SESSION_TTL_SECONDS),
    });
  } catch (err) {
    console.log('[admin/login] server_error:', String(err).slice(0, 300));
    return json({ ok: false, error: 'server_error' }, 500);
  }
};

// Any non-POST verb.
export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
