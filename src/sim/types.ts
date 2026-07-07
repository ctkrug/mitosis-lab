/**
 * Domain types for the lineage simulation.
 *
 * A `Cell` is one node in the lineage tree. Its `genome` holds the heritable
 * traits that drift on division; its scheduling fields drive stochastic mitosis.
 */

/** Heritable traits. Daughters inherit a mutated copy of the mother's genome. */
export interface Genome {
  /** Colour identity, hue in degrees [0, 360). Drifts on mutation. */
  hue: number;
  /** Relative cell size multiplier, roughly [0.5, 1.6]. */
  size: number;
  /** Per-cell bias on division interval; multiplies the global mean. */
  divisionBias: number;
}

export interface Cell {
  readonly id: number;
  /** Parent id, or null for the founding seed cell. */
  readonly parentId: number | null;
  /** Generation depth from the seed (seed = 0). */
  readonly generation: number;
  /** Simulation time (seconds) at which this cell came into being. */
  readonly bornAt: number;
  /** Simulation time at which this cell will divide, if still alive. */
  divideAt: number;
  /** True once the cell has divided into two daughters. */
  divided: boolean;
  /** Number of point mutations accumulated from the seed down to this cell. */
  readonly mutationLoad: number;
  genome: Genome;
}

/** Tunable biology. All rates are per the simulation's own time unit (seconds). */
export interface SimParams {
  /** Probability [0, 1] that a given trait mutates when a daughter is created. */
  mutationRate: number;
  /** Mean interval between a cell's birth and its division. */
  meanDivisionInterval: number;
  /** Coefficient of variation for division timing (0 = clockwork, 1 = wild). */
  divisionJitter: number;
  /** Hard cap on living population; divisions stop once reached. */
  maxPopulation: number;
}

export const DEFAULT_PARAMS: SimParams = {
  mutationRate: 0.25,
  meanDivisionInterval: 2.2,
  divisionJitter: 0.35,
  maxPopulation: 512,
};
