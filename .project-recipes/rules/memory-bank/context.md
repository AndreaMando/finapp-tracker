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
