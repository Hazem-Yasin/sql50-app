import type { DbLab } from "./types";
import { LABS_SELECT } from "./labs-select";
import { LABS_JOINS } from "./labs-joins";
import { LABS_AGG1 } from "./labs-agg1";
import { LABS_AGG2 } from "./labs-agg2";
import { LABS_ADV1 } from "./labs-adv1";
import { LABS_ADV2 } from "./labs-adv2";

export type { DbLab } from "./types";

export const DB_LABS: DbLab[] = [
  ...LABS_SELECT,
  ...LABS_JOINS,
  ...LABS_AGG1,
  ...LABS_AGG2,
  ...LABS_ADV1,
  ...LABS_ADV2,
];

export function getLab(id: number): DbLab | undefined {
  return DB_LABS.find((l) => l.id === id);
}
