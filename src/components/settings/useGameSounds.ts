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
  const engineRef = useRef<GameSoundEngine | null>(null);

  const engine = () => {
    engineRef.current ??= createGameSoundEngine();
    return engineRef.current;
  };

  useEffect(() => {
    setEnabled(readSoundPreference(window.localStorage));
  }, []);

  const setEnabledByUser = useCallback(async (nextEnabled: boolean) => {
    if (nextEnabled) {
      // AudioContext ilk kez doğrudan kullanıcı tıklaması içinde açılır/resume edilir.
      // Bu, iOS Safari ve Chromium autoplay kurallarıyla uyumludur.
      await engine().unlock();
    }

    writeSoundPreference(window.localStorage, nextEnabled);
    setEnabled(nextEnabled);

    if (nextEnabled) {
      // Kullanıcı ayarı açtığını anında doğrular; aynı tıklamada yalnız bir önizleme çalar.
      await engine().play("select");
    }
  }, []);

  const play = useCallback(
    (cue: GameSoundCue) => {
      if (!enabled) return;
      void engine().play(cue);
    },
    [enabled],
  );

  return { enabled, setEnabledByUser, play };
}
