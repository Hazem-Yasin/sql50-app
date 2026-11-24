import * as THREE from "three";
import { TableSchema, TableRow, ColumnDef } from "./types";

/**
 * Creates a high-res text sprite or canvas texture for labels in 3D
 */
export function createTextTexture(
  text: string,
  options: {
    fontSize?: number;
    fontColor?: string;
    bgColor?: string;
    borderColor?: string;
    width?: number;
    height?: number;
    align?: "left" | "center" | "right";
  } = {}
): THREE.CanvasTexture {
  const {
    fontSize = 28,
    fontColor = "#ffffff",
    bgColor = "rgba(15, 23, 42, 0.85)",
    borderColor = "#38bdf8",
    width = 256,
    height = 64,
    align = "center",
  } = options;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Background card with rounded corners
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, 8);
    ctx.fill();

    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Text rendering
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = fontColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = align;

    const x = align === "center" ? width / 2 : align === "left" ? 20 : width - 20;
    ctx.fillText(text, x, height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export interface TableMeshObject {
  group: THREE.Group;
  rowMeshes: Map<string, THREE.Mesh>;
  schema: TableSchema;
}

/**
 * Generates a full 3D interactive Table platform with header banners and row blocks
 */
export function createTableMesh(schema: TableSchema): TableMeshObject {
  const group = new THREE.Group();
  const [posX, posY, posZ] = schema.position || [0, 0, 0];
  group.position.set(posX, posY, posZ);

  const numCols = schema.columns.length;
  const numRows = Math.max(schema.rows.length, 3);
  
  const colWidth = 3.2;
  const rowHeight = 0.9;
  const rowDepth = 1.6;
  const tableWidth = numCols * colWidth + 0.6;
  const tableDepth = numRows * (rowDepth + 0.3) + 1.2;

  // 1. Table Base Platform
  const baseGeo = new THREE.BoxGeometry(tableWidth, 0.4, tableDepth);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.6,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Border glow outline
  const edgeGeo = new THREE.EdgesGeometry(baseGeo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: schema.color ? parseInt(schema.color.replace("#", "0x"), 16) : 0x38bdf8,
    linewidth: 2,
  });
  const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
  edgeLines.position.copy(baseMesh.position);
  group.add(edgeLines);

  // 2. Table Title Banner (Floating 3D billboard)
  const titleText = schema.alias ? `${schema.name} (${schema.alias})` : schema.name;
  const titleTexture = createTextTexture(titleText, {
    fontSize: 32,
    fontColor: "#f8fafc",
    bgColor: "rgba(30, 41, 59, 0.95)",
    borderColor: schema.color || "#38bdf8",
    width: 320,
    height: 72,
  });
  const titleMat = new THREE.SpriteMaterial({ map: titleTexture, transparent: true });
  const titleSprite = new THREE.Sprite(titleMat);
  titleSprite.scale.set(4.5, 1.1, 1);
  titleSprite.position.set(0, 3.8 + numRows * 0.2, -tableDepth / 2 - 0.8);
  group.add(titleSprite);

  // 3. Column Header Labels
  schema.columns.forEach((col, cIdx) => {
    const colX = -tableWidth / 2 + 0.6 + cIdx * colWidth + colWidth / 2;
    const headerTexture = createTextTexture(col.name, {
      fontSize: 24,
      fontColor: "#93c5fd",
      bgColor: "rgba(15, 23, 42, 0.9)",
      borderColor: "#60a5fa",
      width: 220,
      height: 56,
    });
    const headerMat = new THREE.SpriteMaterial({ map: headerTexture, transparent: true });
    const headerSprite = new THREE.Sprite(headerMat);
    headerSprite.scale.set(colWidth * 0.9, 0.7, 1);
    headerSprite.position.set(colX, 1.0, -tableDepth / 2 + 0.8);
    group.add(headerSprite);
  });

  // 4. Data Row Blocks
  const rowMeshes = new Map<string, THREE.Mesh>();

  schema.rows.forEach((row, rIdx) => {
    const rowZ = -tableDepth / 2 + 2.0 + rIdx * (rowDepth + 0.3);
    const rowGeo = new THREE.BoxGeometry(tableWidth - 0.6, rowHeight, rowDepth);
    const rowMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.5,
    });

    const rowMesh = new THREE.Mesh(rowGeo, rowMat);
    rowMesh.position.set(0, 0.4 + rowHeight / 2, rowZ);
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    rowMesh.name = `row_${row.id}`;

    // Add cell values as sprites onto the row
    schema.columns.forEach((col, cIdx) => {
      const colX = -tableWidth / 2 + 0.6 + cIdx * colWidth + colWidth / 2;
      const cellVal = row.values[col.name];
      const valText = cellVal === null ? "NULL" : String(cellVal);
      
      const cellTexture = createTextTexture(valText, {
        fontSize: 22,
        fontColor: cellVal === null ? "#94a3b8" : "#f1f5f9",
        bgColor: "rgba(30, 41, 59, 0.8)",
        borderColor: "#475569",
        width: 200,
        height: 50,
      });

      const cellMat = new THREE.SpriteMaterial({ map: cellTexture, transparent: true });
      const cellSprite = new THREE.Sprite(cellMat);
      cellSprite.scale.set(colWidth * 0.85, 0.55, 1);
      cellSprite.position.set(colX, 0.15, 0);
      rowMesh.add(cellSprite);
    });

    group.add(rowMesh);
    rowMeshes.set(row.id, rowMesh);
  });

  return { group, rowMeshes, schema };
}

