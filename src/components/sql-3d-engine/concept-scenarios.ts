import { TableSchema, ExecutionStep } from "./types";

export interface ConceptScenario {
  title: string;
  tables: TableSchema[];
  steps: ExecutionStep[];
}

/**
 * Registry of concept-specific 3D execution scenarios
 */
export const CONCEPT_SCENARIOS: Record<string, ConceptScenario> = {
  "self-join": {
    title: "3D Visual Simulation: Self Join (Workers & Managers)",
    tables: [
      {
        name: "Employees",
        alias: "e1 (Worker)",
        color: "#3b82f6",
        position: [-8, 0, 0],
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR" },
          { name: "manager_id", type: "INT", isForeign: true },
        ],
        rows: [
          { id: "e1_r1", values: { id: 1, name: "Alice", manager_id: 3 } },
          { id: "e1_r2", values: { id: 2, name: "Bob", manager_id: 3 } },
          { id: "e1_r3", values: { id: 3, name: "Charlie", manager_id: null } },
        ],
      },
      {
        name: "Employees",
        alias: "e2 (Manager)",
        color: "#8b5cf6",
        position: [8, 0, 0],
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR" },
          { name: "manager_id", type: "INT" },
        ],
        rows: [
          { id: "e2_r1", values: { id: 1, name: "Alice", manager_id: 3 } },
          { id: "e2_r2", values: { id: 2, name: "Bob", manager_id: 3 } },
          { id: "e2_r3", values: { id: 3, name: "Charlie", manager_id: null } },
        ],
      },
    ],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Instantiate Aliases in 3D Space",
        narration:
          "A Self Join queries the same table twice. We spawn two 3D representations of 'Employees': 'e1' as the worker perspective and 'e2' as the manager perspective.",
        sqlSnippet: "FROM Employees e1 JOIN Employees e2",
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Scan Row 1 (Alice) in e1",
        narration:
          "Evaluating Alice (id: 1, manager_id: 3). We search e2 for a row where e2.id = 3.",
        activeTable: "e1",
        activeRowIds: ["e1_r1"],
        sqlSnippet: "ON e1.manager_id = e2.id",
      },
      {
        id: 2,
        type: "JOIN_MATCH",
        title: "3. Match Found: Alice -> Charlie",
        narration:
          "Match found! Alice's manager_id (3) matches Charlie's id (3) in e2. A 3D relation arc connects the two records.",
        matchedRowPair: ["e1_r1", "e2_r3"],
        passedCondition: true,
        sqlSnippet: "e1.manager_id (3) = e2.id (3) -> TRUE",
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Scan Row 2 (Bob) in e1",
        narration:
          "Evaluating Bob (id: 2, manager_id: 3). We search e2 for a row where e2.id = 3.",
        activeTable: "e1",
        activeRowIds: ["e1_r2"],
        sqlSnippet: "ON e1.manager_id = e2.id",
      },
      {
        id: 4,
        type: "JOIN_MATCH",
        title: "5. Match Found: Bob -> Charlie",
        narration:
          "Match found! Bob's manager_id (3) matches Charlie's id (3) in e2. Another join relation is formed.",
        matchedRowPair: ["e1_r2", "e2_r3"],
        passedCondition: true,
        sqlSnippet: "e1.manager_id (3) = e2.id (3) -> TRUE",
      },
      {
        id: 5,
        type: "SCAN_ROW",
        title: "6. Scan Row 3 (Charlie) in e1",
        narration:
          "Evaluating Charlie (id: 3, manager_id: NULL). NULL cannot match any ID in e2.",
        activeTable: "e1",
        activeRowIds: ["e1_r3"],
        passedCondition: false,
        sqlSnippet: "e1.manager_id (NULL) = e2.id -> FALSE",
      },
      {
        id: 6,
        type: "COMPLETE",
        title: "7. Self Join Result Set Formed",
        narration:
          "Execution complete. The Self Join successfully paired workers with their corresponding managers in 3D.",
        sqlSnippet: "SELECT e1.name AS employee, e2.name AS manager",
      },
    ],
  },
  "inner-join": {
    title: "3D Visual Simulation: INNER JOIN",
    tables: [
      {
        name: "Orders",
        color: "#3b82f6",
        position: [-8, 0, 0],
        columns: [
          { name: "order_id", type: "INT", isPrimary: true },
          { name: "customer_id", type: "INT", isForeign: true },
          { name: "amount", type: "DECIMAL" },
        ],
        rows: [
          { id: "o_1", values: { order_id: 101, customer_id: 1, amount: 250 } },
          { id: "o_2", values: { order_id: 102, customer_id: 2, amount: 450 } },
          { id: "o_3", values: { order_id: 103, customer_id: 4, amount: 120 } },
        ],
      },
      {
        name: "Customers",
        color: "#10b981",
        position: [8, 0, 0],
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR" },
        ],
        rows: [
          { id: "c_1", values: { id: 1, name: "Alice" } },
          { id: "c_2", values: { id: 2, name: "Bob" } },
          { id: "c_3", values: { id: 3, name: "Carol" } },
        ],
      },
    ],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Position Tables in 3D Space",
        narration:
          "INNER JOIN finds matching records present in both tables based on a shared key.",
        sqlSnippet: "FROM Orders JOIN Customers ON Orders.customer_id = Customers.id",
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Scan Order 101",
        narration:
          "Checking Order 101 with customer_id: 1 against Customers table.",
        activeTable: "Orders",
        activeRowIds: ["o_1"],
        sqlSnippet: "ON Orders.customer_id (1) = Customers.id",
      },
      {
        id: 2,
        type: "JOIN_MATCH",
        title: "3. Match Found: Order 101 <-> Alice",
        narration:
          "Order 101 matches Customer 1 (Alice). Connecting 3D relation established.",
        matchedRowPair: ["o_1", "c_1"],
        passedCondition: true,
        sqlSnippet: "1 = 1 -> TRUE",
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Scan Order 102",
        narration:
          "Checking Order 102 with customer_id: 2 against Customers table.",
        activeTable: "Orders",
        activeRowIds: ["o_2"],
        sqlSnippet: "ON Orders.customer_id (2) = Customers.id",
      },
      {
        id: 4,
        type: "JOIN_MATCH",
        title: "5. Match Found: Order 102 <-> Bob",
        narration:
          "Order 102 matches Customer 2 (Bob). Connected into result set.",
        matchedRowPair: ["o_2", "c_2"],
        passedCondition: true,
        sqlSnippet: "2 = 2 -> TRUE",
      },
      {
        id: 5,
        type: "SCAN_ROW",
        title: "6. Scan Order 103",
        narration:
          "Checking Order 103 with customer_id: 4 against Customers. No customer with id 4 exists in Customers table.",
        activeTable: "Orders",
        activeRowIds: ["o_3"],
        passedCondition: false,
        sqlSnippet: "4 = Customers.id -> FALSE (Excluded from INNER JOIN)",
      },
      {
        id: 6,
        type: "COMPLETE",
        title: "7. Result Set Complete",
        narration:
          "INNER JOIN returned all 2 matching pairs. Non-matching order 103 and unmatched customer Carol are excluded.",
        sqlSnippet: "SELECT order_id, name, amount",
      },
    ],
  },
  "left-join": {
    title: "3D Visual Simulation: LEFT JOIN",
    tables: [
      {
        name: "Students",
        color: "#3b82f6",
        position: [-8, 0, 0],
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "name", type: "VARCHAR" },
        ],
        rows: [
          { id: "s_1", values: { id: 1, name: "Alice" } },
          { id: "s_2", values: { id: 2, name: "Bob" } },
          { id: "s_3", values: { id: 3, name: "Charlie" } },
        ],
      },
      {
        name: "ExamScores",
        color: "#f59e0b",
        position: [8, 0, 0],
        columns: [
          { name: "student_id", type: "INT", isForeign: true },
          { name: "score", type: "INT" },
        ],
        rows: [
          { id: "ex_1", values: { student_id: 1, score: 95 } },
          { id: "ex_2", values: { student_id: 2, score: 88 } },
        ],
      },
    ],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Position Left & Right Tables",
        narration:
          "LEFT JOIN preserves EVERY row from the Left table (Students), even if no match exists in the Right table (ExamScores).",
        sqlSnippet: "FROM Students LEFT JOIN ExamScores ON Students.id = ExamScores.student_id",
      },
      {
        id: 1,
        type: "JOIN_MATCH",
        title: "2. Match Student 1 (Alice)",
        narration:
          "Alice has an exam score of 95. Matched and connected.",
        matchedRowPair: ["s_1", "ex_1"],
        passedCondition: true,
        sqlSnippet: "Students.id (1) = ExamScores.student_id (1) -> TRUE",
      },
      {
        id: 2,
        type: "JOIN_MATCH",
        title: "3. Match Student 2 (Bob)",
        narration:
          "Bob has an exam score of 88. Matched and connected.",
        matchedRowPair: ["s_2", "ex_2"],
        passedCondition: true,
        sqlSnippet: "Students.id (2) = ExamScores.student_id (2) -> TRUE",
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Preserve Student 3 (Charlie) with NULL",
        narration:
          "Charlie has no exam score entry. In a LEFT JOIN, Charlie is preserved and score is filled with NULL.",
        activeTable: "Students",
        activeRowIds: ["s_3"],
        passedCondition: false,
        sqlSnippet: "Charlie -> ExamScores.score = NULL",
      },
      {
        id: 4,
        type: "COMPLETE",
        title: "5. LEFT JOIN Result",
        narration:
          "All 3 students are included in the output. Charlie retains his record with score = NULL.",
        sqlSnippet: "SELECT name, COALESCE(score, 0)",
      },
    ],
  },
  "where-and-operators": {
    title: "3D Visual Simulation: WHERE Filter Condition",
    tables: [
      {
        name: "Products",
        color: "#06b6d4",
        position: [0, 0, 0],
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "product_name", type: "VARCHAR" },
          { name: "price", type: "DECIMAL" },
          { name: "in_stock", type: "BOOLEAN" },
        ],
        rows: [
          { id: "p_1", values: { id: 1, product_name: "Laptop", price: 1200, in_stock: true } },
          { id: "p_2", values: { id: 2, product_name: "Mouse", price: 25, in_stock: true } },
          { id: "p_3", values: { id: 3, product_name: "Monitor", price: 300, in_stock: false } },
          { id: "p_4", values: { id: 4, product_name: "Keyboard", price: 80, in_stock: true } },
        ],
      },
    ],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Initial Dataset",
        narration:
          "The WHERE clause scans rows one-by-one and tests boolean conditions.",
        sqlSnippet: "SELECT * FROM Products WHERE price > 50 AND in_stock = true",
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Test Row 1: Laptop ($1200)",
        narration:
          "price: 1200 (> 50) AND in_stock: true -> TRUE. Row qualifies and lifts with highlight.",
        activeRowIds: ["p_1"],
        passedCondition: true,
        sqlSnippet: "1200 > 50 AND true = true -> TRUE",
      },
      {
        id: 2,
        type: "SCAN_ROW",
        title: "3. Test Row 2: Mouse ($25)",
        narration:
          "price: 25 (> 50 is FALSE) -> FALSE. Condition fails, row is filtered out.",
        activeRowIds: ["p_2"],
        passedCondition: false,
        sqlSnippet: "25 > 50 -> FALSE",
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Test Row 3: Monitor ($300)",
        narration:
          "price: 300 (> 50 is TRUE), but in_stock: false -> FALSE. Condition fails.",
        activeRowIds: ["p_3"],
        passedCondition: false,
        sqlSnippet: "300 > 50 AND false = true -> FALSE",
      },
      {
        id: 4,
        type: "SCAN_ROW",
        title: "5. Test Row 4: Keyboard ($80)",
        narration:
          "price: 80 (> 50) AND in_stock: true -> TRUE. Row qualifies.",
        activeRowIds: ["p_4"],
        passedCondition: true,
        sqlSnippet: "80 > 50 AND true = true -> TRUE",
      },
      {
        id: 5,
        type: "COMPLETE",
        title: "6. Filtered Result Set",
        narration:
          "Filter evaluation complete: Laptop and Keyboard are emitted into the result stream.",
        sqlSnippet: "Result: 2 rows returned",
      },
    ],
  },
};

