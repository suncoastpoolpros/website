-- Human-readable proposal numbers.
--
-- Apply with:
--   npx wrangler d1 execute suncoast --remote --file=migrations/0003_proposal_number.sql
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
