import { describe, it, expect } from "vitest";
import { setPlayButtonState, setMuteButtonState } from "../src/app/controls.js";

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
