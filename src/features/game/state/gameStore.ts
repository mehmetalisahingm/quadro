import type {
  GameController,
  GameSnapshot,
  Puzzle,
  SubmitResult,
  WordId,
} from "@/features/game/contracts";
import { createEngineController } from "@/features/game/react/engineController";
import { defaultSnapshotStorage, type SnapshotStorage } from "@/lib/persistence";

import {
  createActiveTimer,
  pauseTimer,
  resumeTimer,
  timerSeconds,
  type ActiveTimer,
} from "./activeTimer";
import {
  readPersistedGame,
  writePersistedGame,
  type GameRestoreState,
} from "./persistentGame";

export type GameStoreState = {
  snapshot: GameSnapshot;
  restore: GameRestoreState;
};

export type GameStore = Pick<
  GameController,
  "toggleWord" | "clearSelection" | "shuffle" | "submitSelection"
> & {
  readonly puzzle: Puzzle;
  getState: () => GameStoreState;
  subscribe: (listener: () => void) => () => void;
  hydrate: () => void;
  setScreenVisible: (visible: boolean) => void;
  tick: () => void;
};

export type GameStoreOptions = {
  puzzle: Puzzle;
  dayKey?: string;
  storage?: SnapshotStorage;
  now?: () => number;
  unlimitedMistakes?: boolean;
};

export function createGameStore({
  puzzle,
  dayKey = puzzle.date,
  storage,
  now = Date.now,
  unlimitedMistakes = false,
}: GameStoreOptions): GameStore {
  const engine = createEngineController({ puzzle, unlimitedMistakes });
  const listeners = new Set<() => void>();

  let state: GameStoreState = { snapshot: engine.snapshot, restore: { status: "pending" } };
  let hydrated = false;
  let backend: SnapshotStorage | null = storage ?? null;
  const depo = (): SnapshotStorage => (backend ??= defaultSnapshotStorage());

  const notify = (): void => {
    listeners.forEach((listener) => listener());
  };

  const publish = (restore: GameRestoreState): void => {
    state = { snapshot: engine.snapshot, restore };
    notify();
  };

  engine.subscribe(() => {
    if (hydrated) writePersistedGame(engine.snapshot, depo());
    publish(state.restore);
  });

  let timer: ActiveTimer = createActiveTimer(engine.snapshot.activeSeconds);
  let screenVisible = false;

  const shouldRun = (): boolean =>
    hydrated && screenVisible && engine.snapshot.status === "playing";

  const syncTimer = (): void => {
    const at = now();
    timer = shouldRun() ? resumeTimer(timer, at) : pauseTimer(timer, at);
    engine.setActiveSeconds(timerSeconds(timer, at));
  };

  return {
    puzzle,

    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    hydrate() {
      if (hydrated) return;

      const start = readPersistedGame({ puzzle, dayKey, storage: depo() });
      const applied = start.snapshot !== undefined && engine.restore(start.snapshot);
      hydrated = true;

      const accepted = start.snapshot === undefined || applied;
      const restore: GameRestoreState = accepted
        ? start.restore
        : { status: "discarded", reason: "puzzle-mismatch" };

      timer = createActiveTimer(engine.snapshot.activeSeconds);
      writePersistedGame(engine.snapshot, depo());
      publish(restore);
      syncTimer();
    },

    setScreenVisible(visible: boolean) {
      if (screenVisible === visible) return;
      screenVisible = visible;
      syncTimer();
    },

    tick() {
      syncTimer();
    },

    toggleWord(wordId: WordId) {
      engine.toggleWord(wordId);
    },

    clearSelection() {
      engine.clearSelection();
    },

    shuffle() {
      engine.shuffle();
    },

    submitSelection(): SubmitResult {
      const result = engine.submitSelection();
      syncTimer();
      return { outcome: result.outcome, snapshot: engine.snapshot };
    },
  };
}
