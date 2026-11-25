"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConceptScenario } from "./concept-scenarios";
import { buildErdLayout, colY, ERD, ErdBox } from "./erd-layout";
import { CellValue } from "./types";

interface ErdViewerProps {
  scenario: ConceptScenario;
}

const GREEN = "#10b981";
const RED = "#ef4444";
const AMBER = "#f59e0b";

function fmt(v: CellValue | undefined): string {
  if (v === null || v === undefined) return "NULL";
  const s = String(v);
  return s.length > 9 ? s.slice(0, 8) + "…" : s;
}

function edgePath(a: ErdBox, ay: number, b: ErdBox, by: number): string {
  const aLeftOfB = a.x + a.w <= b.x;
  const bLeftOfA = b.x + b.w <= a.x;
  if (a === b) {
    const x = a.x + a.w;
    return `M ${x} ${ay} C ${x + 50} ${ay}, ${x + 50} ${by}, ${x} ${by}`;
  }
  const x1 = aLeftOfB ? a.x + a.w : bLeftOfA ? a.x : a.x + a.w;
  const x2 = aLeftOfB ? b.x : bLeftOfA ? b.x + b.w : b.x + b.w;
  const dx = Math.max(40, Math.abs(x2 - x1) / 2) * (x2 >= x1 ? 1 : -1);
  return `M ${x1} ${ay} C ${x1 + dx} ${ay}, ${x2 - dx} ${by}, ${x2} ${by}`;
}

