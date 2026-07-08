import { describe, it, expect } from "vitest";
import {
  setPlayButtonState,
  setMuteButtonState,
  setMutationLabel,
  setIntervalLabel,
  setJitterLabel,
  setPopulationLabel,
  setSpeedLabel,
} from "../src/app/controls.js";

/** A minimal ParentNode stand-in exposing just the `[data-value]` spans the label setters target. */
function makeFakeRail(keys: string[]) {
  const spans = new Map(keys.map((k) => [k, { textContent: "" }]));
  return {
    querySelector(selector: string) {
      const match = /\[data-value="(.+)"\]/.exec(selector);
      return match ? (spans.get(match[1]) ?? null) : null;
    },
    spans,
  } as unknown as ParentNode & { spans: Map<string, { textContent: string }> };
}

/**
 * A minimal stand-in for HTMLButtonElement covering only what
 * setPlayButtonState touches, so this stays a plain unit test — no jsdom.
 */
function makeFakeButton() {
  const attrs = new Map<string, string>();
  let innerHTMLWrites = 0;
  return {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    getAttribute(name: string) {
      return attrs.get(name) ?? null;
    },
    set innerHTML(_: string) {
      innerHTMLWrites++;
    },
    get innerHTMLWrites() {
      return innerHTMLWrites;
    },
  } as unknown as HTMLButtonElement & { innerHTMLWrites: number };
}

describe("setPlayButtonState", () => {
  it("sets the aria-label and rebuilds the icon on a real state change", () => {
    const btn = makeFakeButton();
    setPlayButtonState(btn, true);
    expect(btn.getAttribute("aria-label")).toBe("Pause");
    expect(btn.innerHTMLWrites).toBe(1);
  });

  it("is a no-op when called again with the same state", () => {
    // Regression test: doReset() calls this unconditionally with `playing:
    // false` even when the button is already showing "Play". If that lands
    // mid-click (the seed field's blur-triggered "change" firing between
    // this button's mousedown and mouseup), rebuilding its child node out
    // from under the pointer makes the browser drop the click — the button
    // just looks unresponsive. Skipping the redundant rebuild fixes it.
    const btn = makeFakeButton();
    setPlayButtonState(btn, false);
    expect(btn.innerHTMLWrites).toBe(1);
    setPlayButtonState(btn, false);
    expect(btn.innerHTMLWrites).toBe(1); // no second rebuild
  });
});

describe("setMuteButtonState", () => {
  it("reflects muted as a pressed toggle with an unmute label", () => {
    const btn = makeFakeButton();
    setMuteButtonState(btn, true);
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(btn.getAttribute("aria-label")).toBe("Unmute sound");
  });

  it("reflects unmuted as an unpressed toggle with a mute label", () => {
    const btn = makeFakeButton();
    setMuteButtonState(btn, false);
    expect(btn.getAttribute("aria-pressed")).toBe("false");
    expect(btn.getAttribute("aria-label")).toBe("Mute sound");
  });
});

describe("value-label setters", () => {
  it("writes each setter's text into its own [data-value] span, not a sibling's", () => {
    const rail = makeFakeRail(["mutation", "interval", "jitter", "population", "speed"]);
    setMutationLabel(rail, "0.25");
    setIntervalLabel(rail, "2.2s");
    setJitterLabel(rail, "0.35");
    setPopulationLabel(rail, "512");
    setSpeedLabel(rail, "1x");

    expect(rail.spans.get("mutation")!.textContent).toBe("0.25");
    expect(rail.spans.get("interval")!.textContent).toBe("2.2s");
    expect(rail.spans.get("jitter")!.textContent).toBe("0.35");
    expect(rail.spans.get("population")!.textContent).toBe("512");
    expect(rail.spans.get("speed")!.textContent).toBe("1x");
  });

  it("does not throw when the target span is missing from the rail", () => {
    const rail = makeFakeRail([]); // no matching [data-value] spans at all
    expect(() => setMutationLabel(rail, "0.25")).not.toThrow();
  });
});
