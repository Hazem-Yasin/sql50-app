"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { TEST_CASES } from "@/data/test-cases";
import { verifyTestCase, VerifyResult, VerifyStatus } from "@/lib/verifier";

// ─── types ───────────────────────────────────────────────────────────────────

type ResultMap = Record<number, VerifyResult>;

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<VerifyStatus, string> = {
  pass:    "✅ PASS",
  fail:    "❌ FAIL",
  error:   "⚠️ ERROR",
  pending: "⏳ …",
};

const STATUS_COLOR: Record<VerifyStatus, string> = {
  pass:    "#10b981",
  fail:    "#ef4444",
  error:   "#f59e0b",
  pending: "var(--muted)",
};

// ─── component ───────────────────────────────────────────────────────────────

export default function VerifyPage() {
  const [results, setResults] = useState<ResultMap>({});
  const [running, setRunning] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // ── helpers ──────────────────────────────────────────────────────────────

  const setRunningId = (id: number, active: boolean) => {
    setRunning((prev) => {
      const next = new Set(prev);
      if (active) next.add(id); else next.delete(id);
      return next;
    });
  };

  const runOne = useCallback(async (id: number) => {
    const tc = TEST_CASES.find((t) => t.id === id);
    if (!tc) return;
    setRunningId(id, true);
    // Mark as pending immediately
    setResults((prev) => ({
      ...prev,
      [id]: { id, title: tc.title, status: "pending", actual: [], expected: tc.expected, durationMs: 0 },
    }));
    const result = await verifyTestCase(tc);
    setResults((prev) => ({ ...prev, [id]: result }));
    setRunningId(id, false);
  }, []);

  const runAll = useCallback(async () => {
    // Run up to 4 concurrently to avoid overloading WASM
    const CONCURRENCY = 4;
    for (let i = 0; i < TEST_CASES.length; i += CONCURRENCY) {
      const batch = TEST_CASES.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((tc) => runOne(tc.id)));
    }
  }, [runOne]);

  // ── summary stats ─────────────────────────────────────────────────────────

  const total   = TEST_CASES.length;
  const done    = Object.keys(results).length;
  const passes  = Object.values(results).filter((r) => r.status === "pass").length;
  const fails   = Object.values(results).filter((r) => r.status === "fail").length;
  const errors  = Object.values(results).filter((r) => r.status === "error").length;
  const anyRunning = running.size > 0;

  return (
    <>
      <p className="crumbs">
        <Link href="/">Home</Link> / Solution Verification
      </p>
      <h1>Solution Verification Suite</h1>
      <p className="lead">
        Runs all 50 PostgreSQL solutions against isolated in-memory{" "}
        <strong>PGlite (PostgreSQL WASM)</strong> instances with hand-authored test cases.
        Each problem&apos;s DDL, seed data, and expected result rows are defined in{" "}
        <code>src/data/test-cases.ts</code>.
      </p>

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
          margin: "1.5rem 0 1rem",
        }}
      >
        <button
          onClick={runAll}
          disabled={anyRunning}
          style={{
            padding: "10px 22px",
            fontWeight: 700,
            fontSize: "0.9rem",
            background: anyRunning ? "var(--surface)" : "#0284c7",
            color: anyRunning ? "var(--muted)" : "#fff",
            border: "1px solid #0369a1",
            borderRadius: "8px",
            cursor: anyRunning ? "not-allowed" : "pointer",
          }}
        >
          {anyRunning ? `Running… (${running.size} active)` : "▶ Run All 50 Tests"}
        </button>

        {done > 0 && (
          <div style={{ display: "flex", gap: "10px", fontSize: "0.9rem" }}>
            <span style={{ color: "#10b981", fontWeight: 600 }}>✅ {passes}</span>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>❌ {fails}</span>
            {errors > 0 && <span style={{ color: "#f59e0b", fontWeight: 600 }}>⚠️ {errors}</span>}
            <span style={{ color: "var(--muted)" }}>{done}/{total} done</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {done > 0 && (
        <div
          style={{
            height: "6px",
            borderRadius: "3px",
            background: "var(--border)",
            overflow: "hidden",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(passes / total) * 100}%`,
              background: "#10b981",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Test case rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {TEST_CASES.map((tc) => {
          const result = results[tc.id];
          const status: VerifyStatus = result?.status ?? "pending";
          const isRunningThis = running.has(tc.id);
          const isExpanded = expanded.has(tc.id);
          const hasDetail = result && (result.status === "fail" || result.status === "error");

          return (
            <div
              key={tc.id}
              style={{
                background: "var(--surface)",
                border: `1px solid ${result ? STATUS_COLOR[status] + "44" : "var(--border)"}`,
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* Row header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  flexWrap: "wrap",
                }}
              >
                {/* Problem link */}
                <span
                  style={{
                    fontFamily: "ui-monospace, monospace",
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                    minWidth: "40px",
                  }}
                >
                  #{tc.id}
                </span>
                <Link
                  href={`/problems/${tc.id}`}
                  style={{ flex: 1, fontSize: "0.9rem", fontWeight: 500, minWidth: "180px" }}
                >
                  {tc.title}
                </Link>

                {/* Status badge */}
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: result ? STATUS_COLOR[status] : "var(--muted)",
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  {isRunningThis ? "⏳ …" : result ? STATUS_LABEL[status] : "—"}
                </span>

                {/* Duration */}
                {result && result.status !== "pending" && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", minWidth: "50px", textAlign: "right" }}>
                    {result.durationMs}ms
                  </span>
                )}

                {/* Run button */}
                <button
                  onClick={() => runOne(tc.id)}
                  disabled={isRunningThis}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                    cursor: isRunningThis ? "not-allowed" : "pointer",
                  }}
                >
                  Run
                </button>

                {/* Expand toggle for failures */}
                {hasDetail && (
                  <button
                    onClick={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (isExpanded) next.delete(tc.id); else next.add(tc.id);
                        return next;
                      })
                    }
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                      borderRadius: "4px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {isExpanded ? "▲ Hide" : "▼ Details"}
                  </button>
                )}
              </div>

              {/* Expanded detail panel */}
              {isExpanded && result && (
                <div
                  style={{
                    padding: "10px 14px 14px",
                    borderTop: "1px solid var(--border)",
                    fontSize: "0.82rem",
                    fontFamily: "ui-monospace, monospace",
                  }}
                >
                  {result.message && (
                    <div
                      style={{
                        marginBottom: "10px",
                        padding: "8px 10px",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid #ef444466",
                        borderRadius: "5px",
                        color: "#fca5a5",
                      }}
                    >
                      {result.message}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <div style={{ color: "#ef4444", fontWeight: 600, marginBottom: "6px" }}>
                        Actual ({result.actual.length} rows)
                      </div>
                      <ResultTable rows={result.actual} />
                    </div>
                    <div>
                      <div style={{ color: "#10b981", fontWeight: 600, marginBottom: "6px" }}>
                        Expected ({result.expected.length} rows)
                      </div>
                      <ResultTable rows={result.expected} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "2rem", fontSize: "0.8rem", color: "var(--muted)" }}>
        Each test runs in an isolated PGlite instance — no shared state between problems.
        Comparison is set-based (order-independent) unless the solution has a deterministic ORDER BY.
      </div>
    </>
  );
}

// ─── small helper component ───────────────────────────────────────────────────

function ResultTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <span style={{ color: "var(--muted)" }}>(empty)</span>;
  }
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          borderCollapse: "collapse",
          fontSize: "0.78rem",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            {cols.map((c) => (
              <th
                key={c}
                style={{
                  padding: "4px 8px",
                  textAlign: "left",
                  color: "#93c5fd",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              {cols.map((c) => (
                <td
                  key={c}
                  style={{
                    padding: "4px 8px",
                    color: row[c] === null ? "var(--muted)" : "var(--text)",
                    fontStyle: row[c] === null ? "italic" : "normal",
                  }}
                >
                  {row[c] === null ? "NULL" : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
