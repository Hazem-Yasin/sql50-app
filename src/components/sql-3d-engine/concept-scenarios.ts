import { TableSchema, ExecutionStep, ColumnDef } from "./types";

export interface ConceptScenario {
  title: string;
  tables: TableSchema[];
  outputColumns?: ColumnDef[];
  outputPosition?: [number, number, number];
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
        position: [-8, 0, -3],
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
        position: [8, 0, -3],
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
    outputColumns: [
      { name: "employee", type: "VARCHAR" },
      { name: "manager", type: "VARCHAR" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Instantiate Aliases & Output Platform",
        narration:
          "A Self Join queries the same table twice. We spawn 'e1' as workers, 'e2' as managers, and a central Result Platform to receive matches.",
        sqlSnippet: "FROM Employees e1 JOIN Employees e2",
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Scan Row 1 (Alice) in e1",
        narration:
          "Evaluating Alice (id: 1, manager_id: 3). We scan e2 for a row with id = 3.",
        activeTable: "e1",
        activeRowIds: ["e1_r1"],
        sqlSnippet: "ON e1.manager_id = e2.id",
        resultRowsSnapshot: [],
      },
      {
        id: 2,
        type: "JOIN_MATCH",
        title: "3. Match Found: Alice -> Charlie",
        narration:
          "Match found! Alice's manager_id (3) matches Charlie's id (3). A 3D relation arc connects them and emits a result row.",
        matchedRowPair: ["e1_r1", "e2_r3"],
        passedCondition: true,
        sqlSnippet: "e1.manager_id (3) = e2.id (3) -> TRUE",
        resultRowsSnapshot: [
          { id: "res_1", values: { employee: "Alice", manager: "Charlie" } },
        ],
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Scan Row 2 (Bob) in e1",
        narration:
          "Evaluating Bob (id: 2, manager_id: 3). We scan e2 for a row with id = 3.",
        activeTable: "e1",
        activeRowIds: ["e1_r2"],
        sqlSnippet: "ON e1.manager_id = e2.id",
        resultRowsSnapshot: [
          { id: "res_1", values: { employee: "Alice", manager: "Charlie" } },
        ],
      },
      {
        id: 4,
        type: "JOIN_MATCH",
        title: "5. Match Found: Bob -> Charlie",
        narration:
          "Match found! Bob's manager_id (3) matches Charlie's id (3). Second output row is emitted.",
        matchedRowPair: ["e1_r2", "e2_r3"],
        passedCondition: true,
        sqlSnippet: "e1.manager_id (3) = e2.id (3) -> TRUE",
        resultRowsSnapshot: [
          { id: "res_1", values: { employee: "Alice", manager: "Charlie" } },
          { id: "res_2", values: { employee: "Bob", manager: "Charlie" } },
        ],
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
        resultRowsSnapshot: [
          { id: "res_1", values: { employee: "Alice", manager: "Charlie" } },
          { id: "res_2", values: { employee: "Bob", manager: "Charlie" } },
        ],
      },
      {
        id: 6,
        type: "COMPLETE",
        title: "7. Self Join Result Set Formed",
        narration:
          "Execution complete. The Self Join successfully paired workers with their corresponding managers in 3D.",
        sqlSnippet: "SELECT e1.name AS employee, e2.name AS manager",
        resultRowsSnapshot: [
          { id: "res_1", values: { employee: "Alice", manager: "Charlie" } },
          { id: "res_2", values: { employee: "Bob", manager: "Charlie" } },
        ],
      },
    ],
  },
  "inner-join": {
    title: "3D Visual Simulation: INNER JOIN",
    tables: [
      {
        name: "Orders",
        color: "#3b82f6",
        position: [-8, 0, -3],
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
        position: [8, 0, -3],
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
    outputColumns: [
      { name: "order_id", type: "INT" },
      { name: "customer", type: "VARCHAR" },
      { name: "amount", type: "DECIMAL" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Position Tables in 3D Space",
        narration:
          "INNER JOIN matches records present in both tables based on a shared key.",
        sqlSnippet: "FROM Orders JOIN Customers ON Orders.customer_id = Customers.id",
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Scan Order 101",
        narration:
          "Checking Order 101 (customer_id: 1) against Customers.",
        activeTable: "Orders",
        activeRowIds: ["o_1"],
        sqlSnippet: "ON Orders.customer_id (1) = Customers.id",
        resultRowsSnapshot: [],
      },
      {
        id: 2,
        type: "JOIN_MATCH",
        title: "3. Match: Order 101 <-> Alice",
        narration:
          "Order 101 matches Customer 1 (Alice). Emitting to Output Platform.",
        matchedRowPair: ["o_1", "c_1"],
        passedCondition: true,
        sqlSnippet: "1 = 1 -> TRUE",
        resultRowsSnapshot: [
          { id: "res_1", values: { order_id: 101, customer: "Alice", amount: 250 } },
        ],
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Scan Order 102",
        narration:
          "Checking Order 102 (customer_id: 2) against Customers.",
        activeTable: "Orders",
        activeRowIds: ["o_2"],
        sqlSnippet: "ON Orders.customer_id (2) = Customers.id",
        resultRowsSnapshot: [
          { id: "res_1", values: { order_id: 101, customer: "Alice", amount: 250 } },
        ],
      },
      {
        id: 4,
        type: "JOIN_MATCH",
        title: "5. Match: Order 102 <-> Bob",
        narration:
          "Order 102 matches Customer 2 (Bob). Emitting to Output Platform.",
        matchedRowPair: ["o_2", "c_2"],
        passedCondition: true,
        sqlSnippet: "2 = 2 -> TRUE",
        resultRowsSnapshot: [
          { id: "res_1", values: { order_id: 101, customer: "Alice", amount: 250 } },
          { id: "res_2", values: { order_id: 102, customer: "Bob", amount: 450 } },
        ],
      },
      {
        id: 5,
        type: "SCAN_ROW",
        title: "6. Scan Order 103 (No match)",
        narration:
          "Order 103 has customer_id 4. No matching Customer found, so it is omitted from INNER JOIN.",
        activeTable: "Orders",
        activeRowIds: ["o_3"],
        passedCondition: false,
        sqlSnippet: "4 = Customers.id -> FALSE",
        resultRowsSnapshot: [
          { id: "res_1", values: { order_id: 101, customer: "Alice", amount: 250 } },
          { id: "res_2", values: { order_id: 102, customer: "Bob", amount: 450 } },
        ],
      },
      {
        id: 6,
        type: "COMPLETE",
        title: "7. Result Set Complete",
        narration:
          "INNER JOIN finished with 2 matching records on the Output Platform.",
        sqlSnippet: "SELECT order_id, name, amount",
        resultRowsSnapshot: [
          { id: "res_1", values: { order_id: 101, customer: "Alice", amount: 250 } },
          { id: "res_2", values: { order_id: 102, customer: "Bob", amount: 450 } },
        ],
      },
    ],
  },
  "cross-join": {
    title: "3D Visual Simulation: CROSS JOIN (Cartesian Product)",
    tables: [
      {
        name: "Sizes",
        color: "#f59e0b",
        position: [-8, 0, -3],
        columns: [{ name: "size", type: "VARCHAR" }],
        rows: [
          { id: "s_1", values: { size: "Small" } },
          { id: "s_2", values: { size: "Large" } },
        ],
      },
      {
        name: "Colors",
        color: "#ec4899",
        position: [8, 0, -3],
        columns: [{ name: "color", type: "VARCHAR" }],
        rows: [
          { id: "c_1", values: { color: "Red" } },
          { id: "c_2", values: { color: "Blue" } },
        ],
      },
    ],
    outputColumns: [
      { name: "size", type: "VARCHAR" },
      { name: "color", type: "VARCHAR" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Cross Join Initial Setup",
        narration:
          "CROSS JOIN produces a Cartesian product where every row of table 1 pairs with every row of table 2 (2 × 2 = 4 combinations).",
        sqlSnippet: "FROM Sizes CROSS JOIN Colors",
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "JOIN_MATCH",
        title: "2. Pair Small with Red",
        narration: "Pairing (Small, Red) into the output matrix.",
        matchedRowPair: ["s_1", "c_1"],
        resultRowsSnapshot: [
          { id: "r_1", values: { size: "Small", color: "Red" } },
        ],
      },
      {
        id: 2,
        type: "JOIN_MATCH",
        title: "3. Pair Small with Blue",
        narration: "Pairing (Small, Blue) into the output matrix.",
        matchedRowPair: ["s_1", "c_2"],
        resultRowsSnapshot: [
          { id: "r_1", values: { size: "Small", color: "Red" } },
          { id: "r_2", values: { size: "Small", color: "Blue" } },
        ],
      },
      {
        id: 3,
        type: "JOIN_MATCH",
        title: "4. Pair Large with Red",
        narration: "Pairing (Large, Red) into the output matrix.",
        matchedRowPair: ["s_2", "c_1"],
        resultRowsSnapshot: [
          { id: "r_1", values: { size: "Small", color: "Red" } },
          { id: "r_2", values: { size: "Small", color: "Blue" } },
          { id: "r_3", values: { size: "Large", color: "Red" } },
        ],
      },
      {
        id: 4,
        type: "JOIN_MATCH",
        title: "5. Pair Large with Blue",
        narration: "Pairing (Large, Blue) into the output matrix.",
        matchedRowPair: ["s_2", "c_2"],
        resultRowsSnapshot: [
          { id: "r_1", values: { size: "Small", color: "Red" } },
          { id: "r_2", values: { size: "Small", color: "Blue" } },
          { id: "r_3", values: { size: "Large", color: "Red" } },
          { id: "r_4", values: { size: "Large", color: "Blue" } },
        ],
      },
      {
        id: 5,
        type: "COMPLETE",
        title: "6. Cartesian Grid Complete",
        narration: "All 4 combinations have materialized on the Output Platform.",
        sqlSnippet: "SELECT size, color FROM Sizes CROSS JOIN Colors",
        resultRowsSnapshot: [
          { id: "r_1", values: { size: "Small", color: "Red" } },
          { id: "r_2", values: { size: "Small", color: "Blue" } },
          { id: "r_3", values: { size: "Large", color: "Red" } },
          { id: "r_4", values: { size: "Large", color: "Blue" } },
        ],
      },
    ],
  },
  "group-by-having": {
    title: "3D Visual Simulation: GROUP BY & HAVING",
    tables: [
      {
        name: "Sales",
        color: "#6366f1",
        position: [0, 0, -3],
        columns: [
          { name: "id", type: "INT" },
          { name: "department", type: "VARCHAR" },
          { name: "revenue", type: "DECIMAL" },
        ],
        rows: [
          { id: "s1", values: { id: 1, department: "Electronics", revenue: 500 } },
          { id: "s2", values: { id: 2, department: "Clothing", revenue: 150 } },
          { id: "s3", values: { id: 3, department: "Electronics", revenue: 700 } },
          { id: "s4", values: { id: 4, department: "Clothing", revenue: 200 } },
        ],
      },
    ],
    outputColumns: [
      { name: "department", type: "VARCHAR" },
      { name: "total_revenue", type: "DECIMAL" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Raw Sales Data",
        narration:
          "GROUP BY aggregates individual rows with matching department keys into summary buckets, then HAVING filters those buckets.",
        sqlSnippet: "GROUP BY department HAVING SUM(revenue) > 500",
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "GROUP_ROW",
        title: "2. Form Group: Electronics",
        narration:
          "Row 1 ($500) and Row 3 ($700) share department 'Electronics'. SUM(revenue) = $1200.",
        activeRowIds: ["s1", "s3"],
        sqlSnippet: "SUM(revenue) for Electronics = 1200",
        resultRowsSnapshot: [],
      },
      {
        id: 2,
        type: "EVALUATE_PREDICATE",
        title: "3. Evaluate HAVING: Electronics ($1200 > 500)",
        narration:
          "1200 > 500 is TRUE. Electronics qualifies and emits to the Output Platform.",
        passedCondition: true,
        sqlSnippet: "HAVING 1200 > 500 -> TRUE",
        resultRowsSnapshot: [
          { id: "grp_1", values: { department: "Electronics", total_revenue: 1200 } },
        ],
      },
      {
        id: 3,
        type: "GROUP_ROW",
        title: "4. Form Group: Clothing",
        narration:
          "Row 2 ($150) and Row 4 ($200) share department 'Clothing'. SUM(revenue) = $350.",
        activeRowIds: ["s2", "s4"],
        sqlSnippet: "SUM(revenue) for Clothing = 350",
        resultRowsSnapshot: [
          { id: "grp_1", values: { department: "Electronics", total_revenue: 1200 } },
        ],
      },
      {
        id: 4,
        type: "EVALUATE_PREDICATE",
        title: "5. Evaluate HAVING: Clothing ($350 > 500)",
        narration:
          "350 > 500 is FALSE. Clothing fails the HAVING predicate and is discarded.",
        passedCondition: false,
        sqlSnippet: "HAVING 350 > 500 -> FALSE",
        resultRowsSnapshot: [
          { id: "grp_1", values: { department: "Electronics", total_revenue: 1200 } },
        ],
      },
      {
        id: 5,
        type: "COMPLETE",
        title: "6. Group By & Having Complete",
        narration:
          "Only qualifying groups survive to the final output.",
        sqlSnippet: "SELECT department, SUM(revenue) FROM Sales GROUP BY department HAVING SUM(revenue) > 500",
        resultRowsSnapshot: [
          { id: "grp_1", values: { department: "Electronics", total_revenue: 1200 } },
        ],
      },
    ],
  },
  "ranking-functions": {
    title: "3D Visual Simulation: Window & Ranking Functions (DENSE_RANK)",
    tables: [
      {
        name: "Salaries",
        color: "#8b5cf6",
        position: [0, 0, -3],
        columns: [
          { name: "employee", type: "VARCHAR" },
          { name: "salary", type: "INT" },
        ],
        rows: [
          { id: "sal_1", values: { employee: "Alice", salary: 9000 } },
          { id: "sal_2", values: { employee: "Bob", salary: 8000 } },
          { id: "sal_3", values: { employee: "Charlie", salary: 8000 } },
          { id: "sal_4", values: { employee: "Diana", salary: 6000 } },
        ],
      },
    ],
    outputColumns: [
      { name: "employee", type: "VARCHAR" },
      { name: "salary", type: "INT" },
      { name: "dense_rank", type: "INT" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Order Dataset for Window Ranking",
        narration:
          "DENSE_RANK() assigns consecutive rank numbers without gaps when ties occur.",
        sqlSnippet: "DENSE_RANK() OVER (ORDER BY salary DESC)",
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Rank 1: Alice ($9000)",
        narration: "Highest salary receives Rank 1.",
        activeRowIds: ["sal_1"],
        resultRowsSnapshot: [
          { id: "rnk_1", values: { employee: "Alice", salary: 9000, dense_rank: 1 } },
        ],
      },
      {
        id: 2,
        type: "SCAN_ROW",
        title: "3. Rank 2: Bob ($8000) & Charlie ($8000)",
        narration:
          "Bob and Charlie tie at $8000. Both receive Rank 2.",
        activeRowIds: ["sal_2", "sal_3"],
        resultRowsSnapshot: [
          { id: "rnk_1", values: { employee: "Alice", salary: 9000, dense_rank: 1 } },
          { id: "rnk_2", values: { employee: "Bob", salary: 8000, dense_rank: 2 } },
          { id: "rnk_3", values: { employee: "Charlie", salary: 8000, dense_rank: 2 } },
        ],
      },
      {
        id: 3,
        type: "SCAN_ROW",
        title: "4. Rank 3: Diana ($6000) - No Gap!",
        narration:
          "With DENSE_RANK, the next distinct salary receives Rank 3 (unlike RANK() which would skip to 4).",
        activeRowIds: ["sal_4"],
        resultRowsSnapshot: [
          { id: "rnk_1", values: { employee: "Alice", salary: 9000, dense_rank: 1 } },
          { id: "rnk_2", values: { employee: "Bob", salary: 8000, dense_rank: 2 } },
          { id: "rnk_3", values: { employee: "Charlie", salary: 8000, dense_rank: 2 } },
          { id: "rnk_4", values: { employee: "Diana", salary: 6000, dense_rank: 3 } },
        ],
      },
      {
        id: 4,
        type: "COMPLETE",
        title: "5. Ranking Window Output",
        narration: "All rows computed with consecutive dense ranking.",
        sqlSnippet: "SELECT employee, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rank",
        resultRowsSnapshot: [
          { id: "rnk_1", values: { employee: "Alice", salary: 9000, dense_rank: 1 } },
          { id: "rnk_2", values: { employee: "Bob", salary: 8000, dense_rank: 2 } },
          { id: "rnk_3", values: { employee: "Charlie", salary: 8000, dense_rank: 2 } },
          { id: "rnk_4", values: { employee: "Diana", salary: 6000, dense_rank: 3 } },
        ],
      },
    ],
  },
  "where-and-operators": {
    title: "3D Visual Simulation: WHERE Filter Condition",
    tables: [
      {
        name: "Products",
        color: "#06b6d4",
        position: [0, 0, -3],
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
    outputColumns: [
      { name: "product", type: "VARCHAR" },
      { name: "price", type: "DECIMAL" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: "1. Initial Dataset",
        narration:
          "The WHERE clause scans rows one-by-one and tests boolean conditions.",
        sqlSnippet: "SELECT product_name, price FROM Products WHERE price > 50 AND in_stock = true",
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Test Row 1: Laptop ($1200)",
        narration:
          "price: 1200 (> 50) AND in_stock: true -> TRUE. Row qualifies and emits to Output Platform.",
        activeRowIds: ["p_1"],
        passedCondition: true,
        sqlSnippet: "1200 > 50 AND true = true -> TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { product: "Laptop", price: 1200 } },
        ],
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
        resultRowsSnapshot: [
          { id: "out_1", values: { product: "Laptop", price: 1200 } },
        ],
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
        resultRowsSnapshot: [
          { id: "out_1", values: { product: "Laptop", price: 1200 } },
        ],
      },
      {
        id: 4,
        type: "SCAN_ROW",
        title: "5. Test Row 4: Keyboard ($80)",
        narration:
          "price: 80 (> 50) AND in_stock: true -> TRUE. Row qualifies and emits to Output Platform.",
        activeRowIds: ["p_4"],
        passedCondition: true,
        sqlSnippet: "80 > 50 AND true = true -> TRUE",
        resultRowsSnapshot: [
          { id: "out_1", values: { product: "Laptop", price: 1200 } },
          { id: "out_2", values: { product: "Keyboard", price: 80 } },
        ],
      },
      {
        id: 5,
        type: "COMPLETE",
        title: "6. Filtered Result Set",
        narration:
          "Filter evaluation complete: Laptop and Keyboard are emitted into the result stream.",
        sqlSnippet: "Result: 2 rows returned",
        resultRowsSnapshot: [
          { id: "out_1", values: { product: "Laptop", price: 1200 } },
          { id: "out_2", values: { product: "Keyboard", price: 80 } },
        ],
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
        position: [0, 0, -3],
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
    outputColumns: [
      { name: "attribute", type: "VARCHAR" },
      { name: "metric", type: "DECIMAL" },
    ],
    outputPosition: [0, 0, 7],
    steps: [
      {
        id: 0,
        type: "CREATE_TABLE",
        title: `1. Explore ${conceptTitle} in 3D Space`,
        narration: `Interactive 3D spatial viewport demonstrating relational dynamics for ${conceptTitle}.`,
        sqlSnippet: `SELECT * FROM SourceTable`,
        resultRowsSnapshot: [],
      },
      {
        id: 1,
        type: "SCAN_ROW",
        title: "2. Sequential Row Evaluation",
        narration: "The engine scans data blocks to evaluate query operations.",
        activeRowIds: ["r1", "r2"],
        sqlSnippet: "EVALUATING ROWS",
        resultRowsSnapshot: [
          { id: "out_1", values: { attribute: "Alpha", metric: 100 } },
        ],
      },
      {
        id: 2,
        type: "COMPLETE",
        title: "3. Execution Complete",
        narration: `Query evaluation complete for ${conceptTitle}.`,
        sqlSnippet: "DONE",
        resultRowsSnapshot: [
          { id: "out_1", values: { attribute: "Alpha", metric: 100 } },
          { id: "out_2", values: { attribute: "Beta", metric: 250 } },
        ],
      },
    ],
  };
}
