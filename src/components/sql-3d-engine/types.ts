export interface ColumnDef {
  name: string;
  type: "INT" | "VARCHAR" | "DECIMAL" | "BOOLEAN" | "DATE";
  isPrimary?: boolean;
  isForeign?: boolean;
}

export type CellValue = string | number | boolean | null;

export interface TableRow {
  id: string; // unique row id (e.g. "e1_r1")
  values: Record<string, CellValue>;
}

export interface TableSchema {
  name: string;
  alias?: string;
  columns: ColumnDef[];
  rows: TableRow[];
  color?: string; // Hex color string for theme tint (e.g. "#3b82f6")
  position?: [number, number, number]; // 3D coordinates in scene
}

export type ExecutionStepType =
  | "CREATE_TABLE"
  | "INSERT_ROWS"
  | "SCAN_ROW"
  | "EVALUATE_PREDICATE"
  | "JOIN_MATCH"
  | "EMIT_RESULT"
  | "GROUP_ROW"
  | "AGGREGATE_COLLAPSE"
  | "COMPLETE";

export interface ExecutionStep {
  id: number;
  type: ExecutionStepType;
  title: string;
  narration: string;
  sqlSnippet?: string;
  activeTable?: string;
  activeRowIds?: string[];
  matchedRowPair?: [string, string]; // [leftRowId, rightRowId]
  resultRow?: TableRow;
  passedCondition?: boolean;
}

export interface SqlEngineState {
  tables: Record<string, TableSchema>;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5x, 1x, 2x
  steps: ExecutionStep[];
}
