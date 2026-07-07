/**
 * Bounds for each tunable `SimParams` field, shared by the slider controls
 * and URL (de)serialization so both agree on what a "valid" value is.
 */
import type { SimParams } from "../sim/types.js";

export interface ParamRange {
  min: number;
  max: number;
}

export const PARAM_RANGES: Record<keyof SimParams, ParamRange> = {
  mutationRate: { min: 0, max: 1 },
  meanDivisionInterval: { min: 0.3, max: 8 },
  divisionJitter: { min: 0, max: 1 },
  maxPopulation: { min: 8, max: 1024 },
};

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Clamp one field to its valid range, falling back to `fallback` if NaN. */
export function clampParam(
  key: keyof SimParams,
  value: number,
  fallback: number,
): number {
  const range = PARAM_RANGES[key];
  const v = Number.isFinite(value) ? value : fallback;
  return clamp(v, range.min, range.max);
}

/** Clamp every field of a (possibly partial) params object against `base`. */
export function clampParams(
  input: Partial<SimParams>,
  base: SimParams,
): SimParams {
  return {
    mutationRate: clampParam(
      "mutationRate",
      input.mutationRate ?? base.mutationRate,
      base.mutationRate,
    ),
    meanDivisionInterval: clampParam(
      "meanDivisionInterval",
      input.meanDivisionInterval ?? base.meanDivisionInterval,
      base.meanDivisionInterval,
    ),
    divisionJitter: clampParam(
      "divisionJitter",
      input.divisionJitter ?? base.divisionJitter,
      base.divisionJitter,
    ),
    maxPopulation: clampParam(
      "maxPopulation",
      input.maxPopulation ?? base.maxPopulation,
      base.maxPopulation,
    ),
  };
}
