# Ampy Job Board

A small internal job board for Ampy Electrical: every job in one list, filter and search it, open a job to change its status or leave a note. Next.js 16 (TypeScript) + Postgres, deployed on Vercel with Neon Postgres.

**Live:** https://ampy-job-board-psi.vercel.app · **Health:** `/api/health`

## What it does

- **Job list** of 20 sample jobs (customer, suburb, job type, status, value, date) using real Bendigo-region suburbs and Ampy's service mix.
- **Filter by status** (with live counts) and **search by customer** (case-insensitive, debounced as you type).
- **Sort** by date, value or customer.
- Filters, search and sort live in the **URL**, so a view like "On Hold, highest value" can be bookmarked or sent to someone.
- **Dashboard strip**: open pipeline value, in-progress and on-hold totals, completed value.
- **Job detail page** with an **add note** box that saves to Postgres, plus a **status change** control. Notes and status changes form one **activity timeline**, so you can see who changed what and when.
- **Mobile friendly**: techs can check a job from their phone.
- **Overdue alert**: jobs still marked Scheduled after their booked day are flagged on the board, with a one-click filter to review them.
- **Handover brief**: one button on a job turns its record and latest note into what the next tech needs to know.
- **Ask the board**: a chat panel on every page answers questions like `What's overdue?`, `Who's on hold?` or `What's on in Strathdale?` from the live job list. It's a rule-based demo (keyword matching in `src/lib/assistant.ts`), so it needs no API key; the same endpoint could call an LLM later.
- **Morning digest**: `GET /api/digest` returns open pipeline, overdue and next-up jobs plus a ready-to-send `text` line. Point a cron, n8n or Zapier at it and post to Slack or SMS.

## Reliability

- `/api/health` checks the database and returns `503` if it's unreachable. Point an uptime monitor at it.
- Inputs are validated on the server (note length, known statuses, numeric ids). All SQL is parameterised.
- Status changes run in a transaction with a row lock, so two people changing the same job can't corrupt the log.
- **30 Playwright end-to-end tests** (desktop + mobile) cover listing, filtering, search, sort, notes persisting after reload, validation, status changes, overdue flags, the digest, the chat and brief, 404s and health.
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

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Storage → add **Neon** Postgres and connect it to the project (sets `DATABASE_URL`).
3. Deploy. `vercel.json` pins functions to Sydney (`syd1`), next to the database. The `vercel-build` script runs the migration before `next build`, so schema and seed data are applied on every deploy (idempotent).

Railway also works: `npm start` migrates before booting and `railway.json` sets the healthcheck.

## Structure

```
scripts/migrate.mjs        schema + seed (safe to re-run)
src/lib/db.ts              all SQL queries
src/lib/status.ts          statuses shared by server and client
src/app/page.tsx           job list, stats, filters
src/app/filters.tsx        search + sort (client, URL-synced)
src/app/jobs/[id]/         detail page, server actions for notes + status
src/app/api/health/        healthcheck
src/app/api/digest/        morning digest JSON for automations
src/app/api/ask/           ask-the-board endpoint
src/lib/assistant.ts       rule-based chat answers + handover brief
e2e/                       Playwright tests
```

## How I built it

Built with Claude Code, as the brief asked. I scoped the features, set the data model and the testing approach, and reviewed every change. Claude Code did the scaffolding and first drafts. I ran the Playwright suite in a loop to catch bugs, for example a search box that dropped keystrokes while the URL updated, and a race between parallel test workers on the shared database.

## Next steps if this became a real tool

- Pull jobs from the ServiceTitan API on a schedule instead of seed data.
- Sign-in, so each note records who wrote it.
- Push status changes back to ServiceTitan; link invoiced jobs to Xero.
