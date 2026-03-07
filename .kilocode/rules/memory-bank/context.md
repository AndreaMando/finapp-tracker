# Active Context: Next.js Starter Template

## Current State

**Template Status**: ✅ Ready for development

The template is a clean Next.js 16 starter with TypeScript and Tailwind CSS 4. It's ready for AI-assisted expansion to build any type of application.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] FinTrack personal finance app built on top of the template

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Dashboard with monthly summary, expense breakdown, goals overview | ✅ Ready |
| `src/app/layout.tsx` | Root layout with sidebar navigation | ✅ Ready |
| `src/app/globals.css` | Global styles | ✅ Ready |
| `src/app/income/page.tsx` | Monthly income management (set/edit/delete per month) | ✅ Ready |
| `src/app/recurring/page.tsx` | Recurring expenses (bills, subscriptions, insurance) with toggle | ✅ Ready |
| `src/app/expenses/page.tsx` | One-time expenses per month, grouped by category | ✅ Ready |
| `src/app/goals/page.tsx` | Savings goals with contributions, progress tracking, history | ✅ Ready |
| `src/lib/store.ts` | localStorage data layer (income, recurring, one-time, goals, contributions) | ✅ Ready |
| `src/components/layout/Sidebar.tsx` | Navigation sidebar | ✅ Ready |
| `src/components/ui/Button.tsx` | Reusable button component | ✅ Ready |
| `src/components/ui/Modal.tsx` | Reusable modal component | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Current Focus

FinTrack personal finance app is fully functional. Features implemented:
- Monthly income tracking (per month, with notes)
- Recurring expenses (bills, subscriptions, insurance) with enable/disable toggle
- One-time expenses per month, categorized
- Monthly dashboard with income vs expenses breakdown and savings calculation
- Savings goals with target amount, deadline, color coding
- Goal contributions (add money from monthly total to a goal)
- Contribution history per goal with ability to remove contributions
- All data persisted in browser localStorage (no backend needed)

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
