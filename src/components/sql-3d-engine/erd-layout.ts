import { ConceptScenario } from "./concept-scenarios";
import { ColumnDef, TableRow } from "./types";

export const ERD = {
  boxW: 230,
  gapX: 110,
  pad: 30,
  headH: 34,
  colH: 22,
  rowH: 20,
  maxRows: 8,
};

export interface ErdBox {
  key: string;
  title: string;
  color: string;
  isResult: boolean;
  columns: ColumnDef[];
  rows: TableRow[];
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ErdRelation {
  from: string;
  fromCol: string;
  to: string;
  toCol: string;
}

export interface ErdLayout {
  boxes: ErdBox[];
  relations: ErdRelation[];
  width: number;
  height: number;
}

/** Y offset of a column row inside a box (centre line). */
export function colY(box: ErdBox, colIndex: number): number {
  return box.y + ERD.headH + colIndex * ERD.colH + ERD.colH / 2;
}

function boxHeight(cols: number, rows: number): number {
  const shown = Math.min(rows, ERD.maxRows) + (rows > ERD.maxRows ? 1 : 0);
  return ERD.headH + cols * ERD.colH + (shown ? 10 + shown * ERD.rowH : 0) + 8;
}

function findTarget(
  fromKey: string,
  fk: string,
  boxes: ErdBox[]
): { key: string; col: string } | null {
  const self = boxes.find((b) => b.key === fromKey);
  const others = boxes.filter((b) => !b.isResult && b.key !== fromKey);
  const prefix = fk.replace(/_?id$/i, "").toLowerCase();
  const pkOf = (b: ErdBox, name?: string) =>
    b.columns.find((c) => c.isPrimary && (!name || c.name === name));
  // 1. same-named primary key elsewhere (order.customer_id -> customer.customer_id)
  for (const b of others) {
    const pk = pkOf(b, fk);
    if (pk) return { key: b.key, col: pk.name };
  }
  // 2. "id" primary key on a table whose name starts with the FK prefix
  for (const b of others) {
    const pk = pkOf(b, "id");
    if (pk && prefix && b.title.toLowerCase().startsWith(prefix)) return { key: b.key, col: pk.name };
  }
  // 3. self reference: another copy of the same table, or any table with "id"
  for (const b of others) {
    const pk = pkOf(b, "id");
    if (pk && self && b.title.split(" ")[0] === self.title.split(" ")[0]) return { key: b.key, col: pk.name };
  }
  for (const b of others) {
    const pk = pkOf(b, "id");
    if (pk) return { key: b.key, col: pk.name };
  }
  return null;
}

export function buildErdLayout(scenario: ConceptScenario): ErdLayout {
  const boxes: ErdBox[] = scenario.tables.map((t, i) => ({
    key: t.alias ?? `${t.name}#${i}`,
    title: t.alias ? `${t.name} (${t.alias})` : t.name,
    color: t.color ?? "#38bdf8",
    isResult: false,
    columns: t.columns,
    rows: t.rows,
    x: 0,
    y: 0,
    w: ERD.boxW,
    h: boxHeight(t.columns.length, t.rows.length),
  }));

  // Result box: declared output columns, or the keys of the first result row
  let outCols: ColumnDef[] = scenario.outputColumns ?? [];
  const allResults = scenario.steps.flatMap((s) => s.resultRowsSnapshot ?? []);
  if (!outCols.length && allResults.length) {
    outCols = Object.keys(allResults[0].values).map((n) => ({ name: n, type: "VARCHAR" as const }));
  }
  if (outCols.length) {
    boxes.push({
      key: "__result__",
      title: "Result",
      color: "#10b981",
      isResult: true,
      columns: outCols,
      rows: [],
      x: 0,
      y: 0,
      w: ERD.boxW,
      h: boxHeight(outCols.length, 0),
    });
  }

  boxes.forEach((b, i) => {
    b.x = ERD.pad + i * (ERD.boxW + ERD.gapX);
    b.y = ERD.pad + (i % 2 === 1 ? 26 : 0);
  });

  const relations: ErdRelation[] = [];
  boxes.forEach((b) => {
    if (b.isResult) return;
    b.columns.forEach((c) => {
      if (!c.isForeign) return;
      const t = findTarget(b.key, c.name, boxes);
      if (t) relations.push({ from: b.key, fromCol: c.name, to: t.key, toCol: t.col });
    });
  });

  const width = ERD.pad * 2 + boxes.length * ERD.boxW + Math.max(boxes.length - 1, 0) * ERD.gapX;
  const height = ERD.pad * 2 + 26 + Math.max(...boxes.map((b) => b.h), 100);
  return { boxes, relations, width, height };
}
