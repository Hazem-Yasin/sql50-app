"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sql3DViewer,
  CONCEPT_SCENARIOS,
  interpretQueryTo3D,
  ConceptScenario,
  SAMPLE_DATABASE,
} from "@/components/sql-3d-engine";
import { DotsViewer } from "@/components/sql-3d-engine/DotsViewer";
import { runQuery, QueryResult } from "@/lib/sql-wasm";

interface ScenarioOption {
  key: string;
  label: string;
  category: string;
  description: string;
}

const AVAILABLE_SCENARIOS: ScenarioOption[] = [
  {
    key: "self-join",
    label: "Self Join",
    category: "Joins",
    description: "Queries the same table twice to match hierarchical records (e.g. Workers & Managers).",
  },
  {
    key: "inner-join",
    label: "Inner Join",
    category: "Joins",
    description: "Matches records between two distinct tables on a shared foreign key.",
  },
  {
    key: "cross-join",
    label: "Cross Join",
    category: "Joins",
    description: "Generates a Cartesian product (N × M) pairing every row of table A with table B.",
  },
  {
    key: "group-by-having",
    label: "Group By & Having",
    category: "Aggregation",
    description: "Aggregates rows by department key into summary blocks and filters with HAVING.",
  },
  {
    key: "ranking-functions",
    label: "Window & Ranking (DENSE_RANK)",
    category: "Advanced",
    description: "Computes consecutive ranking frames without gaps across ordered partitions.",
  },
  {
    key: "where-and-operators",
    label: "WHERE Filtering",
    category: "Filtering",
    description: "Evaluates multi-condition predicates and filters non-qualifying rows.",
  },
];

const PRESET_QUERIES = [
  {
    label: "Filter high salary employees",
    sql: "SELECT * FROM \"Employees\" WHERE salary > 7800",
  },
  {
    label: "Self-Join workers to managers",
    sql: 'SELECT e1.name AS employee, e2.name AS manager FROM "Employees" e1 JOIN "Employees" e2 ON e1.manager_id = e2.id',
  },
  {
    label: "Join Orders with Customers",
    sql: 'SELECT o.order_id, c.name, o.amount FROM "Orders" o JOIN "Customers" c ON o.customer_id = c.id',
  },
  {
    label: "Products under $100",
    sql: 'SELECT * FROM "Products" WHERE price < 100',
  },
  {
    label: "Avg salary by manager",
    sql: 'SELECT manager_id, COUNT(*) AS reports, AVG(salary) AS avg_salary FROM "Employees" WHERE manager_id IS NOT NULL GROUP BY manager_id',
  },
  {
    label: "Rank employees by salary",
    sql: 'SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rank FROM "Employees"',
  },
];

interface WasmState {
  status: "idle" | "running" | "done" | "error";
  result: QueryResult | null;
}

