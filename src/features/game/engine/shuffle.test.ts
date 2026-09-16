import { describe, expect, it } from "vitest";

import { standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";

import { createSeededRandom } from "./random";
import { shuffleBoard } from "./shuffle";
import { TEST_SEED, newGame, selectOnly, solveSelection } from "./testHelpers";

const meyveler = ["elma", "armut", "kiraz", "incir"];

describe("shuffleBoard", () => {
  it("yalnız çözülmemiş kartları karıştırır; seçim, haklar, geçmiş ve çözülen gruplar korunur", () => {
    const { snapshot: solved } = solveSelection(puzzle, selectOnly(puzzle, newGame(), meyveler));
    const before = { ...selectOnly(puzzle, solved, ["venus", "bursa"]), mistakesRemaining: 2 };

    const after = shuffleBoard(before, createSeededRandom(TEST_SEED));

    expect(after).not.toBe(before);
    expect(after.remainingWordOrder).not.toEqual(before.remainingWordOrder);
    expect([...after.remainingWordOrder].sort()).toEqual([...before.remainingWordOrder].sort());
    expect(after.remainingWordOrder.some((id) => meyveler.includes(id))).toBe(false);
    expect(after.selectedWordIds).toEqual(["venus", "bursa"]);
    expect(after.mistakesRemaining).toBe(2);
    expect(after.solvedGroupIds).toBe(before.solvedGroupIds);
    expect(after.attempts).toBe(before.attempts);
    expect({ ...after, remainingWordOrder: before.remainingWordOrder }).toEqual(before);
  });

  it("aynı tohumlu kaynakla deterministiktir; farklı tohum farklı sıra verir", () => {
    const start = newGame();
    const orderWith = (seed: number) =>
      shuffleBoard(start, createSeededRandom(seed)).remainingWordOrder;

    expect(orderWith(42)).toEqual(orderWith(42));
    expect(orderWith(42)).not.toEqual(orderWith(43));
  });

  it("terminal oyunda ve karıştırılacak iki kart yokken aynı snapshot'ı döndürür", () => {
    const random = createSeededRandom(TEST_SEED);
    const won = { ...newGame(), status: "won" as const };
    const lost = { ...newGame(), status: "lost" as const };
    const single = { ...newGame(), remainingWordOrder: ["mars"] };

    expect(shuffleBoard(won, random)).toBe(won);
    expect(shuffleBoard(lost, random)).toBe(lost);
    expect(shuffleBoard(single, random)).toBe(single);
  });
});
