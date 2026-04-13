# Development Rules

## Critical Rules

- **Primary package manager**: `npm` using `package-lock.json`
- `bun` is optional when installed, but keep `npm` compatibility in mind
- Always commit and push after completing changes:
  ```bash
  npm run typecheck && npm run lint && git add -A && git commit -m "descriptive message" && git push
  ```

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build production app |
| `npm run lint` | Check code quality |
| `npm run typecheck` | TypeScript checking |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply Drizzle migrations |

## Best Practices

### React/Next.js
- Use Server Components by default; add `"use client"` only when needed
- Use `next/image` for optimized images
- Use `next/link` for client-side navigation
- Use `error.tsx` for error boundaries
- Use `not-found.tsx` for 404 pages

### API Routes
- Return `NextResponse.json({ error: "..." }, { status: 500 })` on failure
- Always include appropriate status codes
- Handle errors gracefully

### Code Quality
- Run `npm run typecheck` before committing
- Run `npm run lint` before committing
- Write descriptive commit messages
