import type {
  GameController,
  GameSnapshot,
  Puzzle,
  SubmitResult,
  WordId,
} from "@/features/game/contracts";
import {
  clearSelection,
  createInitialSnapshot,
  createSeededRandom,
  shuffleBoard,
  submitSelection,
  toggleWord,
  type RandomSource,
} from "@/features/game/engine";

/** Gerçek motorun deterministik başlangıç/karıştırma tohumu. */
export const DEFAULT_ENGINE_SEED = 20260920;

export type EngineControllerOptions = {
  puzzle: Puzzle;
  snapshot?: GameSnapshot;
  random?: RandomSource;
};

/**
 * Q09/Q10 saf motorunu UI'nın kullandığı `GameController` sözleşmesine bağlayan adaptör.
 * İş kuralları burada yeniden uygulanmaz; bütün durum geçişleri engine fonksiyonlarından gelir.
 */
export type EngineGameController = GameController & {
  readonly puzzle: Puzzle;
  subscribe: (listener: () => void) => () => void;
};

export function createEngineController({
  puzzle,
  snapshot: initialSnapshot,
  random: providedRandom,
}: EngineControllerOptions): EngineGameController {
  const random = providedRandom ?? createSeededRandom(DEFAULT_ENGINE_SEED);
  let snapshot = initialSnapshot ?? createInitialSnapshot(puzzle, { random });

  if (snapshot.puzzleId !== puzzle.id || snapshot.puzzleRevision !== puzzle.revision) {
    throw new Error(
      `Başlangıç durumu ${snapshot.puzzleId}@${snapshot.puzzleRevision} için; beklenen ${puzzle.id}@${puzzle.revision}.`,
    );
  }

  const listeners = new Set<() => void>();

  const commit = (next: GameSnapshot) => {
    if (next === snapshot) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  return {
    puzzle,

    get snapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    toggleWord(wordId: WordId) {
      commit(toggleWord(puzzle, snapshot, wordId));
    },

    clearSelection() {
      commit(clearSelection(snapshot));
    },

    shuffle() {
      commit(shuffleBoard(snapshot, random));
    },

    submitSelection(): SubmitResult {
      const result = submitSelection(puzzle, snapshot);
      commit(result.snapshot);
      return result;
    },
  };
}
