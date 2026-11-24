# SQL 50 Concepts App

A web app that documents the SQL concepts needed to fully understand and finish
LeetCode's [SQL 50](https://leetcode.com/studyplan/top-sql-50/) study plan.

- **Concepts page** (`/concepts`): 28 SQL concepts in 7 groups (joins, aggregation,
  subqueries, window functions and so on). Each has an explanation, an example,
  common pitfalls, prerequisites, and links to the problems that use it.
- **Problems** (`/problems`, `/problems/[id]`): the 50 problems, grouped like the study
  plan, each with a PostgreSQL solution and the concepts it needs.

## Status

The app builds and is ready to deploy. Solutions are written for PostgreSQL and have
**not all been verified on LeetCode yet**.

## Stack

Next.js 16 (App Router), React 19, TypeScript. All pages are statically generated, so
no server, database, or environment variables are needed at runtime.

## Commands

```bash
npm install
npm run dev              # local dev server on http://localhost:3000
npm run generate         # db/sql50_database.sql -> src/data/problems.json
npm run check:concepts   # validate src/data/concepts.ts against the problems
npm run typecheck
npm run lint
npm run build            # runs generate + check:concepts, then next build
```

## Deploy to Vercel

1. Go to Vercel, choose **Add New > Project**, and import this GitHub repo.
2. Framework preset: **Next.js** (detected automatically). Keep the default build
   command (`npm run build`) and output settings.
3. No environment variables are needed. Click **Deploy**.

Or from the CLI: `npx vercel` for a preview, `npx vercel --prod` for production.

## What is in the repo

| Path | What it is |
|---|---|
| `db/sql50_database.sql` | PostgreSQL script that creates and fills the database. Single source of truth for problems and solutions |
| `scripts/generate-data.mjs` | Parses the SQL file into `src/data/problems.json` |
| `scripts/check-concepts.mjs` | Checks that every concept links to real problems that use its keywords, no prerequisite cycles, all 50 problems covered |
| `src/data/problems.json` | Generated data used by the app (committed, needed by the build) |
| `src/data/problems.ts` | Typed access to the problem data |
| `src/data/concepts.ts` | The concepts, written by hand |
| `src/app/` | Pages: home, concepts, problems, problem detail |

## Database

The script creates three tables:

| Table | Purpose |
|---|---|
| `categories` | The 7 groups of the study plan |
| `problems` | The 50 problems (LeetCode id, title, slug, difficulty, group, position) |
| `solutions` | One row per problem and SQL dialect, so MySQL and SQL Server versions can be added |

The problem list (titles, ids, difficulties, group order) comes from LeetCode's SQL 50 plan.

### Set up the database

1. In a PostgreSQL console connected to the default `postgres` database, run:
   `CREATE DATABASE sql50;`
2. Connect to `sql50` and run `db/sql50_database.sql`.
3. The last two queries show 7 categories, 50 problems and 50 solutions.

## Planned

- [ ] Verify each solution on LeetCode
- [ ] `concepts` and `problem_concepts` tables in the database script
- [ ] MySQL and SQL Server versions of the solutions
