/**
 * lab-db.ts
 *
 * Browser-side runner for the per-problem practice databases. Each lab gets
 * its own isolated PGlite instance, created on demand and seeded with the
 * lab's script (thousands of rows). Separate from the playground singleton.
 */

import { PGlite } from "@electric-sql/pglite";
import type { QueryResult } from "@/lib/sql-wasm";

const labs = new Map<number, Promise<PGlite>>();

/** Creates (or recreates) the lab database and runs its seed script. */
export function createLabDb(id: number, seed: string): Promise<PGlite> {
  const previous = labs.get(id);
  if (previous) previous.then((db) => db.close()).catch(() => undefined);
  const next = (async () => {
    const db = new PGlite();
    await db.exec(seed);
    return db;
  })();
  labs.set(id, next);
  return next;
}

export function hasLabDb(id: number): boolean {
  return labs.has(id);
}

/** Runs one query against an existing lab database. */
export async function runLabQuery(id: number, sql: string): Promise<QueryResult> {
  const pending = labs.get(id);
  if (!pending) {
    return { columns: [], rows: [], rowCount: 0, error: "Create the database first." };
  }
  if (!sql.trim()) {
    return { columns: [], rows: [], rowCount: 0, error: "Empty query." };
  }
  try {
    const db = await pending;
    const result = await db.query<Record<string, unknown>>(sql);
    return {
      columns: result.fields.map((f) => f.name),
      rows: result.rows,
      rowCount: result.rowCount ?? result.rows.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { columns: [], rows: [], rowCount: 0, error: message };
  }
}

/** Returns "table: N rows" lines for every user table in the lab database. */
export async function describeLabDb(id: number): Promise<string[]> {
  const pending = labs.get(id);
  if (!pending) return [];
  const db = await pending;
  const tables = await db.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  const lines: string[] = [];
  for (const t of tables.rows) {
    const c = await db.query<{ n: string | number }>(`SELECT count(*) AS n FROM "${t.tablename}"`);
    lines.push(`${t.tablename}: ${Number(c.rows[0].n).toLocaleString()} rows`);
  }
  return lines;
}
