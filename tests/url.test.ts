import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { parseRunConfig, serializeRunConfig, DEFAULT_SEED } from "../src/app/url.js";
import { DEFAULT_PARAMS } from "../src/sim/types.js";
import { PARAM_RANGES, type ParamRange } from "../src/app/params.js";

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

  it("falls back to the default seed for a whitespace-only seed param", () => {
    const config = parseRunConfig("?seed=%20%20%20", DEFAULT_PARAMS);
    expect(config.seed).toBe(DEFAULT_SEED);
  });

  it("treats a falsy-looking seed like \"0\" as a real, distinct seed", () => {
    const config = parseRunConfig("?seed=0", DEFAULT_PARAMS);
    expect(config.seed).toBe("0");
  });

  it("falls back to defaults for malformed numeric params", () => {
    const config = parseRunConfig("?mutation=not-a-number", DEFAULT_PARAMS);
    expect(config.params.mutationRate).toBe(DEFAULT_PARAMS.mutationRate);
  });

  it("falls back to defaults for non-finite numeric params (Infinity/NaN)", () => {
    const config = parseRunConfig(
      "?interval=Infinity&mutation=NaN",
      DEFAULT_PARAMS,
    );
    expect(config.params.meanDivisionInterval).toBe(
      DEFAULT_PARAMS.meanDivisionInterval,
    );
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

describe("serializeRunConfig (property-based)", () => {
  const paramArb = (range: ParamRange) =>
    fc.double({ min: range.min, max: range.max, noNaN: true });

  it("round-trips any in-range params and any non-blank seed", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        paramArb(PARAM_RANGES.mutationRate),
        paramArb(PARAM_RANGES.meanDivisionInterval),
        paramArb(PARAM_RANGES.divisionJitter),
        paramArb(PARAM_RANGES.maxPopulation),
        (seed, mutationRate, meanDivisionInterval, divisionJitter, maxPopulation) => {
          const original = {
            seed,
            params: { mutationRate, meanDivisionInterval, divisionJitter, maxPopulation },
          };
          const parsed = parseRunConfig(
            `?${serializeRunConfig(original)}`,
            DEFAULT_PARAMS,
          );
          expect(parsed.seed).toBe(seed);
          expect(parsed.params.mutationRate).toBeCloseTo(mutationRate, 9);
          expect(parsed.params.meanDivisionInterval).toBeCloseTo(
            meanDivisionInterval,
            9,
          );
          expect(parsed.params.divisionJitter).toBeCloseTo(divisionJitter, 9);
          expect(parsed.params.maxPopulation).toBeCloseTo(maxPopulation, 9);
        },
      ),
    );
  });
});
