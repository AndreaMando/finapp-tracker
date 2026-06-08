-- Add end_month to recurring_expenses to record when a recurring expense was concluded
BEGIN;
ALTER TABLE recurring_expenses ADD COLUMN IF NOT EXISTS end_month text;
COMMIT;
