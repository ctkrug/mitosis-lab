/**
 * Synthesized SFX — oscillators only, zero binary audio assets. The
 * AudioContext is created lazily (autoplay policy requires a user gesture)
 * and every entry point guards environments without WebAudio (SSR, tests,
 * older browsers) so a missing API degrades to silence, never a throw.
 */

export type SfxKind = "divide" | "mutate" | "saturate" | "ui";

interface Voice {
  freq: number;
  duration: number;
  type: OscillatorType;
  gain: number;
}

const VOICES: Record<SfxKind, Voice> = {
  divide: { freq: 660, duration: 0.06, type: "sine", gain: 0.05 },
  mutate: { freq: 340, duration: 0.09, type: "triangle", gain: 0.06 },
  saturate: { freq: 220, duration: 0.55, type: "sawtooth", gain: 0.05 },
  ui: { freq: 880, duration: 0.04, type: "square", gain: 0.03 },
};

/** Minimum gap between repeats of a given SFX kind, so a fast run can't spam it. */
const THROTTLE_MS: Record<SfxKind, number> = {
  divide: 70,
  mutate: 90,
  saturate: 1000,
  ui: 40,
};

/** True if `nowMs` is still within `minIntervalMs` of `lastMs`. */
export function shouldThrottle(
  lastMs: number,
  nowMs: number,
  minIntervalMs: number,
): boolean {
  return nowMs - lastMs < minIntervalMs;
}

const MUTE_KEY = "mitosis-lab:muted";

export interface MuteStore {
  get(): boolean;
  set(muted: boolean): void;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** A persisted mute flag; a `null` storage (unavailable) degrades to unmuted. */
export function createMuteStore(storage: StorageLike | null): MuteStore {
  return {
    get(): boolean {
      if (!storage) return false;
      return storage.getItem(MUTE_KEY) === "1";
    },
    set(muted: boolean): void {
      storage?.setItem(MUTE_KEY, muted ? "1" : "0");
    },
  };
}

type AudioContextCtor = new () => AudioContext;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastPlayedAt: Partial<Record<SfxKind, number>> = {};

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === "undefined") return null;
    const Ctor = (window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext) as AudioContextCtor | undefined;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  /** Play a synthesized SFX. `now` is injectable for tests; defaults to wall time. */
  play(kind: SfxKind, now: number = performance.now()): void {
    if (this.muted) return;
    const last = this.lastPlayedAt[kind] ?? -Infinity;
    if (shouldThrottle(last, now, THROTTLE_MS[kind])) return;
    this.lastPlayedAt[kind] = now;

    const ctx = this.context();
    if (!ctx) return;

    const voice = VOICES[kind];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = voice.type;
    osc.frequency.setValueAtTime(voice.freq, ctx.currentTime);
    gain.gain.setValueAtTime(voice.gain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + voice.duration,
    );
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + voice.duration);
  }
}
