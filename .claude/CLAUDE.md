# Personal Finance Dashboard

## Overview

Next.js 16 single-page wealth tracking dashboard. Manages cash positions, income streams, expenses, assets, liabilities, carry positions (VC fund), transactions, and financial scenarios/projections. All sections on one page with anchor navigation (#overview, #cash-flow, #assets).

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
- **Neon region**: eu-west-2
- **Connection strings**: Pooler URL uses `-pooler` suffix in hostname; direct URL does not.

## Vercel Deployment — CRITICAL

**GitHub repo**: `lawrencestefanlundy/personal-finances` (different from directory name `personal-finance-dashboard`)

**Domain alias**: The production URL is `personal-finances-five.vercel.app`. Vercel auto-assigns `personal-finance-dashboard-sooty.vercel.app` which is NOT the correct public URL.

### Deploy procedure (MUST follow every time):

```bash
# 1. Build locally first to catch errors
npm run build

# 2. Deploy with --force to ensure env vars are included in the build
#    WITHOUT --force, Vercel may use cached builds that lack env vars
npx vercel --prod --force

# 3. Set the alias (the deployment URL changes each time)
npx vercel alias set <deployment-url>.vercel.app personal-finances-five.vercel.app

# 4. Verify the API returns data (NOT the homepage — the API)
curl -s https://personal-finances-five.vercel.app/api/state | head -c 100
```

### Env vars that MUST exist in Vercel production:

| Variable       | Value pattern                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://neondb_owner:...@...-pooler.eu-west-2.aws.neon.tech/personal_finance?sslmode=require` |
| `DIRECT_URL`   | `postgresql://neondb_owner:...@...eu-west-2.aws.neon.tech/personal_finance?sslmode=require`         |

**If the site shows "Failed to connect to the server"**, the env vars are likely missing or the deploy didn't pick them up. Check with:

```bash
npx vercel env ls production
```

If they exist but API still returns 500, redeploy with `--force`.

If they're missing, re-add:

```bash
echo -n '<value>' | npx vercel env add DATABASE_URL production
echo -n '<value>' | npx vercel env add DIRECT_URL production
npx vercel --prod --force
```

### Git push method:

```bash
GH_TOKEN=$(gh auth token) && git push https://x-access-token:${GH_TOKEN}@github.com/lawrencestefanlundy/personal-finances.git main
```

## Error Handling

- All API routes use `handlePrismaError()` from `src/lib/api-utils.ts`
- Handles P2002 (unique → 409), P2025 (not found → 404), P2003 (FK → 400)
- Root `error.tsx` and `loading.tsx` provide global error boundary
- `FinanceContext` validates API response shape before dispatching (checks `res.ok` and `Array.isArray(data.cashPositions)`) — shows error UI with retry button on failure
- `IMPORT_DATA` reducer action uses `Array.isArray()` fallbacks on every field — prevents "Cannot read properties of undefined" crashes from malformed API responses

## Key Architecture

- **Single-page layout**: `src/app/page.tsx` contains Overview, Cash Flow, and Assets sections. Only `/settings` is a separate page.
- **Navigation**: `src/components/Navigation.tsx` uses anchor links (#overview, #cash-flow, #assets) on homepage.
- **Redirects**: `next.config.ts` redirects all old routes (/cash-flow, /net-worth, /assets, etc.) to anchor positions on homepage.
- **State**: React Context + useReducer in `src/context/FinanceContext.tsx`. Hydrates from `GET /api/state` on mount; mutations sync to individual CRUD API routes via `syncToAPI`.
- `/api/state` GET loads entire finance state; POST replaces all data
- 16 CRUD API routes for individual entity types
- CarryPosition has nested PortfolioCompany (created together)
- Scenarios store overrides as JSON string in DB
- Settings stored as key-value pairs
- Cash Flow table is a flat list — no collapsible sections, no category grouping

## Monzo Integration

- OAuth2 flow: `/api/auth/monzo` → Monzo consent → callback stores token in DB (MonzoToken, singleton id=1)
- Refresh tokens are **single-use** — `lib/monzo.ts` updates DB immediately after refresh
- Token refresh buffer: 5 min before expiry (TOKEN_BUFFER_SECONDS = 300)
- Sync: `POST /api/monzo/sync` fetches last 90 days (Monzo API limit)
- Cron: Vercel daily at 00:00 UTC (`vercel.json`)
- Transaction dedup by `emailId` (unique constraint)

## Other API Integrations

- **DVLA**: `/api/vehicles/lookup?registration=ABC123` — vehicle data
- **UKHPI**: `/api/property/valuation` — Land Registry price index by region
- **FX rates**: `/api/fx` — EUR-GBP for angel investment conversions
- **Gmail scripts**: `scripts/fetch-monzo-transactions.py` (offline, parses Monzo email notifications)

## Data Patterns

- **Monthly overrides**: Income/Expense store JSON strings parsed on API response
- **vehicleData/propertyData**: JSON strings on Asset model
- **Multi-currency**: angel investments need `costCurrency`, `costBasisGBP`, `fxRate`
- **Carry cascading delete**: deleting CarryPosition auto-deletes all PortfolioCompany
- **Neon cold starts**: API retries 2x with exponential backoff (1s, 2s, 4s)
- **Path alias**: `@/*` → `./src/*` (tsconfig.json)

## Naming Conventions

- camelCase functions/variables, UPPER_CASE constants
- Model names singular (CashPosition not CashPositions)
- Boolean prefixes: `is*`, `has*`
- Frequencies: 'monthly', 'quarterly', 'annual', 'bimonthly', 'termly', 'one-off'
- Categories: 'cash', 'savings', 'isa', 'crypto', 'fund', 'angel', 'pension', 'property', 'vehicle', 'children_isa'

## Conventions

- Pre-commit hooks run ESLint + Prettier via husky/lint-staged
- All new code must pass `npm run lint` and `npm test`
- Always run `npm run build` before deploying — catches TypeScript and lint errors
- Always use `--force` flag with `npx vercel --prod`
- Always set the alias after deploying
- Always verify `/api/state` returns JSON (not HTML or error) after deploy
