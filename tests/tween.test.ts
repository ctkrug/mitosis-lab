import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { clamp, lerp, easeOutCubic, damp } from "../src/app/tween.js";

describe("clamp", () => {
  it("passes through values already in range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps below the lower bound", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it("clamps above the upper bound", () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe("lerp", () => {
  it("returns a at t=0 and b at t=1", () => {
    expect(lerp(2, 8, 0)).toBe(2);
    expect(lerp(2, 8, 1)).toBe(8);
  });
  it("returns the midpoint at t=0.5", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
  it("extrapolates for t outside [0, 1]", () => {
    expect(lerp(0, 10, 2)).toBe(20);
  });
});

describe("easeOutCubic", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
  it("clamps inputs outside [0, 1]", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
  it("front-loads progress (past the midpoint before t=0.5)", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});

describe("damp", () => {
  it("does not move when dt is zero", () => {
    expect(damp(0, 100, 10, 0)).toBe(0);
  });
  it("does not move when lambda is zero", () => {
    expect(damp(0, 100, 0, 1)).toBe(0);
  });
  it("approaches the target as dt grows", () => {
    const v = damp(0, 100, 8, 5);
    expect(v).toBeGreaterThan(90);
    expect(v).toBeLessThanOrEqual(100);
  });
  it("splitting one long step into many short ones lands at ~the same place", () => {
    const whole = damp(0, 100, 6, 1);
    let chunked = 0;
    for (let i = 0; i < 100; i++) chunked = damp(chunked, 100, 6, 0.01);
    expect(Math.abs(whole - chunked)).toBeLessThan(0.5);
  });
  it("snaps to the target for an infinite dt or lambda instead of corrupting", () => {
    expect(damp(0, 100, 8, Infinity)).toBe(100);
    expect(damp(0, 100, Infinity, 1)).toBe(100);
  });
  it("holds position instead of corrupting to NaN for a NaN dt or lambda", () => {
    expect(damp(0, 100, 8, NaN)).toBe(0);
    expect(damp(0, 100, NaN, 1)).toBe(0);
  });
});

describe("damp (property-based)", () => {
  it("always stays between current and target for non-negative lambda/dt", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.double({ min: 0, max: 50, noNaN: true }),
        fc.double({ min: 0, max: 10, noNaN: true }),
        (current, target, lambda, dt) => {
          const result = damp(current, target, lambda, dt);
          expect(Number.isFinite(result)).toBe(true);
          expect(result).toBeGreaterThanOrEqual(Math.min(current, target) - 1e-6);
          expect(result).toBeLessThanOrEqual(Math.max(current, target) + 1e-6);
        },
      ),
    );
  });

  it("never returns NaN for any dt/lambda, including NaN and Infinity", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.double({ min: -1e4, max: 1e4, noNaN: true }),
        fc.double({ noNaN: false, noDefaultInfinity: false }),
        fc.double({ noNaN: false, noDefaultInfinity: false }),
        (current, target, lambda, dt) => {
          const result = damp(current, target, lambda, dt);
          expect(Number.isNaN(result)).toBe(false);
        },
      ),
    );
  });
});

describe("easeOutCubic (property-based)", () => {
  it("always returns a value in [0, 1] for any finite input", () => {
    fc.assert(
      fc.property(fc.double({ min: -1e6, max: 1e6, noNaN: true }), (t) => {
        const v = easeOutCubic(t);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }),
    );
  });
});
