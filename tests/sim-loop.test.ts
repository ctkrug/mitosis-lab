import { describe, it, expect } from "vitest";
import { FixedStepLoop } from "../src/app/sim-loop.js";

describe("FixedStepLoop", () => {
  it("takes no steps when elapsed time is under one step", () => {
    const loop = new FixedStepLoop({ stepSeconds: 1 / 30 });
    const calls: number[] = [];
    const steps = loop.tick(0.01, (dt) => calls.push(dt));
    expect(steps).toBe(0);
    expect(calls).toHaveLength(0);
    expect(loop.pending()).toBeCloseTo(0.01, 10);
  });

  it("fires exactly one step once a full step's worth accumulates", () => {
    const loop = new FixedStepLoop({ stepSeconds: 1 / 30 });
    loop.tick(0.02, () => {});
    const calls: number[] = [];
    const steps = loop.tick(1 / 30 - 0.02, (dt) => calls.push(dt));
    expect(steps).toBe(1);
    expect(calls).toEqual([1 / 30]);
  });

  it("fires multiple steps when elapsed time spans several increments", () => {
    const loop = new FixedStepLoop({ stepSeconds: 0.1 });
    const calls: number[] = [];
    const steps = loop.tick(0.35, (dt) => calls.push(dt));
    expect(steps).toBe(3);
    expect(calls).toEqual([0.1, 0.1, 0.1]);
    expect(loop.pending()).toBeCloseTo(0.05, 10);
  });

  it("caps steps per tick so a huge elapsed gap cannot spiral", () => {
    const loop = new FixedStepLoop({ stepSeconds: 0.01, maxStepsPerTick: 5 });
    const steps = loop.tick(10, () => {});
    expect(steps).toBe(5);
    expect(loop.pending()).toBeGreaterThan(9);
  });

  it("reset drops any banked partial-step time", () => {
    const loop = new FixedStepLoop({ stepSeconds: 1 });
    loop.tick(0.7, () => {});
    loop.reset();
    expect(loop.pending()).toBe(0);
    expect(loop.tick(0.7, () => {})).toBe(0);
  });

  it("stays at zero pending when onStep calls reset() reentrantly", () => {
    // site/preview.ts reseeds (calling fixedLoop.reset()) from inside the
    // very onStep callback tick() is looping over. Without guarding for
    // that, the loop unconditionally does `accumulator -= stepSeconds`
    // after onStep returns, driving the just-reset (zeroed) accumulator
    // negative — a real, if minor, extra delay before the next step fires.
    const loop = new FixedStepLoop({ stepSeconds: 1 / 30 });
    loop.tick(0.05, () => {
      loop.reset();
    });
    expect(loop.pending()).toBe(0);
  });

  it("ignores non-positive elapsed input without going backwards", () => {
    const loop = new FixedStepLoop({ stepSeconds: 1 });
    loop.tick(0.5, () => {});
    loop.tick(-100, () => {});
    expect(loop.pending()).toBeCloseTo(0.5, 10);
  });

  it("ignores a NaN elapsed input instead of corrupting the accumulator", () => {
    const loop = new FixedStepLoop({ stepSeconds: 1 });
    loop.tick(0.5, () => {});
    const steps = loop.tick(NaN, () => {});
    expect(steps).toBe(0);
    expect(loop.pending()).toBeCloseTo(0.5, 10);
  });

  it("ignores an Infinity elapsed input instead of permanently poisoning the accumulator", () => {
    const loop = new FixedStepLoop({ stepSeconds: 1 / 30, maxStepsPerTick: 240 });
    const first = loop.tick(Infinity, () => {});
    expect(first).toBe(0);
    expect(loop.pending()).toBe(0);
    // A poisoned (Infinity) accumulator would fire maxStepsPerTick forever
    // regardless of subsequent input; a healthy loop takes no steps for 0.
    const second = loop.tick(0, () => {});
    expect(second).toBe(0);
  });

  it("total steps fired is independent of how elapsed time is chunked", () => {
    const totalReal = 2.03;
    const stepSeconds = 1 / 30;

    const oneShot = new FixedStepLoop({ stepSeconds, maxStepsPerTick: 1000 });
    let oneShotSteps = 0;
    oneShot.tick(totalReal, () => oneShotSteps++);

    const chunked = new FixedStepLoop({ stepSeconds, maxStepsPerTick: 1000 });
    let chunkedSteps = 0;
    const chunkSize = 1 / 240; // finer than the step size, like a high fps
    let remaining = totalReal;
    while (remaining > 1e-9) {
      const dt = Math.min(chunkSize, remaining);
      chunked.tick(dt, () => chunkedSteps++);
      remaining -= dt;
    }

    expect(oneShotSteps).toBe(Math.floor(totalReal / stepSeconds));
    // Chunked accumulation should land on the same fixed-step count.
    expect(chunkedSteps).toBe(Math.floor(totalReal / stepSeconds));
  });
});
