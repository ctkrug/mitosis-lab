import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { formatCount } from "../src/app/format.js";

describe("formatCount", () => {
  it("formats zero", () => {
    expect(formatCount(0)).toBe("0");
  });

  it("adds thousands separators", () => {
    expect(formatCount(1234567)).toBe("1,234,567");
  });

  it("truncates fractional values", () => {
    expect(formatCount(41.9)).toBe("41");
  });

  it("clamps negative values to zero", () => {
    expect(formatCount(-5)).toBe("0");
  });

  it("falls back to an em dash for non-finite input", () => {
    expect(formatCount(NaN)).toBe("—");
    expect(formatCount(Infinity)).toBe("—");
  });
});

describe("formatCount (property-based)", () => {
  it("never throws and always returns digits+separators or the em dash", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: false, noDefaultInfinity: false }),
        (value) => {
          const result = formatCount(value);
          expect(/^([\d,]+|—)$/.test(result)).toBe(true);
        },
      ),
    );
  });
});