export interface ResultPlatformObject {
  group: THREE.Group;
  /** Adds a row that drops in from above with bounce-ease physics. */
  addResultRow: (row: TableRow, columns: ColumnDef[], rowIndex: number) => THREE.Mesh;
  clearResults: () => void;
  resultRows: THREE.Mesh[];
  /** Call each frame to advance drop animations. */
  updateAnimations: (delta: number) => void;
}

/**
 * Creates an elevated Output / Result Set Platform for materialized queries
 */
export function createResultPlatformMesh(
  columns: ColumnDef[],
  position: [number, number, number] = [0, 0, 9]
): ResultPlatformObject {
  const group = new THREE.Group();
  const [posX, posY, posZ] = position;
  group.position.set(posX, posY, posZ);

  const numCols = Math.max(columns.length, 2);
  const colWidth = 3.2;
  const maxRows = 4;
  const rowHeight = 0.9;
  const rowDepth = 1.6;
  const platformWidth = numCols * colWidth + 0.8;
  const platformDepth = maxRows * (rowDepth + 0.3) + 1.4;

  // Platform Base
  const baseGeo = new THREE.BoxGeometry(platformWidth, 0.4, platformDepth);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Deep emerald surface
    roughness: 0.3,
    metalness: 0.7,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.2;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Emerald glowing wireframe edge
  const edgeGeo = new THREE.EdgesGeometry(baseGeo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x10b981,
    linewidth: 2,
  });
  const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
  edgeLines.position.copy(baseMesh.position);
  group.add(edgeLines);

  // Platform Header Billboard
  const titleTexture = createTextTexture("Result Output Stream", {
    fontSize: 28,
    fontColor: "#a7f3d0",
    bgColor: "rgba(6, 78, 59, 0.95)",
    borderColor: "#10b981",
    width: 300,
    height: 64,
  });
  const titleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: titleTexture, transparent: true }));
  titleSprite.scale.set(4.2, 0.95, 1);
  titleSprite.position.set(0, 3.2, -platformDepth / 2 - 0.7);
  group.add(titleSprite);

  // Column Headers
  columns.forEach((col, cIdx) => {
    const colX = -platformWidth / 2 + 0.6 + cIdx * colWidth + colWidth / 2;
    const headerTexture = createTextTexture(col.name, {
      fontSize: 22,
      fontColor: "#6ee7b7",
      bgColor: "rgba(6, 78, 59, 0.9)",
      borderColor: "#059669",
      width: 200,
      height: 52,
    });
    const headerSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: headerTexture, transparent: true }));
    headerSprite.scale.set(colWidth * 0.85, 0.6, 1);
    headerSprite.position.set(colX, 0.9, -platformDepth / 2 + 0.8);
    group.add(headerSprite);
  });

  const resultRows: THREE.Mesh[] = [];

  // Drop animations: { mesh, targetY, elapsed, duration }
  type DropAnim = { mesh: THREE.Mesh; targetY: number; elapsed: number; duration: number };
  const dropAnims: DropAnim[] = [];

  const addResultRow = (row: TableRow, cols: ColumnDef[], rIdx: number): THREE.Mesh => {
    const targetY = 0.4 + rowHeight / 2;
    const rowZ = -platformDepth / 2 + 2.0 + rIdx * (rowDepth + 0.3);
    const rowGeo = new THREE.BoxGeometry(platformWidth - 0.6, rowHeight, rowDepth);
    const rowMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      emissive: 0x047857,
      roughness: 0.3,
      metalness: 0.6,
    });

    const rowMesh = new THREE.Mesh(rowGeo, rowMat);
    // Start well above target — will drop into place
    rowMesh.position.set(0, targetY + 6, rowZ);
    rowMesh.castShadow = true;
    rowMesh.receiveShadow = true;
    rowMesh.name = `result_row_${row.id}`;

    // Add cell labels
    cols.forEach((col, cIdx) => {
      const colX = -platformWidth / 2 + 0.6 + cIdx * colWidth + colWidth / 2;
      const cellVal = row.values[col.name];
      const valText = cellVal === null ? "NULL" : String(cellVal);

      const cellTexture = createTextTexture(valText, {
        fontSize: 22,
        fontColor: "#ecfdf5",
        bgColor: "rgba(6, 78, 59, 0.85)",
        borderColor: "#10b981",
        width: 190,
        height: 48,
      });

      const cellSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: cellTexture, transparent: true }));
      cellSprite.scale.set(colWidth * 0.82, 0.52, 1);
      cellSprite.position.set(colX, 0.15, 0);
      rowMesh.add(cellSprite);
    });

    group.add(rowMesh);
    resultRows.push(rowMesh);

    // Register drop animation (bounce-ease, 0.55s)
    dropAnims.push({ mesh: rowMesh, targetY, elapsed: 0, duration: 0.55 });

    return rowMesh;
  };

  /** Bounce-ease easing: overshoots slightly then settles */
  function bounceEaseOut(t: number): number {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
    if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
    t -= 2.625 / 2.75;
    return 7.5625 * t * t + 0.984375;
  }

  const updateAnimations = (delta: number) => {
    for (let i = dropAnims.length - 1; i >= 0; i--) {
      const anim = dropAnims[i];
      anim.elapsed += delta;
      const t = Math.min(anim.elapsed / anim.duration, 1);
      const eased = bounceEaseOut(t);
      anim.mesh.position.y = anim.targetY + 6 * (1 - eased);
      if (t >= 1) dropAnims.splice(i, 1);
    }
  };

  const clearResults = () => {
    resultRows.forEach((rMesh) => {
      group.remove(rMesh);
      rMesh.geometry.dispose();
      if (Array.isArray(rMesh.material)) {
        rMesh.material.forEach((m) => m.dispose());
      } else {
        rMesh.material.dispose();
      }
    });
    resultRows.length = 0;
    dropAnims.length = 0;
  };

  return { group, addResultRow, clearResults, resultRows, updateAnimations };
}

