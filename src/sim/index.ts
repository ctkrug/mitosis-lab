/**
 * Public surface of the simulation core. Import from here to keep the
 * renderer decoupled from the internal file layout of `src/sim/`.
 */
export { Lineage } from "./lineage.js";
export type { LineageStats } from "./lineage.js";
export { inherit, seedGenome } from "./genome.js";
export { makeRng, hashSeed } from "./rng.js";
export type { Rng } from "./rng.js";
export { DEFAULT_PARAMS } from "./types.js";
export type { Cell, Genome, SimParams } from "./types.js";
