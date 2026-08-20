-- Throttle for failed quote-token lookups.
--
-- NOT YET APPLIED. Run these in the Cloudflare D1 console ONE AT A TIME, the
-- same way as 0003 — `wrangler d1 execute --file` sends the whole file as one
-- run and stops at the first error, which tells you nothing about what came
-- after. To check state:
--   SELECT type, name FROM sqlite_master WHERE name IN ('lookup_failures');
--
-- WHY THIS EXISTS
-- A quote token is 7 characters of base32 — about 34 billion combinations. That
-- is short enough to text and, unthrottled, roughly 200 days of sustained
-- guessing against one known quote number. This table is the other half of that
-- decision: with it, the same attack needs thousands of IP-years. The token
-- length and this throttle are load-bearing for each other, and neither is safe
-- alone — see newQuoteToken in functions/api/_quotes.ts.
--
-- ONLY FAILURES ARE RECORDED. A successful lookup is a customer opening their
-- own link and writes nothing, so the normal path stays a single read. Rows are
-- written only when someone asks for a token that doesn't exist, which for a
-- real customer essentially never happens.
--
-- Keyed by IP. That is imperfect — a carrier NAT shares one address across many
-- phones — which is why the limit is set well above what any human clicking a
-- broken link would produce, rather than tight.
CREATE TABLE IF NOT EXISTS lookup_failures (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  -- Start of the current window, ISO. The window resets rather than sliding:
  -- a fixed window can be reset with one UPDATE and needs no history rows.
  window_start TEXT NOT NULL
);

-- Sweeping expired windows is a range scan over window_start, not a lookup by
-- ip, so it needs its own index.
CREATE INDEX IF NOT EXISTS idx_lookup_failures_window ON lookup_failures (window_start);
