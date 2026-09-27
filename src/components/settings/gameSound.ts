export type GameSoundCue =
  | "select"
  | "wrong"
  | "one-away"
  | "correct"
  | "finish"
  | "intro-ocean"
  | "intro-meadow"
  | "intro-sky"
  | "intro-sunrise"
  | "intro-city";

export const SOUND_STORAGE_KEY = "quadro:sound:v1";

export type ToneStep = {
  frequency: number;
  endFrequency?: number;
  offsetMs: number;
  durationMs: number;
  gain: number;
  type: OscillatorType;
};

const CUES: Record<GameSoundCue, readonly ToneStep[]> = {
  select: [
    { frequency: 420, offsetMs: 0, durationMs: 42, gain: 0.035, type: "sine" },
  ],
  wrong: [
    { frequency: 185, offsetMs: 0, durationMs: 105, gain: 0.045, type: "triangle" },
  ],
  "one-away": [
    { frequency: 390, offsetMs: 0, durationMs: 60, gain: 0.035, type: "sine" },
    { frequency: 520, offsetMs: 72, durationMs: 70, gain: 0.032, type: "sine" },
  ],
  correct: [
    { frequency: 523.25, offsetMs: 0, durationMs: 70, gain: 0.032, type: "sine" },
    { frequency: 659.25, offsetMs: 62, durationMs: 80, gain: 0.03, type: "sine" },
    { frequency: 783.99, offsetMs: 128, durationMs: 100, gain: 0.028, type: "sine" },
  ],
  finish: [
    { frequency: 659.25, offsetMs: 0, durationMs: 90, gain: 0.03, type: "sine" },
    { frequency: 783.99, offsetMs: 70, durationMs: 110, gain: 0.03, type: "sine" },
    { frequency: 1046.5, offsetMs: 150, durationMs: 150, gain: 0.026, type: "sine" },
  ],
  "intro-ocean": [
    { frequency: 146.83, endFrequency: 110, offsetMs: 0, durationMs: 620, gain: 0.018, type: "sine" },
    { frequency: 293.66, endFrequency: 392, offsetMs: 180, durationMs: 720, gain: 0.014, type: "sine" },
    { frequency: 587.33, endFrequency: 783.99, offsetMs: 760, durationMs: 360, gain: 0.012, type: "sine" },
  ],
  "intro-meadow": [
    { frequency: 659.25, offsetMs: 0, durationMs: 140, gain: 0.019, type: "sine" },
    { frequency: 880, offsetMs: 210, durationMs: 160, gain: 0.016, type: "sine" },
    { frequency: 1046.5, offsetMs: 430, durationMs: 180, gain: 0.014, type: "sine" },
    { frequency: 1318.51, offsetMs: 690, durationMs: 210, gain: 0.011, type: "sine" },
  ],
  "intro-sky": [
    { frequency: 392, endFrequency: 523.25, offsetMs: 0, durationMs: 720, gain: 0.014, type: "sine" },
    { frequency: 587.33, endFrequency: 783.99, offsetMs: 260, durationMs: 680, gain: 0.012, type: "sine" },
    { frequency: 987.77, offsetMs: 840, durationMs: 170, gain: 0.01, type: "sine" },
  ],
  "intro-sunrise": [
    { frequency: 261.63, endFrequency: 329.63, offsetMs: 0, durationMs: 900, gain: 0.015, type: "sine" },
    { frequency: 329.63, endFrequency: 392, offsetMs: 180, durationMs: 920, gain: 0.014, type: "sine" },
    { frequency: 392, endFrequency: 523.25, offsetMs: 420, durationMs: 880, gain: 0.013, type: "sine" },
  ],
  "intro-city": [
    { frequency: 154, endFrequency: 84, offsetMs: 0, durationMs: 500, gain: 0.018, type: "triangle" },
    { frequency: 246.94, endFrequency: 146.83, offsetMs: 120, durationMs: 640, gain: 0.013, type: "sawtooth" },
    { frequency: 880, endFrequency: 440, offsetMs: 620, durationMs: 260, gain: 0.01, type: "sine" },
  ],
};

export function cuePlan(cue: GameSoundCue): readonly ToneStep[] {
  return CUES[cue];
}

export function readSoundPreference(storage: Pick<Storage, "getItem"> | null | undefined): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(SOUND_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeSoundPreference(
  storage: Pick<Storage, "setItem"> | null | undefined,
  enabled: boolean,
): void {
  if (!storage) return;
  try {
    storage.setItem(SOUND_STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Gizli mod / kota gibi depolama hataları oyunu veya ses kontrolünü bozmamalı.
  }
}

type AudioContextConstructor = new () => AudioContext;

type BrowserWindow = Window & {
  AudioContext?: AudioContextConstructor;
  webkitAudioContext?: AudioContextConstructor;
};

export function createBrowserAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as BrowserWindow;
  const AudioContextConstructor = browserWindow.AudioContext ?? browserWindow.webkitAudioContext;
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

export type GameSoundEngine = {
  unlock: () => Promise<boolean>;
  play: (cue: GameSoundCue) => Promise<void>;
};

export function createGameSoundEngine(
  createContext: () => AudioContext | null = createBrowserAudioContext,
): GameSoundEngine {
  let context: AudioContext | null = null;

  const getContext = () => {
    context ??= createContext();
    return context;
  };

  const ensureRunning = async (audioContext: AudioContext): Promise<boolean> => {
    const initialState = audioContext.state;
    if (initialState === "running") return true;
    if (initialState !== "suspended") return false;
    try {
      await audioContext.resume();
      return audioContext.state === "running";
    } catch {
      return false;
    }
  };

  const play = async (cue: GameSoundCue): Promise<void> => {
    const audioContext = getContext();
    if (!audioContext || !(await ensureRunning(audioContext))) return;

    const baseTime = audioContext.currentTime;
    for (const tone of cuePlan(cue)) {
      const start = baseTime + tone.offsetMs / 1000;
      const stop = start + tone.durationMs / 1000;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = tone.type;
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      if (tone.endFrequency && tone.endFrequency > 0) {
        oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, stop);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(stop + 0.01);
    }
  };

  return {
    unlock: async () => {
      const audioContext = getContext();
      return audioContext ? ensureRunning(audioContext) : false;
    },
    play,
  };
}
