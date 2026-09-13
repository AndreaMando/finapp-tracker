# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General consumers managing personal finances, reached via public self-registration (email + password). Currently few active users (early-stage), but the product is openly public, not a closed personal tool — the user explicitly confirmed this ("per ora pochi utenti, ma è aperto al pubblico e quindi a chiunque").

## Product Purpose

Vaulty is a personal finance tracker: record monthly income, log one-time and recurring expenses, set and contribute to savings goals, and see a monthly dashboard summary of income vs. expenses vs. savings. Success means a user can see their monthly financial position at a glance and stay on top of recurring costs and savings progress without a spreadsheet.

## Positioning

No explicit competitive positioning has been established (not benchmarked against Mint/YNAB/etc.). Treat as an open/undecided fact rather than inventing a differentiator.

## Operating Context

Used across desktop and mobile/tablet. The user explicitly flagged that today's UI wastes large screens (content stays centered/constrained) while mobile is reasonably balanced — the redesign must use the full width available on whatever device shows it. Usage has a recurring monthly rhythm (checking the dashboard, confirming/applying recurring expenses each month) plus ad hoc one-time expense and income entry between those check-ins.

## Capabilities and Constraints

- This is a visual/layout redesign only — all existing functionality must remain unchanged; no features added or removed.
- Must support switching between a light and a dark theme from the existing settings menu (today the app is dark-only).
- Needs layouts that genuinely work for both large/desktop screens and mobile/tablet — a single fluid layout is fine only if it truly serves both; otherwise build them as distinct layouts.
- Features to preserve as-is functionally: monthly income entry + history; one-time expenses (name, amount, category, date); recurring expenses (start/end month, per-item amount history, a monthly "apply" confirmation step with per-item amount override before it becomes a one-time expense); savings goals with contributions and history; dashboard monthly summary (income, expenses, goal contributions, net savings); auth (email/password login + registration via NextAuth); IT/EN i18n.
- Stack (unchanged by this redesign): Next.js / React / TypeScript, Tailwind CSS, Drizzle ORM on Postgres (Neon), NextAuth.

## Brand Commitments

- Name: "Vaulty" (from "vault").
- Current logo intentionally reads as both a lock and a coin dropping into a piggy bank/vault. The user is open to recoloring it for the new theme, or redesigning it entirely, as long as it keeps that vault/savings meaning tied to the name.
- Explicit binding visual constraint from the user: no neon-style look on a very dark theme. Wants a modern, simple, direct finance-app feel instead (recorded as stated, not expanded on here — new-work owns turning this into an actual direction).

## Evidence on Hand

- The only evidence is the current shipped UI in this repository — no external testimonials, case studies, or press. Marketing screenshots under `public/screenshots/` reflect the pre-redesign look and will go stale once the new design ships (future work should regenerate them).

## Product Principles

1. Surface the user's financial position at a glance instead of behind a wall of side-by-side menus — the user's own diagnosis of the current UI's core problem.
2. Respect the device it's shown on: use the full width available rather than forcing a centered, constrained layout on large screens.
3. Keep the finance domain legible and calm — modern and direct, not loud or neon, even in a dark theme.
4. Functionality is frozen for this pass: every redesign decision must map to an existing capability, never add or remove one.

## Accessibility & Inclusion

No product-specific requirement beyond what the app already implements (existing keyboard/focus/ARIA patterns from prior work this project). The redesign must not regress that inherited baseline.
