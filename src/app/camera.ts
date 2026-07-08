/**
 * Camera auto-fit: computes the pan/zoom that keeps the whole growing tree
 * in frame without the user touching anything. Pure — takes a bounding box
 * and a viewport size, returns a transform; the caller decides how to
 * smooth toward it frame to frame (see `tween.damp`).
 */

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface CameraTransform {
  /** Uniform scale from layout units to CSS pixels. */
  scale: number;
  /** Viewport-space coordinates of the layout origin (0, 0). */
  x: number;
  y: number;
}

export interface FitCameraOptions {
  /** Extra layout-unit margin added around the content on every side. */
  padding: number;
  /** Scale is never allowed to exceed this (avoid over-zooming a single cell). */
  maxScale: number;
  /** Scale is never allowed to go below this (avoid the tree shrinking to a speck). */
  minScale: number;
}

export const DEFAULT_FIT_CAMERA: FitCameraOptions = {
  padding: 60,
  maxScale: 2.5,
  minScale: 0.05,
};

/** A single point counts as a zero-size box centred on itself. */
export function boundsOfPoints(
  points: Array<{ x: number; y: number }>,
): Bounds {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Compute the scale + offset that fits `bounds` (plus padding) inside
 * `viewport`, centred. Degenerates gracefully for a zero-size viewport or a
 * single-point bounds (never returns NaN/Infinity).
 */
export function fitCamera(
  bounds: Bounds,
  viewport: Viewport,
  opts: Partial<FitCameraOptions> = {},
): CameraTransform {
  const { padding, maxScale, minScale } = { ...DEFAULT_FIT_CAMERA, ...opts };

  const contentW = Math.max(bounds.maxX - bounds.minX, 0) + padding * 2;
  const contentH = Math.max(bounds.maxY - bounds.minY, 0) + padding * 2;
  const rawCenterX = (bounds.minX + bounds.maxX) / 2;
  const rawCenterY = (bounds.minY + bounds.maxY) / 2;
  const centerX = Number.isFinite(rawCenterX) ? rawCenterX : 0;
  const centerY = Number.isFinite(rawCenterY) ? rawCenterY : 0;

  let scale =
    viewport.width > 0 && viewport.height > 0 && contentW > 0 && contentH > 0
      ? Math.min(viewport.width / contentW, viewport.height / contentH)
      : maxScale;
  if (!Number.isFinite(scale) || scale <= 0) scale = maxScale;
  scale = Math.min(maxScale, Math.max(minScale, scale));

  return {
    scale,
    x: viewport.width / 2 - centerX * scale,
    y: viewport.height / 2 - centerY * scale,
  };
}
