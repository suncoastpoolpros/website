-- Onboarding captured when a customer accepts a quote.
--
-- APPLIED 2026-08-18 via the Cloudflare D1 console, not with wrangler. Confirm
-- with: PRAGMA table_info(quotes);  -- expect onboarding_json and terms_version
--
-- (Already applied — see above.)
--
-- ONE column, not a dozen. The technicians' service app owns customer records;
-- this is a handoff payload, so it doesn't need to be queryable field by field.
-- Keeping it as JSON means adding a question to the form later needs no
-- migration and can't break an older row.
--
-- NO PAYMENT CREDENTIALS EVER. Card and bank numbers would put this database in
-- PCI-DSS scope. Billing ADDRESS is fine; payment setup happens elsewhere.
ALTER TABLE quotes ADD COLUMN onboarding_json TEXT;

-- Which version of the service agreement was accepted. "They agreed" is worth
-- little without "to what" — this makes the record specific.
ALTER TABLE quotes ADD COLUMN terms_version TEXT;
