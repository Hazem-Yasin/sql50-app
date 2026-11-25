"use client";

import type { QueryResult } from "@/lib/sql-wasm";

interface LabResultsProps {
  info: string[];
  sql: string;
  setSql: (s: string) => void;
  run: () => void;
  solution: string;
  result: QueryResult | null;
  ms: number | null;
}

const MAX_SHOWN = 100;

/** Query box, run buttons and result table for an existing lab database. */
export function LabResults({ info, sql, setSql, run, solution, result, ms }: LabResultsProps) {
  return (
    <>
      <p className="muted" style={{ fontSize: "0.82rem" }}>
        {info.join(" · ")}
      </p>
      <textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run();
        }}
        placeholder="Write your solution here, then press Run (Ctrl+Enter)"
        rows={6}
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.88rem",
          padding: "10px 12px",
          background: "#020617",
          color: "#38bdf8",
          border: "1px solid #334155",
          borderRadius: "6px",
        }}
      />
      <p style={{ margin: "8px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="sql3d-btn sql3d-btn-primary" onClick={run}>
          Run
        </button>
        <button className="sql3d-btn" onClick={() => setSql(solution)}>
          Fill in reference solution
        </button>
      </p>

      {result?.error && <p style={{ color: "#fca5a5" }}>{result.error}</p>}
      {result && !result.error && (
        <>
          <p className="muted" style={{ fontSize: "0.82rem" }}>
            {result.rowCount.toLocaleString()} row{result.rowCount === 1 ? "" : "s"}
            {ms !== null ? ` · ${ms} ms` : ""}
            {result.rows.length > MAX_SHOWN ? ` · showing first ${MAX_SHOWN}` : ""}
          </p>
          {result.columns.length > 0 && (
            <div style={{ overflow: "auto", maxHeight: 360 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem" }}>
                <thead>
                  <tr>
                    {result.columns.map((c) => (
                      <th key={c} style={{ textAlign: "left", padding: "6px 10px", color: "#38bdf8" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, MAX_SHOWN).map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                      {result.columns.map((c) => (
                        <td key={c} style={{ padding: "5px 10px" }}>
                          {row[c] === null ? "NULL" : String(row[c])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
