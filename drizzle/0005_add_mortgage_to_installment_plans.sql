-- A mortgage is an installment plan with extra metadata, so it reuses the
-- lazy monthly recording (see src/lib/installments-server.ts).
-- kind: 'installment' (default, all existing rows) or 'mortgage'.
-- financed_amount: optional borrowed capital, used to estimate the interest
-- rate and the capital/interest split. Additive and idempotent.

ALTER TABLE installment_plans
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'installment';

ALTER TABLE installment_plans
  ADD COLUMN IF NOT EXISTS financed_amount numeric(12, 2);
