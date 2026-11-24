// Checks src/data/concepts.ts against src/data/problems.json:
//  - every linked problem id exists
//  - every prerequisite slug exists and there are no cycles
//  - every concept's linked problems actually use a keyword of that concept in their solution
//  - every one of the 50 problems is covered by at least one concept
// Run with: npm run check:concepts

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const problems = JSON.parse(readFileSync(join(root, "src", "data", "problems.json"), "utf8")).problems;
const source = readFileSync(join(root, "src", "data", "concepts.ts"), "utf8").replace(/\r\n/g, "\n");

// Pull each concept's slug, problems and prerequisites out of the TypeScript source.
const blocks = source.split(/\n  \{\n    slug: /).slice(1);
const concepts = blocks.map((b) => ({
  slug: b.match(/^"([^"]+)"/)[1],
  problems: (b.match(/\n    problems: \[([^\]]*)\]/)[1].match(/\d+/g) ?? []).map(Number),
  prerequisites: b.match(/\n    prerequisites: \[([^\]]*)\]/)[1].match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) ?? [],
}));

// Keywords that must appear in a solution for it to count as using a concept.
const keywords = {
  "select-from": /\bSELECT\b/i,
  aliases: /\bAS\b|\bFROM \w+ [a-z]\w*\b|\bJOIN \w+ [a-z]\w*\b/i,
  "order-by-limit": /ORDER BY|\bLIMIT\b|\bOFFSET\b/i,
  distinct: /\bDISTINCT\b/i,
  "where-and-operators": /\bWHERE\b|\bCASE WHEN\b/i,
  "null-handling": /IS (NOT )?NULL|IS DISTINCT FROM|COALESCE|NOT IN/i,
  "between-in-like": /\bBETWEEN\b|\bIN \(|\bLIKE\b/i,
  regex: / ~ '/,
  "string-functions": /LENGTH|UPPER|LOWER|LEFT\(|SUBSTRING|STRING_AGG/i,
  "case-when": /\bCASE\b/i,
  "coalesce-nullif-cast": /COALESCE|NULLIF|::|CAST\(/i,
  "math-and-rounding": /ROUND\(| % 2|\* 100|100\.0/i,
  "date-functions": /TO_CHAR|INTERVAL|DATE '|recordDate \+ 1|first_login \+ 1|l1\.id \+ 1|\+ 6/i,
  "inner-join": /\bJOIN\b/i,
  "left-join": /LEFT JOIN/i,
  "self-join": /JOIN (\w+) (\w+)[\s\S]*JOIN \1 \w+|FROM (\w+) \w+\s+JOIN \3 /i,
  "cross-join": /CROSS JOIN/i,
  "multi-condition-joins": /\bON\b[^;]*\bAND\b|\bJOIN\b[\s\S]*\bJOIN\b/i,
  "aggregate-functions": /COUNT\(|SUM\(|AVG\(|MIN\(|MAX\(/i,
  "group-by-having": /GROUP BY|HAVING/i,
  "conditional-aggregation": /FILTER \(|CASE WHEN|::int/i,
  subqueries: /\(\s*SELECT|\(\(?SELECT/i,
  union: /UNION/i,
  ctes: /^WITH /im,
  "window-functions": /OVER\s*\(|OVER w|WINDOW w/i,
  "ranking-functions": /DENSE_RANK|RANK\(|ROW_NUMBER/i,
  "distinct-on": /DISTINCT ON/i,
  "delete-and-dml": /\bDELETE\b/i,
};

let errors = 0;
const fail = (msg) => {
  errors++;
  console.error("ERROR: " + msg);
};

const ids = new Set(problems.map((p) => p.id));
const slugs = new Set(concepts.map((c) => c.slug));

for (const c of concepts) {
  if (!(c.slug in keywords)) fail(`no keyword rule for concept "${c.slug}"`);
  for (const id of c.problems) {
    if (!ids.has(id)) {
      fail(`${c.slug}: problem ${id} does not exist`);
      continue;
    }
    const sql = problems.find((p) => p.id === id).postgresql;
    if (keywords[c.slug] && !keywords[c.slug].test(sql)) {
      fail(`${c.slug}: problem ${id} (${problems.find((p) => p.id === id).title}) does not use this concept`);
    }
  }
  for (const pre of c.prerequisites) if (!slugs.has(pre)) fail(`${c.slug}: unknown prerequisite "${pre}"`);
}

// Cycle check
const byslug = new Map(concepts.map((c) => [c.slug, c]));
const visiting = new Set();
const done = new Set();
function visit(slug, path) {
  if (done.has(slug)) return;
  if (visiting.has(slug)) return fail("prerequisite cycle: " + [...path, slug].join(" -> "));
  visiting.add(slug);
  for (const p of byslug.get(slug)?.prerequisites ?? []) visit(p, [...path, slug]);
  visiting.delete(slug);
  done.add(slug);
}
concepts.forEach((c) => visit(c.slug, []));

// Coverage
const covered = new Set(concepts.flatMap((c) => c.problems));
const uncovered = problems.filter((p) => !covered.has(p.id));
for (const p of uncovered) fail(`problem ${p.id} (${p.title}) is not linked to any concept`);

console.log(`${concepts.length} concepts, ${covered.size}/50 problems covered, ${errors} error(s)`);
process.exit(errors ? 1 : 0);
