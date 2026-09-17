import { describe, expect, it } from "vitest";

import type { GameSnapshot, WordId } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import { createSampleController } from "@/features/game/sampleController";

import { matchGroup, solveGroup } from "./groups";
import { createSeededRandom } from "./random";
import { clearSelection, readSelection, toggleWord } from "./selection";
import { createInitialSnapshot } from "./setup";
import { shuffleBoard } from "./shuffle";
import { submitSelection } from "./submit";
import { TEST_SEED, deepFreeze, selectOnly, solveSelection } from "./testHelpers";

describe("motor: saflık", () => {
  it("donmuş bulmaca ve durumlarla çalışır; girdileri değiştirmez", () => {
    const puzzle = deepFreeze(structuredClone(standardPuzzle));
    const random = createSeededRandom(TEST_SEED);

    const start = deepFreeze(createInitialSnapshot(puzzle, { random }));
    const startCopy = structuredClone(start);

    const toggled = deepFreeze(toggleWord(puzzle, start, "mars"));
    const cleared = deepFreeze(clearSelection(toggled));
    const shuffled = deepFreeze(shuffleBoard(cleared, random));
    const selected = deepFreeze(selectOnly(puzzle, shuffled, ["elma", "armut", "kiraz", "incir"]));
    const selectedCopy = structuredClone(selected);

    const read = readSelection(puzzle, selected);
    if (!read.ok) throw new Error("Seçim okunamadı.");
    const match = matchGroup(puzzle, read.wordIds);
    if (match.kind !== "group") throw new Error("Grup bulunamadı.");
    const result = solveGroup(selected, read.wordIds, match.group);

    expect(start).toEqual(startCopy);
    expect(toggled.selectedWordIds).toEqual(["mars"]);
    expect(cleared.selectedWordIds).toEqual([]);
    expect(selected).toEqual(selectedCopy);
    expect(puzzle).toEqual(standardPuzzle);
    expect(result.snapshot).not.toBe(selected);
    expect(result.snapshot.solvedGroupIds).toEqual(["meyveler"]);
  });
});

describe("motor ve örnek adaptör tutarlılığı (Q16 geçişi)", () => {
  it("aynı tohum ve aynı eylemlerle birebir aynı durum ve sonuçları üretir", () => {
    const puzzle = standardPuzzle;
    const controller = createSampleController({ puzzle, random: createSeededRandom(TEST_SEED) });
    const engineRandom = createSeededRandom(TEST_SEED);
    let state: GameSnapshot = createInitialSnapshot(puzzle, { random: engineRandom });

    const expectSame = () => expect(state).toEqual(controller.snapshot);
    const toggle = (wordId: WordId) => {
      state = toggleWord(puzzle, state, wordId);
      controller.toggleWord(wordId);
      expectSame();
    };
    const clear = () => {
      state = clearSelection(state);
      controller.clearSelection();
      expectSame();
    };
    const shuffle = () => {
      state = shuffleBoard(state, engineRandom);
      controller.shuffle();
      expectSame();
    };
    const solve = (wordIds: readonly WordId[]) => {
      clear();
      wordIds.forEach(toggle);
      const engineResult = solveSelection(puzzle, state);
      state = engineResult.snapshot;
      expect(engineResult).toEqual(controller.submitSelection());
      expectSame();
    };

    expectSame();
    toggle("mars");
    toggle("elma");
    toggle("mars");
    ["adana", "mavi", "kiraz", "bursa"].forEach(toggle);
    clear();
    shuffle();
    solve(["kiraz", "elma", "incir", "armut"]);
    toggle("elma");
    toggle("venus");
    shuffle();
    solve(["sari", "kirmizi", "mavi", "yesil"]);
    solve(["mars", "venus", "saturn", "merkur"]);
    shuffle();
    solve(["adana", "bursa", "izmir", "mugla"]);

    expect(state.status).toBe("won");
    toggle("mars");
    shuffle();
    clear();
    expect(selectOnly(puzzle, state, ["mars"])).toBe(state);
  });

  it("gönderimlerde (geçersiz, yanlış, tekrar, çok yakın, kayıp, bitmiş oyun) birebir aynı sonucu üretir", () => {
    const puzzle = standardPuzzle;
    const controller = createSampleController({ puzzle, random: createSeededRandom(TEST_SEED) });
    let state: GameSnapshot = createInitialSnapshot(puzzle, { random: createSeededRandom(TEST_SEED) });

    const submit = (wordIds: readonly WordId[]) => {
      state = selectOnly(puzzle, state, wordIds);
      controller.clearSelection();
      wordIds.forEach((wordId) => controller.toggleWord(wordId));

      const engineResult = submitSelection(puzzle, state);
      state = engineResult.snapshot;
      expect(engineResult).toEqual(controller.submitSelection());
      expect(state).toEqual(controller.snapshot);
      return engineResult.outcome.verdict;
    };

    expect([
      submit(["mars", "venus"]),
      submit(["kiraz", "elma", "incir", "armut"]),
      submit(["mars", "kirmizi", "adana", "mavi"]),
      submit(["mavi", "adana", "kirmizi", "mars"]),
      submit(["mars", "venus", "saturn", "adana"]),
      submit(["bursa", "kirmizi", "venus", "izmir"]),
      submit(["mars", "venus", "adana", "bursa"]),
      submit(["sari", "kirmizi", "mavi", "yesil"]),
    ]).toEqual(["invalid", "correct", "wrong", "repeated", "one-away", "wrong", "wrong", "invalid"]);
    expect(state).toMatchObject({ status: "lost", solvedGroupIds: ["meyveler"], mistakesRemaining: 0 });
  });
});
