"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createGameSoundEngine,
  readSoundPreference,
  writeSoundPreference,
  type GameSoundCue,
  type GameSoundEngine,
} from "./gameSound";

export type GameSounds = {
  enabled: boolean;
  setEnabledByUser: (enabled: boolean) => Promise<void>;
  play: (cue: GameSoundCue) => void;
};

export function useGameSounds(): GameSounds {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const engineRef = useRef<GameSoundEngine | null>(null);

  const getEngine = useCallback(() => {
    engineRef.current ??= createGameSoundEngine();
    return engineRef.current;
  }, []);

  useEffect(() => {
    const storedPreference = readSoundPreference(window.localStorage);
    enabledRef.current = storedPreference;
    setEnabled(storedPreference);
  }, []);

  const setEnabledByUser = useCallback(
    async (nextEnabled: boolean) => {
      if (nextEnabled) {
        // AudioContext ilk kez doğrudan kullanıcı tıklaması içinde açılır/resume edilir.
        // Bu, iOS Safari ve Chromium autoplay kurallarıyla uyumludur.
        await getEngine().unlock();
      }

      writeSoundPreference(window.localStorage, nextEnabled);
      enabledRef.current = nextEnabled;
      setEnabled(nextEnabled);

      if (nextEnabled) {
        // Kullanıcı ayarı açtığını anında doğrular; aynı tıklamada yalnız bir önizleme çalar.
        await getEngine().play("select");
      }
    },
    [getEngine],
  );

  const play = useCallback(
    (cue: GameSoundCue) => {
      if (!enabledRef.current) return;
      void getEngine().play(cue);
    },
    [getEngine],
  );

  return { enabled, setEnabledByUser, play };
}
