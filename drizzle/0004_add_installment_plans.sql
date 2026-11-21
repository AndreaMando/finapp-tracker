-- Installment payments ("pagamenti a rate"): a plan of N fixed monthly installments.
-- Each installment is materialised as a regular one_time_expenses row (named
-- "<name> (rata nr. X)") when its month begins; generated_count tracks how many
-- have been created so far. Additive and idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS installment_plans (
  id text PRIMARY KEY NOT NULL,
  name text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  category text NOT NULL,
  start_date date NOT NULL,
  total_installments integer NOT NULL,
  generated_count integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now() NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE one_time_expenses
  ADD COLUMN IF NOT EXISTS source_installment_id text;

ALTER TABLE one_time_expenses
  ADD COLUMN IF NOT EXISTS installment_number integer;

-- Guarantees an installment number is only ever recorded once per plan, even if
-- two requests materialise the same plan at the same moment.
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_time_source_installment_number
  ON one_time_expenses (source_installment_id, installment_number)
  WHERE source_installment_id IS NOT NULL;
