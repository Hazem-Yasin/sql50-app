import { TableSchema, ExecutionStep, ColumnDef, TableRow } from "./types";
import { ConceptScenario } from "./concept-scenarios";

export const SAMPLE_DATABASE: Record<string, TableSchema> = {
  Employees: {
    name: "Employees",
    color: "#3b82f6",
    columns: [
      { name: "id", type: "INT", isPrimary: true },
      { name: "name", type: "VARCHAR" },
      { name: "salary", type: "INT" },
      { name: "manager_id", type: "INT", isForeign: true },
    ],
    rows: [
      { id: "emp_1", values: { id: 1, name: "Alice", salary: 9000, manager_id: 3 } },
      { id: "emp_2", values: { id: 2, name: "Bob", salary: 8000, manager_id: 3 } },
      { id: "emp_3", values: { id: 3, name: "Charlie", salary: 11000, manager_id: null } },
      { id: "emp_4", values: { id: 4, name: "Diana", salary: 7500, manager_id: 1 } },
    ],
  },
  Orders: {
    name: "Orders",
    color: "#06b6d4",
    columns: [
      { name: "order_id", type: "INT", isPrimary: true },
      { name: "customer_id", type: "INT", isForeign: true },
      { name: "amount", type: "DECIMAL" },
    ],
    rows: [
      { id: "ord_1", values: { order_id: 101, customer_id: 1, amount: 250 } },
      { id: "ord_2", values: { order_id: 102, customer_id: 2, amount: 450 } },
      { id: "ord_3", values: { order_id: 103, customer_id: 4, amount: 120 } },
    ],
  },
  Customers: {
    name: "Customers",
    color: "#10b981",
    columns: [
      { name: "id", type: "INT", isPrimary: true },
      { name: "name", type: "VARCHAR" },
    ],
    rows: [
      { id: "cust_1", values: { id: 1, name: "Alice" } },
      { id: "cust_2", values: { id: 2, name: "Bob" } },
      { id: "cust_3", values: { id: 3, name: "Carol" } },
    ],
  },
  Products: {
    name: "Products",
    color: "#8b5cf6",
    columns: [
      { name: "id", type: "INT", isPrimary: true },
      { name: "name", type: "VARCHAR" },
      { name: "price", type: "DECIMAL" },
    ],
    rows: [
      { id: "prod_1", values: { id: 1, name: "Laptop", price: 1200 } },
      { id: "prod_2", values: { id: 2, name: "Mouse", price: 25 } },
      { id: "prod_3", values: { id: 3, name: "Monitor", price: 300 } },
      { id: "prod_4", values: { id: 4, name: "Keyboard", price: 80 } },
    ],
  },
};

export interface InterpreterResult {
  success: boolean;
  scenario?: ConceptScenario;
  error?: string;
}

/**
 * Parses and executes a user SQL query client-side, compiling it into a 3D visualization timeline
 */
