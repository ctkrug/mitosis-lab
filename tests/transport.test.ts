import { describe, it, expect } from "vitest";
import { clampSpeed, formatSpeed, SPEED_RANGE } from "../src/app/transport.js";

describe("clampSpeed", () => {
  it("passes through an in-range value", () => {
    expect(clampSpeed(2)).toBe(2);
  });

  it("clamps below the minimum", () => {
    expect(clampSpeed(0)).toBe(SPEED_RANGE.min);
  });

  it("clamps above the maximum", () => {
    expect(clampSpeed(999)).toBe(SPEED_RANGE.max);
  });

  it("falls back to the given default for NaN", () => {
    expect(clampSpeed(NaN, 2)).toBe(2);
  });

  it("falls back to 1 by default for NaN", () => {
    expect(clampSpeed(NaN)).toBe(1);
  });
});

describe("formatSpeed", () => {
  it("formats a whole number with the multiplier sign", () => {
    expect(formatSpeed(1)).toBe("1×");
  });

  it("formats a fractional speed", () => {
    expect(formatSpeed(0.25)).toBe("0.25×");
  });

  it("rounds to two decimal places", () => {
    expect(formatSpeed(1.005)).toBe("1×");
  });
});
