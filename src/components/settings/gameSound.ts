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
    { frequency: 92, endFrequency: 245, offsetMs: 0, durationMs: 760, gain: 0.018, type: "sawtooth" },
    { frequency: 184, endFrequency: 490, offsetMs: 40, durationMs: 720, gain: 0.012, type: "square" },
    { frequency: 760, endFrequency: 240, offsetMs: 610, durationMs: 330, gain: 0.01, type: "sine" },
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

function playFormulaPass(audioContext: AudioContext, baseTime: number): boolean {
  if (
    typeof audioContext.createBiquadFilter !== "function" ||
    typeof audioContext.createStereoPanner !== "function"
  ) {
    return false;
  }

  const duration = 1.04;
  const filter = audioContext.createBiquadFilter();
  const panner = audioContext.createStereoPanner();
  const master = audioContext.createGain();

  filter.type = "lowpass";
  filter.Q.setValueAtTime(1.4, baseTime);
  filter.frequency.setValueAtTime(820, baseTime);
  filter.frequency.exponentialRampToValueAtTime(3800, baseTime + 0.47);
  filter.frequency.exponentialRampToValueAtTime(1150, baseTime + duration);

  panner.pan.setValueAtTime(-0.92, baseTime);
  panner.pan.linearRampToValueAtTime(0.94, baseTime + duration);

  master.gain.setValueAtTime(0.0001, baseTime);
  master.gain.exponentialRampToValueAtTime(0.065, baseTime + 0.11);
  master.gain.setValueAtTime(0.065, baseTime + 0.42);
  master.gain.exponentialRampToValueAtTime(0.0001, baseTime + duration);

  filter.connect(master);
  master.connect(panner);
  panner.connect(audioContext.destination);

  const layers = [
    { type: "sawtooth" as OscillatorType, start: 92, peak: 520, end: 210, gain: 0.7 },
    { type: "square" as OscillatorType, start: 184, peak: 980, end: 390, gain: 0.2 },
    { type: "triangle" as OscillatorType, start: 61, peak: 178, end: 88, gain: 0.34 },
  ];

  for (const layer of layers) {
    const oscillator = audioContext.createOscillator();
    const layerGain = audioContext.createGain();
    oscillator.type = layer.type;
    oscillator.frequency.setValueAtTime(layer.start, baseTime);
    oscillator.frequency.exponentialRampToValueAtTime(layer.peak, baseTime + 0.52);
    oscillator.frequency.exponentialRampToValueAtTime(layer.end, baseTime + duration);
    layerGain.gain.setValueAtTime(layer.gain, baseTime);
    oscillator.connect(layerGain);
    layerGain.connect(filter);
    oscillator.start(baseTime);
    oscillator.stop(baseTime + duration + 0.02);
  }

  return true;
}

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
    if (cue === "intro-city" && playFormulaPass(audioContext, baseTime)) return;

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
