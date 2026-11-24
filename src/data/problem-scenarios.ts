/**
 * problem-scenarios.ts
 *
 * Hand-authored 3D execution scenarios for representative LeetCode SQL 50 problems.
 * Each entry maps a problem ID to a ConceptScenario that drives the Sql3DViewer
 * embedded on /problems/[id] pages.
 *
 * Coverage: 2 problems per category × 7 categories = 14 scenarios.
 * Table schemas and sample rows mirror the official LeetCode test case data.
 */

import { ConceptScenario } from "@/components/sql-3d-engine/concept-scenarios";

export const PROBLEM_SCENARIOS: Record<number, ConceptScenario> = {
  // ─────────────────────────────────────────────────────────────────
  // Category 1: Select
  // ─────────────────────────────────────────────────────────────────

  /** 1757 · Recyclable and Low Fat Products — WHERE with two conditions */
  1757: {
    title: "1757: Recyclable and Low Fat Products — WHERE Filter",
    tables: [
      {
        name: "Products",
        color: "#3b82f6",
        position: [0, 0, -3],
        columns: [
          { name: "product_id", type: "INT", isPrimary: true },
          { name: "low_fats",   type: "VARCHAR" },
          { name: "recyclable", type: "VARCHAR" },
        ],
        rows: [
          { id: "p1", values: { product_id: 0, low_fats: "Y", recyclable: "N" } },
          { id: "p2", values: { product_id: 1, low_fats: "Y", recyclable: "Y" } },
          { id: "p3", values: { product_id: 2, low_fats: "N", recyclable: "Y" } },
          { id: "p4", values: { product_id: 3, low_fats: "Y", recyclable: "Y" } },
        ],
      },
    ],
    outputColumns: [{ name: "product_id", type: "INT" }],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Load Products Table",
        narration: "Products table loaded. We need rows where low_fats = 'Y' AND recyclable = 'Y'. Scanline will evaluate both conditions per row.",
        sqlSnippet: "SELECT product_id FROM Products WHERE low_fats = 'Y' AND recyclable = 'Y'",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "SCAN_ROW",
        title: "2. Row 0: low_fats=Y, recyclable=N → FAIL",
        narration: "low_fats='Y' ✓  but recyclable='N' ✗ — AND requires both TRUE. Row filtered out.",
        activeRowIds: ["p1"], passedCondition: false,
        sqlSnippet: "'Y'='Y' AND 'N'='Y' → FALSE",
        resultRowsSnapshot: [],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. Row 1: low_fats=Y, recyclable=Y → PASS",
        narration: "low_fats='Y' ✓ AND recyclable='Y' ✓ — both conditions satisfied. Row emitted.",
        activeRowIds: ["p2"], passedCondition: true,
        sqlSnippet: "'Y'='Y' AND 'Y'='Y' → TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { product_id: 1 } }],
      },
      {
        id: 3, type: "SCAN_ROW",
        title: "4. Row 2: low_fats=N → FAIL",
        narration: "low_fats='N' ✗ — first condition already false. Short-circuit, row dropped.",
        activeRowIds: ["p3"], passedCondition: false,
        sqlSnippet: "'N'='Y' → FALSE (short-circuit)",
        resultRowsSnapshot: [{ id: "out_1", values: { product_id: 1 } }],
      },
      {
        id: 4, type: "SCAN_ROW",
        title: "5. Row 3: low_fats=Y, recyclable=Y → PASS",
        narration: "Both conditions satisfied. Row emitted to Output Platform.",
        activeRowIds: ["p4"], passedCondition: true,
        sqlSnippet: "'Y'='Y' AND 'Y'='Y' → TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { product_id: 1 } },
          { id: "out_2", values: { product_id: 3 } },
        ],
      },
      {
        id: 5, type: "COMPLETE",
        title: "6. Result: product_id 1 and 3",
        narration: "Scan complete. 2 of 4 products satisfy both WHERE conditions.",
        sqlSnippet: "Result: 2 rows",
        resultRowsSnapshot: [
          { id: "out_1", values: { product_id: 1 } },
          { id: "out_2", values: { product_id: 3 } },
        ],
      },
    ],
  },

  /** 595 · Big Countries — WHERE with OR */
  595: {
    title: "595: Big Countries — WHERE with OR",
    tables: [
      {
        name: "World",
        color: "#0ea5e9",
        position: [0, 0, -3],
        columns: [
          { name: "name",       type: "VARCHAR", isPrimary: true },
          { name: "population", type: "INT" },
          { name: "area",       type: "INT" },
        ],
        rows: [
          { id: "w1", values: { name: "Afghanistan", population: 25500100, area: 652230 } },
          { id: "w2", values: { name: "Albania",     population: 2831741,  area: 28748  } },
          { id: "w3", values: { name: "Algeria",     population: 37100000, area: 2381741 } },
          { id: "w4", values: { name: "Andorra",     population: 78115,    area: 468    } },
          { id: "w5", values: { name: "Angola",      population: 20609294, area: 1246700 } },
        ],
      },
    ],
    outputColumns: [
      { name: "name",       type: "VARCHAR" },
      { name: "population", type: "INT" },
      { name: "area",       type: "INT" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Load World Table",
        narration: "World table loaded. A 'big' country has area ≥ 3,000,000 OR population ≥ 25,000,000. OR means either condition qualifies the row.",
        sqlSnippet: "WHERE area >= 3000000 OR population >= 25000000",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "SCAN_ROW",
        title: "2. Afghanistan: pop 25.5M → PASS",
        narration: "area=652,230 (< 3M) ✗ but population=25,500,100 (≥ 25M) ✓ — OR satisfied. Row emitted.",
        activeRowIds: ["w1"], passedCondition: true,
        sqlSnippet: "652230 >= 3000000 OR 25500100 >= 25000000 → TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { name: "Afghanistan", population: 25500100, area: 652230 } }],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. Albania: neither → FAIL",
        narration: "area=28,748 ✗ AND population=2.8M ✗ — both conditions false. Row dropped.",
        activeRowIds: ["w2"], passedCondition: false,
        sqlSnippet: "28748 >= 3000000 OR 2831741 >= 25000000 → FALSE",
        resultRowsSnapshot: [{ id: "out_1", values: { name: "Afghanistan", population: 25500100, area: 652230 } }],
      },
      {
        id: 3, type: "SCAN_ROW",
        title: "4. Algeria: pop 37M → PASS",
        narration: "population=37,100,000 ≥ 25M ✓. Row emitted.",
        activeRowIds: ["w3"], passedCondition: true,
        sqlSnippet: "2381741 >= 3000000 OR 37100000 >= 25000000 → TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { name: "Afghanistan", population: 25500100, area: 652230 } },
          { id: "out_2", values: { name: "Algeria",     population: 37100000, area: 2381741 } },
        ],
      },
      {
        id: 4, type: "SCAN_ROW",
        title: "5. Andorra: neither → FAIL",
        narration: "Very small country. Both conditions false. Row filtered out.",
        activeRowIds: ["w4"], passedCondition: false,
        sqlSnippet: "468 >= 3000000 OR 78115 >= 25000000 → FALSE",
        resultRowsSnapshot: [
          { id: "out_1", values: { name: "Afghanistan", population: 25500100, area: 652230 } },
          { id: "out_2", values: { name: "Algeria",     population: 37100000, area: 2381741 } },
        ],
      },
      {
        id: 5, type: "COMPLETE",
        title: "6. Result: 2 big countries",
        narration: "Scan complete. Afghanistan and Algeria qualify. Angola would also pass in a full dataset (area > 1M).",
        sqlSnippet: "Result: 2 rows",
        resultRowsSnapshot: [
          { id: "out_1", values: { name: "Afghanistan", population: 25500100, area: 652230 } },
          { id: "out_2", values: { name: "Algeria",     population: 37100000, area: 2381741 } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 2: Basic Joins
  // ─────────────────────────────────────────────────────────────────

  /** 1378 · Replace Employee ID — LEFT JOIN */
  1378: {
    title: "1378: Replace Employee ID With Unique ID — LEFT JOIN",
    tables: [
      {
        name: "Employees",
        alias: "e",
        color: "#3b82f6",
        position: [-8, 0, -3],
        columns: [
          { name: "id",   type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR" },
        ],
        rows: [
          { id: "e1", values: { id: 1, name: "Alice" } },
          { id: "e2", values: { id: 7, name: "Bob" } },
          { id: "e3", values: { id: 11, name: "Meir" } },
          { id: "e4", values: { id: 90, name: "Winston" } },
        ],
      },
      {
        name: "EmployeeUNI",
        alias: "eu",
        color: "#10b981",
        position: [8, 0, -3],
        columns: [
          { name: "id",        type: "INT", isPrimary: true },
          { name: "unique_id", type: "INT" },
        ],
        rows: [
          { id: "eu1", values: { id: 11, unique_id: 2 } },
          { id: "eu2", values: { id: 90, unique_id: 3 } },
        ],
      },
    ],
    outputColumns: [
      { name: "unique_id", type: "INT" },
      { name: "name",      type: "VARCHAR" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Set Up LEFT JOIN",
        narration: "LEFT JOIN keeps every row from Employees (left). If no matching EmployeeUNI row, unique_id fills with NULL. No employee is ever dropped.",
        sqlSnippet: "FROM Employees e LEFT JOIN EmployeeUNI eu ON e.id = eu.id",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "SCAN_ROW",
        title: "2. Alice (id=1): no match in EU → NULL",
        narration: "id=1 not in EmployeeUNI. LEFT JOIN preserves the row with NULL for unique_id.",
        activeRowIds: ["e1"], passedCondition: false,
        sqlSnippet: "1 = 11? NO · 1 = 90? NO → NULL",
        resultRowsSnapshot: [{ id: "out_1", values: { unique_id: null, name: "Alice" } }],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. Bob (id=7): no match → NULL",
        narration: "id=7 not in EmployeeUNI. Preserved with NULL.",
        activeRowIds: ["e2"], passedCondition: false,
        sqlSnippet: "7 not found → NULL",
        resultRowsSnapshot: [
          { id: "out_1", values: { unique_id: null, name: "Alice" } },
          { id: "out_2", values: { unique_id: null, name: "Bob"   } },
        ],
      },
      {
        id: 3, type: "JOIN_MATCH",
        title: "4. Meir (id=11): match! unique_id=2",
        narration: "e.id=11 matches eu.id=11. unique_id=2 is attached. Arc drawn between the matching blocks.",
        matchedRowPair: ["e3", "eu1"], passedCondition: true,
        sqlSnippet: "11 = 11 → TRUE, unique_id = 2",
        resultRowsSnapshot: [
          { id: "out_1", values: { unique_id: null, name: "Alice" } },
          { id: "out_2", values: { unique_id: null, name: "Bob"   } },
          { id: "out_3", values: { unique_id: 2,    name: "Meir"  } },
        ],
      },
      {
        id: 4, type: "JOIN_MATCH",
        title: "5. Winston (id=90): match! unique_id=3",
        narration: "e.id=90 matches eu.id=90. unique_id=3 attached.",
        matchedRowPair: ["e4", "eu2"], passedCondition: true,
        sqlSnippet: "90 = 90 → TRUE, unique_id = 3",
        resultRowsSnapshot: [
          { id: "out_1", values: { unique_id: null, name: "Alice"   } },
          { id: "out_2", values: { unique_id: null, name: "Bob"     } },
          { id: "out_3", values: { unique_id: 2,    name: "Meir"    } },
          { id: "out_4", values: { unique_id: 3,    name: "Winston" } },
        ],
      },
      {
        id: 5, type: "COMPLETE",
        title: "6. All 4 employees preserved",
        narration: "LEFT JOIN guarantees all employees appear. Unmatched rows get NULL unique_id.",
        sqlSnippet: "Result: 4 rows (2 with NULL unique_id)",
        resultRowsSnapshot: [
          { id: "out_1", values: { unique_id: null, name: "Alice"   } },
          { id: "out_2", values: { unique_id: null, name: "Bob"     } },
          { id: "out_3", values: { unique_id: 2,    name: "Meir"    } },
          { id: "out_4", values: { unique_id: 3,    name: "Winston" } },
        ],
      },
    ],
  },

  /** 1068 · Product Sales Analysis I — INNER JOIN */
  1068: {
    title: "1068: Product Sales Analysis I — INNER JOIN",
    tables: [
      {
        name: "Sales",
        alias: "s",
        color: "#06b6d4",
        position: [-8, 0, -3],
        columns: [
          { name: "sale_id",    type: "INT", isPrimary: true },
          { name: "product_id", type: "INT", isForeign: true },
          { name: "year",       type: "INT" },
          { name: "price",      type: "INT" },
        ],
        rows: [
          { id: "s1", values: { sale_id: 1, product_id: 100, year: 2008, price: 10 } },
          { id: "s2", values: { sale_id: 2, product_id: 100, year: 2009, price: 12 } },
          { id: "s3", values: { sale_id: 7, product_id: 200, year: 2011, price: 20 } },
        ],
      },
      {
        name: "Product",
        alias: "p",
        color: "#8b5cf6",
        position: [8, 0, -3],
        columns: [
          { name: "product_id",   type: "INT", isPrimary: true },
          { name: "product_name", type: "VARCHAR" },
        ],
        rows: [
          { id: "p1", values: { product_id: 100, product_name: "Nokia"  } },
          { id: "p2", values: { product_id: 200, product_name: "Apple"  } },
          { id: "p3", values: { product_id: 300, product_name: "Samsung"} },
        ],
      },
    ],
    outputColumns: [
      { name: "product_name", type: "VARCHAR" },
      { name: "year",         type: "INT"     },
      { name: "price",        type: "INT"     },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Set Up INNER JOIN",
        narration: "INNER JOIN returns only rows where Sales.product_id = Product.product_id. Unmatched rows on either side are dropped. Samsung (300) has no sales and will not appear.",
        sqlSnippet: "FROM Sales s JOIN Product p ON s.product_id = p.product_id",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "JOIN_MATCH",
        title: "2. Sale 1 (product 100) → Nokia",
        narration: "s.product_id=100 matches p.product_id=100 (Nokia). Arc drawn, result row emitted.",
        matchedRowPair: ["s1", "p1"], passedCondition: true,
        sqlSnippet: "100 = 100 → TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { product_name: "Nokia", year: 2008, price: 10 } }],
      },
      {
        id: 2, type: "JOIN_MATCH",
        title: "3. Sale 2 (product 100 again) → Nokia",
        narration: "Same product, different year. Each sale row creates a separate output row.",
        matchedRowPair: ["s2", "p1"], passedCondition: true,
        sqlSnippet: "100 = 100 → TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { product_name: "Nokia", year: 2008, price: 10 } },
          { id: "out_2", values: { product_name: "Nokia", year: 2009, price: 12 } },
        ],
      },
      {
        id: 3, type: "JOIN_MATCH",
        title: "4. Sale 7 (product 200) → Apple",
        narration: "s.product_id=200 matches p.product_id=200 (Apple).",
        matchedRowPair: ["s3", "p2"], passedCondition: true,
        sqlSnippet: "200 = 200 → TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { product_name: "Nokia", year: 2008, price: 10 } },
          { id: "out_2", values: { product_name: "Nokia", year: 2009, price: 12 } },
          { id: "out_3", values: { product_name: "Apple", year: 2011, price: 20 } },
        ],
      },
      {
        id: 4, type: "COMPLETE",
        title: "5. Result: 3 rows (Samsung excluded)",
        narration: "INNER JOIN produced 3 sales enriched with product names. Samsung has no matching sales row so it is excluded.",
        sqlSnippet: "Result: 3 rows",
        resultRowsSnapshot: [
          { id: "out_1", values: { product_name: "Nokia", year: 2008, price: 10 } },
          { id: "out_2", values: { product_name: "Nokia", year: 2009, price: 12 } },
          { id: "out_3", values: { product_name: "Apple", year: 2011, price: 20 } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 3: Basic Aggregate Functions
  // ─────────────────────────────────────────────────────────────────

  /** 620 · Not Boring Movies — WHERE filter + ORDER BY */
  620: {
    title: "620: Not Boring Movies — WHERE + ORDER BY",
    tables: [
      {
        name: "Cinema",
        color: "#f59e0b",
        position: [0, 0, -3],
        columns: [
          { name: "id",          type: "INT",     isPrimary: true },
          { name: "movie",       type: "VARCHAR" },
          { name: "description", type: "VARCHAR" },
          { name: "rating",      type: "DECIMAL" },
        ],
        rows: [
          { id: "c1", values: { id: 1, movie: "War",    description: "great 3D", rating: 8.9 } },
          { id: "c2", values: { id: 2, movie: "Science", description: "boring",   rating: 8.5 } },
          { id: "c3", values: { id: 3, movie: "Irish",  description: "boring",   rating: 6.2 } },
          { id: "c4", values: { id: 4, movie: "Ice",    description: "good",     rating: 9.1 } },
          { id: "c5", values: { id: 5, movie: "House",  description: "fun",      rating: 7.4 } },
        ],
      },
    ],
    outputColumns: [
      { name: "id",     type: "INT"     },
      { name: "movie",  type: "VARCHAR" },
      { name: "rating", type: "DECIMAL" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Load Cinema Table",
        narration: "Filter: odd id (id % 2 = 1) AND description ≠ 'boring'. Then sort by rating DESC.",
        sqlSnippet: "WHERE id % 2 = 1 AND description <> 'boring' ORDER BY rating DESC",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "SCAN_ROW",
        title: "2. id=1 (War): odd ✓, not boring ✓ → PASS",
        narration: "1 % 2 = 1 ✓ AND 'great 3D' ≠ 'boring' ✓. Qualifies.",
        activeRowIds: ["c1"], passedCondition: true,
        sqlSnippet: "1%2=1 AND 'great 3D'<>'boring' → TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { id: 1, movie: "War", rating: 8.9 } }],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. id=2 (Science): even → FAIL",
        narration: "2 % 2 = 0 ✗. Even id. Dropped immediately.",
        activeRowIds: ["c2"], passedCondition: false,
        sqlSnippet: "2%2=0 → FALSE",
        resultRowsSnapshot: [{ id: "out_1", values: { id: 1, movie: "War", rating: 8.9 } }],
      },
      {
        id: 3, type: "SCAN_ROW",
        title: "4. id=3 (Irish): odd ✓, boring ✗ → FAIL",
        narration: "3 % 2 = 1 ✓ but description='boring' ✗. AND fails.",
        activeRowIds: ["c3"], passedCondition: false,
        sqlSnippet: "3%2=1 AND 'boring'<>'boring' → FALSE",
        resultRowsSnapshot: [{ id: "out_1", values: { id: 1, movie: "War", rating: 8.9 } }],
      },
      {
        id: 4, type: "SCAN_ROW",
        title: "5. id=4 (Ice): even → FAIL",
        narration: "4 % 2 = 0 ✗. Filtered out.",
        activeRowIds: ["c4"], passedCondition: false,
        sqlSnippet: "4%2=0 → FALSE",
        resultRowsSnapshot: [{ id: "out_1", values: { id: 1, movie: "War", rating: 8.9 } }],
      },
      {
        id: 5, type: "SCAN_ROW",
        title: "6. id=5 (House): odd ✓, 'fun' ✓ → PASS",
        narration: "5 % 2 = 1 ✓ AND 'fun' ≠ 'boring' ✓. Qualifies. Rating=7.4.",
        activeRowIds: ["c5"], passedCondition: true,
        sqlSnippet: "5%2=1 AND 'fun'<>'boring' → TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { id: 1, movie: "War",   rating: 8.9 } },
          { id: "out_2", values: { id: 5, movie: "House", rating: 7.4 } },
        ],
      },
      {
        id: 6, type: "COMPLETE",
        title: "7. Sort by rating DESC → War, House",
        narration: "ORDER BY rating DESC: War (8.9) first, House (7.4) second.",
        sqlSnippet: "ORDER BY rating DESC → 8.9, 7.4",
        resultRowsSnapshot: [
          { id: "out_1", values: { id: 1, movie: "War",   rating: 8.9 } },
          { id: "out_2", values: { id: 5, movie: "House", rating: 7.4 } },
        ],
      },
    ],
  },

  /** 2356 · Subjects per Teacher — GROUP BY + COUNT DISTINCT */
  2356: {
    title: "2356: Unique Subjects per Teacher — GROUP BY + COUNT(DISTINCT)",
    tables: [
      {
        name: "Teacher",
        color: "#10b981",
        position: [0, 0, -3],
        columns: [
          { name: "teacher_id", type: "INT" },
          { name: "subject_id", type: "INT" },
          { name: "dept_id",    type: "INT" },
        ],
        rows: [
          { id: "t1", values: { teacher_id: 1, subject_id: 2, dept_id: 3 } },
          { id: "t2", values: { teacher_id: 1, subject_id: 2, dept_id: 4 } },
          { id: "t3", values: { teacher_id: 1, subject_id: 3, dept_id: 3 } },
          { id: "t4", values: { teacher_id: 2, subject_id: 1, dept_id: 1 } },
          { id: "t5", values: { teacher_id: 2, subject_id: 2, dept_id: 1 } },
          { id: "t6", values: { teacher_id: 2, subject_id: 3, dept_id: 1 } },
        ],
      },
    ],
    outputColumns: [
      { name: "teacher_id", type: "INT" },
      { name: "cnt",        type: "INT" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Load Teacher Table",
        narration: "GROUP BY teacher_id, then COUNT(DISTINCT subject_id). Teacher 1 teaches subject 2 in two departments — DISTINCT ensures it counts once.",
        sqlSnippet: "SELECT teacher_id, COUNT(DISTINCT subject_id) AS cnt FROM Teacher GROUP BY teacher_id",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "GROUP_ROW",
        title: "2. Group rows for teacher_id = 1",
        narration: "Rows t1, t2, t3 belong to teacher 1. Subject 2 appears twice (different depts) — DISTINCT collapses it to one. Subjects: {2, 3} → cnt = 2.",
        activeRowIds: ["t1", "t2", "t3"], passedCondition: true,
        sqlSnippet: "teacher_id=1: subject_ids = {2, 2, 3} → DISTINCT {2,3} → 2",
        resultRowsSnapshot: [{ id: "out_1", values: { teacher_id: 1, cnt: 2 } }],
      },
      {
        id: 2, type: "GROUP_ROW",
        title: "3. Group rows for teacher_id = 2",
        narration: "Rows t4, t5, t6 belong to teacher 2. Subjects 1, 2, 3 — all distinct. cnt = 3.",
        activeRowIds: ["t4", "t5", "t6"], passedCondition: true,
        sqlSnippet: "teacher_id=2: subject_ids = {1,2,3} → DISTINCT {1,2,3} → 3",
        resultRowsSnapshot: [
          { id: "out_1", values: { teacher_id: 1, cnt: 2 } },
          { id: "out_2", values: { teacher_id: 2, cnt: 3 } },
        ],
      },
      {
        id: 3, type: "COMPLETE",
        title: "4. Result: 2 aggregated rows",
        narration: "GROUP BY collapsed 6 rows to 2 summary rows. DISTINCT prevented double-counting same subject across departments.",
        sqlSnippet: "Result: 2 rows",
        resultRowsSnapshot: [
          { id: "out_1", values: { teacher_id: 1, cnt: 2 } },
          { id: "out_2", values: { teacher_id: 2, cnt: 3 } },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 4: Sorting and Grouping
  // ─────────────────────────────────────────────────────────────────

  /** 1141 · User Activity for the Past 30 Days — GROUP BY date */
  1141: {
    title: "1141: User Activity Past 30 Days — GROUP BY + COUNT DISTINCT",
    tables: [
      {
        name: "Activity",
        color: "#f97316",
        position: [0, 0, -3],
        columns: [
          { name: "user_id",       type: "INT" },
          { name: "session_id",    type: "INT" },
          { name: "activity_date", type: "DATE" },
          { name: "activity_type", type: "VARCHAR" },
        ],
        rows: [
          { id: "a1", values: { user_id: 1, session_id: 1, activity_date: "2019-07-20", activity_type: "open_session"  } },
          { id: "a2", values: { user_id: 1, session_id: 1, activity_date: "2019-07-20", activity_type: "scroll_down"   } },
          { id: "a3", values: { user_id: 2, session_id: 4, activity_date: "2019-07-20", activity_type: "open_session"  } },
          { id: "a4", values: { user_id: 3, session_id: 2, activity_date: "2019-07-21", activity_type: "send_message"  } },
          { id: "a5", values: { user_id: 1, session_id: 1, activity_date: "2019-07-21", activity_type: "close_session" } },
        ],
      },
    ],
    outputColumns: [
      { name: "day",          type: "DATE" },
      { name: "active_users", type: "INT"  },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Load Activity Table",
        narration: "Filter to 30-day window (Jun 28 – Jul 27 2019), then GROUP BY date and COUNT(DISTINCT user_id) per day.",
        sqlSnippet: "WHERE activity_date BETWEEN '2019-06-28' AND '2019-07-27' GROUP BY activity_date",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "GROUP_ROW",
        title: "2. Group: 2019-07-20 → users {1, 2}",
        narration: "Three rows fall on 2019-07-20 — users 1 and 2. DISTINCT collapses user 1's two rows into one. active_users = 2.",
        activeRowIds: ["a1", "a2", "a3"], passedCondition: true,
        sqlSnippet: "2019-07-20: users {1,1,2} → DISTINCT → 2",
        resultRowsSnapshot: [{ id: "out_1", values: { day: "2019-07-20", active_users: 2 } }],
      },
      {
        id: 2, type: "GROUP_ROW",
        title: "3. Group: 2019-07-21 → users {3, 1}",
        narration: "Two rows on 2019-07-21 — users 3 and 1. Both distinct. active_users = 2.",
        activeRowIds: ["a4", "a5"], passedCondition: true,
        sqlSnippet: "2019-07-21: users {3,1} → DISTINCT → 2",
        resultRowsSnapshot: [
          { id: "out_1", values: { day: "2019-07-20", active_users: 2 } },
          { id: "out_2", values: { day: "2019-07-21", active_users: 2 } },
        ],
      },
      {
        id: 3, type: "COMPLETE",
        title: "4. Result: 2 days",
        narration: "GROUP BY activity_date with COUNT(DISTINCT user_id) gives daily unique active users.",
        sqlSnippet: "Result: 2 rows",
        resultRowsSnapshot: [
          { id: "out_1", values: { day: "2019-07-20", active_users: 2 } },
          { id: "out_2", values: { day: "2019-07-21", active_users: 2 } },
        ],
      },
    ],
  },

  /** 619 · Biggest Single Number — MAX with subquery / NULL handling */
  619: {
    title: "619: Biggest Single Number — GROUP BY + HAVING + MAX",
    tables: [
      {
        name: "MyNumbers",
        color: "#6366f1",
        position: [0, 0, -3],
        columns: [
          { name: "num", type: "INT" },
        ],
        rows: [
          { id: "n1", values: { num: 8 } },
          { id: "n2", values: { num: 8 } },
          { id: "n3", values: { num: 3 } },
          { id: "n4", values: { num: 3 } },
          { id: "n5", values: { num: 1 } },
          { id: "n6", values: { num: 4 } },
          { id: "n7", values: { num: 5 } },
          { id: "n8", values: { num: 6 } },
        ],
      },
    ],
    outputColumns: [{ name: "num", type: "INT" }],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Find Numbers Appearing Exactly Once",
        narration: "GROUP BY num, use HAVING COUNT(num) = 1 to keep only singletons, then take MAX of those.",
        sqlSnippet: "SELECT MAX(num) FROM MyNumbers GROUP BY num HAVING COUNT(num)=1",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "GROUP_ROW",
        title: "2. num=8 appears 2× → filtered by HAVING",
        narration: "8 appears twice. HAVING COUNT(num) = 1 fails. 8 is excluded from singleton candidates.",
        activeRowIds: ["n1", "n2"], passedCondition: false,
        sqlSnippet: "COUNT(8)=2 → HAVING 2=1 FALSE",
        resultRowsSnapshot: [],
      },
      {
        id: 2, type: "GROUP_ROW",
        title: "3. num=3 appears 2× → filtered",
        narration: "3 appears twice. Excluded.",
        activeRowIds: ["n3", "n4"], passedCondition: false,
        sqlSnippet: "COUNT(3)=2 → FALSE",
        resultRowsSnapshot: [],
      },
      {
        id: 3, type: "GROUP_ROW",
        title: "4. num=1,4,5,6 each appear once → kept",
        narration: "1, 4, 5, 6 each appear exactly once. All pass HAVING. Singleton set = {1, 4, 5, 6}.",
        activeRowIds: ["n5", "n6", "n7", "n8"], passedCondition: true,
        sqlSnippet: "COUNT(*)=1 for each → HAVING TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { num: 6 } }],
      },
      {
        id: 4, type: "COMPLETE",
        title: "5. MAX(singletons) = 6",
        narration: "Outer MAX over {1,4,5,6} = 6. If no singletons existed MAX would return NULL.",
        sqlSnippet: "MAX(1,4,5,6) = 6",
        resultRowsSnapshot: [{ id: "out_1", values: { num: 6 } }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 5: Advanced Select and Joins
  // ─────────────────────────────────────────────────────────────────

  /** 180 · Consecutive Numbers — Self Join × 3 */
  180: {
    title: "180: Consecutive Numbers — Triple Self Join",
    tables: [
      {
        name: "Logs",
        alias: "l1",
        color: "#3b82f6",
        position: [-10, 0, -3],
        columns: [
          { name: "id",  type: "INT", isPrimary: true },
          { name: "num", type: "INT" },
        ],
        rows: [
          { id: "l1_r1", values: { id: 1, num: 1 } },
          { id: "l1_r2", values: { id: 2, num: 1 } },
          { id: "l1_r3", values: { id: 3, num: 1 } },
          { id: "l1_r4", values: { id: 4, num: 2 } },
        ],
      },
      {
        name: "Logs",
        alias: "l2 (id+1)",
        color: "#8b5cf6",
        position: [0, 0, -3],
        columns: [
          { name: "id",  type: "INT", isPrimary: true },
          { name: "num", type: "INT" },
        ],
        rows: [
          { id: "l2_r1", values: { id: 1, num: 1 } },
          { id: "l2_r2", values: { id: 2, num: 1 } },
          { id: "l2_r3", values: { id: 3, num: 1 } },
          { id: "l2_r4", values: { id: 4, num: 2 } },
        ],
      },
      {
        name: "Logs",
        alias: "l3 (id+2)",
        color: "#10b981",
        position: [10, 0, -3],
        columns: [
          { name: "id",  type: "INT", isPrimary: true },
          { name: "num", type: "INT" },
        ],
        rows: [
          { id: "l3_r1", values: { id: 1, num: 1 } },
          { id: "l3_r2", values: { id: 2, num: 1 } },
          { id: "l3_r3", values: { id: 3, num: 1 } },
          { id: "l3_r4", values: { id: 4, num: 2 } },
        ],
      },
    ],
    outputColumns: [{ name: "ConsecutiveNums", type: "INT" }],
    outputPosition: [0, 0, 9],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Triple Self Join on Consecutive IDs",
        narration: "Join Logs to itself twice: l2.id = l1.id+1, l3.id = l1.id+2. Then match that l1.num = l2.num = l3.num. This finds any number appearing in 3 consecutive rows.",
        sqlSnippet: "JOIN Logs l2 ON l2.id=l1.id+1 AND l2.num=l1.num JOIN Logs l3 ON l3.id=l1.id+2 AND l3.num=l1.num",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "JOIN_MATCH",
        title: "2. l1.id=1 (num=1) + l2.id=2 (num=1) + l3.id=3 (num=1) → MATCH",
        narration: "ids 1,2,3 are consecutive. All three have num=1. Triple match found — 1 is a consecutive number.",
        matchedRowPair: ["l1_r1", "l2_r2"], passedCondition: true,
        sqlSnippet: "1→2→3: num=1=1=1 → TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { ConsecutiveNums: 1 } }],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. l1.id=2 → l2.id=3 (num=1) → l3.id=4 (num=2) → FAIL",
        narration: "ids 2,3,4 are consecutive but l3.num=2 ≠ l1.num=1. No match for this starting id.",
        activeRowIds: ["l1_r2", "l2_r3", "l3_r4"], passedCondition: false,
        sqlSnippet: "1,1,2 — not all equal → FALSE",
        resultRowsSnapshot: [{ id: "out_1", values: { ConsecutiveNums: 1 } }],
      },
      {
        id: 3, type: "COMPLETE",
        title: "4. DISTINCT result: ConsecutiveNums = 1",
        narration: "DISTINCT ensures we return 1 once even though the triple join matched it at id=1 and id=2 (both would yield num=1).",
        sqlSnippet: "DISTINCT → result: 1",
        resultRowsSnapshot: [{ id: "out_1", values: { ConsecutiveNums: 1 } }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 6: Subqueries
  // ─────────────────────────────────────────────────────────────────

  /** 1978 · Employees Whose Manager Left — NOT IN subquery */
  1978: {
    title: "1978: Employees Whose Manager Left — Subquery + NOT IN",
    tables: [
      {
        name: "Employees",
        color: "#3b82f6",
        position: [0, 0, -3],
        columns: [
          { name: "employee_id", type: "INT", isPrimary: true },
          { name: "name",        type: "VARCHAR" },
          { name: "manager_id",  type: "INT", isForeign: true },
          { name: "salary",      type: "INT" },
        ],
        rows: [
          { id: "em1", values: { employee_id: 3,  name: "Mila",   manager_id: 9,  salary: 60651 } },
          { id: "em2", values: { employee_id: 12, name: "Annyk",  manager_id: 9,  salary: 55008 } },
          { id: "em3", values: { employee_id: 13, name: "Khali",  manager_id: 11, salary: 45555 } },
          { id: "em4", values: { employee_id: 1,  name: "Kalel",  manager_id: null, salary: 110000 } },
          { id: "em5", values: { employee_id: 9,  name: "Micha",  manager_id: null, salary: 92000 } },
          { id: "em6", values: { employee_id: 11, name: "Jozua",  manager_id: 6,  salary: 29400 } },
        ],
      },
    ],
    outputColumns: [{ name: "employee_id", type: "INT" }],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Find Employees Whose Manager Left",
        narration: "An employee's manager 'left' if manager_id IS NOT NULL but that manager_id does not appear as any employee_id in the table. Find them using NOT IN subquery.",
        sqlSnippet: "WHERE salary < 30000 AND manager_id IS NOT NULL AND manager_id NOT IN (SELECT employee_id FROM Employees)",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "SCAN_ROW",
        title: "2. Mila: salary=60651 ≥ 30000 → SKIP",
        narration: "Salary condition fails first. Mila is not checked further.",
        activeRowIds: ["em1"], passedCondition: false,
        sqlSnippet: "60651 < 30000 → FALSE",
        resultRowsSnapshot: [],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. Annyk: salary=55008 ≥ 30000 → SKIP",
        narration: "Same — salary too high.",
        activeRowIds: ["em2"], passedCondition: false,
        sqlSnippet: "55008 < 30000 → FALSE",
        resultRowsSnapshot: [],
      },
      {
        id: 3, type: "SCAN_ROW",
        title: "4. Khali: salary=45555 ≥ 30000 → SKIP",
        narration: "Salary too high.",
        activeRowIds: ["em3"], passedCondition: false,
        sqlSnippet: "45555 < 30000 → FALSE",
        resultRowsSnapshot: [],
      },
      {
        id: 4, type: "SCAN_ROW",
        title: "5. Jozua: salary=29400 < 30k ✓, manager_id=6 ✓",
        narration: "Jozua passes salary < 30000. manager_id=6 IS NOT NULL ✓. Now check: does id=6 exist in Employees? The table has ids {1,3,9,11,12,13} — 6 is NOT there. Manager left!",
        activeRowIds: ["em6"], passedCondition: true,
        sqlSnippet: "29400<30000 AND 6 NOT IN {1,3,9,11,12,13} → TRUE",
        resultRowsSnapshot: [{ id: "out_1", values: { employee_id: 11 } }],
      },
      {
        id: 5, type: "COMPLETE",
        title: "6. Result: employee_id = 11 (Jozua)",
        narration: "Only Jozua qualifies: low salary AND his manager (id 6) no longer works at the company.",
        sqlSnippet: "Result: 1 row",
        resultRowsSnapshot: [{ id: "out_1", values: { employee_id: 11 } }],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 7: Advanced String Functions / Regex / Clause
  // ─────────────────────────────────────────────────────────────────

  /** 1667 · Fix Names — UPPER + LOWER string functions */
  1667: {
    title: "1667: Fix Names in a Table — String Functions",
    tables: [
      {
        name: "Users",
        color: "#ec4899",
        position: [0, 0, -3],
        columns: [
          { name: "user_id", type: "INT",     isPrimary: true },
          { name: "name",    type: "VARCHAR" },
        ],
        rows: [
          { id: "u1", values: { user_id: 1, name: "aLice"  } },
          { id: "u2", values: { user_id: 2, name: "bOB"    } },
          { id: "u3", values: { user_id: 3, name: "CHARLIE"} },
          { id: "u4", values: { user_id: 4, name: "dave"   } },
        ],
      },
    ],
    outputColumns: [
      { name: "user_id", type: "INT"     },
      { name: "name",    type: "VARCHAR" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0, type: "CREATE_TABLE",
        title: "1. Load Users Table",
        narration: "Names are inconsistently cased. We apply UPPER(LEFT(name,1)) || LOWER(SUBSTRING(name FROM 2)) to each row to produce Title Case.",
        sqlSnippet: "UPPER(LEFT(name,1)) || LOWER(SUBSTRING(name FROM 2))",
        resultRowsSnapshot: [],
      },
      {
        id: 1, type: "SCAN_ROW",
        title: "2. 'aLice' → 'Alice'",
        narration: "LEFT('aLice',1)='a' → UPPER → 'A'. SUBSTRING from 2='Lice' → LOWER → 'lice'. Concat: 'Alice'.",
        activeRowIds: ["u1"], passedCondition: true,
        sqlSnippet: "UPPER('a') || LOWER('Lice') = 'Alice'",
        resultRowsSnapshot: [{ id: "out_1", values: { user_id: 1, name: "Alice" } }],
      },
      {
        id: 2, type: "SCAN_ROW",
        title: "3. 'bOB' → 'Bob'",
        narration: "'b' → 'B', 'OB' → 'ob'. Result: 'Bob'.",
        activeRowIds: ["u2"], passedCondition: true,
        sqlSnippet: "UPPER('b') || LOWER('OB') = 'Bob'",
        resultRowsSnapshot: [
          { id: "out_1", values: { user_id: 1, name: "Alice" } },
          { id: "out_2", values: { user_id: 2, name: "Bob"   } },
        ],
      },
      {
        id: 3, type: "SCAN_ROW",
        title: "4. 'CHARLIE' → 'Charlie'",
        narration: "'C' stays 'C', 'HARLIE' → 'harlie'. Result: 'Charlie'.",
        activeRowIds: ["u3"], passedCondition: true,
        sqlSnippet: "UPPER('C') || LOWER('HARLIE') = 'Charlie'",
        resultRowsSnapshot: [
          { id: "out_1", values: { user_id: 1, name: "Alice"   } },
          { id: "out_2", values: { user_id: 2, name: "Bob"     } },
          { id: "out_3", values: { user_id: 3, name: "Charlie" } },
        ],
      },
      {
        id: 4, type: "SCAN_ROW",
        title: "5. 'dave' → 'Dave'",
        narration: "'d' → 'D', 'ave' stays 'ave'. Result: 'Dave'.",
        activeRowIds: ["u4"], passedCondition: true,
        sqlSnippet: "UPPER('d') || LOWER('ave') = 'Dave'",
        resultRowsSnapshot: [
          { id: "out_1", values: { user_id: 1, name: "Alice"   } },
          { id: "out_2", values: { user_id: 2, name: "Bob"     } },
          { id: "out_3", values: { user_id: 3, name: "Charlie" } },
          { id: "out_4", values: { user_id: 4, name: "Dave"    } },
        ],
      },
      {
        id: 5, type: "COMPLETE",
        title: "6. All 4 names fixed, ordered by user_id",
        narration: "String manipulation applied to every row. ORDER BY user_id returns them in ascending order.",
        sqlSnippet: "Result: 4 rows, properly Title-Cased",
        resultRowsSnapshot: [
          { id: "out_1", values: { user_id: 1, name: "Alice"   } },
          { id: "out_2", values: { user_id: 2, name: "Bob"     } },
          { id: "out_3", values: { user_id: 3, name: "Charlie" } },
          { id: "out_4", values: { user_id: 4, name: "Dave"    } },
        ],
      },
    ],
  },
};
