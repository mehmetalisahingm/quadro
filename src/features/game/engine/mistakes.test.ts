import { describe, expect, it } from "vitest";

import { GAME_CONSTANTS, type Four, type WordId } from "@/features/game/contracts";
import { standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";

import { applyMistake, classifyMistake } from "./mistakes";
import { newGame, selectOnly, solveSelection } from "./testHelpers";

const ucGezegenBirSehir: Four<WordId> = ["mars", "venus", "saturn", "adana"];
const karisik: Four<WordId> = ["mars", "kirmizi", "adana", "mavi"];

describe("classifyMistake", () => {
  it("tam üç ortak kelimede one-away, en fazla iki ortak kelimede wrong verir", () => {
    expect(classifyMistake(GAME_CONSTANTS.groupSize - 1)).toBe("one-away");
    for (const largestShare of [0, 1, 2]) {
      expect(classifyMistake(largestShare)).toBe("wrong");
    }
  });
});

describe("applyMistake", () => {
  it("bir hak düşürür; seçim, tahta ve çözülen gruplar korunur, geçmişe kendi değerlendirmesiyle yazılır", () => {
    const { snapshot: solved } = solveSelection(
      puzzle,
      selectOnly(puzzle, newGame(), ["elma", "armut", "kiraz", "incir"]),
    );
    const selected = selectOnly(puzzle, solved, ucGezegenBirSehir);

    expect(applyMistake(selected, ucGezegenBirSehir, "one-away")).toEqual({
      outcome: { verdict: "one-away" },
      snapshot: {
        ...selected,
        mistakesRemaining: GAME_CONSTANTS.maxMistakes - 1,
        attempts: [
          ...selected.attempts,
          { id: "a2", wordIds: ucGezegenBirSehir, verdict: "one-away" },
        ],
      },
    });
  });

  it("hakkı sıfıra indirirse lost: seçim temizlenir, tahta ve çözülen gruplar korunur, sonuç kendi değerlendirmesi kalır", () => {
    const lastChance = { ...selectOnly(puzzle, newGame(), karisik), mistakesRemaining: 1 };

    for (const verdict of ["wrong", "one-away"] as const) {
      expect(applyMistake(lastChance, karisik, verdict)).toEqual({
        outcome: { verdict },
        snapshot: {
          ...lastChance,
          status: "lost",
          selectedWordIds: [],
          mistakesRemaining: 0,
          attempts: [{ id: "a1", wordIds: karisik, verdict }],
        },
      });
    }
  });

  it("terminal oyunda hata fırlatır; tutarsız kayıtta hak sıfırın altına inmez", () => {
    const selected = selectOnly(puzzle, newGame(), karisik);
    for (const status of ["won", "lost"] as const) {
      expect(() => applyMistake({ ...selected, status }, karisik, "wrong")).toThrow(/oyun sürmüyor/);
    }

    const { snapshot } = applyMistake({ ...selected, mistakesRemaining: 0 }, karisik, "wrong");
    expect(snapshot).toMatchObject({ status: "lost", mistakesRemaining: 0 });
  });
});
