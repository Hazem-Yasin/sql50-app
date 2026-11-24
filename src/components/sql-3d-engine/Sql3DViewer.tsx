"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import {
  createTableMesh,
  createResultPlatformMesh,
  createJoinArc,
  TableMeshObject,
  ResultPlatformObject,
} from "./mesh-generators";
import { TableSchema, ExecutionStep, ColumnDef } from "./types";

// Pre-configured Self-Join Scenario data for interactive demonstration
const DEMO_EMPLOYEES_TABLE: TableSchema = {
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
};

const DEMO_MANAGERS_TABLE: TableSchema = {
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
};

const DEMO_STEPS: ExecutionStep[] = [
  {
    id: 0,
    type: "CREATE_TABLE",
    title: "1. Instantiate Aliases in 3D Space",
    narration:
      "A Self Join queries the same table twice. We spawn two 3D representations of 'Employees': 'e1' as the worker perspective and 'e2' as the manager perspective.",
    sqlSnippet: "FROM Employees e1 JOIN Employees e2",
    resultRowsSnapshot: [],
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
    resultRowsSnapshot: [],
  },
  {
    id: 2,
    type: "JOIN_MATCH",
    title: "3. Match Found: Alice -> Charlie",
    narration:
      "Match found! Alice's manager_id (3) matches Charlie's id (3) in e2. A 3D relation arc connects the two records and emits a result row.",
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
      "Evaluating Bob (id: 2, manager_id: 3). We search e2 for a row where e2.id = 3.",
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
      "Match found! Bob's manager_id (3) matches Charlie's id (3) in e2. Another join relation is formed.",
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
];

export interface Sql3DViewerProps {
  customTables?: TableSchema[];
  outputColumns?: ColumnDef[];
  outputPosition?: [number, number, number];
  customSteps?: ExecutionStep[];
  title?: string;
}

export function Sql3DViewer({
  customTables,
  outputColumns,
  outputPosition,
  customSteps,
  title = "3D Interactive SQL Execution Engine",
}: Sql3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const tableObjectsRef = useRef<Map<string, TableMeshObject>>(new Map());
  const resultPlatformRef = useRef<ResultPlatformObject | null>(null);
  const activeArcGroupRef = useRef<THREE.Group | null>(null);

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [hoveredRowInfo, setHoveredRowInfo] = useState<{
    tableName: string;
    values: Record<string, unknown>;
    x: number;
    y: number;
  } | null>(null);

  const steps = customSteps || DEMO_STEPS;
  const currentStep = steps[currentStepIdx] || steps[0];

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    let pulseTime = 0;
    const sceneManager = new SceneManager({
      container: containerRef.current,
      onAnimate: (delta) => {
        pulseTime += delta * 2;
        // Animate join arc pulse if active
        if (activeArcGroupRef.current) {
          const pulseMesh = activeArcGroupRef.current.children[1] as THREE.Mesh | undefined;
          if (pulseMesh) {
            pulseMesh.scale.setScalar(1 + Math.sin(pulseTime * 4) * 0.25);
          }
        }
      },
    });
    sceneManagerRef.current = sceneManager;

    // Load tables into scene
    const tablesToLoad = customTables || [DEMO_EMPLOYEES_TABLE, DEMO_MANAGERS_TABLE];
    tableObjectsRef.current.clear();

    tablesToLoad.forEach((tableSchema) => {
      const tableObj = createTableMesh(tableSchema);
      sceneManager.worldGroup.add(tableObj.group);
      tableObjectsRef.current.set(tableSchema.alias || tableSchema.name, tableObj);
    });

    // Load Output Platform if output columns are defined
    const outCols = outputColumns || [
      { name: "employee", type: "VARCHAR" },
      { name: "manager", type: "VARCHAR" },
    ];
    const outPos = outputPosition || [0, 0, 7];
    const resultPlatform = createResultPlatformMesh(outCols, outPos);
    sceneManager.worldGroup.add(resultPlatform.group);
    resultPlatformRef.current = resultPlatform;

    // Raycasting for row hover inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !sceneManagerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, sceneManagerRef.current.camera);

      // Collect all candidate row meshes
      const candidateMeshes: { mesh: THREE.Mesh; tableName: string; row: { id: string; values: Record<string, unknown> } }[] = [];
      tableObjectsRef.current.forEach((tObj) => {
        tObj.rowMeshes.forEach((mesh, rowId) => {
          const rowData = tObj.schema.rows.find((r) => r.id === rowId);
          if (rowData) {
            candidateMeshes.push({ mesh, tableName: tObj.schema.alias || tObj.schema.name, row: rowData });
          }
        });
      });

      const intersects = raycaster.intersectObjects(candidateMeshes.map((c) => c.mesh));
      if (intersects.length > 0) {
        const hit = candidateMeshes.find((c) => c.mesh === intersects[0].object);
        if (hit) {
          setHoveredRowInfo({
            tableName: hit.tableName,
            values: hit.row.values,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }
      setHoveredRowInfo(null);
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => sceneManager.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      containerEl.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      sceneManager.dispose();
      sceneManagerRef.current = null;
      resultPlatformRef.current = null;
    };
  }, [customTables, outputColumns, outputPosition]);

  // Apply visual updates based on current step
  const applyStepVisuals = useCallback(
    (stepIndex: number) => {
      const step = steps[stepIndex];
      if (!step || !sceneManagerRef.current) return;

      // 1. Remove existing arc
      if (activeArcGroupRef.current) {
        sceneManagerRef.current.worldGroup.remove(activeArcGroupRef.current);
        activeArcGroupRef.current = null;
      }

      // 2. Reset all source row highlights
      tableObjectsRef.current.forEach((tableObj) => {
        tableObj.rowMeshes.forEach((mesh) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.color.setHex(0x0f172a);
            mesh.material.emissive.setHex(0x000000);
          }
          mesh.position.y = 0.85;
        });
      });

      // 3. Highlight active rows
      if (step.activeRowIds && step.activeRowIds.length > 0) {
        step.activeRowIds.forEach((rowId) => {
          tableObjectsRef.current.forEach((tableObj) => {
            const rowMesh = tableObj.rowMeshes.get(rowId);
            if (rowMesh && rowMesh.material instanceof THREE.MeshStandardMaterial) {
              rowMesh.material.color.setHex(0x1e3a8a);
              rowMesh.material.emissive.setHex(0x1d4ed8);
              rowMesh.position.y = 1.15; // Lift up row
            }
          });
        });
      }

      // 4. Draw join connection arc if rows matched
      if (step.matchedRowPair) {
        const [leftId, rightId] = step.matchedRowPair;
        let leftPos: THREE.Vector3 | null = null;
        let rightPos: THREE.Vector3 | null = null;

        tableObjectsRef.current.forEach((tableObj) => {
          const lMesh = tableObj.rowMeshes.get(leftId);
          if (lMesh) {
            leftPos = new THREE.Vector3();
            lMesh.getWorldPosition(leftPos);
            leftPos.y += 0.5;
            if (lMesh.material instanceof THREE.MeshStandardMaterial) {
              lMesh.material.color.setHex(0x065f46);
              lMesh.material.emissive.setHex(0x059669);
              lMesh.position.y = 1.25;
            }
          }
          const rMesh = tableObj.rowMeshes.get(rightId);
          if (rMesh) {
            rightPos = new THREE.Vector3();
            rMesh.getWorldPosition(rightPos);
            rightPos.y += 0.5;
            if (rMesh.material instanceof THREE.MeshStandardMaterial) {
              rMesh.material.color.setHex(0x065f46);
              rMesh.material.emissive.setHex(0x059669);
              rMesh.position.y = 1.25;
            }
          }
        });

        if (leftPos && rightPos) {
          const arc = createJoinArc(leftPos, rightPos, 0x10b981);
          sceneManagerRef.current.worldGroup.add(arc);
          activeArcGroupRef.current = arc;
        }
      }

      // 5. Update Output Platform result rows snapshot
      if (resultPlatformRef.current) {
        resultPlatformRef.current.clearResults();
        const activeCols = outputColumns || [
          { name: "employee", type: "VARCHAR" },
          { name: "manager", type: "VARCHAR" },
        ];
        const snapshot = step.resultRowsSnapshot || [];
        snapshot.forEach((row, rIdx) => {
          resultPlatformRef.current?.addResultRow(row, activeCols, rIdx);
        });
      }
    },
    [steps, outputColumns]
  );

  // Trigger step update
  useEffect(() => {
    applyStepVisuals(currentStepIdx);
  }, [currentStepIdx, applyStepVisuals]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2800 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, steps.length]);

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
    sceneManagerRef.current?.resetCamera();
  };

  const handleFocus = (view: "overview" | "tables" | "output") => {
    if (!sceneManagerRef.current) return;
    if (view === "overview") {
      sceneManagerRef.current.resetCamera();
    } else if (view === "tables") {
      sceneManagerRef.current.focusOnPosition(new THREE.Vector3(0, 2, -3), 18);
    } else if (view === "output") {
      sceneManagerRef.current.focusOnPosition(new THREE.Vector3(0, 2, 7), 14);
    }
  };

  return (
    <div className="sql3d-container">
      {/* Header bar */}
      <div className="sql3d-header">
        <div className="sql3d-title-group">
          <span className="sql3d-status-dot" />
          <h3 className="sql3d-title">{title}</h3>
        </div>
        <div className="sql3d-btn-group">
          <button
            onClick={() => handleFocus("overview")}
            className="sql3d-btn"
            title="Overview Camera View"
          >
            Overview
          </button>
          <button
            onClick={() => handleFocus("tables")}
            className="sql3d-btn"
            title="Focus Source Tables"
          >
            Tables
          </button>
          <button
            onClick={() => handleFocus("output")}
            className="sql3d-btn"
            title="Focus Result Output"
          >
            Output
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="sql3d-viewport">
        <div ref={containerRef} className="sql3d-canvas-wrap" />

        {/* Viewport instruction badge */}
        <div className="sql3d-badge-instructions">
          Hover: Inspect · Left Drag: Rotate · Right Drag: Pan · Scroll: Zoom
        </div>

        {/* Step indicator pill */}
        <div className="sql3d-badge-step">
          Step {currentStepIdx + 1} of {steps.length}
        </div>

        {/* Hover Raycast Tooltip */}
        {hoveredRowInfo && (
          <div
            style={{
              position: "absolute",
              left: `${Math.min(hoveredRowInfo.x + 15, 600)}px`,
              top: `${Math.max(hoveredRowInfo.y - 15, 10)}px`,
              pointerEvents: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid #38bdf8",
              boxShadow: "0 8px 16px rgba(0,0,0,0.5)",
              color: "#f8fafc",
              fontSize: "0.8rem",
              zIndex: 30,
              minWidth: "160px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#38bdf8", marginBottom: "4px" }}>
              {hoveredRowInfo.tableName}
            </div>
            {Object.entries(hoveredRowInfo.values).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <span style={{ color: "#94a3b8" }}>{k}:</span>
                <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{v === null ? "NULL" : String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Narration & SQL Code Box */}
      <div className="sql3d-narration-box">
        <div className="sql3d-narration-header">
          <h4 className="sql3d-step-title">{currentStep.title}</h4>
          {currentStep.sqlSnippet && (
            <code className="sql3d-sql-snippet">{currentStep.sqlSnippet}</code>
          )}
        </div>
        <p className="sql3d-narration-text">{currentStep.narration}</p>
      </div>

      {/* Playback & Step Controls Bar */}
      <div className="sql3d-controls-bar">
        {/* Step Navigation */}
        <div className="sql3d-btn-group">
          <button onClick={handleReset} className="sql3d-btn">
            Restart
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className="sql3d-btn"
          >
            ◀ Prev
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="sql3d-btn sql3d-btn-primary"
          >
            {isPlaying ? "Pause ❚❚" : "Play ▶"}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStepIdx === steps.length - 1}
            className="sql3d-btn"
          >
            Next ▶
          </button>
        </div>

        {/* Speed Selector */}
        <div className="sql3d-speed-selector">
          <span>Speed:</span>
          {[0.5, 1, 2].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`sql3d-speed-btn ${playbackSpeed === speed ? "active" : ""}`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
