# AGENTS.md: handover for the next agent

Read this first. It explains what the project is, how it is built, the rules that keep
it consistent, and what is still open.

## 1. What this project is

A small, static web app for studying LeetCode's **SQL 50** study plan
(https://leetcode.com/studyplan/top-sql-50/).

- `/concepts`: Catalog index of the 28 SQL concepts, grouped by category.
- `/concepts/[slug]`: Dedicated page for each SQL concept with interactive 3D visual simulation,
  in-depth explanation, example SQL, common pitfalls, prerequisites, and problem links.
- `/playground`: Interactive 3D SQL Sandbox allowing users to switch scenarios (Self Join,
  Inner Join, Cross Join, Group By & Having, Window/Ranking, Filtering), adjust camera views,
  and inspect 3D data transformations and output platforms in real time.
- `/problems` and `/problems/[id]`: The 50 problems, grouped like the study plan, each with a
  PostgreSQL solution and the concepts it needs.
- `/`: Home page with stats and links.

It is meant to be **deployed on Vercel** (no server, no database at runtime, no environment
variables) and to be worked on for a while.

Repo: https://github.com/Hazem-Yasin/sql50-app (public), branch `main`.
Local path used so far: `C:\Users\HazemYasin\source\repos\sql50-app`.

## 2. The owner

Hazem Yasin: backend-leaning full-stack developer who wants to move towards data engineering.
He is practising SQL on LeetCode.

- He sometimes writes in Arabic and asks for Arabic explanations. Explain in Arabic when he
  asks, and go back to English when he says so.
- When he is solving a LeetCode problem himself, give **hints and syntax first**, and the full
  answer only when he asks. This does not apply to building this app.
- Be direct and technical. No filler openers.
- Git identity for this repo (set locally): `Hazem Yasin <hazem.yasin.1416@gmail.com>`. The
  repo is public, so do **not** use his IBM work email (`Hazem.Ya-sin@ibm.com`, still his
  global git identity). Check `git config user.email` before committing.

## 3. Stack and layout

Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 (deliberately not 7.x), ESLint 10
flat config with `eslint-config-next`. Node >= 20.9 (developed on Node 24). All pages are
statically generated. Plain CSS in one file; no UI library.

```
db/sql50_database.sql        SINGLE SOURCE OF TRUTH for problems + PostgreSQL solutions
scripts/generate-data.mjs    parses the SQL file -> src/data/problems.json
scripts/check-concepts.mjs   validates src/data/concepts.ts against the problems
src/data/problems.json       GENERATED, but committed (the build needs it)
src/data/problems.ts         typed access: problems, categories, getProblem, leetcodeUrl
src/data/concepts.ts         hand-written concepts (the content of the concepts page)
src/components/sql-3d-engine/ 3D SQL visualization engine (Three.js interactive component)
docs/3D_SQL_ENGINE.md        Architecture and design for the 3D SQL visualization engine
src/lib/slugify.ts           shared slugify, used for #anchors
src/app/                     layout, page (home), concepts/, problems/, problems/[id]/
src/app/globals.css          all styling
```

## 4. Data flow (important)

```
db/sql50_database.sql --(npm run generate)--> src/data/problems.json --> src/data/problems.ts --> pages
src/data/concepts.ts  --(npm run check:concepts validates against problems.json)
```

- **Never edit `src/data/problems.json` by hand.** Edit `db/sql50_database.sql` and run
  `npm run generate`. `npm run build` does this automatically through `prebuild`.
- `generate-data.mjs` parses the SQL with regular expressions, so it depends on the file format:
  - `INSERT INTO categories (name, position) VALUES ...`
  - problems in a `FROM (VALUES (id, 'title', 'slug', 'DIFFICULTY', 'Category', position), ...) AS v (`
  - solutions as `(id, 'postgresql', $sql$ ... $sql$)` with `$sql$` on its own lines
  - it throws unless there are exactly 7 categories, 50 problems and 50 PostgreSQL solutions.
  
  If you change the SQL file's shape, update the script too.
- The `solutions` table has a `dialect` column so MySQL and SQL Server versions can be added
  later. The generator currently only reads `'postgresql'` rows, and the UI only shows one
  solution per problem.

## 5. Concepts: rules that the check script enforces

`src/data/concepts.ts` exports `concepts: Concept[]` (see the `Concept` interface at the top of
the file) and `conceptGroups`. Each concept has `slug`, `title`, `group`, `level`, `summary`,
`explanation[]`, `example {sql, note}`, `pitfalls[]`, `problems[]` (LeetCode ids) and
`prerequisites[]` (slugs).

`npm run check:concepts` (also part of `prebuild`, so a bad edit **fails the build**) checks:

1. every linked problem id exists;
2. every prerequisite slug exists and there are no prerequisite cycles;
3. every linked problem's PostgreSQL solution contains a keyword for that concept. The regex
   per concept slug is in the `keywords` object in `scripts/check-concepts.mjs`;
4. all 50 problems are linked to at least one concept.

When you **add a concept**, also add its keyword regex to `keywords` (a concept without one
fails). When you **change a solution** in the SQL file, re-run the check, because a concept
link can become wrong. The script reads `concepts.ts` with regexes (it splits on
`\n  {\n    slug: `), so keep the existing formatting of each concept block (two-space indent,
`problems: [...]` and `prerequisites: [...]` each on one line).

## 6. Commands (Windows / PowerShell notes)

```
npm install
npm run dev              # http://localhost:3000
npm run generate
npm run check:concepts
npm run typecheck
npm run lint
npm run build            # prebuild (generate + check) then next build
```

On his machine PowerShell blocks `npm.ps1`: use **`npm.cmd`** and **`npx.cmd`**. Do not use
`&&` in PowerShell 5.1; use `;` or `if ($?) { ... }`.

**Definition of done for any change:** `typecheck`, `lint` and `build` all pass with no new
warnings. The last verified state: typecheck clean, lint clean, build produces 55 static pages.

## 7. Deployment

Vercel, framework preset Next.js, default build command, no environment variables.
Auto-deploy is enabled on commits pushed to `main`. All 84 static pages build cleanly.

## 8. 3D SQL Engine & Future Roadmap

The 3D SQL Engine (`src/components/sql-3d-engine/`) provides real-time WebGL visualization of SQL operations using Three.js:
- **Concept Integration**: Every individual concept page (`/concepts/[slug]`) embeds an interactive 3D simulation with step-by-step narration, camera controls, and output streams.
- **Interactive Playground (`/playground`)**: Houses a live SQL Query Interpreter, preset scenarios, and raycast tooltip inspector.
- **Architecture Documentation**: Full design specifications are located in `docs/3D_SQL_ENGINE.md`.

### Future Roadmap & Open Items:
1. **WASM-Powered SQL Engine in Browser**:
   - Integrate a client-side WebAssembly SQL engine (e.g. SQLite WASM / PGlite) to parse and run 100% standard SQL (recursive CTEs, nested subqueries, advanced window framing) directly inside the 3D canvas without relying on custom regex/AST interpreters.
2. **Interactive 3D Visualizer on Problem Pages (`/problems/[id]`)**:
   - Embed 3D visual step animations for LeetCode problem test cases directly in the problem detail view.
3. **Physics & Particle Visuals**:
   - Add particle beams for join matching arcs, glowing dissolve transitions on filtered rows, and drop physics when records are inserted into table slots.
4. **Solution Verification & Automated Test Suite**:
   - Verify all 50 PostgreSQL solutions against live database test suites or LeetCode test runners.
5. **Multi-Dialect Tabs (PostgreSQL / MySQL / SQL Server)**:
   - Expand `db/sql50_database.sql` and the generator to support dialect tabs on the problem detail pages.
6. **Progress Tracking**:
   - Add a client-side (LocalStorage) study plan checklist to track solved problems and mastered concepts.

## 9. Working agreements

- Make the minimal change that solves the request. No extra features, no unrelated refactors.
- Follow the existing style (TypeScript, double quotes, two-space indent, server components,
  no client JS unless needed).
- Do not commit secrets; `.env` and `appsettings.Development.json` are gitignored.
- Commit to `main` with clear messages. Do not force-push or rewrite public
  history without asking (it was done once, to replace the work email on the first two
  commits).
- Always push to `origin/main` after finishing every requested change or task, so Vercel
  automatically deploys the latest build.
- Update this file and `README.md` when the structure, commands or rules above change.

## 10. Other things on his machine (context only, not part of this repo)

- `C:\Users\HazemYasin\OneDrive - IBM\Documents\psql sandBox`: his personal LeetCode practice
  folders (1378, 1068, 1581, 197, 1661) with `solution.sql` and sample-data scripts. Solutions
  were deliberately removed from some of them at his request. `sql50-database/sql50_database.sql`
  there is an old duplicate of `db/sql50_database.sql` and can be deleted.
- `C:\Users\HazemYasin\source\repos\WebApplication1`: an unrelated ASP.NET Web API built
  around problem 1661.
