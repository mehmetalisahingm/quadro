import { describe, expect, it } from "vitest";

import { GAME_CONSTANTS } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";

import { createSeededRandom, shuffleWordIds } from "./random";
import { createInitialSnapshot } from "./setup";
import { TEST_SEED, newGame } from "./testHelpers";

const allWordIds = standardPuzzle.groups.flatMap((group) => group.words.map((word) => word.id));

describe("createSeededRandom", () => {
  it("aynı tohum aynı diziyi, farklı tohum farklı diziyi verir; değerler [0, 1) aralığında", () => {
    const sequence = (seed: number) => {
      const random = createSeededRandom(seed);
      return Array.from({ length: 50 }, () => random());
    };

    expect(sequence(TEST_SEED)).toEqual(sequence(TEST_SEED));
    expect(sequence(TEST_SEED)).not.toEqual(sequence(TEST_SEED + 1));
    expect(sequence(TEST_SEED).every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe("shuffleWordIds", () => {
  it("girdinin permütasyonunu yeni dizi olarak döndürür ve girdiyi değiştirmez", () => {
    const input = [...allWordIds];
    const shuffled = shuffleWordIds(input, createSeededRandom(TEST_SEED));

    expect(shuffled).not.toBe(input);
    expect(input).toEqual(allWordIds);
    expect([...shuffled].sort()).toEqual([...allWordIds].sort());
    expect(shuffled).not.toEqual(allWordIds);
  });
});

describe("createInitialSnapshot", () => {
  it("boş oyun kurar: 16 kelime, 4 hak, playing; seçim, çözülen gruplar ve geçmiş boş", () => {
    const snapshot = newGame();

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      puzzleId: standardPuzzle.id,
      puzzleRevision: standardPuzzle.revision,
      status: "playing",
      selectedWordIds: [],
      solvedGroupIds: [],
      mistakesRemaining: GAME_CONSTANTS.maxMistakes,
      attempts: [],
      activeSeconds: 0,
    });
    expect(snapshot.remainingWordOrder).toHaveLength(GAME_CONSTANTS.wordCount);
    expect([...snapshot.remainingWordOrder].sort()).toEqual([...allWordIds].sort());
  });

  it("dayKey varsayılan olarak bulmaca tarihidir; verilirse onu kullanır", () => {
    expect(newGame().dayKey).toBe(standardPuzzle.date);
    expect(
      createInitialSnapshot(standardPuzzle, {
        random: createSeededRandom(TEST_SEED),
        dayKey: "2026-09-21",
      }).dayKey,
    ).toBe("2026-09-21");
  });

  it("aynı tohum aynı başlangıç sırasını, farklı tohum farklı sırayı verir", () => {
    const orderWith = (seed: number) =>
      createInitialSnapshot(standardPuzzle, { random: createSeededRandom(seed) }).remainingWordOrder;

    expect(orderWith(TEST_SEED)).toEqual(orderWith(TEST_SEED));
    expect(orderWith(TEST_SEED)).not.toEqual(orderWith(TEST_SEED + 1));
  });
});
