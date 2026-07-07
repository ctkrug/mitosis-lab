/**
 * Trait inheritance: how a daughter's genome derives from its mother's.
 *
 * Each trait independently mutates with probability `mutationRate`. When it does,
 * it drifts by a small gaussian step (bounded to a sane range) — so mutations show
 * up as gradual colour/size lineages, not random noise on every cell.
 */
import type { Genome, SimParams } from "./types.js";
import type { Rng } from "./rng.js";

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Wrap a hue into [0, 360). */
const wrapHue = (h: number): number => ((h % 360) + 360) % 360;

export interface MutationResult {
  genome: Genome;
  /** How many of the three traits actually mutated (0..3). */
  mutations: number;
}

/**
 * Produce a daughter genome from a mother genome. Returns the new genome plus the
 * count of traits that mutated, so callers can tally mutation load.
 */
export function inherit(
  mother: Genome,
  params: SimParams,
  rng: Rng,
): MutationResult {
  let mutations = 0;
  const next: Genome = { ...mother };

  if (rng.next() < params.mutationRate) {
    next.hue = wrapHue(mother.hue + rng.gaussian() * 22);
    mutations++;
  }
  if (rng.next() < params.mutationRate) {
    next.size = clamp(mother.size + rng.gaussian() * 0.12, 0.5, 1.6);
    mutations++;
  }
  if (rng.next() < params.mutationRate) {
    next.divisionBias = clamp(
      mother.divisionBias + rng.gaussian() * 0.1,
      0.4,
      2.0,
    );
    mutations++;
  }

  return { genome: next, mutations };
}

/** The founding genome for a fresh run — a neutral GFP-green cell. */
export function seedGenome(): Genome {
  return { hue: 152, size: 1, divisionBias: 1 };
}
