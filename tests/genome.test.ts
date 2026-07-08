import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { inherit, seedGenome } from "../src/sim/genome.js";
import { makeRng } from "../src/sim/rng.js";
import { DEFAULT_PARAMS } from "../src/sim/types.js";
import type { Genome } from "../src/sim/types.js";

describe("inherit", () => {
  it("copies the mother genome exactly when mutation rate is zero", () => {
    const rng = makeRng(1);
    const mother = seedGenome();
    const { genome, mutations } = inherit(
      mother,
      { ...DEFAULT_PARAMS, mutationRate: 0 },
      rng,
    );
    expect(mutations).toBe(0);
    expect(genome).toEqual(mother);
    expect(genome).not.toBe(mother); // fresh object, not a shared reference
  });

  it("never mutates at rate zero even when the rng lands exactly on 0", () => {
    // rng.next() can legitimately return exactly 0 (mulberry32's output is
    // [0, 1)), so the `< mutationRate` check must be a strict inequality —
    // a `<=` mutant would fire here since 0 <= 0. A fixed real seed doesn't
    // reliably land on this boundary, so stub the rng to force it.
    const zeroRng = { next: () => 0, range: () => 0, gaussian: () => 0 };
    const mother = seedGenome();
    const { genome, mutations } = inherit(
      mother,
      { ...DEFAULT_PARAMS, mutationRate: 0 },
      zeroRng,
    );
    expect(mutations).toBe(0);
    expect(genome).toEqual(mother);
  });

  it("always mutates when mutation rate is one", () => {
    const rng = makeRng(5);
    const { mutations } = inherit(
      seedGenome(),
      { ...DEFAULT_PARAMS, mutationRate: 1 },
      rng,
    );
    expect(mutations).toBe(3);
  });

  it("keeps hue wrapped into [0, 360) and size/bias in range", () => {
    const rng = makeRng(11);
    let g = seedGenome();
    const params = { ...DEFAULT_PARAMS, mutationRate: 1 };
    for (let i = 0; i < 2000; i++) {
      g = inherit(g, params, rng).genome;
      expect(g.hue).toBeGreaterThanOrEqual(0);
      expect(g.hue).toBeLessThan(360);
      expect(g.size).toBeGreaterThanOrEqual(0.5);
      expect(g.size).toBeLessThanOrEqual(1.6);
      expect(g.divisionBias).toBeGreaterThanOrEqual(0.4);
      expect(g.divisionBias).toBeLessThanOrEqual(2.0);
    }
  });
});

describe("inherit (property-based)", () => {
  it("keeps every trait in its documented range for any seed, mother, or mutation rate", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.record({
          hue: fc.double({ min: 0, max: 359.999, noNaN: true }),
          size: fc.double({ min: 0.5, max: 1.6, noNaN: true }),
          divisionBias: fc.double({ min: 0.4, max: 2.0, noNaN: true }),
        }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        (seed, mother, mutationRate) => {
          const rng = makeRng(seed);
          const { genome } = inherit(
            mother as Genome,
            { ...DEFAULT_PARAMS, mutationRate },
            rng,
          );
          expect(genome.hue).toBeGreaterThanOrEqual(0);
          expect(genome.hue).toBeLessThan(360);
          expect(genome.size).toBeGreaterThanOrEqual(0.5);
          expect(genome.size).toBeLessThanOrEqual(1.6);
          expect(genome.divisionBias).toBeGreaterThanOrEqual(0.4);
          expect(genome.divisionBias).toBeLessThanOrEqual(2.0);
        },
      ),
    );
  });
});
