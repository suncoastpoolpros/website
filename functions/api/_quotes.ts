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
  /** Human-readable proposal number. Null on quotes sent before numbering. */
  number?: number | null;
  /** Activity. Null / 0 until the customer opens the link — see recordQuoteOpen. */
  first_opened_at?: string | null;
  last_opened_at?: string | null;
  open_count?: number | null;
  /** The owner's own previews, kept out of open_count. See recordQuoteOpen. */
  admin_open_count?: number | null;
  admin_last_opened_at?: string | null;
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
 * Crockford base32, lowercase: the digits and letters minus i, l, o and u.
 * Excluding those means no 0/O or 1/l ambiguity when a link is read aloud or
 * retyped, and dropping u makes an accidental word in a customer-facing URL
 * far less likely.
 */
const TOKEN_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';

/** Kept short deliberately — these links are texted, and a 75-character URL
 *  wraps onto three lines in a message. See the entropy note on newQuoteToken. */
export const TOKEN_LENGTH = 7;

/** Whether a string is one of our short tokens (vs. a legacy 43-char one). */
export const isShortToken = (s: string): boolean =>
  s.length === TOKEN_LENGTH && [...s].every((c) => TOKEN_ALPHABET.includes(c));

/**
 * The secret in a quote link.
 *
 * 7 characters of Crockford base32 — 32^7, about 34 billion. That is a
 * DELIBERATE step down from the 256-bit base64 token this replaced, traded for
 * a URL short enough to text, and it only holds up because failed lookups are
 * rate limited (see functions/api/quote/[token].ts). Without that limit, 34
 * billion is roughly 200 days of sustained guessing against one known quote —
 * with it, the same attack needs thousands of IP-years.
 *
 * So: if the rate limiting is ever removed, this MUST get longer. The two
 * decisions are load-bearing for each other and neither is safe alone.
 *
 * Note the proposal number travels in the URL beside this (/quote-1001-k7m2p9x)
 * and is NOT a secret — it's printed on the PDF. It also tells an attacker the
 * quote exists, which is exactly why the random part carries the whole lock.
 *
 * Legacy 43-character base64url tokens stay valid forever; they are simply
 * longer strings in the same column, and their links keep working.
 */
export const newQuoteToken = (): string => {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  let out = '';
  // 256 is an exact multiple of 32, so a plain modulo is unbiased here and
  // needs no rejection sampling.
  for (const b of bytes) out += TOKEN_ALPHABET[b % 32];
  return out;
};

export const isQuoteStorageAvailable = (db: unknown): db is D1Like =>
  !!db && typeof (db as D1Like).prepare === 'function';

/**
 * Reserve the next proposal number.
 *
 * Reserved rather than derived, because the number has to be ON the PDF, and
 * the PDF is rendered in the admin's browser before the quote row exists.
 * MAX(number)+1 over a table the row isn't in yet would hand the same number to
 * two overlapping sends; a single atomic increment can't.
 *
 * Returns null when storage isn't available or the counter is missing — the
 * proposal then sends exactly as it did before numbering, just without one. A
 * missing number must never block a send.
 */
/**
 * Coerce a proposal number for storage, or null.
 *
 * Number(null) and Number('') are both 0, and Number.isFinite(0) is true — so a
 * naive isFinite check stores 0 for "no number", which is neither null nor a
 * real proposal. A number is only real if it's a positive integer.
 */
