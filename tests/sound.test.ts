import { describe, it, expect } from "vitest";
import { shouldThrottle, createMuteStore, SoundEngine } from "../src/app/sound.js";

describe("shouldThrottle", () => {
  it("throttles when the interval has not elapsed", () => {
    expect(shouldThrottle(0, 50, 70)).toBe(true);
  });

  it("allows once the interval has elapsed", () => {
    expect(shouldThrottle(0, 100, 70)).toBe(false);
  });

  it("allows exactly at the boundary", () => {
    expect(shouldThrottle(0, 70, 70)).toBe(false);
  });
});

class FakeStorage implements Pick<Storage, "getItem" | "setItem"> {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("createMuteStore", () => {
  it("defaults to unmuted when nothing is persisted", () => {
    const store = createMuteStore(new FakeStorage());
    expect(store.get()).toBe(false);
  });

  it("persists and reads back a muted flag", () => {
    const storage = new FakeStorage();
    const store = createMuteStore(storage);
    store.set(true);
    expect(store.get()).toBe(true);
    expect(createMuteStore(storage).get()).toBe(true);
  });

  it("degrades to unmuted, no-op set, when storage is unavailable", () => {
    const store = createMuteStore(null);
    expect(store.get()).toBe(false);
    expect(() => store.set(true)).not.toThrow();
    expect(store.get()).toBe(false);
  });
});

describe("SoundEngine", () => {
  it("never throws when WebAudio is unavailable (node test environment)", () => {
    const engine = new SoundEngine();
    expect(() => engine.play("ui")).not.toThrow();
    expect(() => engine.play("divide")).not.toThrow();
    expect(() => engine.play("mutate")).not.toThrow();
    expect(() => engine.play("saturate")).not.toThrow();
  });

  it("round-trips the muted flag", () => {
    const engine = new SoundEngine();
    expect(engine.isMuted()).toBe(false);
    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
  });

  it("does not throw for rapid divide calls despite throttling", () => {
    const engine = new SoundEngine();
    expect(() => {
      engine.play("divide", 0);
      engine.play("divide", 10);
      engine.play("divide", 20);
    }).not.toThrow();
  });
});
