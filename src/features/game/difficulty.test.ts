import { describe, expect, it } from "vitest";

import type { Puzzle } from "./contracts";
import { standardPuzzle } from "./fixtures";
import {
  createHintStore,
  difficultyFeedback,
  hintStorageKey,
  parseRevealedHints,
  resolveGameDifficulty,
} from "./difficulty";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("difficulty assistance", () => {
  it("uses medium for an absent or invalid preference", () => {
    for (const value of [null, undefined, {}, "expert", ""]) {
      expect(resolveGameDifficulty(value)).toBe("medium");
    }
    expect(resolveGameDifficulty("easy")).toBe("easy");
    expect(resolveGameDifficulty("hard")).toBe("hard");
  });

  it("hides one-away feedback only in hard mode without changing the engine outcome", () => {
    const outcome = { verdict: "one-away" } as const;
    expect(difficultyFeedback(outcome, "hard")).toEqual({ verdict: "wrong" });
    expect(difficultyFeedback(outcome, "medium")).toBe(outcome);
    expect(difficultyFeedback(outcome, "easy")).toBe(outcome);
    expect(outcome.verdict).toBe("one-away");
    const correct = { verdict: "correct", solvedGroup: standardPuzzle.groups[0] } as const;
    expect(difficultyFeedback(correct, "hard")).toBe(correct);
  });

  it("reveals only unsolved and previously unrevealed groups, and exhausts the medium budget", () => {
    const store = createHintStore(standardPuzzle, "medium", memoryStorage());
    store.hydrate();
    store.revealNext(["renkler"]);
    expect(store.getState().revealedGroupIds).toEqual(["meyveler"]);
    store.revealNext([]);
    expect(store.getState().revealedGroupIds).toEqual(["meyveler"]);
  });

  it("easy allows four distinct hints while hard allows none", () => {
    for (const difficulty of ["easy", "hard"] as const) {
      const store = createHintStore(standardPuzzle, difficulty, memoryStorage());
      store.hydrate();
      for (let index = 0; index < 6; index++) store.revealNext([]);
      expect(store.getState().revealedGroupIds).toHaveLength(difficulty === "easy" ? 4 : 0);
      expect(new Set(store.getState().revealedGroupIds).size).toBe(store.getState().revealedGroupIds.length);
    }
  });

  it("does not charge a hint when all groups are solved or before storage is hydrated", () => {
    const store = createHintStore(standardPuzzle, "easy", memoryStorage());
    store.revealNext([]);
    expect(store.getState().revealedGroupIds).toEqual([]);
    store.hydrate();
    store.revealNext(standardPuzzle.groups.map((group) => group.id));
    expect(store.getState().revealedGroupIds).toEqual([]);
  });

  it("restores spent hints and isolates puzzle identity, day, revision, and difficulty", () => {
    const storage = memoryStorage();
    const store = createHintStore(standardPuzzle, "easy", storage);
    store.hydrate();
    store.revealNext([]);
    const restored = createHintStore(standardPuzzle, "easy", storage);
    expect(restored.getServerState()).toEqual({ hydrated: false, revealedGroupIds: [] });
    restored.hydrate();
    expect(restored.getState().revealedGroupIds).toEqual(["renkler"]);
    const otherPuzzles: Puzzle[] = [
      { ...standardPuzzle, id: "another" },
      { ...standardPuzzle, date: "2026-09-21" },
      { ...standardPuzzle, revision: 2 },
    ];
    for (const puzzle of otherPuzzles) {
      const next = createHintStore(puzzle, "easy", storage);
      next.hydrate();
      expect(next.getState().revealedGroupIds).toEqual([]);
      expect(hintStorageKey(puzzle, "easy")).not.toBe(hintStorageKey(standardPuzzle, "easy"));
    }
    const medium = createHintStore(standardPuzzle, "medium", storage);
    medium.hydrate();
    expect(medium.getState().revealedGroupIds).toEqual([]);
  });

  it("validates saved group IDs, removes duplicates, and caps restored assistance", () => {
    const raw = JSON.stringify([null, 1, "unknown", "renkler", "renkler", "meyveler"]);
    expect(parseRevealedHints(raw, standardPuzzle, "easy")).toEqual(["renkler", "meyveler"]);
    expect(parseRevealedHints(raw, standardPuzzle, "medium")).toEqual(["renkler"]);
    expect(parseRevealedHints(raw, standardPuzzle, "hard")).toEqual([]);
    for (const corrupt of ["broken", "{}", "null"]) {
      expect(parseRevealedHints(corrupt, standardPuzzle, "easy")).toEqual([]);
    }
  });

  it("keeps consumed hints in memory when browser storage is unavailable", () => {
    const storage = {
      getItem: () => { throw new Error("Storage blocked"); },
      setItem: () => { throw new Error("Storage blocked"); },
    };
    const store = createHintStore(standardPuzzle, "medium", storage);
    store.hydrate();
    store.revealNext([]);
    store.revealNext([]);
    expect(store.getState()).toEqual({ hydrated: true, revealedGroupIds: ["renkler"] });
  });
});
