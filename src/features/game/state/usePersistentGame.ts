import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import {
  GAME_CONSTANTS,
  type GameController,
  type Puzzle,
} from "@/features/game/contracts";
import { trackBrowserEvent, trackBrowserEventOnce } from "@/lib/analytics";
import type { SnapshotStorage } from "@/lib/persistence";
import { persistSignedInGameResult } from "@/lib/results/remote";

import { createGameStore } from "./gameStore";
import type { GameRestoreState } from "./persistentGame";
import { useActiveTimer } from "./useActiveTimer";

export type PersistentGame = {
  puzzle: Puzzle;
  controller: GameController;
  restore: GameRestoreState;
};

export type UsePersistentGameOptions = {
  dayKey?: string;
  storage?: SnapshotStorage;
  unlimitedMistakes?: boolean;
};

export function usePersistentGame(
  puzzle: Puzzle,
  options: UsePersistentGameOptions = {},
): PersistentGame {
  const { dayKey, storage, unlimitedMistakes = false } = options;

  const store = useMemo(
    () => createGameStore({ puzzle, dayKey, storage, unlimitedMistakes }),
    [puzzle, dayKey, storage, unlimitedMistakes],
  );

  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const trackedGameStart = useRef<string | null>(null);

  useEffect(() => {
    store.hydrate();
  }, [store]);

  useEffect(() => {
    const identity = `${puzzle.id}:${puzzle.revision}`;
    if (
      trackedGameStart.current === identity ||
      state.restore.status === "pending" ||
      state.snapshot.status !== "playing"
    ) {
      return;
    }

    trackedGameStart.current = identity;
    trackBrowserEvent("game_start", {
      puzzleId: puzzle.id,
      revision: puzzle.revision,
      dayKey: state.snapshot.dayKey,
      resumed: state.snapshot.attempts.length > 0,
    });
  }, [
    puzzle.id,
    puzzle.revision,
    state.restore.status,
    state.snapshot.attempts.length,
    state.snapshot.dayKey,
    state.snapshot.status,
  ]);

  useActiveTimer(store, state.snapshot.status);

  const controller = useMemo<GameController>(
    () => ({
      snapshot: state.snapshot,
      toggleWord: store.toggleWord,
      clearSelection: store.clearSelection,
      shuffle: store.shuffle,
      submitSelection: () => {
        const before = store.getState().snapshot;
        const result = store.submitSelection();
        const verdict = result.outcome.verdict;
        const accepted = verdict === "correct" || verdict === "one-away" || verdict === "wrong";

        if (before.attempts.length === 0 && accepted) {
          trackBrowserEvent("first_attempt", {
            puzzleId: result.snapshot.puzzleId,
            revision: result.snapshot.puzzleRevision,
            verdict,
            mistakesRemaining: result.snapshot.mistakesRemaining,
          });
        }

        if (result.snapshot.status !== "playing") {
          trackBrowserEventOnce(
            `finish:${result.snapshot.puzzleId}:${result.snapshot.puzzleRevision}`,
            "game_finish",
            {
              puzzleId: result.snapshot.puzzleId,
              revision: result.snapshot.puzzleRevision,
              dayKey: result.snapshot.dayKey,
              status: result.snapshot.status,
              attemptCount: result.snapshot.attempts.length,
              mistakesUsed: GAME_CONSTANTS.maxMistakes - result.snapshot.mistakesRemaining,
              activeSeconds: result.snapshot.activeSeconds,
            },
          );

          // Adminın sınırsız-hak test oyunları gerçek oyuncu başarı metriklerini kirletmesin.
          if (!unlimitedMistakes) persistSignedInGameResult(result.snapshot);
        }

        return result;
      },
    }),
    [state.snapshot, store, unlimitedMistakes],
  );

  return { puzzle, controller, restore: state.restore };
}
