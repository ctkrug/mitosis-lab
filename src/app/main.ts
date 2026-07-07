/**
 * Entry point — wires the simulation, renderer, controls, sound, and URL
 * state together. See docs/ARCHITECTURE.md for the module map; the pure
 * math (layout, camera, clamping, URL parsing) all lives in dedicated,
 * unit-tested files, so this is mostly plumbing.
 */
import { Lineage } from "../sim/lineage.js";
import { DEFAULT_PARAMS, type SimParams } from "../sim/types.js";
import { attachStage } from "./canvas.js";
import { TreeRenderer } from "./render.js";
import { FixedStepLoop } from "./sim-loop.js";
import { clampParams } from "./params.js";
import { clampSpeed, formatSpeed } from "./transport.js";
import { formatCount } from "./format.js";
import { parseRunConfig, serializeRunConfig } from "./url.js";
import { SoundEngine, createMuteStore } from "./sound.js";
import {
  queryControls,
  bindControls,
  setMutationLabel,
  setIntervalLabel,
  setJitterLabel,
  setPopulationLabel,
  setSpeedLabel,
  setPlayButtonState,
  setMuteButtonState,
} from "./controls.js";

const canvas = document.getElementById("stage") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#stage canvas missing");
const railEl = document.querySelector(".rail");
if (!railEl) throw new Error(".rail missing");
const rail: Element = railEl;
const liveRegion = document.querySelector<HTMLElement>("[data-live]");
const bloom = document.querySelector<HTMLElement>("[data-bloom]");

const els = queryControls(document);

const hudStats = {
  population: document.querySelector('[data-stat="population"]')!,
  generation: document.querySelector('[data-stat="generation"]')!,
  divisions: document.querySelector('[data-stat="divisions"]')!,
  mutations: document.querySelector('[data-stat="mutations"]')!,
};

let storage: Storage | null = null;
try {
  storage = window.localStorage;
} catch {
  storage = null; // privacy mode can throw on access
}
const muteStore = createMuteStore(storage);
const sound = new SoundEngine();
sound.setMuted(muteStore.get());
setMuteButtonState(els.muteBtn, sound.isMuted());

let { seed, params } = parseRunConfig(window.location.search, DEFAULT_PARAMS);
let lineage = new Lineage(seed, params);
let speed = 1;
let playing = false;
let bloomShown = false;
let lastMutations = 0;

const renderer = new TreeRenderer();
const fixedLoop = new FixedStepLoop();
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener("change", (e) => {
  reducedMotion = e.matches;
});

function announce(message: string): void {
  if (liveRegion) liveRegion.textContent = message;
}

function syncUrl(): void {
  const search = serializeRunConfig({ seed, params: lineage.params });
  window.history.replaceState(null, "", `?${search}`);
}

function refreshParamLabels(): void {
  setMutationLabel(rail, lineage.params.mutationRate.toFixed(2));
  setIntervalLabel(rail, `${lineage.params.meanDivisionInterval.toFixed(1)}s`);
  setJitterLabel(rail, lineage.params.divisionJitter.toFixed(2));
  setPopulationLabel(rail, formatCount(lineage.params.maxPopulation));
  setSpeedLabel(rail, formatSpeed(speed));
}

function syncSlidersToParams(): void {
  els.mutation.valueAsNumber = lineage.params.mutationRate;
  els.interval.valueAsNumber = lineage.params.meanDivisionInterval;
  els.jitter.valueAsNumber = lineage.params.divisionJitter;
  els.population.valueAsNumber = lineage.params.maxPopulation;
  els.speed.valueAsNumber = speed;
  els.seed.value = seed;
  refreshParamLabels();
}

function hideBloom(): void {
  bloomShown = false;
  bloom?.setAttribute("hidden", "");
}

