-- Your own previews, counted separately from the customer's opens.
--
-- NOT YET APPLIED. Run in the Cloudflare D1 console. Note ADD COLUMN has no
-- IF NOT EXISTS form in SQLite, so a re-run errors with "duplicate column
-- name" — harmless, but that is why these go one at a time.
--
-- WHY
-- 0006 skips recording when the request carries a valid admin session, so the
-- owner checking their own quote link doesn't show up as customer interest.
-- That is the right behaviour and it was invisible: opening your own link and
-- seeing "Not opened yet" is indistinguishable from the feature being broken,
-- and the first thing anyone does with open-tracking is test it on themselves.
--
-- Counting those separately keeps open_count clean AND proves the pipeline
-- works the moment you look at your own quote. It also answers a question
-- worth having: "have I actually checked what I sent this person?"
ALTER TABLE quotes ADD COLUMN admin_open_count INTEGER NOT NULL DEFAULT 0;

-- Its own timestamp, NOT shared with last_opened_at. Sharing would let a
-- preview advance the customer's freshness signal, so a quote the customer
-- read on Monday would say "last opened just now" because you glanced at it —
-- which is the one thing this feature exists to get right.
ALTER TABLE quotes ADD COLUMN admin_last_opened_at TEXT;
