/**
 * DOM glue for the control rail: reads the static markup in index.html,
 * wires input/click events to callbacks, and offers small setters so
 * main.ts can push live values back onto the sliders/labels/buttons. No
 * business logic lives here — clamping and formatting come from
 * params.ts/transport.ts/format.ts, which are unit-tested on their own.
 */
import type { SimParams } from "../sim/types.js";

function required<T extends Element>(doc: Document, id: string): T {
  const el = doc.getElementById(id);
  if (!el) throw new Error(`#${id} missing from the control rail`);
  return el as unknown as T;
}

export interface ControlElements {
  mutation: HTMLInputElement;
  interval: HTMLInputElement;
  jitter: HTMLInputElement;
  population: HTMLInputElement;
  speed: HTMLInputElement;
  seed: HTMLInputElement;
  playBtn: HTMLButtonElement;
  stepBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  muteBtn: HTMLButtonElement;
  shareBtn: HTMLButtonElement;
}

export function queryControls(doc: Document): ControlElements {
  return {
    mutation: required(doc, "ctl-mutation"),
    interval: required(doc, "ctl-interval"),
    jitter: required(doc, "ctl-jitter"),
    population: required(doc, "ctl-population"),
    speed: required(doc, "ctl-speed"),
    seed: required(doc, "ctl-seed"),
    playBtn: required(doc, "btn-play"),
    stepBtn: required(doc, "btn-step"),
    resetBtn: required(doc, "btn-reset"),
    muteBtn: required(doc, "btn-mute"),
    shareBtn: required(doc, "btn-share"),
  };
}

export interface ControlCallbacks {
  onParamChange(patch: Partial<SimParams>): void;
  onSpeedChange(speed: number): void;
  onSeedCommit(seed: string): void;
  onTogglePlay(): void;
  onStep(): void;
  onReset(): void;
  onToggleMute(): void;
  onShare(): void;
}

export function bindControls(
  els: ControlElements,
  callbacks: ControlCallbacks,
): void {
  els.mutation.addEventListener("input", () =>
    callbacks.onParamChange({ mutationRate: els.mutation.valueAsNumber }),
  );
  els.interval.addEventListener("input", () =>
    callbacks.onParamChange({ meanDivisionInterval: els.interval.valueAsNumber }),
  );
  els.jitter.addEventListener("input", () =>
    callbacks.onParamChange({ divisionJitter: els.jitter.valueAsNumber }),
  );
  els.population.addEventListener("input", () =>
    callbacks.onParamChange({ maxPopulation: els.population.valueAsNumber }),
  );
  els.speed.addEventListener("input", () =>
    callbacks.onSpeedChange(els.speed.valueAsNumber),
  );
  els.seed.addEventListener("change", () => callbacks.onSeedCommit(els.seed.value));

  els.playBtn.addEventListener("click", callbacks.onTogglePlay);
  els.stepBtn.addEventListener("click", callbacks.onStep);
  els.resetBtn.addEventListener("click", callbacks.onReset);
  els.muteBtn.addEventListener("click", callbacks.onToggleMute);
  els.shareBtn.addEventListener("click", callbacks.onShare);
}

function setValueLabel(rail: ParentNode, key: string, text: string): void {
  const el = rail.querySelector(`[data-value="${key}"]`);
  if (el) el.textContent = text;
}

export function setMutationLabel(rail: ParentNode, text: string): void {
  setValueLabel(rail, "mutation", text);
}
export function setIntervalLabel(rail: ParentNode, text: string): void {
  setValueLabel(rail, "interval", text);
}
export function setJitterLabel(rail: ParentNode, text: string): void {
  setValueLabel(rail, "jitter", text);
}
export function setPopulationLabel(rail: ParentNode, text: string): void {
  setValueLabel(rail, "population", text);
}
export function setSpeedLabel(rail: ParentNode, text: string): void {
  setValueLabel(rail, "speed", text);
}

export function setPlayButtonState(btn: HTMLButtonElement, playing: boolean): void {
  btn.setAttribute("aria-label", playing ? "Pause" : "Play");
  btn.innerHTML = playing
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 5l12 7-12 7z"/></svg>';
}

export function setMuteButtonState(btn: HTMLButtonElement, muted: boolean): void {
  btn.setAttribute("aria-pressed", String(muted));
  btn.setAttribute("aria-label", muted ? "Unmute sound" : "Mute sound");
}
