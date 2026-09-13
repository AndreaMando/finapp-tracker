-- One-off data fix for the "Mortage" -> "Mortgage" category rename
-- (see src/app/(authenticated)/expenses/page.tsx, recurring/page.tsx,
-- src/components/useRecurringApply.ts, src/lib/i18n.tsx).
--
-- Existing rows still store the old misspelled category value; without this
-- fix they'd fall back to the "Other" color/translation instead of showing
-- as "Mortgage" / "Mutuo". Run manually against the app's Postgres database
-- once after deploying the rename (not wired into drizzle's migration
-- journal on purpose, since it's a data fix, not a schema change):
--
--   psql "$POSTGRES_URL" -f scripts/fix-mortgage-typo.sql

UPDATE recurring_expenses SET category = 'Mortgage' WHERE category = 'Mortage';
UPDATE one_time_expenses  SET category = 'Mortgage' WHERE category = 'Mortage';