export const proposalNumberOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export async function reserveProposalNumber(db: unknown): Promise<number | null> {
  if (!isQuoteStorageAvailable(db)) return null;
  try {
    const row = await db
      .prepare("UPDATE counters SET value = value + 1 WHERE name = 'proposal_number' RETURNING value")
      .bind()
      .first<{ value?: number }>();
    const n = Number(row?.value);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (err) {
    console.log('[quotes] number_reserve_failed:', String(err).slice(0, 300));
    return null;
  }
}

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
    /** The number already reserved and printed on the PDF, if any. */
    number?: number | null;
  },
): Promise<string | null> {
  if (!isQuoteStorageAvailable(db)) return null;
  const now = new Date();
  const expires = new Date(now.getTime() + QUOTE_TTL_DAYS * 24 * 60 * 60 * 1000);
  /**
   * Retried because the token is now 7 characters, not 43. A collision is still
   * vanishingly unlikely — but "unlikely" was ~1 in 10^70 before and is ~1 in
   * 10^8 per insert now, which is close enough to real that silently returning
   * "no link" for it would be the wrong call. A fresh token on the next attempt
   * costs nothing.
   */
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = newQuoteToken();
    try {
      await db
        .prepare(
          `INSERT INTO quotes
             (id, created_at, expires_at, customer_name, customer_email,
              customer_address, customer_phone, pool_json, proposal_json, number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          proposalNumberOrNull(quote.number),
        )
        .run();
      return id;
    } catch (err) {
      const msg = String(err);
      // Only a primary-key clash is worth another go. Anything else (no table,
      // no binding, a constraint on a real column) will fail identically three
      // times, and retrying it just delays the send.
      if (!/UNIQUE|PRIMARY KEY|constraint/i.test(msg) || attempt === 2) {
        // A storage failure must not fail the send — the customer still gets the
        // proposal, just without a one-click accept.
        console.log('[quotes] save_failed:', msg.slice(0, 300));
        return null;
      }
      console.log('[quotes] token_collision, retrying');
    }
  }
  return null;
}

/**
 * Photos attached to a proposal.
 *
 * Written alongside the quote and read only when the customer presses
 * "Download full proposal" — never on page load. See migrations/0005 for why
 * they are not folded into proposal_json.
 *
 * Best-effort by the same rule as everything else here: a photo that fails to
 * store must not fail the send. The customer's emailed PDF already has them;
 * losing the archival copy costs a re-download some pictures, not the sale.
 */
export async function saveQuotePhotos(
  db: unknown,
  quoteId: string,
  photos: string[],
): Promise<void> {
  if (!isQuoteStorageAvailable(db) || !quoteId || photos.length === 0) return;
  try {
    for (let i = 0; i < photos.length; i += 1) {
      const src = photos[i];
      // Only ever our own downscaled JPEG data URLs. Anything else is either a
      // remote reference we should not be fetching or something malformed, and
      // storing it would put unvalidated content in front of a customer later.
      if (typeof src !== 'string' || !src.startsWith('data:image/')) continue;
      await db
        .prepare('INSERT OR REPLACE INTO quote_photos (quote_id, idx, data_url) VALUES (?, ?, ?)')
        .bind(quoteId, i, src)
        .run();
    }
  } catch (err) {
    console.log('[quotes] photo_save_failed:', String(err).slice(0, 300));
  }
}

/**
 * One photo, by position. Fetched one at a time rather than as an array: eight
 * of them is 2–3 MB, and a single response that large risks D1's result limit
 * and stalls on a phone. One request per photo keeps each one small and lets
 * the download show progress.
 */
export async function getQuotePhoto(
  db: unknown,
  quoteId: string,
  idx: number,
): Promise<string | null> {
  if (!isQuoteStorageAvailable(db) || !quoteId || !Number.isInteger(idx) || idx < 0) return null;
  try {
    const row = await db
      .prepare('SELECT data_url FROM quote_photos WHERE quote_id = ? AND idx = ?')
      .bind(quoteId, idx)
      .first<{ data_url?: string }>();
    return row?.data_url ?? null;
  } catch (err) {
    console.log('[quotes] photo_read_failed:', String(err).slice(0, 300));
    return null;
  }
}

export async function getQuote(db: unknown, id: string): Promise<QuoteRow | null> {
  if (!isQuoteStorageAvailable(db) || !id) return null;
  try {
    const sql = 'SELECT * FROM quotes WHERE id = ?';
    const hit = await db.prepare(sql).bind(id).first<QuoteRow>();
    if (hit) return hit;
    // Short tokens are generated lowercase, so a link that came back capitalised
    // — read over the phone, or mangled by a keyboard that autocapitalises —
    // should still resolve. Only retried for SHORT tokens: legacy 43-character
    // base64url tokens are genuinely case-sensitive, and lowercasing one would
    // turn a valid link into a miss.
    const lower = id.toLowerCase();
    if (lower !== id && isShortToken(lower)) {
      return await db.prepare(sql).bind(lower).first<QuoteRow>();
    }
    return null;
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
    // Photos first, and explicitly. The schema declares ON DELETE CASCADE, but
    // that only fires when `PRAGMA foreign_keys = ON` for the connection, which
    // is not something to assume per-request in D1. Deleting the parent and
    // trusting the cascade would silently leave photographs of a customer's
    // property in the database after the record they belong to is gone.
    await db.prepare('DELETE FROM quote_photos WHERE quote_id = ?').bind(id).run();
    await db.prepare('DELETE FROM quotes WHERE id = ?').bind(id).run();
    return true;
  } catch (err) {
    console.log('[quotes] delete_failed:', String(err).slice(0, 300));
    return false;
  }
}

/**
 * Failed-lookup throttle.
 *
 * The other half of the short-token decision. A 7-character token is ~34 billion
 * combinations, which is only safe because guesses are limited — see the note on
 * newQuoteToken. Remove this and the token must get longer.
 *
 * Deliberately counts FAILURES ONLY. A successful lookup is a customer opening
 * their own link; it writes nothing and the normal path stays a single read.
 * A row is written only when someone asks for a token that does not exist.
 *
 * DEGRADES OPEN, like everything else here: if the table is missing or the write
 * fails, the lookup proceeds. A throttle that 500s the page would turn a
 * database hiccup into "no customer can accept their quote", which is a worse
 * outcome than the thing it prevents. The token is still 34 billion wide.
 */
/**
 * Scopes keep separate budgets in one table.
 *
 * 'quote' — guessing quote tokens. 'login' — guessing the admin PIN, which is
 * far more valuable and far smaller (a 6-digit PIN is a million combinations),
 * so it gets a much tighter limit.
 *
 * They MUST NOT share a counter: a flood of quote-token guesses would otherwise
 * lock the owner out of their own admin, turning a nuisance into a denial of
 * service against the person running the business.
 */
export type ThrottleScope = 'quote' | 'login';

const THROTTLE: Record<ThrottleScope, { max: number; windowMs: number }> = {
  quote: { max: 30, windowMs: 10 * 60 * 1000 },
  // Ten wrong PINs in fifteen minutes is already far more than someone
  // mistyping their own. A million combinations at this rate is ~2,800 years.
  login: { max: 10, windowMs: 15 * 60 * 1000 },
};

const key = (scope: ThrottleScope, ip: string): string => `${scope}:${ip.slice(0, 60)}`;

/** True when this IP has burned through its failed attempts and should wait. */
export async function isThrottled(
  db: unknown,
  ip: string,
  scope: ThrottleScope = 'quote',
): Promise<boolean> {
  if (!isQuoteStorageAvailable(db) || !ip) return false;
  try {
    const limit = THROTTLE[scope];
    const row = await db
      .prepare('SELECT count, window_start FROM lookup_failures WHERE ip = ?')
      .bind(key(scope, ip))
      .first<{ count?: number; window_start?: string }>();
    if (!row) return false;
    const started = new Date(String(row.window_start)).getTime();
    // An unparseable or expired window is not a block: recordLookupFailure will
    // start a fresh one on the next miss.
    if (!Number.isFinite(started) || Date.now() - started > limit.windowMs) return false;
    return Number(row.count) >= limit.max;
  } catch (err) {
    console.log('[quotes] throttle_read_failed:', String(err).slice(0, 300));
    return false;
  }
}

/** Count one failed attempt against this IP, starting a new window when due. */
export async function recordLookupFailure(
  db: unknown,
  ip: string,
  scope: ThrottleScope = 'quote',
): Promise<void> {
  if (!isQuoteStorageAvailable(db) || !ip) return;
  const cutoff = new Date(Date.now() - THROTTLE[scope].windowMs).toISOString();
  try {
    // One statement, so two simultaneous misses can't each read 5 and write 6.
    // ON CONFLICT resets the window when the stored one has expired and
    // increments when it hasn't — the CASE is what makes it a fixed window
    // rather than a counter that only ever grows.
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO lookup_failures (ip, count, window_start)
         VALUES (?, 1, ?)
         ON CONFLICT(ip) DO UPDATE SET
           count = CASE WHEN lookup_failures.window_start < ? THEN 1 ELSE lookup_failures.count + 1 END,
           window_start = CASE WHEN lookup_failures.window_start < ? THEN ? ELSE lookup_failures.window_start END`,
      )
      .bind(key(scope, ip), now, cutoff, cutoff, now)
      .run();
    // Sweep expired windows. Without this the table only ever grows: an IP that
    // fails once is remembered forever, and a burst of guesses from a botnet
    // leaves a row per address for good. Run here rather than on a schedule
    // because this is the only code that writes the table — if nothing is
    // failing there is nothing to clean up. Uses idx_lookup_failures_window,
    // which migration 0004 creates for exactly this scan.
    // Swept with the LONGEST window of any scope, not this call's cutoff — the
    // login window is longer than the quote one, so sweeping on a quote miss
    // with the quote cutoff would delete live login counters and hand an
    // attacker a fresh budget by simply making a quote request.
    const longest = Math.max(...Object.values(THROTTLE).map((t) => t.windowMs));
    await db
      .prepare('DELETE FROM lookup_failures WHERE window_start < ?')
      .bind(new Date(Date.now() - longest).toISOString())
      .run();
  } catch (err) {
    console.log('[quotes] throttle_write_failed:', String(err).slice(0, 300));
  }
}