export function ErdViewer({ scenario }: ErdViewerProps) {
  const layout = useMemo(() => buildErdLayout(scenario), [scenario]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= scenario.steps.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 2200);
    return () => window.clearInterval(id);
  }, [playing, scenario.steps.length]);

  const current = scenario.steps[Math.min(step, scenario.steps.length - 1)];
  const active = new Set(current.activeRowIds ?? []);
  if (current.matchedRowPair) current.matchedRowPair.forEach((id) => active.add(id));
  const rejected = current.passedCondition === false;
  const rowColor = rejected ? RED : current.matchedRowPair ? GREEN : AMBER;
  const resultRows = current.resultRowsSnapshot ?? [];

  // locate a source row inside the drawn boxes
  const rowPos = (rowId: string): { box: ErdBox; y: number } | null => {
    for (const b of layout.boxes) {
      const i = b.rows.findIndex((r) => r.id === rowId);
      if (i >= 0 && i < ERD.maxRows) {
        const y = b.y + ERD.headH + b.columns.length * ERD.colH + 10 + i * ERD.rowH + ERD.rowH / 2;
        return { box: b, y };
      }
    }
    return null;
  };

  const resultBox = layout.boxes.find((b) => b.isResult);
  const pair = current.matchedRowPair?.map(rowPos);
  const boxByKey = (k: string) => layout.boxes.find((b) => b.key === k)!;

  return (
    <div className="sql3d-container">
      <div className="sql3d-header">
        <div className="sql3d-title-group">
          <span className="sql3d-status-dot" />
          <h3 className="sql3d-title">ERD view: {scenario.title}</h3>
        </div>
      </div>
      <div className="sql3d-viewport" style={{ height: "auto", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            display: "block",
            margin: "0 auto",
            width: "100%",
            maxWidth: layout.width,
            height: "auto",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <defs>
            <marker id="erd-many" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L10,5 L0,10" fill="none" stroke="#64748b" strokeWidth="1.5" />
            </marker>
          </defs>

          {/* foreign key relations */}
          {layout.relations.map((r, i) => {
            const a = boxByKey(r.from);
            const b = boxByKey(r.to);
            const ai = a.columns.findIndex((c) => c.name === r.fromCol);
            const bi = b.columns.findIndex((c) => c.name === r.toCol);
            return (
              <path
                key={i}
                d={edgePath(a, colY(a, ai), b, colY(b, bi))}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.6"
                strokeDasharray="5 4"
                markerEnd="url(#erd-many)"
              />
            );
          })}

          {/* table boxes */}
          {layout.boxes.map((b) => {
            const rowsTop = b.y + ERD.headH + b.columns.length * ERD.colH + 10;
            const rows = b.isResult ? [] : b.rows.slice(0, ERD.maxRows);
            return (
              <g key={b.key}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill="#0f172a" stroke={b.color} strokeWidth="1.6" />
                <path
                  d={`M ${b.x} ${b.y + ERD.headH} V ${b.y + 8} Q ${b.x} ${b.y} ${b.x + 8} ${b.y} H ${b.x + b.w - 8} Q ${b.x + b.w} ${b.y} ${b.x + b.w} ${b.y + 8} V ${b.y + ERD.headH} Z`}
                  fill={b.color}
                  opacity="0.85"
                />
                <text x={b.x + 12} y={b.y + 22} fontSize="13" fontWeight="700" fill="#fff">
                  {b.title.length > 28 ? b.title.slice(0, 27) + "…" : b.title}
                </text>

                {b.columns.map((c, i) => (
                  <g key={c.name}>
                    <text x={b.x + 12} y={colY(b, i) + 4} fontSize="11.5" fill="#e2e8f0">
                      {c.isPrimary ? "PK " : c.isForeign ? "FK " : ""}
                      {c.name}
                    </text>
                    <text x={b.x + b.w - 12} y={colY(b, i) + 4} fontSize="10" fill="#64748b" textAnchor="end">
                      {c.type}
                    </text>
                  </g>
                ))}

                {rows.length > 0 && (
                  <line x1={b.x + 8} x2={b.x + b.w - 8} y1={rowsTop - 5} y2={rowsTop - 5} stroke="#1e293b" />
                )}
                {rows.map((r, i) => {
                  const y = rowsTop + i * ERD.rowH;
                  const on = active.has(r.id);
                  return (
                    <g key={r.id}>
                      <rect
                        x={b.x + 4}
                        y={y}
                        width={b.w - 8}
                        height={ERD.rowH - 2}
                        rx="4"
                        fill={on ? rowColor : "transparent"}
                        fillOpacity={on ? 0.28 : 1}
                        stroke={on ? rowColor : "none"}
                      />
                      <text x={b.x + 10} y={y + 13} fontSize="10.5" fill={on ? "#fff" : "#94a3b8"}>
                        {b.columns.map((c) => fmt(r.values[c.name])).join(" · ")}
                      </text>
                    </g>
                  );
                })}
                {!b.isResult && b.rows.length > ERD.maxRows && (
                  <text x={b.x + 10} y={rowsTop + ERD.maxRows * ERD.rowH + 12} fontSize="10" fill="#64748b">
                    + {b.rows.length - ERD.maxRows} more rows
                  </text>
                )}
              </g>
            );
          })}

          {/* match link between two matched rows */}
          {pair && pair.length === 2 && pair[0] && pair[1] && (
            <path
              d={edgePath(pair[0].box, pair[0].y, pair[1].box, pair[1].y)}
              fill="none"
              stroke={GREEN}
              strokeWidth="2.4"
            />
          )}

          {/* result rows listed under the Result box */}
          {resultBox &&
            resultRows.slice(-ERD.maxRows).map((r, i) => {
              const y = resultBox.y + resultBox.h + 6 + i * ERD.rowH;
              return (
                <g key={r.id}>
                  <rect
                    x={resultBox.x + 4}
                    y={y}
                    width={resultBox.w - 8}
                    height={ERD.rowH - 2}
                    rx="4"
                    fill={GREEN}
                    fillOpacity={0.22}
                    stroke={GREEN}
                  />
                  <text x={resultBox.x + 10} y={y + 13} fontSize="10.5" fill="#fff">
                    {resultBox.columns.map((c) => fmt(r.values[c.name])).join(" · ")}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      <div className="sql3d-narration-box">
        <div className="sql3d-narration-header">
          <h4 className="sql3d-step-title">{current.title}</h4>
          {current.sqlSnippet && <code className="sql3d-sql-snippet">{current.sqlSnippet}</code>}
        </div>
        <p className="sql3d-narration-text">{current.narration}</p>
      </div>
      <div className="sql3d-controls-bar">
        <div className="sql3d-btn-group">
          <button className="sql3d-btn" onClick={() => setStep(0)}>
            Restart
          </button>
          <button className="sql3d-btn" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Prev
          </button>
          <button className="sql3d-btn sql3d-btn-primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            className="sql3d-btn"
            disabled={step >= scenario.steps.length - 1}
            onClick={() => setStep((s) => Math.min(scenario.steps.length - 1, s + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
