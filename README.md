# SQL 50 Concepts & 3D Visualization App

A modern, static web app designed for mastering SQL concepts and finishing LeetCode's [SQL 50](https://leetcode.com/studyplan/top-sql-50/) study plan through explanations and **interactive 3D relational simulations**.

---

## Features

- **Interactive 3D SQL Engine (`/playground`)**: A WebGL/Three.js sandbox with an in-browser SQL interpreter. Write queries or select presets (Self Join, Inner Join, Cross Join, Group By & Having, Window/Ranking, WHERE filtering) to watch 3D tables spawn, records scan, relation arcs form, and results stream onto the 3D Output Platform.
- **Dedicated Concept Pages (`/concepts/[slug]`)**: 28 individual concept pages, each equipped with its own tailored 3D simulation, in-depth explanation, example SQL, common mistakes, prerequisites, and linked SQL 50 problems.
- **Concept Catalog (`/concepts`)**: Categorized directory covering Querying basics, Filtering & NULL, Functions, Joins, Aggregation, Subqueries & Sets, and Advanced topics.
- **Problems & Solutions (`/problems`, `/problems/[id]`)**: All 50 LeetCode SQL 50 problems categorized with PostgreSQL solutions, prerequisites, and direct LeetCode links.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, React 19)
- **3D Graphics Engine**: Three.js, OrbitControls, custom Canvas Textures & Raycasting
- **Language**: TypeScript 5.9 (Strict mode)
- **Styling**: Pure CSS with dark mode support (no heavy UI libraries)
- **Deployment**: Static Site Generation (SSG) for Vercel (zero runtime database or environment variables required)

---

## Getting Started & Commands

```bash
npm install
npm run dev              # local dev server on http://localhost:3000
npm run generate         # db/sql50_database.sql -> src/data/problems.json
npm run check:concepts   # validates concepts.ts against problem solutions
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint 10 flat config
npm run build            # prebuild (generate + check) then static export (84 pages)
```

---

## Project Structure

| Path | Description |
|---|---|
| `src/components/sql-3d-engine/` | Self-contained 3D engine: `SceneManager.ts`, `mesh-generators.ts`, `concept-scenarios.ts`, `sql-interpreter.ts`, `Sql3DViewer.tsx` |
| `src/app/concepts/[slug]/` | Static individual concept pages with embedded 3D viewer |
| `src/app/playground/` | Live 3D SQL playground with interactive query console |
| `src/app/problems/[id]/` | Problem solution pages |
| `db/sql50_database.sql` | Single source of truth for problem definitions & solutions |
| `scripts/generate-data.mjs` | Parses SQL database script into `src/data/problems.json` |
| `scripts/check-concepts.mjs` | Concept coverage and keyword validation engine |
| `docs/3D_SQL_ENGINE.md` | Architecture and spatial design documentation for the 3D visualizer |

---

## Future Roadmap

- [ ] **WASM SQL Engine Integration**: Embed WebAssembly SQLite / PGlite in the client to support 100% full-spec SQL (CTEs, recursive queries, window framing, subqueries) in the 3D canvas.
- [ ] **3D Visualizations on Problem Pages (`/problems/[id]`)**: Embed 3D visual step animations for LeetCode problem test cases directly in the problem detail view.
- [ ] **Physics & Particle FX**: Add particle beams and gravity physics for rows falling into table grids and merging into result sets.
- [ ] **Multi-Dialect Solutions**: Add MySQL and SQL Server (T-SQL) tabs alongside PostgreSQL solutions.
- [ ] **Progress Tracking**: Client-side (LocalStorage) study plan checklist to track solved problems and mastered concepts.
- [ ] **Solution Verification**: Automated test runner verifying all 50 PostgreSQL solutions against real database test suites.
