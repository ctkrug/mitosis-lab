/**
 * Landing-page hero preview: a real, tiny Mitosis Lab run — same sim and
 * renderer as the app — auto-playing on a loop with no controls, sound, or
 * URL state. Reseeds with a fresh random seed once the small preview
 * population cap is reached, so the hero never goes idle.
 */
import { Lineage } from "../src/sim/lineage.js";
import { attachStage } from "../src/app/canvas.js";
import { TreeRenderer } from "../src/app/render.js";
import { FixedStepLoop } from "../src/app/sim-loop.js";

const PREVIEW_PARAMS = {
  mutationRate: 0.4,
  meanDivisionInterval: 1.1,
  divisionJitter: 0.45,
  maxPopulation: 140,
};

const canvas = document.getElementById("preview") as HTMLCanvasElement | null;
if (canvas) {
  const renderer = new TreeRenderer();
  const fixedLoop = new FixedStepLoop();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const randomSeed = (): string => Math.random().toString(36).slice(2, 10);
  let lineage = new Lineage(randomSeed(), PREVIEW_PARAMS);

  const stage = attachStage(canvas, () => {});

  let last = 0;
  const frame = (now: number): void => {
    const dtReal = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;

    fixedLoop.tick(dtReal, (stepDt) => {
      lineage.advance(stepDt);
      if (lineage.stats().population >= PREVIEW_PARAMS.maxPopulation) {
        lineage = new Lineage(randomSeed(), PREVIEW_PARAMS);
        renderer.reset();
        fixedLoop.reset();
      }
    });

    renderer.render(
      stage.ctx,
      lineage.cells,
      { width: stage.width, height: stage.height },
      now,
      reducedMotion,
    );

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}
