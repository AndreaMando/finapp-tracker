# Technical Context: FinApp Tracker

## Technology Stack

| Technology               | Version | Purpose                                           |
| ------------------------ | ------- | ------------------------------------------------- |
| Next.js                  | 16.1.3  | React framework with App Router                   |
| React                    | 19.2.3  | UI library                                        |
| TypeScript               | 5.9.3   | Type-safe JavaScript                              |
| Tailwind CSS             | 4.1.17  | Utility-first styling                             |
| Drizzle ORM              | 0.45.1  | SQL query builder and type-safe database layer    |
| Neon / PostgreSQL        | N/A     | Database backend                                  |
| NextAuth                 | 5.0.0-beta.30 | Authentication                          |
| @neondatabase/serverless | 1.0.2   | Neon client for PostgreSQL                        |
| Vercel Analytics         | 2.0.1   | Analytics integration                             |
| Vercel Speed Insights    | 2.0.0   | Performance monitoring                            |
| Framer Motion            | 12.36.0 | Motion and transitions                            |
| Lucide React             | 0.577.0 | Icon library                                      |
| bcryptjs                 | 3.0.3   | Password hashing                                  |
| dotenv                   | 17.3.1  | Environment variable loading                      |

## Development Environment

### Prerequisites

- Node.js 20+ installed
- `npm` is the primary package manager for this repository
- `bun` is optional when installed, but the repo currently tracks `package-lock.json`

### Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
```

## Project Configuration

### Next.js Config (`next.config.ts`)

- App Router enabled
- Default settings suitable for server-rendered pages with nested layouts

### TypeScript Config (`tsconfig.json`)

- Strict mode enabled
- Path alias: `@/*` → `src/*`
- Target: ESNext

### Tailwind CSS 4 (`postcss.config.mjs`)

- Uses `@tailwindcss/postcss` plugin
- Tailwind styling via utility classes

### ESLint (`eslint.config.mjs`)

- Uses `eslint-config-next`
- Flat config format

## Key Dependencies

### Production Dependencies

```json
{
  "@auth/core": "^0.41.1",
  "@auth/drizzle-adapter": "^1.11.1",
  "@neondatabase/serverless": "^1.0.2",
  "@vercel/analytics": "^2.0.1",
  "@vercel/speed-insights": "^2.0.0",
  "bcryptjs": "^3.0.3",
  "drizzle-orm": "^0.45.1",
  "framer-motion": "^12.36.0",
  "js-cookie": "^3.0.5",
  "lucide-react": "^0.577.0",
  "next": "^16.1.3",
  "next-auth": "^5.0.0-beta.30",
  "react": "^19.2.3",
  "react-dom": "^19.2.3"
}
```

### Dev Dependencies

```json
{
  "@tailwindcss/postcss": "^4.1.17",
  "@types/bcryptjs": "^3.0.0",
  "@types/js-cookie": "^3.0.6",
  "@types/node": "^24.10.2",
  "@types/react": "^19.2.7",
  "@types/react-dom": "^19.2.3",
  "@types/sqlite3": "^5.1.0",
  "dotenv": "^17.3.1",
  "drizzle-kit": "^0.31.10",
  "eslint": "^9.39.1",
  "eslint-config-next": "^16.0.0",
  "tailwindcss": "^4.1.17",
  "typescript": "^5.9.3"
}
```

## File Structure

```
/
├── .gitignore
├── package.json
├── package-lock.json
├── bun.lock
├── drizzle.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (authenticated)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── income/page.tsx
│   │   │   ├── expenses/page.tsx
│   │   │   ├── recurring/page.tsx
│   │   │   └── goals/page.tsx
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── migrate.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   └── store.ts
│   └── components/
│       ├── layout/
│       └── ui/
└── .project-recipes/
```

## Notes

- The project uses Neon/PostgreSQL for the database.
- The app includes NextAuth with a Drizzle adapter and credential-based login.
- The `package-lock.json` indicates `npm` is the repo's stable package manager.
- `postgres`, `better-sqlite3`, `sqlite3`, and `@types/sqlite3` are installed in the lockfile but are not used by active source files.
