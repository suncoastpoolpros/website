-- The lead finder's run log: when it last ran, and what it found.
--
-- NOT YET APPLIED. One CREATE TABLE IF NOT EXISTS plus an index, both safe to
-- re-run, so this file can go in whole (D1 console, or
--   npx wrangler d1 execute suncoast --remote --file=migrations/0009_lead_runs.sql).
-- Until it is applied the lead finder still works; it just can't show a history.
--
-- COUNTS ONLY. A run records its settings and totals, never an address: the
-- route and sales files stay in the browser, and the leads go out as a CSV to
-- the CRM. Like the quotes table, this must not grow into a customer database.

CREATE TABLE IF NOT EXISTS lead_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at TEXT NOT NULL,
  -- The settings the run used.
  as_of TEXT NOT NULL,
  lookback_days INTEGER NOT NULL,
  radius_miles REAL NOT NULL,
  -- What went in and what came out.
  route_stops INTEGER NOT NULL,
  sales_rows INTEGER NOT NULL,
  leads_found INTEGER NOT NULL,
  -- The latest sale in the county file: how fresh the data was, which matters
  -- more than when the button was pressed.
  newest_sale TEXT,
  routes_file TEXT,
  sales_file TEXT
);

CREATE INDEX IF NOT EXISTS idx_lead_runs_ran ON lead_runs (ran_at);
