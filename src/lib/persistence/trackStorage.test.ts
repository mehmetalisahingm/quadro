import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "./storage";
import { trackStorage } from "./trackStorage";
import { createGameStore } from "@/features/game/state/gameStore";
import { loadModePuzzle } from "@/lib/daily/modePuzzle";

describe("independent chapter progress", () => {
  it("keeps easy, medium, and later chapters without pruning one another or old games", async () => {
    const storage = createMemoryStorage({ "quadro:save:v1:old": "old-save" });
    const easy = (await loadModePuzzle("easy", 1))!;
    const medium = (await loadModePuzzle("medium", 1))!;
    const next = (await loadModePuzzle("easy", 2))!;
    const play = (puzzle: typeof easy) => {
      const store = createGameStore({ puzzle, storage: trackStorage(puzzle.id, storage) });
      store.hydrate();
      return store;
    };
    const first = play(easy);
    easy.groups[0].words.forEach(w=>first.toggleWord(w.id));
    first.submitSelection();
    const second = play(medium);
    medium.groups[1].words.forEach(w=>second.toggleWord(w.id));
    second.submitSelection();
    play(next).shuffle();
    expect(play(easy).getState().snapshot.solvedGroupIds).toEqual([easy.groups[0].id]);
    expect(play(medium).getState().snapshot.solvedGroupIds).toEqual([medium.groups[1].id]);
    expect(play(next).getState().snapshot.solvedGroupIds).toEqual([]);
    expect(storage.getItem("quadro:save:v1:old")).toBe("old-save");
  });
});
