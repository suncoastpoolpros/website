/**
 * Single submit layer for every contact/quote/signup form on the site.
 *
 * Posts to our own Cloudflare Pages Function at `/api/contact`. The Function
 * handles Turnstile verification, origin checks, and the actual email delivery
 * via Resend — keeping the API key and destination address server-side.
 *
 * To change delivery (e.g. swap Resend, add a Google Sheets log), edit
 * `functions/api/contact.ts`. Forms here don't need to know how it works.
 */

const ENDPOINT = '/api/contact';

// A form submission. `source` identifies which form it came from; everything
// else is free-form so different forms can send different fields.
export type ContactPayload = {
  source: string;
  submittedAt: string;
  /** Cloudflare Turnstile token, if the form has the widget mounted. */
  turnstileToken?: string;
  [key: string]: unknown;
};

/**
 * POST the payload to /api/contact. Throws on non-2xx so the caller can
 * display an error state and we can console-log a tagged failure (stripped
 * in production by esbuild).
 */
export async function sendContact(payload: ContactPayload): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // Body usually has a short machine-readable error code like
    // `captcha_failed`. Stay opaque in the thrown message; let the caller
    // surface a generic "please try again" to the user.
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`Contact submit failed (${res.status}): ${detail.slice(0, 200)}`);
  }
}
