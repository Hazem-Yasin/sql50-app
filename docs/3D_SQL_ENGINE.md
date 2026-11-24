# 3D SQL Visualization Engine Documentation

## 1. Vision & Purpose

The 3D SQL Engine is an interactive, visual SQL execution and demonstration system built with Three.js. It transforms abstract relational database concepts (such as Self Joins, Cross Joins, Group By, Window Functions, and Filtering) into intuitive 3D spatial representations.

Users can watch SQL queries execute step-by-step: tables spawn as 3D platforms, rows slide into place, join conditions draw glowing bezier arcs between matching records, and resulting datasets materialize onto an output platform.

---

## 2. System Architecture

The engine is decoupled into three independent layers located in `src/components/sql-3d-engine/`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. SQL Execution Layer                          │
│  • In-memory SQL simulator & query step generator                     │
│  • Emits a step-by-step visual timeline of execution events:          │
│    CreateTable → InsertRows → Scan/Filter → JoinEvaluate → EmitResult  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Timeline Events
┌───────────────────────────────────▼────────────────────────────────────┐
│                       2. Three.js 3D Scene Layer                       │
│  • SceneManager (Scene, Camera, OrbitControls, Dark Grid Studio)      │
│  • TableMesh (3D glass/metallic table frames with column slots)        │
│  • RowBlockMesh (3D cuboid data blocks with values, labels & glows)    │
│  • JoinConnector (Animated laser/bezier arcs linking matching keys)    │
│  • ResultPlatform (Output zone where resulting rows materialize)       │
│  • Animation Engine (Transitions, scan pulses, dissolves)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Viewport & Controls
┌───────────────────────────────────▼────────────────────────────────────┐
│                        3. Interactive UI Layer                         │
│  • Timeline Controls: Play, Pause, Step Next/Prev, Speed Slider        │
│  • Step Narration: Explains what the SQL engine is doing at each step  │
│  • Live SQL Console: Run custom queries or switch pre-built scenarios │
│  • Concept Embed Widget: Embedded directly into `/concepts` pages      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Visual Representation Mapping

| SQL Concept / Entity | 3D Spatial Representation |
| :--- | :--- |
| **Table** | A rectangular elevated grid platform labeled with column headers. Dimensions scale dynamically with column count and row capacity. |
| **Row / Record** | A 3D cuboid block sitting in a table slot. Displays cell values and glows upon selection or scanning. |
| **Column** | A segmented vertical column lane along the table platform. |
| **CREATE TABLE** | A new 3D platform materializes onto the scene canvas with column headers. |
| **INSERT INTO** | Data cuboids fall smoothly from above and lock into their designated row slots. |
| **WHERE / Filter** | Active scanline sweeps through rows. Matching rows lift up with an emerald glow; non-matching rows dim and fade. |
| **JOIN (Inner / Left)** | Two distinct 3D table platforms positioned side by side. Matching keys shoot glowing connecting bezier arcs between them. |
| **SELF JOIN** | Spawns two holographic alias instances of the same table (e.g., `e1` and `e2`). Glowing rays link matching attributes (e.g., `e1.manager_id == e2.employee_id`), producing merged output rows. |
| **GROUP BY / Aggregation** | Matching blocks slide across the floor and stack into group clusters, then fuse into aggregated summary blocks. |
| **Result Set** | Merged or projected rows are transported to a central "Output Platform" reflecting the final query output. |

---

## 4. Implementation Roadmap

### Phase 1: Engine Core & 3D Canvas Foundation
- Dependencies: `three` and `@types/three`.
- Core canvas wrapper (`Sql3DCanvas.tsx`), resize observer, dark studio environment, lighting, grid plane, and orbit controls.
- Camera positioning presets (Isometric view, Top-down view, Table focus).

### Phase 2: 3D Meshes & Visual Entities
- `TableMesh`: Table platform geometry, column labels using HTML overlays / canvas sprites, grid slots.
- `RowMesh`: 3D data blocks with text textures, hover state, scan-highlight materials.
- `JoinConnector`: Dynamic cubic Bezier curves with flowing particle / laser shader effects.
- `ResultPlatform`: Dedicated materialization platform for result sets.

### Phase 3: SQL Simulation & Execution Timeline
- Query AST / Execution timeline generator.
- Step emitter producing discrete event frames:
  - `CREATE_TABLE`
  - `INSERT_ROWS`
  - `SCAN_ROW`
  - `EVALUATE_PREDICATE`
  - `JOIN_MATCH`
  - `EMIT_RESULT_ROW`
- Support for key scenarios: `SELECT/WHERE`, `INNER JOIN`, `LEFT JOIN`, `SELF JOIN`, and `GROUP BY`.

### Phase 4: Interactive Player & Narration UI
- Play/Pause, Step Forward, Step Back, Reset, Speed Control.
- Step Explanation Box: Live narration explaining the relational algebra at each step.
- SQL code highlighter synchronizing the highlighted SQL clause with the active 3D step.

### Phase 5: Integration with Concept Pages
- Embed the 3D widget into `/concepts` (starting with `self-join`).
- Standalone `/playground` or 3D explorer page for testing arbitrary queries.