export function interpretQueryTo3D(
  queryStr: string,
  database: Record<string, TableSchema> = SAMPLE_DATABASE
): InterpreterResult {
  const clean = queryStr.trim().replace(/;+$/, "");
  if (!clean) {
    return { success: false, error: "Please enter a valid SQL query." };
  }

  try {
    // 1. Check for FROM clause
    const fromMatch = clean.match(/\bFROM\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?/i);
    if (!fromMatch) {
      return { success: false, error: "Missing FROM clause in query." };
    }

    const primaryTableName = fromMatch[1];
    const primaryTableAlias = fromMatch[2] || primaryTableName;

    // Check if table exists in database
    const primaryTableDef = Object.values(database).find(
      (t) => t.name.toLowerCase() === primaryTableName.toLowerCase()
    );

    if (!primaryTableDef) {
      const available = Object.keys(database).join(", ");
      return {
        success: false,
        error: `Table '${primaryTableName}' not found in database. Available tables: ${available}`,
      };
    }

    // 2. Check for JOIN clause
    const joinMatch = clean.match(
      /\b(?:(INNER|LEFT|RIGHT|CROSS)\s+)?JOIN\s+([a-zA-Z0-9_]+)(?:\s+(?:AS\s+)?([a-zA-Z0-9_]+))?(?:\s+ON\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+))?/i
    );

    const isJoin = !!joinMatch;
    const joinType = (joinMatch?.[1] || "INNER").toUpperCase();
    const joinedTableName = joinMatch?.[2];
    const joinedTableAlias = joinMatch?.[3] || joinedTableName;
    const onLeft = joinMatch?.[4];
    const onRight = joinMatch?.[5];

    let joinedTableDef: TableSchema | undefined;
    if (isJoin && joinedTableName) {
      joinedTableDef = Object.values(database).find(
        (t) => t.name.toLowerCase() === joinedTableName.toLowerCase()
      );
      if (!joinedTableDef) {
        return {
          success: false,
          error: `Joined table '${joinedTableName}' not found in database.`,
        };
      }
    }

    // 3. Check for WHERE clause
    const whereMatch = clean.match(/\bWHERE\s+([^;]+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s*$)/i);
    const whereClause = whereMatch ? whereMatch[1].trim() : null;

    // 4. Check for SELECT projection
    const selectMatch = clean.match(/^SELECT\s+(.+?)\s+FROM\b/i);
    const selectProjection = selectMatch ? selectMatch[1].trim() : "*";

    // Setup 3D Scene Tables
    const isSelfJoin = isJoin && joinedTableDef && primaryTableDef.name === joinedTableDef.name;
    const tables: TableSchema[] = [];

    const table1: TableSchema = {
      ...primaryTableDef,
      alias: isSelfJoin ? `${primaryTableAlias} (Alias 1)` : primaryTableAlias,
      position: isJoin ? [-8, 0, -3] : [0, 0, -3],
      rows: primaryTableDef.rows.map((r) => ({ ...r, id: `t1_${r.id}` })),
    };
    tables.push(table1);

    let table2: TableSchema | undefined;
    if (isJoin && joinedTableDef) {
      table2 = {
        ...joinedTableDef,
        color: isSelfJoin ? "#8b5cf6" : joinedTableDef.color || "#10b981",
        alias: isSelfJoin ? `${joinedTableAlias} (Alias 2)` : joinedTableAlias,
        position: [8, 0, -3],
        rows: joinedTableDef.rows.map((r) => ({ ...r, id: `t2_${r.id}` })),
      };
      tables.push(table2);
    }

    // Determine Output Columns
    const outputColumns: ColumnDef[] = [];
    if (selectProjection === "*") {
      primaryTableDef.columns.forEach((c) => outputColumns.push(c));
      if (table2 && !isSelfJoin) {
        table2.columns.forEach((c) => {
          if (!outputColumns.find((oc) => oc.name === c.name)) {
            outputColumns.push(c);
          }
        });
      }
    } else {
      const parts = selectProjection.split(",").map((p) => p.trim());
      parts.forEach((p) => {
        const colClean = p.split(/\s+AS\s+/i)[1] || p.split(".").pop() || p;
        outputColumns.push({ name: colClean.trim(), type: "VARCHAR" });
      });
    }

    // 5. Generate Simulation Steps
    const steps: ExecutionStep[] = [];
    let stepId = 0;

    steps.push({
      id: stepId++,
      type: "CREATE_TABLE",
      title: "1. Initialize Scene & Tables",
      narration: `Allocated ${tables.length} table platform(s) in 3D space with an active Output Platform for query results.`,
      sqlSnippet: clean,
      resultRowsSnapshot: [],
    });

    const accumulatedResults: TableRow[] = [];

    if (!isJoin) {
      // Single table scan with optional WHERE filter
      table1.rows.forEach((row, rIdx) => {
        let passes = true;
        let testNote = "";

        if (whereClause) {
          // Simple condition evaluator
          const cmpMatch = whereClause.match(/([a-zA-Z0-9_]+)\s*(=|>|<|>=|<=|!=)\s*(['"]?[^'"]+['"]?)/);
          if (cmpMatch) {
            const field = cmpMatch[1];
            const op = cmpMatch[2];
            const rawVal = cmpMatch[3].replace(/['"]/g, "");
            const rowVal = row.values[field];

            testNote = `${field} (${rowVal}) ${op} ${rawVal}`;
            if (op === "=") passes = String(rowVal).toLowerCase() === rawVal.toLowerCase();
            else if (op === ">") passes = Number(rowVal) > Number(rawVal);
            else if (op === "<") passes = Number(rowVal) < Number(rawVal);
            else if (op === "!=") passes = String(rowVal) !== rawVal;
          }
        }

        if (passes) {
          const resRow: TableRow = {
            id: `res_${accumulatedResults.length + 1}`,
            values: { ...row.values },
          };
          accumulatedResults.push(resRow);
        }

        steps.push({
          id: stepId++,
          type: "SCAN_ROW",
          title: `Scan Row ${rIdx + 1}: ${Object.entries(row.values).map(([k, v]) => `${k}:${v}`).join(", ")}`,
          narration: whereClause
            ? `Evaluating condition '${testNote}' -> ${passes ? "PASSED" : "FAILED"}. ${
                passes ? "Row emitted to Result Platform." : "Row filtered out."
              }`
            : `Reading row into output result stream.`,
          activeTable: table1.alias,
          activeRowIds: [row.id],
          passedCondition: passes,
          sqlSnippet: whereClause ? testNote : `SELECT ${selectProjection}`,
          resultRowsSnapshot: [...accumulatedResults],
        });
      });
    } else if (table2) {
      // JOIN evaluation
      let leftCol = "id";
      let rightCol = "id";

      if (onLeft && onRight) {
        leftCol = onLeft.split(".").pop() || "id";
        rightCol = onRight.split(".").pop() || "id";
      } else if (isSelfJoin) {
        leftCol = "manager_id";
        rightCol = "id";
      } else {
        leftCol = "customer_id";
        rightCol = "id";
      }

      table1.rows.forEach((r1) => {
        const val1 = r1.values[leftCol];
        let matched = false;

        table2.rows.forEach((r2) => {
          const val2 = r2.values[rightCol];
          const isMatch = val1 !== null && val1 !== undefined && String(val1) === String(val2);

          if (isMatch) {
            matched = true;
            const resRow: TableRow = {
              id: `res_${accumulatedResults.length + 1}`,
              values: { ...r1.values, ...r2.values },
            };
            accumulatedResults.push(resRow);

            steps.push({
              id: stepId++,
              type: "JOIN_MATCH",
              title: `Match: ${table1.name}.${leftCol} (${val1}) = ${table2.name}.${rightCol} (${val2})`,
              narration: `Matching key found between ${table1.alias} and ${table2.alias}. 3D connector drawn and row emitted.`,
              matchedRowPair: [r1.id, r2.id],
              passedCondition: true,
              sqlSnippet: `${leftCol} (${val1}) = ${rightCol} (${val2}) -> TRUE`,
              resultRowsSnapshot: [...accumulatedResults],
            });
          }
        });

        if (!matched && joinType === "LEFT") {
          const resRow: TableRow = {
            id: `res_${accumulatedResults.length + 1}`,
            values: { ...r1.values },
          };
          accumulatedResults.push(resRow);
          steps.push({
            id: stepId++,
            type: "SCAN_ROW",
            title: `LEFT JOIN Preserve: ${r1.values.name || r1.id}`,
            narration: `No match in ${table2.alias}. Preserved with NULL values in result.`,
            activeTable: table1.alias,
            activeRowIds: [r1.id],
            passedCondition: false,
            sqlSnippet: `NULL match preserved for LEFT JOIN`,
            resultRowsSnapshot: [...accumulatedResults],
          });
        }
      });
    }

    steps.push({
      id: stepId++,
      type: "COMPLETE",
      title: "Query Execution Complete",
      narration: `Execution finished with ${accumulatedResults.length} row(s) materialized on the Output Platform.`,
      sqlSnippet: clean,
      resultRowsSnapshot: [...accumulatedResults],
    });

    return {
      success: true,
      scenario: {
        title: `3D Simulation: Custom Query`,
        tables,
        outputColumns,
        outputPosition: [0, 0, 7],
        steps,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Execution error: ${message}` };
  }
}
