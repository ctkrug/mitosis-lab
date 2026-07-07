import { describe, it, expect } from "vitest";
import { makeRng, hashSeed } from "../src/sim/rng.js";

describe("makeRng", () => {
  it("is deterministic for the same seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("diverges for different seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it("accepts string seeds via hashSeed", () => {
    const a = makeRng("mitosis");
    const b = makeRng(hashSeed("mitosis"));
    expect(a.next()).toEqual(b.next());
  });

  it("produces floats within [0, 1)", () => {
    const r = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("range() stays within bounds", () => {
    const r = makeRng(9);
    for (let i = 0; i < 500; i++) {
      const v = r.range(5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });

  it("gaussian() is finite and roughly centred on zero", () => {
    const r = makeRng(3);
    let sum = 0;
    const n = 5000;
    for (let i = 0; i < n; i++) {
      const v = r.gaussian();
      expect(Number.isFinite(v)).toBe(true);
      sum += v;
    }
    expect(Math.abs(sum / n)).toBeLessThan(0.1);
  });
});
