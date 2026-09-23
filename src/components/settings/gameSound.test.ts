import { describe, expect, it, vi } from "vitest";

import {
  SOUND_STORAGE_KEY,
  createGameSoundEngine,
  cuePlan,
  readSoundPreference,
  writeSoundPreference,
} from "./gameSound";

describe("ses tercihi", () => {
  it("ilk kullanımda kapalıdır ve yalnız 'on' açık kabul edilir", () => {
    const emptyStorage = { getItem: vi.fn(() => null) };
    const offStorage = { getItem: vi.fn(() => "off") };
    const onStorage = { getItem: vi.fn(() => "on") };

    expect(readSoundPreference(emptyStorage)).toBe(false);
    expect(readSoundPreference(offStorage)).toBe(false);
    expect(readSoundPreference(onStorage)).toBe(true);
    expect(readSoundPreference(null)).toBe(false);
  });

  it("açık/kapalı tercihini sonraki ziyaret için aynı anahtara yazar", () => {
    const setItem = vi.fn();
    const storage = { setItem };

    writeSoundPreference(storage, true);
    expect(setItem).toHaveBeenLastCalledWith(SOUND_STORAGE_KEY, "on");

    writeSoundPreference(storage, false);
    expect(setItem).toHaveBeenLastCalledWith(SOUND_STORAGE_KEY, "off");
  });

  it("depolama hatası oyuna taşınmaz", () => {
    const brokenReader = {
      getItem: () => {
        throw new Error("blocked");
      },
    };
    const brokenWriter = {
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readSoundPreference(brokenReader)).toBe(false);
    expect(() => writeSoundPreference(brokenWriter, true)).not.toThrow();
  });
});

describe("oyun sesleri", () => {
  it("her olayın kısa ve tanımlı bir cue planı vardır", () => {
    expect(cuePlan("select")).toHaveLength(1);
    expect(cuePlan("wrong")).toHaveLength(1);
    expect(cuePlan("one-away")).toHaveLength(2);
    expect(cuePlan("correct")).toHaveLength(3);
    expect(cuePlan("finish")).toHaveLength(3);

    for (const cue of ["select", "wrong", "one-away", "correct", "finish"] as const) {
      for (const tone of cuePlan(cue)) {
        expect(tone.durationMs).toBeLessThanOrEqual(150);
        expect(tone.offsetMs).toBeGreaterThanOrEqual(0);
        expect(tone.gain).toBeLessThan(0.05);
      }
    }
  });

  it("suspended AudioContext'i resume eder ve bir olayın planını yalnız bir kez zamanlar", async () => {
    let state: AudioContextState = "suspended";
    const starts = vi.fn();
    const stops = vi.fn();
    const connect = vi.fn();
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();
    const resume = vi.fn(async () => {
      state = "running";
    });

    const fakeContext = {
      get state() {
        return state;
      },
      currentTime: 10,
      destination: {},
      resume,
      createOscillator: vi.fn(() => ({
        type: "sine" as OscillatorType,
        frequency: { setValueAtTime },
        connect,
        start: starts,
        stop: stops,
      })),
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime,
          exponentialRampToValueAtTime,
        },
        connect,
      })),
    } as unknown as AudioContext;

    const engine = createGameSoundEngine(() => fakeContext);
    await engine.play("wrong");

    expect(resume).toHaveBeenCalledTimes(1);
    expect(starts).toHaveBeenCalledTimes(1);
    expect(stops).toHaveBeenCalledTimes(1);

    await engine.play("correct");
    expect(resume).toHaveBeenCalledTimes(1);
    expect(starts).toHaveBeenCalledTimes(4);
  });

  it("AudioContext desteklenmiyorsa sessizce no-op olur", async () => {
    const engine = createGameSoundEngine(() => null);
    await expect(engine.unlock()).resolves.toBe(false);
    await expect(engine.play("select")).resolves.toBeUndefined();
  });
});
