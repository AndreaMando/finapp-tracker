# Active Context: FinApp Tracker

## Current State

**Project Status**: ✅ Functional personal finance app with authentication and database setup.

FinApp Tracker uses Next.js 16, React 19, Tailwind CSS 4, NextAuth, and Drizzle ORM with Neon/Postgres.

## Recently Completed

- [x] Personal finance dashboard and authenticated app shell
- [x] Income, recurring expense, one-time expense, and savings goals flows
- [x] NextAuth credentials login with Drizzle adapter
- [x] Postgres database integration via Neon and Drizzle ORM
- [x] App Router layout with nested `(authenticated)` routes
- [x] Analytics via Vercel Analytics and Speed Insights
- [x] Memory bank and recipe documentation in `.project-recipes`

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Login page and public landing experience | ✅ Ready |
| `src/app/(authenticated)/layout.tsx` | Authenticated layout wrapper | ✅ Ready |
| `src/app/(authenticated)/dashboard/page.tsx` | Dashboard summary page | ✅ Ready |
| `src/app/(authenticated)/income/page.tsx` | Income tracking | ✅ Ready |
| `src/app/(authenticated)/expenses/page.tsx` | One-time expense tracking | ✅ Ready |
| `src/app/(authenticated)/recurring/page.tsx` | Recurring expense management | ✅ Ready |
| `src/app/(authenticated)/goals/page.tsx` | Savings goals with contributions | ✅ Ready |
| `src/app/(authenticated)/expenses/page.tsx` (Installment Payments tab) + `src/app/api/installments/` + `src/lib/installment-math.ts` + `src/lib/installments-server.ts` | Installment plans ("pagamenti a rate"): N monthly installments, each recorded lazily as a one-time expense named `<name> (rata nr. X)` when its month begins (triggered from `GET /api/one-time` and `/api/installments`; idempotent via `generated_count` + unique index). Migration: `drizzle/0004_add_installment_plans.sql`, applied with `scripts/apply-sql-migration.cjs` (the drizzle journal only knows 0000) | 🟡 Local, awaiting approval |
| `src/app/(authenticated)/mortgage/page.tsx` + `src/lib/mortgage-math.ts` + `src/components/MortgageDebtChart.tsx` | Mortgage = an `installment_plans` row with `kind='mortgage'` (+ optional `financed_amount`), recorded monthly like installments in category Mortgage. Page `/mortgage` (figures, debt curve, amortization schedule; rate/interest split is an estimate assuming a fixed rate) reached only from the dashboard Mortgage card. Migration `drizzle/0005_*.sql` | 🟡 Local, awaiting approval |
| `src/components/MortgageForms.tsx` + `src/app/api/installments/[id]/{route,extra,revisions}` + table `installment_plan_revisions` (migration `drizzle/0006_*.sql`) | Mortgage edits: a *revision* (recalculated payment/duration from a month on, for variable rates) and an *extra* repayment ("anticipo": expense named after the plan + new terms, either shorter duration or lower payment, proposed by `proposeExtraPayment` and overridable). `buildMortgageModel` (mortgage-math.ts) replays base terms + revisions, re-deriving the rate at each segment. Installment/prepayment expenses are stored under the plain plan name; the "(rata nr. X)" / "(anticipo)" label is composed at display time by `src/lib/expense-display.ts` so it follows the language | 🟡 Local, awaiting approval |
| `src/lib/categories.ts` | Single shared expense-category list + tag colors for one-time, recurring and installments (20 categories) | 🟡 Local, awaiting approval |
| `src/app/(authenticated)/analytics/page.tsx` | Analytics: period presets (1/3/6/12 months, calendar year), income/expense columns, category donut, goal contributions. Reached only from a dashboard button, not the navbar. Aggregates client-side from `getIncomes`/`getOneTimeExpenses`/`getGoalContributions`/`getSavingsGoals` | 🟡 Local, awaiting approval |
| `src/db/schema.ts` | Drizzle Postgres schema, including auth and finance tables | ✅ Ready |
| `src/db/index.ts` | Neon/Postgres Drizzle client | ✅ Ready |
| `src/lib/auth.ts` | NextAuth configuration with credential provider | ✅ Ready |
| `src/components/layout/Sidebar.tsx` | Navigation sidebar | ✅ Ready |
| `src/components/ui/Button.tsx` | Reusable button component | ✅ Ready |
| `src/components/ui/Modal.tsx` | Reusable modal component | ✅ Ready |
| `.project-recipes/` | AI recipe and memory bank docs | ✅ Ready |

## Current Focus

The project is ready for GitHub publication and documentation cleanup.

Key themes:
- Clear root README for repository publishing
- Accurate `.project-recipes` docs for the real stack
- Database and auth configuration consistency
- Removal of unused direct dependencies where appropriate

## Deployment Notes

- The app requires `POSTGRES_URL` in `.env.local` for database access.
- Authentication uses NextAuth with an email/password credentials provider.
- Static assets live in `public/`.

## GitHub Publishing Checklist

- [x] Add a root `README.md`
- [x] Confirm `package.json` scripts work
- [ ] Remove unused direct dependencies if cleanup is desired
- [x] Keep `.project-recipes` documentation aligned with repo structure

## Session History

| Date | Changes |
|------|---------|
| 2026-04-13 | Updated `.project-recipes` to match FinApp Tracker and added GitHub documentation guidance |
