"use client";

/**
 * DbLabPanel.tsx
 *
 * Collapsed-by-default practice database for one problem. The issue, seed
 * script and SQL console only appear after the user clicks the header.
 */

import { useState } from "react";
import { createLabDb, describeLabDb, runLabQuery } from "@/lib/lab-db";
import type { QueryResult } from "@/lib/sql-wasm";
import { LabResults } from "./LabResults";

interface DbLabPanelProps {
  id: number;
  issue: string;
  seed: string;
  solution: string;
}

type Status = "empty" | "creating" | "ready" | "error";

export function DbLabPanel({ id, issue, seed, solution }: DbLabPanelProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("empty");
  const [info, setInfo] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [ms, setMs] = useState<number | null>(null);

  const create = async () => {
    setStatus("creating");
    setError(null);
    setResult(null);
    try {
      const t0 = performance.now();
      await createLabDb(id, seed);
      setInfo(await describeLabDb(id));
      setMs(Math.round(performance.now() - t0));
      setStatus("ready");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const run = async () => {
    const t0 = performance.now();
    const r = await runLabQuery(id, sql);
    setMs(Math.round(performance.now() - t0));
    setResult(r);
    if (!r.error) setInfo(await describeLabDb(id));
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        margin: "1rem 0",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "12px 16px",
          background: "transparent",
          color: "var(--text)",
          border: "none",
          cursor: "pointer",
          fontSize: "0.95rem",
          fontWeight: 600,
        }}
      >
        {open ? "▾" : "▸"} Practice database (thousands of rows)
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          <p className="muted" style={{ marginTop: 0 }}>
            <strong>Issue:</strong> {issue}
          </p>
          <details>
            <summary style={{ cursor: "pointer" }}>Show the setup query</summary>
            <pre>
              <code>{seed.trim()}</code>
            </pre>
          </details>
          <p style={{ marginBottom: 8 }}>
            <button className="sql3d-btn sql3d-btn-primary" onClick={create} disabled={status === "creating"}>
              {status === "creating" ? "Creating…" : status === "ready" ? "Reset database" : "Create database"}
            </button>
          </p>
          {error && <p style={{ color: "#fca5a5" }}>{error}</p>}
          {status === "ready" && (
            <LabResults
              info={info}
              sql={sql}
              setSql={setSql}
              run={run}
              solution={solution}
              result={result}
              ms={ms}
            />
          )}
        </div>
      )}
    </div>
  );
}
