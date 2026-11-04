import { describe, expect, it } from "vitest";
import { createMemoryStorage } from "./storage";
import { readJourneyProgress, journeyStorage } from "./journeyProgress";
import { journeyId } from "@/features/game/journey";
import { loadJourneyPuzzle } from "@/lib/daily/journeyPuzzle";
import { createGameStore } from "@/features/game/state/gameStore";

describe("journey unlocking and isolated progress", () => {
  it("opens only the next contiguous won step, counts stars and leaves daily saves untouched", async () => {
    const storage = createMemoryStorage({ "quadro:save:v1:2026-11-03": "daily-sentinel" });
    const play = async (step: number) => {
      const puzzle = (await loadJourneyPuzzle(step))!;
      const store = createGameStore({ puzzle, storage: journeyStorage(journeyId(step), storage) });
      store.hydrate(); return { puzzle, store };
    };
    expect(readJourneyProgress(storage).unlocked).toBe(1);
    const { puzzle, store } = await play(1);
    const win = (p: typeof puzzle, s: typeof store) => p.groups.forEach(g => { g.words.forEach(w => s.toggleWord(w.id)); s.submitSelection(); });
    puzzle.groups[0].words.forEach(w => store.toggleWord(w.id)); store.submitSelection();
    expect(readJourneyProgress(storage).unlocked).toBe(1);
    puzzle.groups.slice(1).forEach(g => { g.words.forEach(w => store.toggleWord(w.id)); store.submitSelection(); });
    expect(readJourneyProgress(storage)).toMatchObject({ unlocked: 2, complete: 1 });
    expect(readJourneyProgress(storage).stars[0]).toBe(3);
    const third = await play(3); win(third.puzzle, third.store);
    expect(readJourneyProgress(storage).unlocked).toBe(2);
    const second = await play(2); win(second.puzzle, second.store);
    expect(readJourneyProgress(storage)).toMatchObject({ unlocked: 4, complete: 3 });
    expect((await play(1)).store.getState().snapshot.status).toBe("won");
    expect(storage.getItem("quadro:save:v1:2026-11-03")).toBe("daily-sentinel");
  });
  it("a lost step never opens another step", async () => {
    const storage = createMemoryStorage(); const puzzle = (await loadJourneyPuzzle(1))!;
    const store = createGameStore({ puzzle, storage: journeyStorage(puzzle.id, storage) }); store.hydrate();
    for (let i = 0; i < 4; i++) {
      store.clearSelection();
      [puzzle.groups[0].words[i]!, puzzle.groups[1].words[i]!, puzzle.groups[2].words[i]!, puzzle.groups[3].words[i]!].forEach(w => store.toggleWord(w.id));
      store.submitSelection();
    }
    expect(store.getState().snapshot.status).toBe("lost");
    expect(readJourneyProgress(storage)).toMatchObject({ unlocked: 1, complete: 0 });
    expect(readJourneyProgress(storage).stars[0]).toBe(0);
  });
  it("opens steps 31 and 51 when existing progress is complete", async () => {
    const storage = createMemoryStorage();
    for (let step = 1; step <= 50; step++) {
      const puzzle = (await loadJourneyPuzzle(step))!;
      const store = createGameStore({ puzzle, storage: journeyStorage(puzzle.id, storage) });
      store.hydrate();
      puzzle.groups.forEach(group => { group.words.forEach(word => store.toggleWord(word.id)); store.submitSelection(); });
      if (step === 30) expect(readJourneyProgress(storage)).toMatchObject({ complete: 30, unlocked: 31 });
    }
    expect(readJourneyProgress(storage)).toMatchObject({ complete: 50, unlocked: 51 });
  });
});
