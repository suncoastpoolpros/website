/**
 * Single submit layer for every contact/quote/signup form on the site.
 *
 * All forms call `sendContact()`. To change HOW submissions are delivered
 * (e.g. swap webhooks for an email service, or add a CRM), edit ONLY this file
 * and every form — homepage quote, contact page, quote popup, and signup —
 * picks up the change automatically.
 */

// Delivery destinations. VITE_-prefixed so Vite exposes them to the browser.
// Empty values are skipped so local dev doesn't error without a .env.
const WEBHOOK_URLS = [
  import.meta.env.VITE_CONTACTS_WEBHOOK_URL,
  import.meta.env.VITE_QUO_WEBHOOK_URL,
].filter((url): url is string => Boolean(url));

// A form submission. `source` identifies which form it came from; everything
// else is free-form so different forms can send different fields.
export type ContactPayload = {
  source: string;
  submittedAt: string;
  [key: string]: unknown;
};

/**
 * Deliver a submission to every configured destination in parallel.
 * Resolves if at least one delivery succeeds; rejects only if all fail, so a
 * single flaky endpoint never blocks the customer.
 *
 * Swap-point: replace the fetch loop below with an email API call (or add one)
 * to change delivery everywhere at once.
 */
export async function sendContact(payload: ContactPayload): Promise<void> {
  if (WEBHOOK_URLS.length === 0) {
    throw new Error('No contact delivery destinations configured');
  }

  const results = await Promise.allSettled(
    WEBHOOK_URLS.map((url) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error(`Webhook ${url} responded ${res.status}`);
      })
    )
  );

  const anyDelivered = results.some((r) => r.status === 'fulfilled');
  if (!anyDelivered) {
    const reasons = results
      .map((r) => (r.status === 'rejected' ? String(r.reason) : ''))
      .filter(Boolean)
      .join('; ');
    throw new Error(`All contact deliveries failed: ${reasons}`);
  }
}
