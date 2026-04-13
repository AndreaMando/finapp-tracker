# System Patterns: FinApp Tracker

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── (authenticated)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── income/page.tsx
│   │   ├── expenses/page.tsx
│   │   ├── recurring/page.tsx
│   │   └── goals/page.tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/route.ts
│       ├── income/route.ts
│       ├── recurring/route.ts
│       ├── one-time/route.ts
│       ├── contributions/route.ts
│       └── goals/route.ts
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx
│   └── ui/
│       ├── Button.tsx
│       └── Modal.tsx
├── db/
│   ├── index.ts
│   ├── schema.ts
│   └── migrate.ts
└── lib/
    ├── auth.ts
    └── store.ts
```

## Key Design Patterns

### 1. App Router with Authenticated Nesting

- Public login/landing content is delivered from `src/app/page.tsx`
- Protected finance pages are grouped under `src/app/(authenticated)/`
- Nested layout allows a single auth-aware shell with sidebar and main content

### 2. Database Layer

- `src/db/schema.ts` defines auth and finance tables using `drizzle-orm/pg-core`
- `src/db/index.ts` initializes the database client with `drizzle-orm/neon-http`
- `drizzle.config.ts` configures migrations for Neon/Postgres

### 3. Authentication Pattern

- `src/lib/auth.ts` configures NextAuth with the Drizzle adapter
- Credentials provider validates passwords via `bcryptjs`
- User sessions are stored as JWTs

### 4. API Routes for CRUD

- Each resource has a dedicated route under `src/app/api/`
- Server-side logic lives in API routes and server components only
- Use Drizzle queries wrapped in `eq`, `and`, and `sql` as needed

### 5. UI Component Organization

- Shared UI components live in `src/components/ui/`
- Layout components live in `src/components/layout/`
- Page-specific rendering stays inside `app/`

## Styling Conventions

- Use Tailwind utility classes for layout, spacing, and typography
- Prefer responsive Tailwind classes (`sm:`, `md:`, `lg:`)
- Keep button and form state accessible with focus rings and ARIA labels

## State Management

- Use server components for data-fetching pages
- Use client components only where browser state or interactivity is required
- Keep most business logic on the server side with Drizzle queries

## Naming Conventions

- Components: PascalCase (`Sidebar.tsx`, `Button.tsx`)
- Utility modules: camelCase (`auth.ts`, `store.ts`)
- Pages/routes: lowercase `page.tsx` and `layout.tsx`
- Database columns: snake_case by convention in schema definitions
