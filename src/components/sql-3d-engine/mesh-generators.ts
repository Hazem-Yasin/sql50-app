import * as THREE from "three";
import { TableSchema } from "./types";

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

/**
 * Creates an animated 3D Bezier Join Arc between two row positions
 */
export function createJoinArc(
  startPos: THREE.Vector3,
  endPos: THREE.Vector3,
  color = 0x38bdf8
): THREE.Group {
  const arcGroup = new THREE.Group();

  const midPoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
  const distance = startPos.distanceTo(endPos);
  midPoint.y += Math.max(distance * 0.35, 3.5); // Arc height

  const curve = new THREE.QuadraticBezierCurve3(startPos, midPoint, endPos);
  const points = curve.getPoints(40);
  const geo = new THREE.BufferGeometry().setFromPoints(points);

  const mat = new THREE.LineDashedMaterial({
    color,
    linewidth: 3,
    scale: 1,
    dashSize: 0.6,
    gapSize: 0.3,
  });

  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  arcGroup.add(line);

  // Glowing traveling pulse sphere
  const pulseGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const pulseMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
  pulseMesh.position.copy(startPos);
  arcGroup.add(pulseMesh);

  return arcGroup;
}