export interface ArcObject {
  group: THREE.Group;
  /** Call each frame with accumulated time (seconds) to animate particles. */
  update: (time: number) => void;
}

/**
 * Creates an animated 3D Bezier Join Arc with flowing particle beam.
 * Returns an ArcObject whose update(time) must be called each frame.
 */
export function createJoinArc(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  color = 0x38bdf8
): ArcObject {
  const arcGroup = new THREE.Group();

  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const distance = startPos.distanceTo(endPos);
  midPoint.y += Math.max(distance * 0.35, 3.5);

  const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
  const points = curve.getPoints(60);
  const geo = new THREE.BufferGeometry().setFromPoints(points);

  // Solid thin base line
  const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  const line = new THREE.Line(geo, mat);
  arcGroup.add(line);

  // 5 particles travelling along the curve at staggered offsets
  const PARTICLE_COUNT = 5;
  const particles: THREE.Mesh[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pGeo = new THREE.SphereGeometry(0.18, 10, 10);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.9,
    });
    const pMesh = new THREE.Mesh(pGeo, pMat);
    arcGroup.add(pMesh);
    particles.push(pMesh);
  }

  const tmp = new THREE.Vector3();

  const update = (time: number) => {
    const SPEED = 0.45; // laps per second
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const offset = i / PARTICLE_COUNT;
      // t oscillates 0→1, looping
      const t = ((time * SPEED + offset) % 1 + 1) % 1;
      curve.getPoint(t, tmp);
      particles[i].position.copy(tmp);
      // Fade out at the tail end of each cycle so they don't pop
      const fade = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1;
      (particles[i].material as THREE.MeshBasicMaterial).opacity = fade * 0.9;
    }
  };

  return { group: arcGroup, update };
}
