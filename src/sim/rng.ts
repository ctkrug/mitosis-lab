/**
 * Deterministic pseudo-random number generation.
 *
 * The simulation must be reproducible: the same seed always produces the same
 * lineage. We use mulberry32 — a tiny, fast, well-distributed 32-bit PRNG — so a
 * run is a pure function of its seed and nothing depends on Math.random().
 */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform float in [min, max). */
  range(min: number, max: number): number;
  /** Standard-normal-ish sample via Box–Muller; mean 0, unit variance. */
  gaussian(): number;
}

/** Hash an arbitrary string seed into a 32-bit unsigned integer. */
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Construct a deterministic RNG from a numeric or string seed. */
export function makeRng(seed: number | string): Rng {
  let a = (typeof seed === "string" ? hashSeed(seed) : seed >>> 0) || 1;

  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    gaussian: () => {
      // Box–Muller; guard the log against exactly 0.
      const u1 = Math.max(next(), 1e-12);
      const u2 = next();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
  };
}