function showBloom(): void {
  if (!bloom || bloomShown) return;
  bloomShown = true;
  const stats = lineage.stats();
  bloom.querySelector('[data-bloom-stat="population"]')!.textContent =
    formatCount(stats.population);
  bloom.querySelector('[data-bloom-stat="generation"]')!.textContent =
    formatCount(stats.maxGeneration);
  bloom.querySelector('[data-bloom-stat="divisions"]')!.textContent =
    formatCount(stats.divisions);
  bloom.querySelector('[data-bloom-stat="mutations"]')!.textContent =
    formatCount(stats.mutations);
  bloom.querySelector('[data-bloom-stat="seed"]')!.textContent = seed;
  bloom.removeAttribute("hidden");
  sound.play("saturate");
  playing = false;
  setPlayButtonState(els.playBtn, playing);
}

function doReset(nextSeed: string): void {
  seed = nextSeed;
  lineage = new Lineage(seed, params);
  renderer.reset();
  fixedLoop.reset();
  lastMutations = 0;
  playing = false;
  hideBloom();
  setPlayButtonState(els.playBtn, playing);
  syncSlidersToParams();
  syncUrl();
  announce(`Run reset with seed "${seed}"`);
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function shareRun(): Promise<void> {
  const url = `${window.location.origin}${window.location.pathname}?${serializeRunConfig(
    { seed, params: lineage.params },
  )}`;
  try {
    await navigator.clipboard.writeText(url);
    announce("Share link copied to clipboard");
  } catch {
    announce(url);
  }
}

bindControls(els, {
  onParamChange(patch: Partial<SimParams>) {
    lineage.params = clampParams(patch, lineage.params);
    params = lineage.params;
    refreshParamLabels();
    syncUrl();
  },
  onSpeedChange(value: number) {
    speed = clampSpeed(value, speed);
    setSpeedLabel(rail, formatSpeed(speed));
  },
  onSeedCommit(value: string) {
    doReset(value.trim().length > 0 ? value.trim() : randomSeed());
  },
  onTogglePlay() {
    playing = !playing;
    setPlayButtonState(els.playBtn, playing);
    sound.play("ui");
  },
  onStep() {
    lineage.advance(lineage.params.meanDivisionInterval);
    sound.play("ui");
  },
  onReset() {
    doReset(seed);
  },
  onToggleMute() {
    const muted = !sound.isMuted();
    sound.setMuted(muted);
    muteStore.set(muted);
    setMuteButtonState(els.muteBtn, muted);
  },
  onShare() {
    void shareRun();
  },
});

document.getElementById("btn-bloom-share")?.addEventListener("click", () => {
  void shareRun();
});
document.getElementById("btn-bloom-new")?.addEventListener("click", () => {
  doReset(randomSeed());
});

const unlockAudio = (): void => {
  sound.unlock();
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", unlockAudio);
};
window.addEventListener("pointerdown", unlockAudio);
window.addEventListener("keydown", unlockAudio);

syncSlidersToParams();
setPlayButtonState(els.playBtn, playing);
syncUrl();

let last = 0;
const stage = attachStage(canvas, () => {});

const frame = (now: number): void => {
  const dtReal = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;

  if (playing && !bloomShown) {
    fixedLoop.tick(dtReal * speed, (stepDt) => {
      const fired = lineage.advance(stepDt);
      if (fired > 0) sound.play("divide");
      const stats = lineage.stats();
      if (stats.mutations > lastMutations) sound.play("mutate");
      lastMutations = stats.mutations;
      if (stats.population >= lineage.params.maxPopulation) showBloom();
    });
  }

  renderer.render(
    stage.ctx,
    lineage.cells,
    { width: stage.width, height: stage.height },
    now,
    reducedMotion,
  );

  const stats = lineage.stats();
  hudStats.population.textContent = formatCount(stats.population);
  hudStats.generation.textContent = formatCount(stats.maxGeneration);
  hudStats.divisions.textContent = formatCount(stats.divisions);
  hudStats.mutations.textContent = formatCount(stats.mutations);

  requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
