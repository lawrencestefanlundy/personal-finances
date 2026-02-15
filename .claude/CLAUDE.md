# Personal Finance Dashboard

## Overview

Next.js 16 wealth tracking dashboard. Manages cash positions, income streams, expenses, assets, liabilities, carry positions (VC fund), transactions, and financial scenarios/projections.

## Key Commands

- **Dev**: `npm run dev`
- **Build**: `npm run build` (runs `prisma generate` first)
- **Lint**: `npm run lint`
- **Test**: `npm test`
- **Format**: `npx prettier --write .`

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript (strict)
- Tailwind CSS (light theme)
- Prisma ORM with Neon PostgreSQL
- Recharts for projections
- Deployed on Vercel

## Database

- **Models**: CashPosition, IncomeStream, Expense, Asset, Liability, Transaction, CarryPosition, PortfolioCompany, Scenario, Settings
- **Migrations**: In `prisma/migrations/` (baseline + incremental)
- **Build**: `prisma generate && next build` (migrations deployed separately)
- **Singleton Prisma client** in `src/lib/db.ts`
- **Critical route**: `POST /api/state` does full wipe-and-reload of all tables (deleteMany → createMany) inside a `prisma.$transaction()` — atomic, rolls back on any failure.

## Error Handling

- All API routes use `handlePrismaError()` from `src/lib/api-utils.ts`
- Handles P2002 (unique → 409), P2025 (not found → 404), P2003 (FK → 400)
- Root `error.tsx` and `loading.tsx` provide global error boundary

## Key Architecture

- `/api/state` GET loads entire finance state; POST replaces all data
- 16 CRUD API routes for individual entity types
- CarryPosition has nested PortfolioCompany (created together)
- Scenarios store overrides as JSON string in DB
- Settings stored as key-value pairs

## Conventions

- Pre-commit hooks run ESLint + Prettier via husky/lint-staged
- All new code must pass `npm run lint` and `npm test`
- GitHub repo: `personal-finances` (note: different from directory name)
