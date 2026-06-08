-- Add auto_apply to recurring_expenses and source_recurring_id to one_time_expenses

ALTER TABLE recurring_expenses
  ADD COLUMN IF NOT EXISTS auto_apply boolean DEFAULT false;

ALTER TABLE one_time_expenses
  ADD COLUMN IF NOT EXISTS source_recurring_id text;

-- Prevent accidental duplicate applications: unique index on (source_recurring_id, month_key)
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_time_source_recurring_month
  ON one_time_expenses (source_recurring_id, month_key)
  WHERE source_recurring_id IS NOT NULL;
