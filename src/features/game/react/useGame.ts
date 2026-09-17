import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import type { GameController, Puzzle } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures";

import { createEngineController } from "./engineController";

export type LiveGame = {
  puzzle: Puzzle;
  controller: GameController;
  reset: () => void;
};

/**
 * Standart oyun çalışma zamanını gerçek Q09/Q10 motoruna bağlar.
 *
 * Q19 günlük yayın kaynağını ekleyene kadar varsayılan içerik Q03'ün deterministik
 * standart bulmacasıdır; ancak seçim, gönderim, hata hakkı, tekrar ve terminal durumlar
 * tamamen gerçek motor tarafından üretilir.
 */
export function useGame(puzzle: Puzzle = standardPuzzle): LiveGame {
  const [generation, setGeneration] = useState(0);

  const source = useMemo(
    () => createEngineController({ puzzle }),
    [puzzle, generation],
  );

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

  const reset = useCallback(() => {
    setGeneration((value) => value + 1);
  }, []);

  return { puzzle, controller, reset };
}
