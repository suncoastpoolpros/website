/**
 * GET    /api/admin/session — is the current request authenticated?
 *        200 {ok:true} when the session cookie is valid, 401 otherwise.
 *        The /admin page calls this on load to decide keypad vs. builder.
 *
 * DELETE /api/admin/session — log out (clear the session cookie).
 */
import {
  type AdminContext,
  json,
  requireSession,
  clearSessionCookie,
} from './_shared';

export const onRequestGet = async (ctx: AdminContext): Promise<Response> => {
  const denied = await requireSession(ctx.request, ctx.env);
  if (denied) return denied;
  return json({ ok: true }, 200);
};

export const onRequestDelete = (): Response =>
  json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });

export const onRequest = (): Response => json({ ok: false, error: 'method_not_allowed' }, 405);
