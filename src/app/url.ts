/**
 * Seeded runs are shareable: the seed and every biology parameter round-trip
 * through the URL query string, so opening a shared link reproduces the
 * exact lineage the sharer saw — not just the same seed under whatever
 * params the viewer happens to have set.
 */
import type { SimParams } from "../sim/types.js";
import { clampParams } from "./params.js";

export const DEFAULT_SEED = "mitosis";

const QUERY_KEYS: Record<keyof SimParams, string> = {
  mutationRate: "mutation",
  meanDivisionInterval: "interval",
  divisionJitter: "jitter",
  maxPopulation: "population",
};

export interface RunConfig {
  seed: string;
  params: SimParams;
}

/** Parse a `?seed=...&mutation=...` query string, clamping against `defaults`. */
export function parseRunConfig(search: string, defaults: SimParams): RunConfig {
  const query = new URLSearchParams(search);
  const seedRaw = query.get("seed");
  const seed = seedRaw && seedRaw.trim().length > 0 ? seedRaw : DEFAULT_SEED;

  const patch: Partial<SimParams> = {};
  for (const key of Object.keys(QUERY_KEYS) as Array<keyof SimParams>) {
    const raw = query.get(QUERY_KEYS[key]);
    if (raw === null) continue;
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed)) patch[key] = parsed;
  }

  return { seed, params: clampParams(patch, defaults) };
}

/** Serialize a run into a `?seed=...&mutation=...` query string (no leading `?`). */
export function serializeRunConfig(config: RunConfig): string {
  const query = new URLSearchParams();
  query.set("seed", config.seed);
  for (const key of Object.keys(QUERY_KEYS) as Array<keyof SimParams>) {
    query.set(QUERY_KEYS[key], String(config.params[key]));
  }
  return query.toString();
}
