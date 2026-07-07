/**
 * Framerate-independent animation helpers.
 *
 * Everything here is a pure function of its inputs so it can be unit-tested
 * without a browser: no Date.now(), no requestAnimationFrame.
 */

/** Clamp `v` into [lo, hi]. */
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Linear interpolation from `a` to `b` at `t` (unclamped). */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Ease-out cubic: fast start, gentle settle — used for birth/intro tweens. */
export function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  const inv = 1 - c;
  return 1 - inv * inv * inv;
}

/**
 * Exponentially damp `current` toward `target`, independent of frame rate.
 *
 * `lambda` is the response rate (higher = snappier). Two calls covering the
 * same total `dt` in different-sized chunks land at (almost) the same place,
 * which is what makes this safe to drive from a variable-rate render loop.
 */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  if (dt <= 0 || lambda <= 0) return current;
  const t = 1 - Math.exp(-lambda * dt);
  return lerp(current, target, t);
}
