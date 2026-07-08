import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { boundsOfPoints, fitCamera } from "../src/app/camera.js";

describe("boundsOfPoints", () => {
  it("returns a zero box at the origin for no points", () => {
    expect(boundsOfPoints([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it("collapses to a single point for one input", () => {
    const b = boundsOfPoints([{ x: 5, y: -3 }]);
    expect(b).toEqual({ minX: 5, minY: -3, maxX: 5, maxY: -3 });
  });

  it("spans the min/max of every point", () => {
    const b = boundsOfPoints([
      { x: -2, y: 4 },
      { x: 10, y: -1 },
      { x: 3, y: 7 },
    ]);
    expect(b).toEqual({ minX: -2, minY: -1, maxX: 10, maxY: 7 });
  });
});

describe("fitCamera", () => {
  it("centres a zero-size viewport-safe result for an empty box", () => {
    const t = fitCamera(
      { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      { width: 800, height: 600 },
    );
    expect(Number.isFinite(t.scale)).toBe(true);
    expect(t.x).toBeCloseTo(400);
    expect(t.y).toBeCloseTo(300);
  });

  it("never returns NaN or Infinity for a zero-size viewport", () => {
    const t = fitCamera(
      { minX: -10, minY: -10, maxX: 10, maxY: 10 },
      { width: 0, height: 0 },
    );
    expect(Number.isFinite(t.scale)).toBe(true);
    expect(Number.isFinite(t.x)).toBe(true);
    expect(Number.isFinite(t.y)).toBe(true);
  });

  it("picks the limiting dimension for a wide box in a tall viewport", () => {
    const t = fitCamera(
      { minX: -100, minY: -10, maxX: 100, maxY: 10 },
      { width: 400, height: 400 },
      { padding: 0 },
    );
    // width (200) is the constraint, not height (20)
    expect(t.scale).toBeCloseTo(400 / 200);
  });

  it("shrinks scale as padding grows", () => {
    const bounds = { minX: -50, minY: -50, maxX: 50, maxY: 50 };
    const viewport = { width: 400, height: 400 };
    const tight = fitCamera(bounds, viewport, { padding: 0 });
    const padded = fitCamera(bounds, viewport, { padding: 100 });
    expect(padded.scale).toBeLessThan(tight.scale);
  });

  it("clamps scale to the configured maximum", () => {
    const t = fitCamera(
      { minX: 0, minY: 0, maxX: 1, maxY: 1 },
      { width: 2000, height: 2000 },
      { maxScale: 3, padding: 0 },
    );
    expect(t.scale).toBe(3);
  });

  it("clamps scale to the configured minimum", () => {
    const t = fitCamera(
      { minX: -5000, minY: -5000, maxX: 5000, maxY: 5000 },
      { width: 400, height: 400 },
      { minScale: 0.1, padding: 0 },
    );
    expect(t.scale).toBe(0.1);
  });

  it("falls back to maxScale instead of NaN when bounds are non-finite", () => {
    // A corrupt/degenerate bounds box (e.g. from a bad render frame) must
    // never propagate NaN into the camera transform.
    const t = fitCamera(
      { minX: 0, minY: 0, maxX: Infinity, maxY: 10 },
      { width: 400, height: 400 },
      { maxScale: 2.5 },
    );
    expect(t.scale).toBe(2.5);
    expect(Number.isFinite(t.x)).toBe(true);
    expect(Number.isFinite(t.y)).toBe(true);
  });

  it("falls back to a finite transform when the viewport itself is non-finite", () => {
    // A ResizeObserver/getBoundingClientRect glitch could hand back a NaN or
    // Infinity dimension; the documented contract is "never NaN/Infinity."
    const t = fitCamera(
      { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      { width: NaN, height: 400 },
    );
    expect(Number.isFinite(t.scale)).toBe(true);
    expect(Number.isFinite(t.x)).toBe(true);
    expect(Number.isFinite(t.y)).toBe(true);
  });

  it("centres the content: transforming the bounds centre lands at the viewport centre", () => {
    const bounds = { minX: 10, minY: 20, maxX: 30, maxY: 60 };
    const viewport = { width: 500, height: 500 };
    const t = fitCamera(bounds, viewport, { padding: 10 });
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    expect(cx * t.scale + t.x).toBeCloseTo(viewport.width / 2);
    expect(cy * t.scale + t.y).toBeCloseTo(viewport.height / 2);
  });

  it("(property-based) never produces NaN/Infinity for any finite bounds and viewport", () => {
    const finiteCoord = fc.double({ min: -1e6, max: 1e6, noNaN: true });
    fc.assert(
      fc.property(
        finiteCoord,
        finiteCoord,
        finiteCoord,
        finiteCoord,
        fc.double({ min: 0, max: 4000, noNaN: true }),
        fc.double({ min: 0, max: 4000, noNaN: true }),
        (ax, ay, bx, by, width, height) => {
          const bounds = {
            minX: Math.min(ax, bx),
            minY: Math.min(ay, by),
            maxX: Math.max(ax, bx),
            maxY: Math.max(ay, by),
          };
          const t = fitCamera(bounds, { width, height });
          expect(Number.isFinite(t.scale)).toBe(true);
          expect(Number.isFinite(t.x)).toBe(true);
          expect(Number.isFinite(t.y)).toBe(true);
        },
      ),
    );
  });
});
