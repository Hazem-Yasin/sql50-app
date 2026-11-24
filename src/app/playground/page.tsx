"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sql3DViewer, CONCEPT_SCENARIOS } from "@/components/sql-3d-engine";

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

export default function PlaygroundPage() {
  const [selectedKey, setSelectedKey] = useState<string>("self-join");
  const scenario = CONCEPT_SCENARIOS[selectedKey] || CONCEPT_SCENARIOS["self-join"];

  return (
    <>
      <p className="crumbs">
        <Link href="/">Home</Link> / 3D SQL Playground
      </p>

      <h1>3D SQL Interactive Playground</h1>
      <p className="lead">
        Explore relational database operations rendered in real-time 3D space. Select a scenario
        below to watch tables spawn, records scan, relation arcs form, and result sets materialize onto
        the Output Platform.
      </p>

      {/* Scenario Selector Tabs */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "1.5rem 0" }}>
        {AVAILABLE_SCENARIOS.map((s) => {
          const isActive = selectedKey === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSelectedKey(s.key)}
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

      {/* 3D SQL Viewer Viewport */}
      <Sql3DViewer
        key={selectedKey}
        title={scenario.title}
        customTables={scenario.tables}
        outputColumns={scenario.outputColumns}
        outputPosition={scenario.outputPosition}
        customSteps={scenario.steps}
      />

      {/* Related Concept Link */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3>Explore the Concept In Depth</h3>
        <p>
          Read full explanations, common pitfalls, and LeetCode SQL 50 problems related to this topic:
        </p>
        <p style={{ marginTop: "8px" }}>
          <Link href={`/concepts/${selectedKey}`} style={{ fontWeight: 600 }}>
            Open Concept Guide: {AVAILABLE_SCENARIOS.find((s) => s.key === selectedKey)?.label} →
          </Link>
        </p>
      </div>
    </>
  );
}
