-- Why a quote was lost.
--
-- NOT YET APPLIED. Run these in the Cloudflare D1 console ONE AT A TIME, the
-- same way as 0003–0007 — `wrangler d1 execute --file` sends the whole file as
-- one run and stops at the first error. ADD COLUMN has no IF NOT EXISTS form in
-- SQLite, so a re-run errors with "duplicate column name": harmless, but that is
-- why these go one at a time. To check state afterwards:
--   PRAGMA table_info(quotes);
--
-- WHY THIS EXISTS
-- "Awaiting" was a bucket everything fell into and nothing ever left. A quote
-- opened four times and never accepted looks identical to one sent yesterday,
-- and the difference between them — why the first one went away — is the single
-- most useful thing a small service business can learn. Price, timing, a
-- competitor, sold the house: each implies a different action, and two of them
-- are recoverable.
--
-- COLUMNS, NOT AN EVENT LOG, and deliberately alongside accepted_at rather than
-- inside proposal_json. proposal_json is a SNAPSHOT of what we quoted and must
-- not be rewritten after the fact; what then happened to that quote is a
-- different kind of fact and belongs in its own columns, exactly as acceptance
-- already does.
--
-- A DECLINE IS NOT DESTRUCTIVE. Nothing is deleted, the link keeps working, and
-- the quote can still be accepted afterwards — people change their minds, and a
-- customer who declined on price in March and calls back in June should not
-- find a dead link. The accept path therefore ignores these columns entirely.

-- When they told us. Null means they never did, which is most quotes.
ALTER TABLE quotes ADD COLUMN declined_at TEXT;

-- One of a fixed set of reasons, not free text: a tapped answer gets many times
-- the response rate of a typed one, and a fixed set is the only version of this
-- that can be counted across quotes. Free text goes in declined_note.
ALTER TABLE quotes ADD COLUMN declined_reason TEXT;

-- Whatever they chose to add, capped and optional. Usually empty; occasionally
-- the most valuable sentence anyone will write about the business all month.
ALTER TABLE quotes ADD COLUMN declined_note TEXT;