/**
 * Repeat hits inside this window are ONE visit.
 *
 * Without it, "opened 4 times" could be one person reloading, or coming back
 * from the PDF, or a flaky connection retrying — and the number that is supposed
 * to mean renewed interest would mean nothing at all. Thirty minutes is longer
 * than any single sitting with a quote and shorter than a considered return.
 */
const OPEN_DEDUPE_MS = 30 * 60 * 1000;

/**
 * Record that the customer looked at their quote.
 *
 * Called from the public GET, which the approve page hits exactly once per
 * load. Deliberately NOT hooked to the page itself: link preview bots fetch the
 * HTML to build their card and never run the JavaScript, so hooking the API
 * excludes them for free — otherwise every texted quote would show an open
 * seconds after it was sent.
 *
 * Best-effort, and never on the response path. A customer's quote must load
 * whether or not we manage to note that they loaded it.
 */
export async function recordQuoteOpen(db: unknown, id: string, isAdmin = false): Promise<void> {
  if (!isQuoteStorageAvailable(db) || !id) return;
  const now = new Date();
  const cutoff = new Date(now.getTime() - OPEN_DEDUPE_MS).toISOString();
  try {
    /**
     * The owner's own previews are counted, just SEPARATELY.
     *
     * They must not touch open_count — checking your own link is not customer
     * interest — but silently recording nothing was worse: opening your own
     * quote and seeing "Not opened yet" is indistinguishable from the feature
     * being broken, and testing it on yourself is the first thing anyone does.
     * Same dedupe window, so a preview and a refresh are one look.
     */
    if (isAdmin) {
      // Deliberately does NOT touch last_opened_at: that is the CUSTOMER's
      // freshness signal, and letting a preview advance it would make a quote
      // they read on Monday claim "last opened just now" because you glanced
      // at it — the exact thing this feature exists to get right.
      await db
        .prepare(
          `UPDATE quotes
              SET admin_open_count = admin_open_count
                    + CASE WHEN admin_last_opened_at IS NULL OR admin_last_opened_at < ?
                           THEN 1 ELSE 0 END,
                  admin_last_opened_at = ?
            WHERE id = ?`,
        )
        .bind(cutoff, now.toISOString(), id)
        .run();
      return;
    }
    // One statement, so two tabs opened together can't both read 2 and write 3.
    // COALESCE on first_opened_at makes it write-once; the count only advances
    // when the previous open is outside the dedupe window (or there wasn't one).
    await db
      .prepare(
        `UPDATE quotes
            SET first_opened_at = COALESCE(first_opened_at, ?),
                last_opened_at = ?,
                open_count = open_count
                  + CASE WHEN last_opened_at IS NULL OR last_opened_at < ? THEN 1 ELSE 0 END
          WHERE id = ?`,
      )
      .bind(now.toISOString(), now.toISOString(), cutoff, id)
      .run();
  } catch (err) {
    console.log('[quotes] open_record_failed:', String(err).slice(0, 300));
  }
}

