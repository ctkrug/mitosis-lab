/**
 * Fixed-timestep driver for the simulation.
 *
 * `requestAnimationFrame` delivers a variable, unpredictable `dt`, but the
 * biology must be reproducible: the same seed has to produce the same tree
 * whether it renders at 30fps or 144fps. `FixedStepLoop` accumulates real
 * elapsed time and fires `onStep` in fixed-size increments, so the sequence
 * of `Lineage.advance()` calls a run makes is independent of frame rate.
 */

export interface FixedStepOptions {
  /** Simulation seconds advanced per fixed step. */
  stepSeconds: number;
  /** Safety cap on steps per tick, so a backgrounded tab can't spiral. */
  maxStepsPerTick: number;
}

export const DEFAULT_FIXED_STEP: FixedStepOptions = {
  stepSeconds: 1 / 30,
  maxStepsPerTick: 240,
};

export class FixedStepLoop {
  private accumulator = 0;
  private readonly opts: FixedStepOptions;

  constructor(opts: Partial<FixedStepOptions> = {}) {
    this.opts = { ...DEFAULT_FIXED_STEP, ...opts };
  }

  /**
   * Feed `elapsedSeconds` of (already speed-scaled) real time in and fire
   * `onStep(stepSeconds)` once per fixed increment consumed. Returns the
   * number of steps taken this call.
   */
  tick(elapsedSeconds: number, onStep: (stepSeconds: number) => void): number {
    if (elapsedSeconds > 0) this.accumulator += elapsedSeconds;
    const { stepSeconds, maxStepsPerTick } = this.opts;

    let steps = 0;
    while (this.accumulator >= stepSeconds && steps < maxStepsPerTick) {
      onStep(stepSeconds);
      this.accumulator -= stepSeconds;
      steps++;
    }
    return steps;
  }

  /** Seconds of real time banked but not yet consumed by a step. */
  pending(): number {
    return this.accumulator;
  }

  /** Drop any banked partial-step time, e.g. on pause or reset. */
  reset(): void {
    this.accumulator = 0;
  }
}
