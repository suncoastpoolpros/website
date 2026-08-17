-- Onboarding captured when a customer accepts a quote.
--
-- Apply with:
--   npx wrangler d1 execute suncoast --remote --file=migrations/0002_onboarding.sql
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
