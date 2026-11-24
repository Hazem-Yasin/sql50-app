"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import { createTableMesh, createJoinArc, TableMeshObject } from "./mesh-generators";
import { TableSchema, ExecutionStep } from "./types";

// Pre-configured Self-Join Scenario data for interactive demonstration
const DEMO_EMPLOYEES_TABLE: TableSchema = {
  name: "Employees",
  alias: "e1 (Worker)",
  color: "#3b82f6",
  position: [-8, 0, 0],
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
  position: [8, 0, 0],
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
  },
  {
    id: 2,
    type: "JOIN_MATCH",
    title: "3. Match Found: Alice -> Charlie",
    narration:
      "Match found! Alice's manager_id (3) matches Charlie's id (3) in e2. A 3D relation arc connects the two records.",
    matchedRowPair: ["e1_r1", "e2_r3"],
    passedCondition: true,
    sqlSnippet: "e1.manager_id (3) = e2.id (3) -> TRUE",
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
  },
  {
    id: 6,
    type: "COMPLETE",
    title: "7. Self Join Result Set Formed",
    narration:
      "Execution complete. The Self Join successfully paired workers with their corresponding managers in 3D.",
    sqlSnippet: "SELECT e1.name AS employee, e2.name AS manager",
  },
];

export interface Sql3DViewerProps {
  customTables?: TableSchema[];
  customSteps?: ExecutionStep[];
  title?: string;
}

export function Sql3DViewer({
  customTables,
  customSteps,
  title = "3D Interactive SQL Execution Engine",
}: Sql3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const tableObjectsRef = useRef<Map<string, TableMeshObject>>(new Map());
  const activeArcGroupRef = useRef<THREE.Group | null>(null);

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

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

    // Resize handler
    const handleResize = () => sceneManager.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      sceneManager.dispose();
      sceneManagerRef.current = null;
    };
  }, [customTables]);

  // Apply visual updates based on current step
  const applyStepVisuals = useCallback(
    (stepIndex: number) => {
      const step = steps[stepIndex];
      if (!step || !sceneManagerRef.current) return;

      // Remove existing arc
      if (activeArcGroupRef.current) {
        sceneManagerRef.current.worldGroup.remove(activeArcGroupRef.current);
        activeArcGroupRef.current = null;
      }

      // Reset all row highlights
      tableObjectsRef.current.forEach((tableObj) => {
        tableObj.rowMeshes.forEach((mesh) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.color.setHex(0x0f172a);
            mesh.material.emissive.setHex(0x000000);
          }
          mesh.position.y = 0.85;
        });
      });

      // Highlight active rows
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

      // Draw join connection arc
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
    },
    [steps]
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

  return (
    <div className="sql3d-container">
      {/* Header bar */}
      <div className="sql3d-header">
        <div className="sql3d-title-group">
          <span className="sql3d-status-dot" />
          <h3 className="sql3d-title">{title}</h3>
        </div>
        <button
          onClick={() => sceneManagerRef.current?.resetCamera()}
          className="sql3d-btn"
          title="Reset 3D Camera"
        >
          Reset Camera
        </button>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="sql3d-viewport">
        <div ref={containerRef} className="sql3d-canvas-wrap" />

        {/* Viewport instruction badge */}
        <div className="sql3d-badge-instructions">
          Left Drag: Rotate · Right Drag: Pan · Scroll: Zoom
        </div>

        {/* Step indicator pill */}
        <div className="sql3d-badge-step">
          Step {currentStepIdx + 1} of {steps.length}
        </div>
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
