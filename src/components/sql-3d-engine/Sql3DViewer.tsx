"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { SceneManager } from "./SceneManager";
import { ParticleSystem, ScannerBeam } from "./effects";
import { playSfx } from "./sounds";
import {
  createTableMesh,
  createResultPlatformMesh,
  createJoinArc,
  disposeObject3D,
  TableMeshObject,
  ResultPlatformObject,
  ArcObject,
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
  const activeArcRef = useRef<ArcObject | null>(null);
  // Dissolve animations: { mesh, elapsed, duration }
  type DissolveAnim = { mesh: THREE.Mesh; elapsed: number; duration: number };
  const dissolveAnims = useRef<DissolveAnim[]>([]);
  const particlesRef = useRef<ParticleSystem | null>(null);
  const beamRef = useRef<ScannerBeam | null>(null);
  const prevResultIdsRef = useRef<Set<string>>(new Set());
  // Smoothly-eased visual targets for source rows (colour, emissive, lift height)
  type RowTarget = { color: THREE.Color; emissive: THREE.Color; y: number };
  const rowTargets = useRef<Map<THREE.Mesh, RowTarget>>(new Map());
  const setRowTarget = useCallback(
    (mesh: THREE.Mesh, color: number, emissive: number, y: number) => {
      rowTargets.current.set(mesh, {
        color: new THREE.Color(color),
        emissive: new THREE.Color(emissive),
        y,
      });
    },
    []
  );

  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [directorMode, setDirectorMode] = useState<boolean>(false);
  const directorRef = useRef<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(false);
  const soundRef = useRef<boolean>(false);
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

    let elapsedTime = 0;
    const sceneManager = new SceneManager({
      container: containerRef.current,
      onAnimate: (delta) => {
        elapsedTime += delta;
        // Animate flowing particles on active join arc
        if (activeArcRef.current) {
          activeArcRef.current.update(elapsedTime);
        }
        // Advance result-row drop animations
        if (resultPlatformRef.current) {
          resultPlatformRef.current.updateAnimations(delta);
        }
        // Advance particle sparks and the scanner beam
        particlesRef.current?.update(delta);
        beamRef.current?.update(delta);
        // Ease source rows toward their target colour / glow / lift height
        const damp = 1 - Math.exp(-12 * delta);
        rowTargets.current.forEach((target, mesh) => {
          const mat = mesh.material;
          if (!(mat instanceof THREE.MeshStandardMaterial)) return;
          mat.color.lerp(target.color, damp);
          mat.emissive.lerp(target.emissive, damp);
          mesh.position.y += (target.y - mesh.position.y) * damp;
        });
        // Advance dissolve fade-outs for rejected rows
        const anims = dissolveAnims.current;
        for (let i = anims.length - 1; i >= 0; i--) {
          const a = anims[i];
          a.elapsed += delta;
          const t = Math.min(a.elapsed / a.duration, 1);
          if (a.mesh.material instanceof THREE.MeshStandardMaterial) {
            a.mesh.material.transparent = true;
            a.mesh.material.opacity = 1 - t * 0.72; // Fade to 28% opacity
          }
          if (t >= 1) anims.splice(i, 1);
        }
      },
    });
    sceneManagerRef.current = sceneManager;

    // Visual effects: particles + scanner beam
    const particles = new ParticleSystem();
    particles.disabled = sceneManager.reducedMotion;
    const beam = new ScannerBeam();
    sceneManager.scene.add(particles.points);
    sceneManager.scene.add(beam.mesh);
    particlesRef.current = particles;
    beamRef.current = beam;

    // Load tables into scene
    const tablesToLoad = customTables || [DEMO_EMPLOYEES_TABLE, DEMO_MANAGERS_TABLE];
    tableObjectsRef.current.clear();
    rowTargets.current.clear();
    prevResultIdsRef.current = new Set();

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
    // Size the platform to the largest result snapshot (min 4 rows)
    const maxResultRows = Math.max(
      4,
      ...(customSteps || DEMO_STEPS).map((s) => s.resultRowsSnapshot?.length ?? 0)
    );
    const resultPlatform = createResultPlatformMesh(outCols, outPos, maxResultRows);
    sceneManager.worldGroup.add(resultPlatform.group);
    resultPlatformRef.current = resultPlatform;

    // Raycasting for row hover inspection (candidates cached once per scene)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const candidates: {
      mesh: THREE.Mesh;
      tableName: string;
      row: { id: string; values: Record<string, unknown> };
    }[] = [];
    tableObjectsRef.current.forEach((tObj) => {
      tObj.rowMeshes.forEach((mesh, rowId) => {
        const rowData = tObj.schema.rows.find((r) => r.id === rowId);
        if (rowData) {
          candidates.push({ mesh, tableName: tObj.schema.alias || tObj.schema.name, row: rowData });
        }
      });
    });
    const candidateMeshes = candidates.map((c) => c.mesh);

    let hoverFrame: number | null = null;
    let lastHoverId: string | null = null;
    let pendingEvent: MouseEvent | null = null;

    const processHover = () => {
      hoverFrame = null;
      const e = pendingEvent;
      if (!e || !containerRef.current || !sceneManagerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, sceneManagerRef.current.camera);

      const intersects = raycaster.intersectObjects(candidateMeshes, false);
      const hit = intersects.length > 0 ? candidates.find((c) => c.mesh === intersects[0].object) : undefined;
      if (hit) {
        lastHoverId = hit.row.id;
        setHoveredRowInfo({
          tableName: hit.tableName,
          values: hit.row.values,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else if (lastHoverId !== null) {
        lastHoverId = null;
        setHoveredRowInfo(null);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      pendingEvent = e;
      if (hoverFrame === null) hoverFrame = requestAnimationFrame(processHover);
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener("mousemove", handleMouseMove);

    // Click-to-inspect: pin a row and light up its FK/PK relatives
    let downX = 0;
    let downY = 0;
    const handleDown = (e: MouseEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const handleClick = (e: MouseEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // was a drag
      if (!sceneManagerRef.current) return;
      const rect = containerEl.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, sceneManagerRef.current.camera);
      const hits = raycaster.intersectObjects(candidateMeshes, false);
      const hit = hits.length > 0 ? candidates.find((c) => c.mesh === hits[0].object) : undefined;

      // Restore every source row to its base look first
      tableObjectsRef.current.forEach((t) =>
        t.rowMeshes.forEach((m) => setRowTarget(m, 0x0f172a, 0x000000, 0.85))
      );
      if (!hit) return;

      setRowTarget(hit.mesh, 0x5b21b6, 0x7c3aed, 1.3);
      const hitTable = [...tableObjectsRef.current.values()].find((t) => t.rowMeshes.get(hit.row.id) === hit.mesh);
      if (!hitTable) return;
      const keyCols = (t: TableMeshObject, kind: "isPrimary" | "isForeign") =>
        t.schema.columns.filter((c) => c[kind]).map((c) => c.name);

      tableObjectsRef.current.forEach((other) => {
        other.schema.rows.forEach((r) => {
          if (r.id === hit.row.id) return;
          const relatedViaFk = keyCols(hitTable, "isForeign").some((fk) => {
            const v = hit.row.values[fk];
            return v !== null && v !== undefined && keyCols(other, "isPrimary").some((pk) => r.values[pk] === v);
          });
          const relatedViaPk = keyCols(hitTable, "isPrimary").some((pk) => {
            const v = hit.row.values[pk];
            return v !== null && v !== undefined && keyCols(other, "isForeign").some((fk) => r.values[fk] === v);
          });
          const mesh = other.rowMeshes.get(r.id);
          if (mesh && (relatedViaFk || relatedViaPk)) setRowTarget(mesh, 0x92400e, 0xf59e0b, 1.2);
        });
      });
    };
    containerEl.addEventListener("mousedown", handleDown);
    containerEl.addEventListener("click", handleClick);

    // Resize handler
    const handleResize = () => sceneManager.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      if (hoverFrame !== null) cancelAnimationFrame(hoverFrame);
      containerEl.removeEventListener("mousemove", handleMouseMove);
      containerEl.removeEventListener("mousedown", handleDown);
      containerEl.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      activeArcRef.current = null;
      particlesRef.current = null;
      beamRef.current = null;
      sceneManager.dispose();
      sceneManagerRef.current = null;
      resultPlatformRef.current = null;
    };
  }, [customTables, outputColumns, outputPosition, customSteps, setRowTarget]);

  // Apply visual updates based on current step
  const applyStepVisuals = useCallback(
    (stepIndex: number) => {
      const step = steps[stepIndex];
      if (!step || !sceneManagerRef.current) return;

      // 1. Remove existing arc
      if (activeArcRef.current) {
        sceneManagerRef.current.worldGroup.remove(activeArcRef.current.group);
        disposeObject3D(activeArcRef.current.group);
        activeArcRef.current = null;
      }

      // 2. Reset all source row highlights (restore opacity too)
      tableObjectsRef.current.forEach((tableObj) => {
        tableObj.rowMeshes.forEach((mesh) => {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.transparent = false;
            mesh.material.opacity = 1;
          }
          setRowTarget(mesh, 0x0f172a, 0x000000, 0.85);
        });
      });
      dissolveAnims.current.length = 0;

      // 3. Highlight active rows
      if (step.activeRowIds && step.activeRowIds.length > 0) {
        step.activeRowIds.forEach((rowId) => {
          tableObjectsRef.current.forEach((tableObj) => {
            const rowMesh = tableObj.rowMeshes.get(rowId);
            if (rowMesh && rowMesh.material instanceof THREE.MeshStandardMaterial) {
              if (step.passedCondition === false) {
                // Trigger dissolve fade-out for failed rows
                setRowTarget(rowMesh, 0x7f1d1d, 0x991b1b, 0.85);
                dissolveAnims.current.push({ mesh: rowMesh, elapsed: 0, duration: 0.65 });
                const rejectPos = new THREE.Vector3();
                rowMesh.getWorldPosition(rejectPos);
                particlesRef.current?.burst(rejectPos, 0xef4444, 36, 4.5, 3);
              } else {
                setRowTarget(rowMesh, 0x1e3a8a, 0x1d4ed8, 1.15); // Lift up row
                if (step.type === "SCAN_ROW" || step.type === "EVALUATE_PREDICATE") {
                  const box = new THREE.Box3().setFromObject(rowMesh);
                  beamRef.current?.sweep(rowMesh, box.max.x - box.min.x);
                }
              }
            }
          });
        });
      }

      // 4. Draw join connection arc with particle beam if rows matched
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
              setRowTarget(lMesh, 0x065f46, 0x059669, 1.25);
            }
          }
          const rMesh = tableObj.rowMeshes.get(rightId);
          if (rMesh) {
            rightPos = new THREE.Vector3();
            rMesh.getWorldPosition(rightPos);
            rightPos.y += 0.5;
            if (rMesh.material instanceof THREE.MeshStandardMaterial) {
              setRowTarget(rMesh, 0x065f46, 0x059669, 1.25);
            }
          }
        });

        if (leftPos && rightPos) {
          const arcObj = createJoinArc(leftPos, rightPos, 0x10b981);
          sceneManagerRef.current.worldGroup.add(arcObj.group);
          activeArcRef.current = arcObj;
          // Spark bursts at both ends of the match
          particlesRef.current?.burst(leftPos, 0x34d399, 30, 4, 1.5);
          particlesRef.current?.burst(rightPos, 0x34d399, 30, 4, 1.5);
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
        const seen = prevResultIdsRef.current;
        // Rows already shown last step stay put; new rows fly in from the match
        let origin: THREE.Vector3 | undefined;
        if (step.matchedRowPair) {
          const [leftId] = step.matchedRowPair;
          tableObjectsRef.current.forEach((tableObj) => {
            const m = tableObj.rowMeshes.get(leftId);
            if (m) {
              origin = new THREE.Vector3();
              m.getWorldPosition(origin);
              origin.y += 1;
            }
          });
        }
        const nextIds = new Set<string>();
        snapshot.forEach((row, rIdx) => {
          nextIds.add(row.id);
          const isNew = !seen.has(row.id);
          const mesh = resultPlatformRef.current?.addResultRow(
            row,
            activeCols,
            rIdx,
            isNew ? origin : undefined,
            !isNew
          );
          if (mesh && isNew && resultPlatformRef.current) {
            const burstPos = new THREE.Vector3();
            const platform = resultPlatformRef.current.group;
            platform.localToWorld(burstPos.set(0, 1.2, mesh.position.z));
            particlesRef.current?.burst(burstPos, 0x6ee7b7, 26, 3.5, 2);
          }
        });
        prevResultIdsRef.current = nextIds;
      }

      // 6. Sound effects (opt-in)
      if (soundRef.current) {
        if (step.passedCondition === false) playSfx("reject");
        else if (step.matchedRowPair) playSfx("match");
        else if (step.type === "SCAN_ROW" || step.type === "EVALUATE_PREDICATE") playSfx("scan");
        else if (step.type === "COMPLETE" || step.type === "EMIT_RESULT") playSfx("result");
      }

      // 7. Director mode: cinematic camera follows the action
      const sm = sceneManagerRef.current;
      if (directorRef.current && sm) {
        const focus = new THREE.Vector3();
        let dist = 22;
        if (step.matchedRowPair) {
          const pts: THREE.Vector3[] = [];
          step.matchedRowPair.forEach((id) =>
            tableObjectsRef.current.forEach((t) => {
              const m = t.rowMeshes.get(id);
              if (m) pts.push(m.getWorldPosition(new THREE.Vector3()));
            })
          );
          if (pts.length === 2) {
            focus.addVectors(pts[0], pts[1]).multiplyScalar(0.5);
            dist = Math.max(16, pts[0].distanceTo(pts[1]) * 1.1);
          }
        } else if (step.activeRowIds && step.activeRowIds.length > 0) {
          tableObjectsRef.current.forEach((t) => {
            const m = t.rowMeshes.get(step.activeRowIds![0]);
            if (m) m.getWorldPosition(focus);
          });
          dist = 15;
        } else if (step.type === "COMPLETE" || step.type === "EMIT_RESULT") {
          focus.set(0, 2, 7);
          dist = 20;
        } else {
          focus.set(0, 2, -2);
          dist = 26;
        }
        sm.focusOnPosition(focus, dist);
      }
    },
    [steps, outputColumns, setRowTarget]
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
    dissolveAnims.current.length = 0;
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
          <button
            onClick={() => {
              const next = !directorMode;
              setDirectorMode(next);
              directorRef.current = next;
              sceneManagerRef.current?.setAutoRotate(false);
              if (next) applyStepVisuals(currentStepIdx);
              else sceneManagerRef.current?.resetCamera();
            }}
            className={`sql3d-btn ${directorMode ? "sql3d-btn-primary" : ""}`}
            title="Cinematic camera follows the action"
          >
            🎬 Director
          </button>
          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              soundRef.current = next;
              if (next) playSfx("result");
            }}
            className={`sql3d-btn ${soundOn ? "sql3d-btn-primary" : ""}`}
            title="Toggle sound effects"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
          <button
            onClick={() => {
              const url = sceneManagerRef.current?.captureImage();
              if (!url) return;
              const a = document.createElement("a");
              a.href = url;
              a.download = `sql3d-step-${currentStepIdx + 1}.png`;
              a.click();
            }}
            className="sql3d-btn"
            title="Save a screenshot of the current step"
          >
            📷
          </button>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div className="sql3d-viewport">
        <div ref={containerRef} className="sql3d-canvas-wrap" />

        {/* Viewport instruction badge */}
        <div className="sql3d-badge-instructions">
          Hover: Inspect · Click: Pin &amp; Show Relations · Left Drag: Rotate · Right Drag: Pan · Scroll: Zoom
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

      {/* Timeline scrubber */}
      <div className="sql3d-timeline">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={currentStepIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStepIdx(Number(e.target.value));
          }}
          className="sql3d-scrubber"
          aria-label="Execution timeline"
        />
        <div className="sql3d-timeline-ticks">
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIdx(i);
              }}
              className={`sql3d-tick sql3d-tick-${s.type.toLowerCase()} ${i === currentStepIdx ? "active" : ""} ${i < currentStepIdx ? "done" : ""}`}
              title={s.title}
              aria-label={`Go to step ${i + 1}: ${s.title}`}
            />
          ))}
        </div>
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
