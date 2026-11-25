import { ConceptScenario } from "./concept-scenarios";
import { ExecutionStep, TableRow } from "./types";

/** Visual state of one dot (one row) at one step. */
export interface DotState {
  x: number;
  y: number;
  z: number;
  size: number;
  /** 0 = invisible, 1 = fully visible */
  alpha: number;
  color: [number, number, number];
}

export interface DotInfo {
  id: string;
  /** Source table label, or "result" for output rows */
  source: string;
  label: string;
  baseColor: [number, number, number];
}

export interface DotsModel {
  dots: DotInfo[];
  /** states[step][dotIndex] */
  states: DotState[][];
}

const GREEN: [number, number, number] = [0.2, 0.9, 0.55];
const RED: [number, number, number] = [1, 0.3, 0.3];
const AMBER: [number, number, number] = [1, 0.75, 0.2];
const DIM = 0.35;

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function rowLabel(row: TableRow): string {
  return Object.values(row.values)
    .map((v) => (v === null ? "NULL" : String(v)))
    .join(" | ");
}

/** Deterministic pseudo-random in [0,1) so layouts are stable between renders. */
function rand(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Builds a dot for every source row and every result row, plus the state of
 * every dot at every step. Source rows form a lattice around their table's
 * position; result rows gather in a ring at the output position.
 */
export function buildDotsModel(scenario: ConceptScenario): DotsModel {
  const dots: DotInfo[] = [];
  const home = new Map<string, [number, number, number]>();
  const rowIndex = new Map<string, number>();

  scenario.tables.forEach((t, ti) => {
    const base = t.position ?? [ti * 8 - 4, 0, -3];
    const color = hexToRgb(t.color ?? "#38bdf8");
    const cols = Math.ceil(Math.sqrt(t.rows.length));
    t.rows.forEach((r, i) => {
      const cx = (i % cols) - (cols - 1) / 2;
      const cz = Math.floor(i / cols) - (Math.ceil(t.rows.length / cols) - 1) / 2;
      home.set(r.id, [base[0] + cx * 1.6, 2.2 + rand(i + ti * 9) * 0.6, base[2] + cz * 1.6]);
      rowIndex.set(r.id, dots.length);
      dots.push({ id: r.id, source: t.alias ?? t.name, label: rowLabel(r), baseColor: color });
    });
  });

  // Result dots: one per distinct result id across all snapshots
  const out = scenario.outputPosition ?? [0, 0, 7];
  const resultIds: string[] = [];
  const resultRows = new Map<string, TableRow>();
  scenario.steps.forEach((s) => {
    (s.resultRowsSnapshot ?? []).forEach((r) => {
      if (!resultRows.has(r.id)) resultIds.push(r.id);
      resultRows.set(r.id, r);
    });
  });
  resultIds.forEach((id) => {
    const r = resultRows.get(id)!;
    rowIndex.set(id, dots.length);
    dots.push({ id, source: "result", label: rowLabel(r), baseColor: GREEN });
  });

  const resultHome = (id: string): [number, number, number] => {
    const i = resultIds.indexOf(id);
    const n = Math.max(resultIds.length, 1);
    const a = (i / n) * Math.PI * 2;
    const rad = n === 1 ? 0 : 1.3 + n * 0.15;
    return [out[0] + Math.cos(a) * rad, 2.2, out[2] + Math.sin(a) * rad];
  };

  const states = scenario.steps.map((step) => stepStates(step, dots, home, resultHome));
  return { dots, states };
}

function stepStates(
  step: ExecutionStep,
  dots: DotInfo[],
  home: Map<string, [number, number, number]>,
  resultHome: (id: string) => [number, number, number]
): DotState[] {
  const active = new Set(step.activeRowIds ?? []);
  if (step.matchedRowPair) step.matchedRowPair.forEach((id) => active.add(id));
  const visibleResults = new Set((step.resultRowsSnapshot ?? []).map((r) => r.id));
  const rejected = step.passedCondition === false;

  return dots.map((d) => {
    if (d.source === "result") {
      const [x, y, z] = resultHome(d.id);
      const on = visibleResults.has(d.id);
      return { x, y: on ? y : y + 3, z, size: on ? 0.55 : 0.1, alpha: on ? 1 : 0, color: GREEN };
    }
    const [hx, hy, hz] = home.get(d.id) ?? [0, 0, 0];
    const isActive = active.has(d.id);
    if (!isActive) {
      return { x: hx, y: hy, z: hz, size: 0.35, alpha: active.size ? DIM : 0.9, color: d.baseColor };
    }
    if (rejected) return { x: hx, y: hy, z: hz, size: 0.45, alpha: 0.7, color: RED };
    if (step.matchedRowPair) {
      const mid = step.matchedRowPair.map((id) => home.get(id)).filter(Boolean) as [number, number, number][];
      const cx = mid.reduce((a, p) => a + p[0], 0) / Math.max(mid.length, 1);
      const cz = mid.reduce((a, p) => a + p[2], 0) / Math.max(mid.length, 1);
      return { x: cx, y: hy + 1.6, z: cz, size: 0.6, alpha: 1, color: GREEN };
    }
    if (step.type === "GROUP_ROW") {
      const grp = [...active].map((id) => home.get(id)).filter(Boolean) as [number, number, number][];
      const cx = grp.reduce((a, p) => a + p[0], 0) / Math.max(grp.length, 1);
      const cz = grp.reduce((a, p) => a + p[2], 0) / Math.max(grp.length, 1);
      return { x: cx + (rand(hx) - 0.5) * 0.4, y: hy + 1, z: cz + (rand(hz) - 0.5) * 0.4, size: 0.55, alpha: 1, color: AMBER };
    }
    return { x: hx, y: hy + 0.8, z: hz, size: 0.6, alpha: 1, color: AMBER };
  });
}
