/**
 * verifier.ts
 *
 * Runs a TestCase against an isolated in-memory PGlite instance and returns
 * a structured result indicating PASS, FAIL, or ERROR.
 *
 * Each invocation creates a fresh PGlite database so test cases cannot
 * interfere with each other or with the playground singleton.
 */

import { PGlite } from "@electric-sql/pglite";
import { TestCase } from "@/data/test-cases";

export type VerifyStatus = "pass" | "fail" | "error" | "pending";

export interface VerifyResult {
  id: number;
  title: string;
  status: VerifyStatus;
  /** Actual rows returned by the solution query */
  actual: Record<string, unknown>[];
  /** Expected rows from the test case */
  expected: Record<string, unknown>[];
  /** Mismatch detail or error message */
  message?: string;
  /** Wall-clock execution time in milliseconds */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------

/** Normalise a cell value for comparison: numbers as numbers, strings trimmed. */
function normalise(v: unknown): string {
  if (v === null || v === undefined) return "__NULL__";
  // Dates returned as Date objects → ISO string date portion
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  // If it looks like a number, parse it for numeric comparison
  const n = Number(s);
  if (!isNaN(n) && s !== "") return String(n);
  return s;
}

function rowKey(row: Record<string, unknown>): string {
  return Object.keys(row)
    .sort()
    .map((k) => `${k}=${normalise(row[k])}`)
    .join("|");
}

function setsEqual(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[]
): boolean {
  if (actual.length !== expected.length) return false;
  const aKeys = actual.map(rowKey).sort();
  const eKeys = expected.map(rowKey).sort();
  return aKeys.every((k, i) => k === eKeys[i]);
}

function orderedEqual(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[]
): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((aRow, i) => rowKey(aRow) === rowKey(expected[i]));
}

// ---------------------------------------------------------------------------
// Core verifier
// ---------------------------------------------------------------------------

export async function verifyTestCase(tc: TestCase): Promise<VerifyResult> {
  const start = performance.now();
  let actual: Record<string, unknown>[] = [];

  try {
    const db = new PGlite();

    // Run DDL + seed
    await db.exec(tc.setup);

    // Run solution — may be multi-statement (e.g. DELETE then SELECT)
    // We execute everything and capture the last SELECT result
    const statements = tc.solution
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    let lastResult: Record<string, unknown>[] = [];
    for (const stmt of statements) {
      const res = await db.query<Record<string, unknown>>(stmt);
      if (res.rows.length > 0 || res.fields.length > 0) {
        lastResult = res.rows;
      }
    }
    actual = lastResult;
    await db.close?.();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      id: tc.id,
      title: tc.title,
      status: "error",
      actual: [],
      expected: tc.expected,
      message,
      durationMs: Math.round(performance.now() - start),
    };
  }

  const durationMs = Math.round(performance.now() - start);
  const passed = tc.ordered
    ? orderedEqual(actual, tc.expected)
    : setsEqual(actual, tc.expected);

  if (passed) {
    return { id: tc.id, title: tc.title, status: "pass", actual, expected: tc.expected, durationMs };
  }

  const message =
    `Expected ${tc.expected.length} row(s), got ${actual.length}. ` +
    (actual.length > 0
      ? `First actual: ${JSON.stringify(actual[0])} | First expected: ${JSON.stringify(tc.expected[0])}`
      : "No rows returned.");

  return { id: tc.id, title: tc.title, status: "fail", actual, expected: tc.expected, message, durationMs };
}
