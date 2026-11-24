# SQL 50 Concepts App

An app that documents the SQL concepts needed to fully understand and finish
LeetCode's [SQL 50](https://leetcode.com/studyplan/top-sql-50/) study plan.

For each of the 50 problems, the app will show the problem, a solution, and the
SQL concepts you need to understand it. It will also answer questions such as
"which concepts does problem 1661 need?" and "which problems use `GROUP BY`?".

## Status

Early stage. The database exists. The backend and frontend are not decided or built yet.

## What is in the repo

| Path | What it is |
|---|---|
| `db/sql50_database.sql` | PostgreSQL script that creates and fills the database |

## Database

The script creates three tables:

| Table | Purpose |
|---|---|
| `categories` | The 7 groups of the study plan |
| `problems` | The 50 problems (LeetCode id, title, slug, difficulty, group, position) |
| `solutions` | One row per problem and SQL dialect, so MySQL and SQL Server versions can be added |

The problem list (titles, ids, difficulties, group order) comes from LeetCode's SQL 50 plan.
The solutions are written for PostgreSQL and have not all been verified on LeetCode yet.

### Set up the database

1. In a PostgreSQL console connected to the default `postgres` database, run:
   `CREATE DATABASE sql50;`
2. Connect to `sql50` and run `db/sql50_database.sql`.
3. The last two queries show 7 categories, 50 problems and 50 solutions.

## Planned

- [ ] Verify each solution on LeetCode
- [ ] `concepts` table, linked to problems (many-to-many)
- [ ] Tag every problem with the concepts it needs
- [ ] Choose the backend and frontend stack
- [ ] Concept documentation pages
