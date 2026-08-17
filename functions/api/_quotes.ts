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
 * Setup:
 *   1. D1 database `suncoast` — DONE (id 7c157f23-9a53-46c5-b2cf-9c76284f826a)
 *   2. Binding DB → suncoast on Production — DONE
 *   3. Schema: npx wrangler d1 execute suncoast --remote --file=migrations/0001_quotes.sql
 *   4. Redeploy — bindings only take effect on the next deployment
 *
 * Only Production is bound. Preview deployments need no binding to be SAFE
 * (they degrade like anything else here); bind Preview only if you want the
 * feature there, and point it at a SEPARATE database so test acceptances can't
 * write into real quotes or email real customers.
 *
 * Local development against the real schema:
 *   npx wrangler pages dev dist --d1 DB=7c157f23-9a53-46c5-b2cf-9c76284f826a
 *
 * Note there is deliberately no wrangler.toml: this Pages project is configured
 * in the dashboard, and adding one would take over that configuration.
 */

/** Minimal shape of the D1 binding we use — avoids depending on CF types. */
export type D1Like = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<unknown>;
      first: <T = Record<string, unknown>>() => Promise<T | null>;
    };
    all: <T = Record<string, unknown>>() => Promise<{ results?: T[] }>;
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
  onboarding_json?: string | null;
  terms_version?: string | null;
};

/**
 * The service agreement version a customer is agreeing to. Mirrors LAST_UPDATED
 * in src/pages/ServiceAgreementPage.tsx — "they agreed" is worth little without
 * "to what", so the accepted record names the version.
 */
export const TERMS_VERSION = '08-17-2026';

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

/**
 * Delete a quote outright.
 *
 * A hard DELETE, not a soft-delete flag. This table is a record of what was
 * quoted, not an audit log — the acceptance email is the permanent copy of any
 * decision, and a `deleted_at` column would mean every read path had to
 * remember to filter on it. One place to forget is one place to leak a deleted
 * quote back into the list.
 *
 * The caller is expected to have already read the row, so it can tell a real
 * 404 from a delete that silently matched nothing.
 */
export async function deleteQuote(db: unknown, id: string): Promise<boolean> {
  if (!isQuoteStorageAvailable(db) || !id) return false;
  try {
    await db.prepare('DELETE FROM quotes WHERE id = ?').bind(id).run();
    return true;
  } catch (err) {
    console.log('[quotes] delete_failed:', String(err).slice(0, 300));
    return false;
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
  onboarding: unknown = null,
): Promise<boolean> {
  if (!isQuoteStorageAvailable(db)) return false;
  try {
    // Plan, consents and evidence land in ONE write. Acceptance is a single
    // fact; recording half of it would leave a row claiming agreement without
    // the terms version that says agreement to what.
    await db
      .prepare(
        `UPDATE quotes
            SET accepted_at = ?, accepted_plan = ?, accepted_ip = ?, accepted_ua = ?,
                onboarding_json = ?, terms_version = ?
          WHERE id = ? AND accepted_at IS NULL`,
      )
      .bind(
        new Date().toISOString(),
        plan.slice(0, 80),
        ip.slice(0, 60),
        ua.slice(0, 300),
        onboarding ? JSON.stringify(onboarding).slice(0, 8000) : null,
        TERMS_VERSION,
        id,
      )
      .run();
    return true;
  } catch (err) {
    console.log('[quotes] accept_failed:', String(err).slice(0, 300));
    return false;
  }
}

/**
 * Recent quotes for the admin list, newest first.
 *
 * Returns null — not an empty array — when storage isn't available, so the UI
 * can say "storage isn't set up" instead of the much more alarming "you have no
 * quotes". Those are different facts and they deserve different screens.
 *
 * Capped rather than paginated: this is a solo operator's quote list, and a few
 * hundred rows is years of work. Revisit if that ever stops being true.
 */
export async function listQuotes(db: unknown, limit = 200): Promise<QuoteRow[] | null> {
  if (!isQuoteStorageAvailable(db)) return null;
  try {
    const res = await db
      .prepare(
        `SELECT id, created_at, expires_at, customer_name, customer_email,
                customer_address, customer_phone, proposal_json,
                accepted_at, accepted_plan
           FROM quotes
          ORDER BY created_at DESC
          LIMIT ${Math.max(1, Math.min(limit, 500))}`,
      )
      .all<QuoteRow>();
    return res.results ?? [];
  } catch (err) {
    console.log('[quotes] list_failed:', String(err).slice(0, 300));
    return null;
  }
}

/** The link that goes in the email. */
export const approveUrl = (origin: string, token: string): string =>
  `${origin.replace(/\/$/, '')}/approve/?t=${encodeURIComponent(token)}`;
