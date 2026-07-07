/**
 * The lineage simulation core — pure, deterministic, renderer-agnostic.
 *
 * A `Lineage` holds every cell ever born (the tree persists for drawing) plus a
 * schedule of pending divisions. `advance(dt)` moves simulation time forward and
 * fires any divisions whose scheduled time has passed, one mother → two daughters.
 * Nothing here touches the DOM, Canvas, or Math.random(): given a seed and params,
 * a run is fully reproducible and unit-testable.
 */
import type { Cell, Genome, SimParams } from "./types.js";
import { DEFAULT_PARAMS } from "./types.js";
import { inherit, seedGenome } from "./genome.js";
import { makeRng, type Rng } from "./rng.js";

export interface LineageStats {
  population: number; // living (undivided) cells
  totalCells: number; // every node ever born
  divisions: number;
  mutations: number; // cumulative point mutations across the tree
  maxGeneration: number;
  time: number;
}

export class Lineage {
  readonly cells: Cell[] = [];
  params: SimParams;
  private rng: Rng;
  private nextId = 0;
  private time = 0;
  private divisions = 0;
  private mutations = 0;
  private living = 0;

  constructor(seed: number | string, params: Partial<SimParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.rng = makeRng(seed);
    this.spawn(null, 0, seedGenome(), 0, 0);
  }

  /** Draw a division interval for a cell from a jittered log-normal-ish curve. */
  private scheduleInterval(genome: Genome): number {
    const mean = this.params.meanDivisionInterval * genome.divisionBias;
    // Gaussian jitter scaled by CV, clamped so intervals stay strictly positive.
    const jittered = mean * (1 + this.rng.gaussian() * this.params.divisionJitter);
    return Math.max(mean * 0.15, jittered);
  }

  private spawn(
    parentId: number | null,
    generation: number,
    genome: Genome,
    bornAt: number,
    mutationLoad: number,
  ): Cell {
    const cell: Cell = {
      id: this.nextId++,
      parentId,
      generation,
      bornAt,
      divideAt: bornAt + this.scheduleInterval(genome),
      divided: false,
      mutationLoad,
      genome,
    };
    this.cells.push(cell);
    this.living++;
    return cell;
  }

  /** Divide one mother into two daughters, updating tallies. */
  private divide(mother: Cell): void {
    mother.divided = true;
    this.living--; // a divided cell is no longer a living leaf
    this.divisions++;

    for (let i = 0; i < 2; i++) {
      const { genome, mutations } = inherit(mother.genome, this.params, this.rng);
      this.mutations += mutations;
      this.spawn(
        mother.id,
        mother.generation + 1,
        genome,
        mother.divideAt,
        mother.mutationLoad + mutations,
      );
    }
  }

  /**
   * Advance simulation time by `dt` seconds, firing every division whose time has
   * arrived. Returns the number of divisions that occurred this step (useful for
   * driving per-division feedback like sound and pops).
   */
  advance(dt: number): number {
    this.time += dt;
    let fired = 0;

    // Repeatedly sweep: a division can create daughters that are themselves due
    // within the same step at high speed, so loop until the frontier is stable.
    let progressed = true;
    while (progressed) {
      progressed = false;
      const snapshot = this.cells.length;
      for (let i = 0; i < snapshot; i++) {
        const cell = this.cells[i];
        if (cell.divided) continue;
        if (cell.divideAt > this.time) continue;
        if (this.living >= this.params.maxPopulation) return fired;
        this.divide(cell);
        fired++;
        progressed = true;
      }
    }
    return fired;
  }

  stats(): LineageStats {
    let maxGeneration = 0;
    for (const c of this.cells) {
      if (c.generation > maxGeneration) maxGeneration = c.generation;
    }
    return {
      population: this.living,
      totalCells: this.cells.length,
      divisions: this.divisions,
      mutations: this.mutations,
      maxGeneration,
      time: this.time,
    };
  }
}
