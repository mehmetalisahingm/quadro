export type GameSoundCue = "select" | "wrong" | "one-away" | "correct" | "finish";

export const SOUND_STORAGE_KEY = "quadro:sound:v1";

export type ToneStep = {
  frequency: number;
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

type BrowserWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
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
    if (audioContext.state === "running") return true;
    if (audioContext.state !== "suspended") return false;
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
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.008);
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
