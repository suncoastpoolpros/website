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
import { isThrottled, recordLookupFailure } from '../_quotes';
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

// --- Turnstile on the admin login. -------------------------------------------
// AdminKeypad mounts the invisible widget and sends its token with the PIN, so
// the check is enforced whenever TURNSTILE_SECRET_KEY is set — on top of the
// per-IP rate limit on wrong PINs below, not instead of it.
//
// LOCKED OUT? If the widget ever can't load (the keypad then says "Security
// check didn't load"), delete TURNSTILE_SECRET_KEY in the Pages project and
// redeploy: the login falls back to PIN + rate limit.
const REQUIRE_TURNSTILE = true;
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

    /**
     * Rate limit the PIN, because nothing else does.
     *
     * ADMIN_PIN is six digits — a million combinations. Unthrottled, at a
     * modest 50 requests a second, the whole space falls in under six hours,
     * and /admin is a known URL (it is named in robots.txt). What is behind it
     * is every customer's name, address, phone and pricing, the ability to send
     * mail from the business domain, and the ability to delete signed
     * acceptances. That is the highest-value door on the site and it had no
     * lock beyond the PIN itself.
     *
     * Ten failures per IP per fifteen minutes puts a million combinations at
     * roughly 2,800 years, while leaving an owner who fat-fingers their PIN a
     * few times entirely unaffected. Counted on FAILURE only, so a correct PIN
     * never spends budget, and scoped separately from quote-token guessing so
     * neither can lock out the other.
     *
     * Degrades open like the rest of the storage layer: if D1 is unavailable
     * this does nothing rather than locking the owner out of their own tools.
     */
    const ip = request.headers.get('CF-Connecting-IP') ?? '';
    const db = (env as unknown as { DB?: unknown }).DB;
    if (await isThrottled(db, ip, 'login')) {
      return json({ ok: false, error: 'too_many_attempts' }, 429);
    }

    const submitted = typeof payload.pin === 'string' ? payload.pin : '';
    if (!timingSafeEqual(submitted, expected)) {
      ctx.waitUntil?.(recordLookupFailure(db, ip, 'login'));
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
