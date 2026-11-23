-- Changes to the terms of an installment plan / mortgage after it was created:
--   kind = 'revision'  the bank recalculated the payment (variable rate) or the
--                      duration changed, from installment `from_installment` on;
--   kind = 'extra'     an extra (early) repayment of `extra_amount` paid on
--                      `extra_date`, after which the plan continues with the
--                      new `payment` / `total_installments`.
-- Installments before `from_installment` keep the terms they were recorded with.
-- Additive and idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS installment_plan_revisions (
  id text PRIMARY KEY NOT NULL,
  plan_id text NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'revision',
  from_installment integer NOT NULL,
  payment numeric(12, 2) NOT NULL,
  total_installments integer NOT NULL,
  extra_amount numeric(12, 2),
  extra_date date,
  expense_id text,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_plan_revisions_plan ON installment_plan_revisions (plan_id);
