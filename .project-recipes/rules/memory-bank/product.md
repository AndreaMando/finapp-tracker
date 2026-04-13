# Product Context: FinApp Tracker

## Why This Project Exists

FinApp Tracker exists to help users manage personal finances with a simple, actionable web interface. It brings together income tracking, recurring and one-time expenses, and savings goals into a single app.

## Problems It Solves

1. **Unclear monthly finances**: Provides a dashboard showing income vs expenses
2. **Forgotten recurring bills**: Tracks subscriptions, insurance, installments, and other repeating costs
3. **Goal planning gaps**: Helps users save toward targets with progress and contribution history
4. **Authentication needs**: Secures user data with sign-in and session handling

## User Flow

1. User visits the app and logs in
2. User enters monthly income data
3. User adds recurring expenses and toggles active subscriptions
4. User logs one-time expenses by category
5. User creates savings goals and tracks contributions
6. User reviews progress in the dashboard
7. User can deploy the app to GitHub-hosted environments

## User Experience Goals

- **Simple onboarding**: easy login and clear navigation
- **Fast data entry**: intuitive forms for income and expenses
- **Helpful summary**: dashboard numbers and charts that explain financial health
- **Goal focus**: visible savings targets and progress tracking

## What This App Provides

1. **Authentication**: NextAuth credentials provider with Drizzle adapter
2. **Database-backed storage**: Neon/Postgres via Drizzle ORM
3. **Finance tracking**: income, recurring, one-time expenses, goals
4. **Analytics**: Vercel Analytics and Speed Insights
5. **Responsive UI**: built with Tailwind CSS and React

## Integration Points

- **Database**: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`
- **Authentication**: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- **API routes**: CRUD endpoints under `src/app/api`
