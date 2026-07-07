import { describe, it, expect } from "vitest";
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
});
