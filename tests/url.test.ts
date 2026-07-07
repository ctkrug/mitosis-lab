import { describe, it, expect } from "vitest";
import { parseRunConfig, serializeRunConfig, DEFAULT_SEED } from "../src/app/url.js";
import { DEFAULT_PARAMS } from "../src/sim/types.js";
import { PARAM_RANGES } from "../src/app/params.js";

describe("parseRunConfig", () => {
  it("falls back to defaults for an empty query string", () => {
    const config = parseRunConfig("", DEFAULT_PARAMS);
    expect(config.seed).toBe(DEFAULT_SEED);
    expect(config.params).toEqual(DEFAULT_PARAMS);
  });

  it("reads a seed and every param field", () => {
    const config = parseRunConfig(
      "?seed=abc123&mutation=0.6&interval=3&jitter=0.2&population=100",
      DEFAULT_PARAMS,
    );
    expect(config.seed).toBe("abc123");
    expect(config.params).toEqual({
      mutationRate: 0.6,
      meanDivisionInterval: 3,
      divisionJitter: 0.2,
      maxPopulation: 100,
    });
  });

  it("falls back to the default seed for a blank seed param", () => {
    const config = parseRunConfig("?seed=", DEFAULT_PARAMS);
    expect(config.seed).toBe(DEFAULT_SEED);
  });

  it("falls back to defaults for malformed numeric params", () => {
    const config = parseRunConfig("?mutation=not-a-number", DEFAULT_PARAMS);
    expect(config.params.mutationRate).toBe(DEFAULT_PARAMS.mutationRate);
  });

  it("clamps out-of-range values instead of passing them through", () => {
    const config = parseRunConfig("?mutation=50", DEFAULT_PARAMS);
    expect(config.params.mutationRate).toBe(PARAM_RANGES.mutationRate.max);
  });

  it("leaves unspecified params at their default", () => {
    const config = parseRunConfig("?seed=x", DEFAULT_PARAMS);
    expect(config.params).toEqual(DEFAULT_PARAMS);
  });
});

describe("serializeRunConfig", () => {
  it("round-trips through parseRunConfig", () => {
    const original = {
      seed: "riotous",
      params: {
        mutationRate: 0.9,
        meanDivisionInterval: 1.5,
        divisionJitter: 0.1,
        maxPopulation: 200,
      },
    };
    const search = serializeRunConfig(original);
    const parsed = parseRunConfig(`?${search}`, DEFAULT_PARAMS);
    expect(parsed).toEqual(original);
  });

  it("produces a parseable query string without a leading '?'", () => {
    const search = serializeRunConfig({ seed: "x", params: DEFAULT_PARAMS });
    expect(search.startsWith("?")).toBe(false);
    expect(search).toContain("seed=x");
  });
});