export default function PlaygroundPage() {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("self-join");
  const [customSql, setCustomSql] = useState<string>('SELECT * FROM "Employees" WHERE salary > 7800');
  const [activeScenario, setActiveScenario] = useState<ConceptScenario | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wasmState, setWasmState] = useState<WasmState>({ status: "idle", result: null });
  const [viewMode, setViewMode] = useState<"cards" | "dots">("cards");

  const scenario = activeScenario || CONCEPT_SCENARIOS[selectedPresetKey] || CONCEPT_SCENARIOS["self-join"];

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    setActiveScenario(null);
    setErrorMessage(null);
  };

  const handleRunCustomQuery = async (queryToRun?: string) => {
    const q = queryToRun || customSql;

    // --- 3D visualization (existing regex interpreter) ---
    const res = interpretQueryTo3D(q, SAMPLE_DATABASE);
    if (res.success && res.scenario) {
      setActiveScenario(res.scenario);
      setErrorMessage(null);
    } else {
      setErrorMessage(res.error || "Query execution failed.");
    }

    // --- Real WASM SQL execution ---
    setWasmState({ status: "running", result: null });
    const wasmResult = await runQuery(q);
    if (wasmResult.error) {
      setWasmState({ status: "error", result: wasmResult });
    } else {
      setWasmState({ status: "done", result: wasmResult });
    }
  };

  return (
    <>
      <p className="crumbs">
        <Link href="/">Home</Link> / 3D SQL Playground
      </p>

      <h1>3D SQL Interactive Playground</h1>
      <p className="lead">
        Explore relational database operations rendered in real-time 3D space. Select a preset scenario
        or write your own SQL query below to watch 3D tables spawn, records scan, relation arcs form,
        and results stream onto the Output Platform.
      </p>

      {/* Preset Scenario Tabs */}
      <h3 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Preset Visual Scenarios</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.5rem" }}>
        {AVAILABLE_SCENARIOS.map((s) => {
          const isActive = !activeScenario && selectedPresetKey === s.key;
          return (
            <button
              key={s.key}
              onClick={() => handleSelectPreset(s.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "0.88rem",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                border: isActive ? "1px solid #38bdf8" : "1px solid var(--border)",
                background: isActive ? "rgba(56, 189, 248, 0.15)" : "var(--surface)",
                color: isActive ? "#38bdf8" : "var(--text)",
                transition: "all 0.15s ease",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Live Custom SQL Query Console */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Live SQL Query Console</h3>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {PRESET_QUERIES.map((pq) => (
              <button
                key={pq.label}
                onClick={() => {
                  setCustomSql(pq.sql);
                  handleRunCustomQuery(pq.sql);
                }}
                style={{
                  fontSize: "0.75rem",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                {pq.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={customSql}
            onChange={(e) => setCustomSql(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRunCustomQuery();
            }}
            placeholder='e.g. SELECT * FROM "Employees" WHERE salary > 8000'
            style={{
              flex: "1 1 320px",
              padding: "10px 14px",
              fontFamily: "ui-monospace, monospace",
              fontSize: "0.9rem",
              background: "#020617",
              color: "#38bdf8",
              border: "1px solid #334155",
              borderRadius: "6px",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleRunCustomQuery()}
            style={{
              padding: "10px 18px",
              fontSize: "0.88rem",
              fontWeight: 600,
              background: "#0284c7",
              color: "#ffffff",
              border: "1px solid #0369a1",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Run in 3D ⚡
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              fontSize: "0.85rem",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "var(--muted)" }}>
          <span>Available tables: </span>
          {["Employees", "Orders", "Customers", "Products"].map((tbl) => (
            <code key={tbl} style={{ marginRight: "6px", fontSize: "0.78rem" }}>
              &quot;{tbl}&quot;
            </code>
          ))}
        </div>
      </div>

      {/* 3D SQL Viewer Viewport */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        {(["cards", "dots"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.82rem",
              cursor: "pointer",
              border: viewMode === m ? "1px solid #38bdf8" : "1px solid var(--border)",
              background: viewMode === m ? "rgba(56, 189, 248, 0.15)" : "var(--surface)",
              color: viewMode === m ? "#38bdf8" : "var(--text)",
            }}
          >
            {m === "cards" ? "Cards view" : "Dots view (prototype)"}
          </button>
        ))}
      </div>
      {viewMode === "cards" ? (
        <Sql3DViewer
          key={activeScenario ? `custom_${customSql}` : selectedPresetKey}
          title={scenario.title}
          customTables={scenario.tables}
          outputColumns={scenario.outputColumns}
          outputPosition={scenario.outputPosition}
          customSteps={scenario.steps}
        />
      ) : (
        <DotsViewer
          key={activeScenario ? `dots_${customSql}` : `dots_${selectedPresetKey}`}
          scenario={scenario}
        />
      )}

      {/* Real WASM SQL Results Panel */}
      {wasmState.status !== "idle" && (
        <div
          style={{
            marginTop: "1.5rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              PostgreSQL Results
            </span>
            {wasmState.status === "running" && (
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Executing…</span>
            )}
            {wasmState.status === "done" && wasmState.result && (
              <span style={{ fontSize: "0.78rem", color: "#10b981" }}>
                {wasmState.result.rowCount} row{wasmState.result.rowCount !== 1 ? "s" : ""} returned
              </span>
            )}
            {wasmState.status === "error" && (
              <span style={{ fontSize: "0.78rem", color: "#ef4444" }}>Error</span>
            )}
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.72rem",
                color: "var(--muted)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Powered by PGlite (PostgreSQL WASM)
            </span>
          </div>

          {wasmState.status === "error" && wasmState.result?.error && (
            <div
              style={{
                padding: "12px 16px",
                color: "#fca5a5",
                fontSize: "0.85rem",
                fontFamily: "ui-monospace, monospace",
                background: "rgba(239, 68, 68, 0.08)",
              }}
            >
              {wasmState.result.error}
            </div>
          )}

          {wasmState.status === "done" && wasmState.result && wasmState.result.columns.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.83rem",
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {wasmState.result.columns.map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          borderBottom: "1px solid var(--border)",
                          color: "#38bdf8",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wasmState.result.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: rIdx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                      }}
                    >
                      {wasmState.result!.columns.map((col) => (
                        <td
                          key={col}
                          style={{
                            padding: "7px 12px",
                            color: row[col] === null ? "var(--muted)" : "var(--text)",
                            fontStyle: row[col] === null ? "italic" : "normal",
                          }}
                        >
                          {row[col] === null ? "NULL" : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {wasmState.status === "done" && wasmState.result && wasmState.result.columns.length === 0 && (
            <div style={{ padding: "12px 16px", color: "var(--muted)", fontSize: "0.85rem" }}>
              Query executed successfully. No rows returned.
            </div>
          )}
        </div>
      )}

      {/* Related Concept Link */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Explore the Concept In Depth</h3>
        <p>
          Read full explanations, common pitfalls, and LeetCode SQL 50 problems related to this topic:
        </p>
        <p style={{ marginTop: "8px" }}>
          <Link href={`/concepts/${selectedPresetKey}`} style={{ fontWeight: 600 }}>
            Open Concept Guide: {AVAILABLE_SCENARIOS.find((s) => s.key === selectedPresetKey)?.label} →
          </Link>
        </p>
      </div>
    </>
  );
}
