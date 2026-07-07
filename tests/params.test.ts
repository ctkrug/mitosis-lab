import { describe, it, expect } from "vitest";
import { clampParam, clampParams, PARAM_RANGES } from "../src/app/params.js";
import { DEFAULT_PARAMS } from "../src/sim/types.js";

describe("clampParam", () => {
  it("passes through an in-range value", () => {
    expect(clampParam("mutationRate", 0.5, 0.25)).toBe(0.5);
  });

  it("clamps below the minimum", () => {
    expect(clampParam("mutationRate", -1, 0.25)).toBe(
      PARAM_RANGES.mutationRate.min,
    );
  });

  it("clamps above the maximum", () => {
    expect(clampParam("maxPopulation", 1e9, 512)).toBe(
      PARAM_RANGES.maxPopulation.max,
    );
  });

  it("falls back for NaN input", () => {
    expect(clampParam("divisionJitter", NaN, 0.4)).toBe(0.4);
  });
});

describe("clampParams", () => {
  it("returns the base unchanged for an empty patch", () => {
    expect(clampParams({}, DEFAULT_PARAMS)).toEqual(DEFAULT_PARAMS);
  });

  it("clamps only the fields present in the patch", () => {
    const result = clampParams({ mutationRate: 5 }, DEFAULT_PARAMS);
    expect(result.mutationRate).toBe(PARAM_RANGES.mutationRate.max);
    expect(result.meanDivisionInterval).toBe(DEFAULT_PARAMS.meanDivisionInterval);
  });

  it("clamps every field when a full malformed object is given", () => {
    const result = clampParams(
      {
        mutationRate: -5,
        meanDivisionInterval: 9999,
        divisionJitter: NaN,
        maxPopulation: -10,
      },
      DEFAULT_PARAMS,
    );
    expect(result.mutationRate).toBe(PARAM_RANGES.mutationRate.min);
    expect(result.meanDivisionInterval).toBe(PARAM_RANGES.meanDivisionInterval.max);
    expect(result.divisionJitter).toBe(DEFAULT_PARAMS.divisionJitter);
    expect(result.maxPopulation).toBe(PARAM_RANGES.maxPopulation.min);
  });
});
