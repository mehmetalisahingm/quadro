import type { Puzzle, SubmitOutcome } from "./contracts";

export type GameDifficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_MODES = [
  {
    id: "easy",
    label: "Kolay",
    description: "4 kategori ipucu ve çok yaklaştın bildirimi.",
    hintLimit: 4,
    showOneAway: true,
  },
  {
    id: "medium",
    label: "Orta",
    description: "1 kategori ipucu ve çok yaklaştın bildirimi.",
    hintLimit: 1,
    showOneAway: true,
  },
  {
    id: "hard",
    label: "Zor",
    description: "İpucu ve çok yaklaştın bildirimi olmadan çöz.",
    hintLimit: 0,
    showOneAway: false,
  },
] as const;

export function resolveGameDifficulty(value: unknown): GameDifficulty {
  return value === "easy" || value === "hard" ? value : "medium";
}

export function getDifficultyMode(difficulty: GameDifficulty) {
  return DIFFICULTY_MODES.find((mode) => mode.id === difficulty) ?? DIFFICULTY_MODES[1];
}

/** The engine keeps identical rules and records; only player assistance changes. */
export function difficultyFeedback(
  outcome: SubmitOutcome,
  difficulty: GameDifficulty,
): SubmitOutcome {
  return difficulty === "hard" && outcome.verdict === "one-away"
    ? { verdict: "wrong" }
    : outcome;
}

export function hintStorageKey(puzzle: Puzzle, difficulty: GameDifficulty): string {
  return `quadro:hints:v1:${JSON.stringify([puzzle.date, puzzle.id, puzzle.revision, difficulty])}`;
}

export function parseRevealedHints(
  raw: string | null,
  puzzle: Puzzle,
  difficulty: GameDifficulty,
): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const groupIds = new Set(puzzle.groups.map((group) => group.id));
    return [...new Set(parsed.filter((id): id is string => typeof id === "string" && groupIds.has(id)))]
      .slice(0, getDifficultyMode(difficulty).hintLimit);
  } catch {
    return [];
  }
}

type HintStorage = Pick<Storage, "getItem" | "setItem">;
type HintState = { hydrated: boolean; revealedGroupIds: readonly string[] };

/** A separate store avoids changing saved game rules or reading storage during hydration. */
export function createHintStore(puzzle: Puzzle, difficulty: GameDifficulty, storage?: HintStorage) {
  const key = hintStorageKey(puzzle, difficulty);
  const initialState: HintState = { hydrated: false, revealedGroupIds: [] };
  let state = initialState;
  const listeners = new Set<() => void>();
  const getStorage = () => storage ?? (typeof window === "undefined" ? undefined : window.localStorage);
  const publish = (revealedGroupIds: readonly string[]) => {
    state = { hydrated: true, revealedGroupIds };
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    getServerState: () => initialState,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    hydrate() {
      if (state.hydrated) return;
      let ids: string[] = [];
      try {
        ids = parseRevealedHints(getStorage()?.getItem(key) ?? null, puzzle, difficulty);
      } catch {
        // Private browsing and unavailable storage still allow an in-memory game.
      }
      publish(ids);
    },
    revealNext(solvedGroupIds: readonly string[]) {
      if (!state.hydrated || state.revealedGroupIds.length >= getDifficultyMode(difficulty).hintLimit) return;
      const next = puzzle.groups.find((group) =>
        !solvedGroupIds.includes(group.id) && !state.revealedGroupIds.includes(group.id),
      );
      if (!next) return;
      const ids = [...state.revealedGroupIds, next.id];
      try {
        getStorage()?.setItem(key, JSON.stringify(ids));
      } catch {
        // The consumed hint remains in memory even when saving is unavailable.
      }
      publish(ids);
    },
  };
}
