"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

import {
  createGameSoundEngine,
  readSoundPreference,
  writeSoundPreference,
  type GameSoundCue,
  type GameSoundEngine,
} from "./gameSound";

const SOUND_PREFERENCE_EVENT = "quadro:sound-preference-change";

function subscribeToPreference(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handleChange = () => onChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(SOUND_PREFERENCE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(SOUND_PREFERENCE_EVENT, handleChange);
  };
}

function clientPreferenceSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return readSoundPreference(window.localStorage);
}

function serverPreferenceSnapshot(): boolean {
  return false;
}

function notifyPreferenceChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SOUND_PREFERENCE_EVENT));
}

export type GameSounds = {
  enabled: boolean;
  setEnabledByUser: (enabled: boolean) => Promise<void>;
  play: (cue: GameSoundCue) => void;
};

export function useGameSounds(): GameSounds {
  const engineRef = useRef<GameSoundEngine | null>(null);
  const enabled = useSyncExternalStore(
    subscribeToPreference,
    clientPreferenceSnapshot,
    serverPreferenceSnapshot,
  );

  const getEngine = useCallback(() => {
    engineRef.current ??= createGameSoundEngine();
    return engineRef.current;
  }, []);

  const setEnabledByUser = useCallback(
    async (nextEnabled: boolean) => {
      if (nextEnabled) {
        // AudioContext ilk kez doğrudan kullanıcı tıklaması içinde açılır/resume edilir.
        // Bu, iOS Safari ve Chromium autoplay kurallarıyla uyumludur.
        await getEngine().unlock();
      }

      writeSoundPreference(window.localStorage, nextEnabled);
      notifyPreferenceChanged();

      if (nextEnabled) {
        // Kullanıcı ayarı açtığını anında doğrular; aynı tıklamada yalnız bir önizleme çalar.
        await getEngine().play("select");
      }
    },
    [getEngine],
  );

  const play = useCallback(
    (cue: GameSoundCue) => {
      // Gecikmiş final cue'ları dahil her çağrı en güncel tercihi yeniden okur.
      if (!clientPreferenceSnapshot()) return;
      void getEngine().play(cue);
    },
    [getEngine],
  );

  return { enabled, setEnabledByUser, play };
}
