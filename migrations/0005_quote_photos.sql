-- Photos attached to a proposal, kept so the customer's own download matches
-- the PDF they were emailed.
--
-- NOT YET APPLIED. Run these in the Cloudflare D1 console ONE AT A TIME, the
-- same way as 0003 and 0004 — `wrangler d1 execute --file` sends the whole file
-- as one run and stops at the first error. To check state:
--   SELECT type, name FROM sqlite_master WHERE tbl_name = 'quote_photos';
--
-- WHY A SEPARATE TABLE, not a field on quotes.proposal_json:
-- getQuote does `SELECT *`, and that runs on every approve-page load. Eight
-- downscaled phone photos are roughly 2–3 MB of base64, so folding them into
-- proposal_json would put megabytes on the critical path of the one page a
-- customer has to load to accept — to render something that page never shows.
-- Here they cost nothing until the download button is actually pressed.
--
-- STORED AS THE SAME DATA URLS THAT WENT INTO THE EMAILED PDF, not re-encoded.
-- The whole point is that the two documents are the same document; a second
-- compression pass would make the customer's copy visibly softer than the one
-- in their inbox, which is exactly the drift this is meant to remove.
--
-- ON DELETE CASCADE so deleting a quote takes its photos with it. Without it,
-- deleting a quote would leave orphaned images of a customer's property in the
-- database with nothing pointing at them — the opposite of what someone
-- pressing "delete" is asking for.
CREATE TABLE IF NOT EXISTS quote_photos (
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  -- Position in the proposal, so the download reproduces the emailed order.
  idx INTEGER NOT NULL,
  data_url TEXT NOT NULL,
  PRIMARY KEY (quote_id, idx)
);

-- Fetching one quote's photos in order is the only read this table has.
CREATE INDEX IF NOT EXISTS idx_quote_photos_quote ON quote_photos (quote_id, idx);
