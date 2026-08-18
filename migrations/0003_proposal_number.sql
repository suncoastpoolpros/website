-- Human-readable proposal numbers.
--
-- APPLIED 2026-08-18 via the Cloudflare D1 console, statement by statement,
-- not with wrangler. Verified after: counters exists with proposal_number=1000,
-- idx_quotes_number exists, and quotes.number was NULL on all existing rows.
--
-- Do NOT re-run this file with `wrangler d1 execute --file`: it sends the whole
-- file as one run and stops at the first error, so the ALTER TABLE below (which
-- will fail with "duplicate column name") aborts the run before the index
-- statement — and a failed run then tells you nothing about what came after.
-- To check state instead:
--   SELECT type, name FROM sqlite_master WHERE name IN ('counters','idx_quotes_number');
--   PRAGMA table_info(quotes);
--
-- (Would have been: npx wrangler d1 execute suncoast --remote --file=... — see
-- the warning above before reaching for that.)
--
-- WHY A COUNTER TABLE, not MAX(number)+1: the number has to exist BEFORE the
-- row does. The PDF is rendered in the admin's browser and emailed as an
-- attachment, and only then is the quote saved — so the number is reserved
-- first and written later. MAX+1 over a table the row isn't in yet would hand
-- the same number to two overlapping sends.
--
-- A reserved number that never gets used leaves a gap (#1004, #1006). That's
-- normal for anything that numbers documents, and far better than two
-- proposals sharing a number.
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

-- Seeded at 1000 so the first reservation returns 1001.
INSERT OR IGNORE INTO counters (name, value) VALUES ('proposal_number', 1000);

-- Null for every quote sent before this existed; those keep their token and
-- simply have no number, rather than being renumbered after the fact into
-- something their PDF doesn't say.
ALTER TABLE quotes ADD COLUMN number INTEGER;

-- "Which quote is #1042?" — the one lookup this column exists to serve.
CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes (number);
