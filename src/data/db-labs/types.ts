/**
 * A practice database for one problem. `seed` is a self-contained PostgreSQL
 * script that creates the tables and fills them with thousands of rows
 * (generated with generate_series, so the file stays small).
 */
export interface DbLab {
  /** LeetCode problem id (matches problems.json). */
  id: number;
  /** Short description of the situation the data simulates. */
  issue: string;
  /** DDL + INSERT ... SELECT generate_series(...) statements. */
  seed: string;
}
