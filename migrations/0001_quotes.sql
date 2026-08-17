-- Quotes sent from /admin, so a customer can accept one by clicking a link.
--
-- Apply with:
--   npx wrangler d1 execute suncoast --remote --file=migrations/0001_quotes.sql
--
-- SCOPE: this is a record of QUOTES, not a customer database. Live customers,
-- routes and filter tracking live in the technicians' service app; the website's
-- job ends at "this person accepted this plan at this price on this date", which
-- is then handed over. Nothing here should grow into a CRM — if a column would
-- only make sense for an active customer, it belongs in the other system.
--
-- The table stores a SNAPSHOT of what was quoted, not a reference to the current
-- presets. A customer accepts the document they were sent; if the presets or
-- prices change next week, what they agreed to must not change with them.

CREATE TABLE IF NOT EXISTS quotes (
  -- The URL token. Random 32 bytes, base64url. Also the primary key: there is
  -- no separate sequential id, because a guessable id in an emailed link is a
  -- way to read other customers' quotes.
  id TEXT PRIMARY KEY,

  created_at TEXT NOT NULL,
  -- Links die after 30 days. A quote left open indefinitely is a price you
  -- forgot you offered.
  expires_at TEXT NOT NULL,

  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_address TEXT,
  customer_phone TEXT,

  -- JSON snapshots of the pool and the proposal (tiers, prices, filter answer,
  -- scope). Rendered back on the approve page so the customer sees exactly what
  -- the PDF said.
  pool_json TEXT NOT NULL,
  proposal_json TEXT NOT NULL,

  -- Acceptance evidence. Null until accepted.
  accepted_at TEXT,
  accepted_plan TEXT,
  accepted_ip TEXT,
  accepted_ua TEXT
);

-- "What did we quote this customer?" and "what came in this month?"
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes (customer_email);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes (created_at);
-- "What's been accepted but not yet scheduled?"
CREATE INDEX IF NOT EXISTS idx_quotes_accepted ON quotes (accepted_at);
