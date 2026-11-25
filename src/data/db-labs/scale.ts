/**
 * scale.ts
 *
 * Lets the same seed script run at several sizes. Every generate_series(a, N)
 * with N >= MIN_SCALED_BOUND has its upper bound multiplied by the factor, so
 * row counts grow while small dimension series (months, departments...) stay put.
 */

export interface LabSize {
  key: string;
  label: string;
  factor: number;
}

export const LAB_SIZES: LabSize[] = [
  { key: "standard", label: "Standard (1x)", factor: 1 },
  { key: "large", label: "Large (10x)", factor: 10 },
  { key: "huge", label: "Huge (30x)", factor: 30 },
];

const MIN_SCALED_BOUND = 100;

export function scaleSeed(seed: string, factor: number): string {
  if (factor <= 1) return seed;
  return seed.replace(/generate_series\(\s*(\d+)\s*,\s*(\d+)\s*\)/g, (whole, from: string, to: string) => {
    const upper = Number(to);
    if (upper < MIN_SCALED_BOUND) return whole;
    let scaled = upper * factor;
    // Keep odd counts odd (the Exchange Seats lab relies on an odd number of rows).
    if (upper % 2 === 1 && scaled % 2 === 0) scaled += 1;
    return `generate_series(${from}, ${scaled})`;
  });
}
