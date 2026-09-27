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

export const DEFAULT_ENGINE_SEED = 20260920;

export type EngineControllerOptions = {
  puzzle: Puzzle;
  snapshot?: GameSnapshot;
  random?: RandomSource;
  unlimitedMistakes?: boolean;
};

export type EngineGameController = GameController & {
  readonly puzzle: Puzzle;
  subscribe: (listener: () => void) => () => void;
  restore: (snapshot: GameSnapshot) => boolean;
  setActiveSeconds: (seconds: number) => void;
};

export function createEngineController({
  puzzle,
  snapshot: initialSnapshot,
  random: providedRandom,
  unlimitedMistakes = false,
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

  const restoreForMode = (next: GameSnapshot): GameSnapshot => {
    if (!unlimitedMistakes || next.status !== "lost") return next;
    return { ...next, status: "playing", mistakesRemaining: 4 };
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

    restore(next: GameSnapshot): boolean {
      if (next.puzzleId !== puzzle.id || next.puzzleRevision !== puzzle.revision) return false;
      commit(restoreForMode(next));
      return true;
    },

    setActiveSeconds(seconds: number) {
      const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
      if (snapshot.activeSeconds === safe) return;
      commit({ ...snapshot, activeSeconds: safe });
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
      const before = snapshot;
      const result = submitSelection(puzzle, snapshot);
      const consumesMistake = result.outcome.verdict === "one-away" || result.outcome.verdict === "wrong";

      if (unlimitedMistakes && consumesMistake) {
        const next = {
          ...result.snapshot,
          status: "playing" as const,
          mistakesRemaining: before.mistakesRemaining,
        };
        commit(next);
        return { outcome: result.outcome, snapshot: next };
      }

      commit(result.snapshot);
      return result;
    },
  };
}