/**
 * Whether the PRICE has passed its validity window. NOT whether the link works.
 *
 * These were one clock and are now two, deliberately. A link that dies is a bad
 * experience for no gain — a customer who saved it, or forwarded it to a
 * partner, hits a wall instead of the proposal they were sent. Stale PRICING is
 * the real risk, and it is a different problem with a different answer: show
 * them everything, and ask them to call before it is accepted at a figure that
 * may no longer hold.
 *
 * The column is still expires_at, so no migration was needed; what changed is
 * what it governs.
 */
export const isPricingStale = (row: QuoteRow): boolean =>
  new Date(row.expires_at).getTime() < Date.now();

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
  /**
   * An address supplied at signing, for a quote that was texted rather than
   * emailed and so has none on record. Only ever FILLS a blank — never
   * overwrites the address a proposal was actually sent to, which is part of
   * what the record says happened.
   */
  customerEmail = '',
  /**
   * The typed signature, used to FILL A BLANK NAME.
   *
   * A quote can now be saved with no name — a texted lead is quoted from the
   * address — and the moment they accept, they type their name as the
   * signature. That is the first time we actually learn it, so the record stops
   * being nameless exactly when it matters: at handoff to the route.
   *
   * Only ever fills a blank, never overwrites the name a proposal was addressed
   * to, on the same rule as customerEmail below.
   */
  signature = '',
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
                onboarding_json = ?, terms_version = ?,
                customer_email = COALESCE(NULLIF(customer_email, ''), ?),
                customer_name = COALESCE(NULLIF(customer_name, ''), ?)
          WHERE id = ? AND accepted_at IS NULL`,
      )
      .bind(
        new Date().toISOString(),
        plan.slice(0, 80),
        ip.slice(0, 60),
        ua.slice(0, 300),
        onboarding ? JSON.stringify(onboarding).slice(0, 8000) : null,
        TERMS_VERSION,
        // NULLIF/COALESCE rather than a conditional query: the column only takes
        // this value when it's currently blank, enforced by SQLite rather than
        // by remembering to check first.
        //
        // '' and NOT null when there's nothing to write. customer_email is NOT
        // NULL, so COALESCE(NULLIF('',''), NULL) resolves to NULL and the whole
        // UPDATE fails the constraint — which would reject a SIGNED ACCEPTANCE
        // because a contact field was missing. Exactly what this endpoint is
        // written to never do.
        customerEmail.trim().slice(0, 160),
        // '' and not null, for the same NOT NULL reason as the email above.
        signature.trim().slice(0, 120),
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
        `SELECT id, number, created_at, expires_at, customer_name, customer_email,
                customer_address, customer_phone, proposal_json,
                accepted_at, accepted_plan,
                first_opened_at, last_opened_at, open_count, admin_open_count
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

