/**
 * Playback speed bounds + formatting, shared by the speed slider and the
 * fixed-step loop so both agree on what a valid multiplier is.
 */

export interface SpeedRange {
  min: number;
  max: number;
}

export const SPEED_RANGE: SpeedRange = { min: 0.25, max: 8 };

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Clamp a speed multiplier into `SPEED_RANGE`, falling back for NaN input. */
export function clampSpeed(value: number, fallback = 1): number {
  const v = Number.isFinite(value) ? value : fallback;
  return clamp(v, SPEED_RANGE.min, SPEED_RANGE.max);
}

/** Format a speed multiplier as a short label, e.g. "1×", "0.5×", "2.25×". */
export function formatSpeed(speed: number): string {
  const rounded = Math.round(speed * 100) / 100;
  return `${rounded}×`;
}
