// Reads db/sql50_database.sql and writes src/data/problems.json.
// The SQL file is the single source of truth for the problems and their solutions.
// Run with: npm run generate

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(join(root, "db", "sql50_database.sql"), "utf8").replace(/\r\n/g, "\n");

// 1. Categories: ('Name', position)
const categoriesBlock = sql.match(/INSERT INTO categories \(name, position\) VALUES([\s\S]*?);/);
if (!categoriesBlock) throw new Error("categories INSERT not found");
const categories = [...categoriesBlock[1].matchAll(/\('([^']+)',\s*(\d+)\)/g)].map((m) => ({
  name: m[1],
  position: Number(m[2]),
}));

// 2. Problems: (id, 'title', 'slug', 'DIFFICULTY', 'Category', position)
const problemsBlock = sql.match(/FROM \(VALUES([\s\S]*?)\) AS v \(/);
if (!problemsBlock) throw new Error("problems VALUES not found");
const problems = [
  ...problemsBlock[1].matchAll(
    /\((\d+),\s*'((?:[^']|'')+)',\s*'([a-z0-9-]+)',\s*'(EASY|MEDIUM|HARD)',\s*'([^']+)',\s*(\d+)\)/g,
  ),
].map((m) => ({
  id: Number(m[1]),
  title: m[2].replace(/''/g, "'"),
  slug: m[3],
  difficulty: m[4],
  category: m[5],
  position: Number(m[6]),
}));

// 3. Solutions: (id, 'postgresql', $sql$ ... $sql$)
const solutions = new Map(
  [...sql.matchAll(/\((\d+),\s*'postgresql',\s*\$sql\$\n([\s\S]*?)\n\$sql\$\)/g)].map((m) => [
    Number(m[1]),
    m[2].trim(),
  ]),
);

if (categories.length !== 7) throw new Error(`expected 7 categories, got ${categories.length}`);
if (problems.length !== 50) throw new Error(`expected 50 problems, got ${problems.length}`);
if (solutions.size !== 50) throw new Error(`expected 50 solutions, got ${solutions.size}`);

const output = {
  categories,
  problems: problems
    .sort((a, b) => a.position - b.position)
    .map((p) => {
      const solution = solutions.get(p.id);
      if (!solution) throw new Error(`no solution for problem ${p.id}`);
      return { ...p, postgresql: solution };
    }),
};

const target = join(root, "src", "data", "problems.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(output, null, 2) + "\n");
console.log(`Wrote ${output.problems.length} problems and ${output.categories.length} categories to src/data/problems.json`);
