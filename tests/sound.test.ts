import { describe, it, expect, afterEach, vi } from "vitest";
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

  it("persists and reads back an unmuted flag", () => {
    const storage = new FakeStorage();
    const store = createMuteStore(storage);
    store.set(true);
    store.set(false);
    expect(store.get()).toBe(false);
  });

  it("degrades to unmuted, no-op set, when storage is unavailable", () => {
    const store = createMuteStore(null);
    expect(store.get()).toBe(false);
    expect(() => store.set(true)).not.toThrow();
    expect(store.get()).toBe(false);
  });

  it("degrades to unmuted, no-op set, when storage throws (private-mode/quota)", () => {
    const throwingStorage: Pick<Storage, "getItem" | "setItem"> = {
      getItem(): string | null {
        throw new DOMException("access denied", "SecurityError");
      },
      setItem(): void {
        throw new DOMException("access denied", "SecurityError");
      },
    };
    const store = createMuteStore(throwingStorage);
    expect(() => store.get()).not.toThrow();
    expect(store.get()).toBe(false);
    expect(() => store.set(true)).not.toThrow();
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

  describe("with a mocked WebAudio window", () => {
    class FakeParam {
      setValueAtTime = vi.fn();
      exponentialRampToValueAtTime = vi.fn();
    }
    class FakeOscillator {
      type = "sine";
      frequency = new FakeParam();
      connect = vi.fn(() => ({ connect: vi.fn() }));
      start = vi.fn();
      stop = vi.fn();
    }
    class FakeGain {
      gain = new FakeParam();
      connect = vi.fn();
    }
    class FakeAudioContext {
      state = "suspended";
      currentTime = 0;
      destination = {};
      resume = vi.fn(async () => {
        this.state = "running";
      });
      createOscillator = vi.fn(() => new FakeOscillator());
      createGain = vi.fn(() => new FakeGain());
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("lazily creates one AudioContext, reused across plays", () => {
      vi.stubGlobal("window", { AudioContext: FakeAudioContext });
      const engine = new SoundEngine();
      engine.play("ui", 0);
      engine.play("divide", 1000);
      const win = window as unknown as { AudioContext: typeof FakeAudioContext };
      expect(win.AudioContext).toBeDefined();
    });

    it("wires oscillator -> gain -> destination and schedules stop", () => {
      let created: FakeOscillator | undefined;
      class TrackingCtx extends FakeAudioContext {
        createOscillator = vi.fn(() => {
          created = new FakeOscillator();
          return created;
        });
      }
      vi.stubGlobal("window", { AudioContext: TrackingCtx });
      const engine = new SoundEngine();
      engine.play("saturate", 0);
      expect(created).toBeDefined();
      expect(created!.start).toHaveBeenCalledOnce();
      expect(created!.stop).toHaveBeenCalledOnce();
      expect(created!.connect).toHaveBeenCalledOnce();
    });

    it("falls back to webkitAudioContext when AudioContext is absent", () => {
      vi.stubGlobal("window", { webkitAudioContext: FakeAudioContext });
      const engine = new SoundEngine();
      expect(() => engine.play("ui", 0)).not.toThrow();
    });

    it("silently no-ops when neither AudioContext nor webkitAudioContext exists", () => {
      vi.stubGlobal("window", {});
      const engine = new SoundEngine();
      expect(() => engine.play("ui", 0)).not.toThrow();
    });

    it("skips synthesis entirely while muted, even with WebAudio available", () => {
      let created = false;
      class TrackingCtx extends FakeAudioContext {
        createOscillator = vi.fn(() => {
          created = true;
          return new FakeOscillator();
        });
      }
      vi.stubGlobal("window", { AudioContext: TrackingCtx });
      const engine = new SoundEngine();
      engine.setMuted(true);
      engine.play("ui", 0);
      expect(created).toBe(false);
    });

    it("resumes a suspended context on unlock", () => {
      const ctx = new FakeAudioContext();
      class SingletonCtx {
        constructor() {
          return ctx as unknown as SingletonCtx;
        }
      }
      vi.stubGlobal("window", { AudioContext: SingletonCtx });
      const engine = new SoundEngine();
      engine.unlock();
      expect(ctx.resume).toHaveBeenCalledOnce();
    });

    it("does not resume an already-running context on unlock", () => {
      const ctx = new FakeAudioContext();
      ctx.state = "running";
      class SingletonCtx {
        constructor() {
          return ctx as unknown as SingletonCtx;
        }
      }
      vi.stubGlobal("window", { AudioContext: SingletonCtx });
      const engine = new SoundEngine();
      engine.unlock();
      expect(ctx.resume).not.toHaveBeenCalled();
    });

    it("no-ops unlock when WebAudio is unavailable", () => {
      const engine = new SoundEngine();
      expect(() => engine.unlock()).not.toThrow();
    });
  });
});
