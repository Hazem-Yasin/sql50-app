"use client";

/**
 * ProblemViewer.tsx
 *
 * Client component that lazy-loads Sql3DViewer (heavy Three.js bundle)
 * only on the browser, embedded inside server-rendered problem pages.
 * Renders nothing on the server (ssr: false dynamic import).
 */

import dynamic from "next/dynamic";
import { ConceptScenario } from "@/components/sql-3d-engine/concept-scenarios";

// Dynamically import the full 3D viewer — skips SSR entirely
const Sql3DViewer = dynamic(
  () =>
    import("@/components/sql-3d-engine/Sql3DViewer").then((m) => ({
      default: m.Sql3DViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          color: "var(--muted)",
          fontSize: "0.9rem",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        Loading 3D Visualizer…
      </div>
    ),
  }
);

interface ProblemViewerProps {
  scenario: ConceptScenario;
}

export function ProblemViewer({ scenario }: ProblemViewerProps) {
  return (
    <Sql3DViewer
      title={scenario.title}
      customTables={scenario.tables}
      outputColumns={scenario.outputColumns}
      outputPosition={scenario.outputPosition}
      customSteps={scenario.steps}
    />
  );
}
