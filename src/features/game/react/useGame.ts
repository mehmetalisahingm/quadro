import { useMemo, useSyncExternalStore } from "react";

import type { GameController, Puzzle } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures";

import { createEngineController } from "./engineController";

export type LiveGame = {
  puzzle: Puzzle;
  controller: GameController;
};

/**
 * Standart oyun çalışma zamanını gerçek Q09/Q10 motoruna bağlar.
 *
 * Günün bulmacası Q19 ile sunucudan gelir ve `/play` tarafından buraya geçirilir.
 * Bulmaca verilmezse Q03'ün deterministik standart bulmacası açılır; bu yalnız
 * tahtayı tek başına çizen çağrılar içindir, günlük akışta kullanılmaz. Seçim,
 * gönderim, hata hakkı, tekrar ve terminal durumlar her iki durumda da tamamen
 * gerçek motor tarafından üretilir.
 */
export function useGame(puzzle: Puzzle = standardPuzzle): LiveGame {
  const source = useMemo(() => createEngineController({ puzzle }), [puzzle]);

  const snapshot = useSyncExternalStore(
    source.subscribe,
    () => source.snapshot,
    () => source.snapshot,
  );

  const controller = useMemo<GameController>(
    () => ({
      snapshot,
      toggleWord: source.toggleWord,
      clearSelection: source.clearSelection,
      shuffle: source.shuffle,
      submitSelection: source.submitSelection,
    }),
    [snapshot, source],
  );

  return { puzzle, controller };
}
