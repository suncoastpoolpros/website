/**
 * Storage for sent quotes, so a customer can accept one from a link.
 *
 * Deliberately NOT a customer database. Live customers, routes and filter
 * tracking belong to the technicians' service app; this records what was quoted
 * and what was accepted, and the acceptance email is the handoff to that system.
 *
 * DEGRADES BY DESIGN. Every function here treats a missing D1 binding as "not
 * available" rather than an error. Until the database is bound in the Cloudflare
 * dashboard, proposals send exactly as they do today — they just don't carry an
 * approve link. Sending a customer their quote is the job; storing it is an
 * enhancement, and an enhancement must never be able to break the job.
 *
 * Setup (one time, in the Cloudflare dashboard):
 *   1. Workers & Pages → D1 → Create database, name it `suncoast`
 *   2. npx wrangler d1 execute suncoast --remote --file=migrations/0001_quotes.sql
 *   3. Pages project → Settings → Functions → D1 bindings → variable name `DB`
 *   4. Redeploy (bindings only take effect on the next deployment)
 */

/** Minimal shape of the D1 binding we use — avoids depending on CF types. */
export type D1Like = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<unknown>;
      first: <T = Record<string, unknown>>() => Promise<T | null>;
    };
  };
};

export type QuoteRow = {
  id: string;
  created_at: string;
  expires_at: string;
  customer_name: string;
  customer_email: string;
  customer_address: string | null;
  customer_phone: string | null;
  pool_json: string;
  proposal_json: string;
  accepted_at: string | null;
  accepted_plan: string | null;
  accepted_ip: string | null;
  accepted_ua: string | null;
};

/** How long an emailed approve link stays live. */
export const QUOTE_TTL_DAYS = 30;

/**
 * A URL-safe token with 256 bits of entropy. Emailed links are the only thing
 * protecting a quote, so this has to be unguessable — not a counter, not
 * anything derived from the customer.
 */
export const newQuoteToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const isQuoteStorageAvailable = (db: unknown): db is D1Like =>
  !!db && typeof (db as D1Like).prepare === 'function';

/**
 * Persist a sent quote. Returns the token, or null when storage isn't available
 * or the write failed — callers then simply omit the approve link.
 */
export async function saveQuote(
  db: unknown,
  quote: {
    customer: { name?: string; email?: string; address?: string; phone?: string };
    pool: unknown;
    proposal: unknown;
  },
): Promise<string | null> {
  if (!isQuoteStorageAvailable(db)) return null;
  const id = newQuoteToken();
  const now = new Date();
  const expires = new Date(now.getTime() + QUOTE_TTL_DAYS * 24 * 60 * 60 * 1000);
  try {
    await db
      .prepare(
        `INSERT INTO quotes
           (id, created_at, expires_at, customer_name, customer_email,
            customer_address, customer_phone, pool_json, proposal_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        now.toISOString(),
        expires.toISOString(),
        String(quote.customer?.name ?? '').trim(),
        String(quote.customer?.email ?? '').trim(),
        String(quote.customer?.address ?? '').trim() || null,
        String(quote.customer?.phone ?? '').trim() || null,
        JSON.stringify(quote.pool ?? {}),
        JSON.stringify(quote.proposal ?? {}),
      )
      .run();
    return id;
  } catch (err) {
    // A storage failure must not fail the send — the customer still gets the
    // proposal, just without a one-click accept.
    console.log('[quotes] save_failed:', String(err).slice(0, 300));
    return null;
  }
}

export async function getQuote(db: unknown, id: string): Promise<QuoteRow | null> {
  if (!isQuoteStorageAvailable(db) || !id) return null;
  try {
    return await db.prepare('SELECT * FROM quotes WHERE id = ?').bind(id).first<QuoteRow>();
  } catch (err) {
    console.log('[quotes] read_failed:', String(err).slice(0, 300));
    return null;
  }
}

export const isExpired = (row: QuoteRow): boolean => new Date(row.expires_at).getTime() < Date.now();

/**
 * Record an acceptance. Returns false when the quote is already accepted, so a
 * second click can't overwrite the first — the original timestamp and plan are
 * the evidence.
 */
export async function acceptQuote(
  db: unknown,
  id: string,
  plan: string,
  ip: string,
  ua: string,
): Promise<boolean> {
  if (!isQuoteStorageAvailable(db)) return false;
  try {
    await db
      .prepare(
        `UPDATE quotes
            SET accepted_at = ?, accepted_plan = ?, accepted_ip = ?, accepted_ua = ?
          WHERE id = ? AND accepted_at IS NULL`,
      )
      .bind(new Date().toISOString(), plan.slice(0, 80), ip.slice(0, 60), ua.slice(0, 300), id)
      .run();
    return true;
  } catch (err) {
    console.log('[quotes] accept_failed:', String(err).slice(0, 300));
    return false;
  }
}

/** The link that goes in the email. */
export const approveUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/$/, '')}/approve/?t=${encodeURIComponent(token)}`;
