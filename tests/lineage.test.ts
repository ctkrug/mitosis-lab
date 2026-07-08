import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { Lineage } from "../src/sim/lineage.js";

describe("Lineage", () => {
  it("starts as a single seed cell (generation 0, no parent)", () => {
    const lin = new Lineage("seed");
    expect(lin.cells).toHaveLength(1);
    const seed = lin.cells[0];
    expect(seed.parentId).toBeNull();
    expect(seed.generation).toBe(0);
    expect(seed.divided).toBe(false);
    const stats = lin.stats();
    expect(stats.population).toBe(1);
    expect(stats.divisions).toBe(0);
  });

  it("each division yields exactly two daughters one generation deeper", () => {
    const lin = new Lineage("grow", { maxPopulation: 2 });
    lin.advance(100); // far past the first division
    const stats = lin.stats();
    expect(stats.divisions).toBe(1);
    expect(stats.totalCells).toBe(3); // seed + 2 daughters
    expect(stats.population).toBe(2); // seed divided, no longer a leaf
    const daughters = lin.cells.filter((c) => c.parentId === 0);
    expect(daughters).toHaveLength(2);
    expect(daughters.every((d) => d.generation === 1)).toBe(true);
  });

  it("never exceeds the population cap", () => {
    const lin = new Lineage("cap", { maxPopulation: 32 });
    lin.advance(10_000);
    expect(lin.stats().population).toBeLessThanOrEqual(32);
  });

  it("is deterministic for the same seed and params", () => {
    const run = () => {
      const lin = new Lineage("repro", { maxPopulation: 64 });
      lin.advance(500);
      return lin.stats();
    };
    expect(run()).toEqual(run());
  });

  it("advance returns the number of divisions fired this step", () => {
    const lin = new Lineage("count", { maxPopulation: 8 });
    const fired = lin.advance(10_000);
    expect(fired).toBe(lin.stats().divisions);
    expect(fired).toBeGreaterThan(0);
  });

  it("does not divide before a cell's scheduled time", () => {
    const lin = new Lineage("early", { meanDivisionInterval: 5 });
    lin.advance(0.001); // essentially no time passed
    expect(lin.stats().divisions).toBe(0);
  });

  it("divides a cell exactly at its scheduled time, not only after", () => {
    const lin = new Lineage("boundary", { maxPopulation: 8 });
    const divideAt = lin.cells[0].divideAt;
    lin.advance(divideAt); // time lands exactly on the seed's divideAt
    expect(lin.stats().divisions).toBe(1);
  });

  it("ignores a non-finite dt instead of corrupting time and mass-dividing", () => {
    const lin = new Lineage("nan-dt", { maxPopulation: 64 });
    const fired = lin.advance(NaN);
    expect(fired).toBe(0);
    const stats = lin.stats();
    expect(stats.time).toBe(0);
    expect(stats.divisions).toBe(0);
    expect(stats.population).toBe(1);
  });
});

describe("Lineage (property-based)", () => {
  it("never exceeds maxPopulation for any seed, jitter, or division bias", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.integer({ min: 8, max: 256 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0.3, max: 4, noNaN: true }),
        (seed, maxPopulation, divisionJitter, meanDivisionInterval) => {
          const lin = new Lineage(seed, {
            maxPopulation,
            divisionJitter,
            meanDivisionInterval,
          });
          lin.advance(10_000);
          expect(lin.stats().population).toBeLessThanOrEqual(maxPopulation);
        },
      ),
    );
  });
});
