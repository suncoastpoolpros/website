-- When a customer actually looked at their quote.
--
-- NOT YET APPLIED. Run these in the Cloudflare D1 console ONE AT A TIME, the
-- same way as 0003–0005 — `wrangler d1 execute --file` sends the whole file as
-- one run and stops at the first error. To check state afterwards:
--   PRAGMA table_info(quotes);
--
-- WHY THIS EXISTS
-- "Sent" and "accepted" were the only two things a quote could tell you, and
-- the interesting cases live in between: never opened (resend, or text them),
-- opened once days ago (gone cold), opened four times yesterday (call now).
-- Those want opposite actions and looked identical in the list.
--
-- COUNTERS, NOT AN EVENT LOG. Three columns answer did-it-land, how-warm and
-- how-many-times without a growing table or a timeline nobody reads. If a full
-- history is ever wanted, it goes in its own table beside these — these stay
-- correct either way.
--
-- Recorded in GET /api/quote/:token, which the approve page calls exactly once
-- per load. That endpoint — rather than the page — is deliberate: link preview
-- bots (iMessage, WhatsApp, Slack) fetch the HTML to build their card but never
-- run the JavaScript, so hooking the API excludes them for free. Counting page
-- loads would show a phantom open seconds after every text you send.

-- First time it was opened by anyone who wasn't us. Null means never.
ALTER TABLE quotes ADD COLUMN first_opened_at TEXT;

-- Most recent open. The freshness signal — "last opened 2 hours ago" is what
-- decides whether to pick up the phone.
ALTER TABLE quotes ADD COLUMN last_opened_at TEXT;

-- How many DISTINCT visits, not page loads: repeat hits inside a short window
-- collapse into one, so a customer reloading or bouncing back from the PDF
-- doesn't read as renewed interest. Defaults to 0 so existing quotes are
-- honestly "never opened" rather than null-and-ambiguous.
ALTER TABLE quotes ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0;
