/**
 * sql-wasm.ts
 *
 * Thin browser-side wrapper around PGlite (PostgreSQL compiled to WASM).
 * Provides a lazy singleton database pre-seeded with the SQL Playground
 * sample tables (Employees, Orders, Customers, Products).
 *
 * Usage:
 *   import { runQuery } from "@/lib/sql-wasm";
 *   const result = await runQuery("SELECT * FROM Employees WHERE salary > 8000");
 */

import { PGlite } from "@electric-sql/pglite";

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Lazy singleton — initialized once on first call, reused thereafter.
// ---------------------------------------------------------------------------

let dbPromise: Promise<PGlite> | null = null;

const SEED_SQL = `
CREATE TABLE IF NOT EXISTS "Employees" (
  id          INTEGER PRIMARY KEY,
  name        TEXT,
  salary      INTEGER,
  manager_id  INTEGER
);

CREATE TABLE IF NOT EXISTS "Orders" (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER,
  amount      NUMERIC
);

CREATE TABLE IF NOT EXISTS "Customers" (
  id   INTEGER PRIMARY KEY,
  name TEXT
);

CREATE TABLE IF NOT EXISTS "Products" (
  id    INTEGER PRIMARY KEY,
  name  TEXT,
  price NUMERIC
);

INSERT INTO "Employees" VALUES
  (1, 'Alice',   9000, 3),
  (2, 'Bob',     8000, 3),
  (3, 'Charlie', 11000, NULL),
  (4, 'Diana',   7500, 1)
ON CONFLICT DO NOTHING;

INSERT INTO "Orders" VALUES
  (101, 1, 250),
  (102, 2, 450),
  (103, 4, 120)
ON CONFLICT DO NOTHING;

INSERT INTO "Customers" VALUES
  (1, 'Alice'),
  (2, 'Bob'),
  (3, 'Carol')
ON CONFLICT DO NOTHING;

INSERT INTO "Products" VALUES
  (1, 'Laptop',   1200),
  (2, 'Mouse',    25),
  (3, 'Monitor',  300),
  (4, 'Keyboard', 80)
ON CONFLICT DO NOTHING;
`;

function getDb(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = new PGlite();
      await db.exec(SEED_SQL);
      return db;
    })();
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs any SQL string against the in-browser PostgreSQL database.
 * Returns column names, typed rows, and a row count.
 * On error, returns an empty result with the error message populated.
 */
export async function runQuery(sql: string): Promise<QueryResult> {
  if (!sql.trim()) {
    return { columns: [], rows: [], rowCount: 0, error: "Empty query." };
  }

  try {
    const db = await getDb();
    const result = await db.query<Record<string, unknown>>(sql);

    const columns = result.fields.map((f) => f.name);
    const rows = result.rows;

    return {
      columns,
      rows,
      rowCount: result.rowCount ?? rows.length,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { columns: [], rows: [], rowCount: 0, error: message };
  }
}