/**
 * Returns scenario for a given slug, or a generated default scenario based on concept title
 */
export function getConceptScenario(slug: string, conceptTitle: string): ConceptScenario {
  if (CONCEPT_SCENARIOS[slug]) {
    return CONCEPT_SCENARIOS[slug];
  }

  // Generic fallback scenario with customized title
  return {
    title: `3D Visual Simulation: ${conceptTitle}`,
    tables: [
      {
        name: "SourceTable",
        color: "#6366f1",
        position: [0, 0, 0],
        columns: [
          { name: "id", type: "INT", isPrimary: true },
          { name: "attribute", type: "VARCHAR" },
          { name: "metric", type: "DECIMAL" },
        ],
        rows: [
          { id: "r1", values: { id: 1, attribute: "Alpha", metric: 100 } },
          { id: "r2", values: { id: 2, attribute: "Beta", metric: 250 } },
          { id: "r3", values: { id: 3, attribute: "Gamma", metric: 400 } },
        ],
      },
    ],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: `1. Explore ${conceptTitle} in 3D Space`,
        narration: `Interactive 3D spatial viewport demonstrating relational dynamics for ${conceptTitle}.`,
        sqlSnippet: `SELECT * FROM SourceTable`,
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Sequential Row Evaluation",
        narration: "The engine scans data blocks to evaluate query operations.",
        activeRowIds: ["r1", "r2"],
        sqlSnippet: "EVALUATING ROWS",
      },
      {
        id: 2,
        type: "COMPLETE",
        title: "3. Execution Complete",
        narration: `Query evaluation complete for ${conceptTitle}.`,
        sqlSnippet: "DONE",
      },
    ],
  };
}