/**
 * The two shapes a quote link comes in.
 *
 *   /quote-1001-k7m2p9x    texted  — opens with the full breakdown, then pricing
 *   /approve-1001-k7m2p9x  emailed — opens straight on the plans
 *
 * SAME SECRET behind both. The leading word is a routing instruction, not a
 * credential, so there is no second token to store and nothing to keep in sync.
 * They differ by a WORD rather than by length or a marker character on purpose:
 * two URLs that differ by one character look identical at a glance, and pasting
 * the wrong one fails silently — the customer just lands on the wrong screen and
 * nobody ever finds out.
 *
 * The proposal number is included for the sender's benefit (you can tell which
 * quote a link is without opening it) and is omitted entirely when the quote
 * has none, rather than leaving an empty `--` in the URL.
 *
 * Legacy /approve/?t=<token> links are still honoured by the page and always
 * will be: they are sitting in customers' inboxes and cannot be reissued.
 */
const quoteLink = (origin: string, word: string, token: string, number?: number | null): string => {
  const n = proposalNumberOrNull(number);
  // Short tokens only — a legacy 43-character token can contain dashes and begin
  // with digits, which would make "1000-kQ7-vZ2x…" ambiguous to the parser. See
  // the note in src/lib/quoteLinks.ts.
  const prefix = n === null || !isShortToken(token) ? '' : `${n}-`;
  return `${origin.replace(/\/$/, '')}/${word}-${prefix}${encodeURIComponent(token)}`;
};

/** The texting link: leads with the breakdown, for a lead who has read nothing. */
export const quoteUrl = (origin: string, token: string, number?: number | null): string =>
  quoteLink(origin, 'quote', token, number);

/** The link that goes in the email, alongside the PDF that explains it. */
export const approveUrl = (origin: string, token: string, number?: number | null): string =>
  quoteLink(origin, 'approve', token, number);
