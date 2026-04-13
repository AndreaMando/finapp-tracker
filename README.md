# FinApp Tracker

FinApp Tracker is a personal finance application built with Next.js, React, TypeScript, Tailwind CSS, NextAuth, and Drizzle ORM on Neon/Postgres.

## Features

- Authentication with email/password login
- Dashboard summary of income versus expenses
- Monthly income tracking
- Recurring expense management
- One-time expense tracking
- Savings goals with contribution history
- Analytics integration via Vercel

## Tech Stack

- Next.js 16
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Drizzle ORM
- Neon / PostgreSQL
- NextAuth
- Vercel Analytics and Speed Insights

## Getting Started

### Requirements

- Node.js 20+
- npm (primary package manager)
- A PostgreSQL database URL for `POSTGRES_URL`

### Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables in `.env.local`:

```env
POSTGRES_URL=postgresql://user:password@host:port/database
```

3. Start the development server:

```bash
npm run dev
```

### Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run Drizzle migrations

## Database

Database setup is configured in `drizzle.config.ts` and uses `@neondatabase/serverless` with Neon/Postgres.

- `src/db/schema.ts` - database schema definitions
- `src/db/index.ts` - Drizzle client initialization
- `src/db/migrate.ts` - migration helper wrapper

## Notes

- The repository includes `.project-recipes/` for AI-assisted documentation and recipes.
- Some packages may appear in the lockfile but are not actively used by source files, including `postgres`, `better-sqlite3`, `sqlite3`, and `@types/sqlite3`.

## License

This project does not include a specific license file. Add one if you want to publish it publicly on GitHub.
