# Ampy Job Board

A small internal job board for Ampy Electrical: every job in one list, filter and search it, open a job to change its status or leave a note. Next.js 16 + Postgres, deployed on Railway.

**Live:** _add Railway URL_ · **Health:** `/api/health`

## What it does

- **Job list** of 20 sample jobs (customer, suburb, job type, status, value, date) using real Bendigo-region suburbs and Ampy's service mix.
- **Filter by status** (with live counts) and **search by customer** (case-insensitive, debounced as you type).
- **Sort** by date, value or customer.
- Filters, search and sort live in the **URL**, so a view like "On Hold, highest value" can be bookmarked or sent to someone.
- **Dashboard strip**: open pipeline value, in-progress and on-hold totals, completed value.
- **Job detail page** with an **add note** box that saves to Postgres, plus a **status change** control. Notes and status changes form one **activity timeline**, so you can see who changed what and when.
- **Mobile friendly**: techs can check a job from their phone.

## Reliability

- `/api/health` checks the database and returns `503` if it's unreachable. Railway uses it as the deploy healthcheck, so a broken build never replaces a working one.
- Inputs are validated on the server (note length, known statuses, numeric ids). All SQL is parameterised.
- Status changes run in a transaction with a row lock, so two people changing the same job can't corrupt the log.
- **20 Playwright end-to-end tests** (desktop + mobile) cover listing, filtering, search, sort, notes persisting after reload, validation, status changes, 404s and health.
- **GitHub Actions CI** runs lint, typecheck, migrations and the full e2e suite against a real Postgres on every push.

## Run locally

```bash
docker run -d --name ampy-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ampy -p 5433:5432 postgres:17-alpine
cp .env.example .env.local   # DATABASE_URL=postgres://postgres:postgres@localhost:5433/ampy
npm install
npm run db:migrate           # creates tables, seeds 20 jobs if empty
npm run dev
npm run test:e2e             # builds and runs the Playwright suite
```

`npm run db:reset` drops and reseeds.

## Deploy (Railway)

1. New project → Deploy from GitHub repo → `ampy-job-board`.
2. Add a Postgres database to the project.
3. On the app service set `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
4. Settings → Networking → Generate domain.

`npm start` runs the migration before booting, so schema and seed data are applied on every deploy (idempotent). `railway.json` sets the healthcheck and restart policy.

## Structure

```
scripts/migrate.mjs        schema + seed (safe to re-run)
src/lib/db.ts              all SQL queries
src/lib/status.ts          statuses shared by server and client
src/app/page.tsx           job list, stats, filters
src/app/filters.tsx        search + sort (client, URL-synced)
src/app/jobs/[id]/         detail page, server actions for notes + status
src/app/api/health/        healthcheck
e2e/                       Playwright tests
```

## How I built it

Built with Claude Code, as the brief asked. I scoped the features, set the data model and the testing approach, and reviewed every change. Claude Code did the scaffolding and first drafts. I ran the Playwright suite in a loop to catch bugs, for example a search box that dropped keystrokes while the URL updated, and a race between parallel test workers on the shared database.

## Next steps if this became a real tool

- Pull jobs from the ServiceTitan API on a schedule instead of seed data.
- Sign-in, so each note records who wrote it.
- Push status changes back to ServiceTitan; link invoiced jobs to Xero.
