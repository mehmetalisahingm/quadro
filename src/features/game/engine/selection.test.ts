import { describe, expect, it } from "vitest";

import { GAME_CONSTANTS, type GameSnapshot } from "@/features/game/contracts";
import { standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";

import { clearSelection, readSelection, toggleWord } from "./selection";
import { newGame, selectOnly, solveSelection } from "./testHelpers";

describe("toggleWord", () => {
  it("kelimeyi seçer, seçim sırasını korur; seçili kelimeye tekrar basmak seçimi kaldırır", () => {
    let snapshot = newGame();
    snapshot = toggleWord(puzzle, snapshot, "mars");
    snapshot = toggleWord(puzzle, snapshot, "elma");
    expect(snapshot.selectedWordIds).toEqual(["mars", "elma"]);

    snapshot = toggleWord(puzzle, snapshot, "mars");
    expect(snapshot.selectedWordIds).toEqual(["elma"]);
  });

  it("en fazla dört farklı kelime seçilir; beşinci kelime aynı snapshot'ı döndürür", () => {
    const full = selectOnly(puzzle, newGame(), ["mars", "elma", "adana", "mavi"]);
    expect(full.selectedWordIds).toHaveLength(GAME_CONSTANTS.groupSize);

    expect(toggleWord(puzzle, full, "bursa")).toBe(full);
    // Dört seçiliyken bir seçimi kaldırmak hâlâ mümkündür.
    expect(toggleWord(puzzle, full, "adana").selectedWordIds).toEqual(["mars", "elma", "mavi"]);
  });

  it("bilinmeyen ve çözülmüş kelime seçilemez", () => {
    const start = newGame();
    expect(toggleWord(puzzle, start, "yok-boyle-kelime")).toBe(start);

    const { snapshot: solved } = solveSelection(
      puzzle,
      selectOnly(puzzle, start, ["elma", "armut", "kiraz", "incir"]),
    );
    expect(toggleWord(puzzle, solved, "elma")).toBe(solved);
  });

  it("terminal oyunda seçim ve temizleme etkisizdir", () => {
    const withSelection = selectOnly(puzzle, newGame(), ["mars", "venus"]);
    for (const status of ["won", "lost"] as const) {
      const ended: GameSnapshot = { ...withSelection, status };
      expect(toggleWord(puzzle, ended, "adana")).toBe(ended);
      expect(toggleWord(puzzle, ended, "mars")).toBe(ended);
      expect(clearSelection(ended)).toBe(ended);
    }
  });
});

describe("clearSelection", () => {
  it("seçimi boşaltır ve diğer alanları korur; boş seçimde aynı snapshot'ı döndürür", () => {
    const selected = { ...selectOnly(puzzle, newGame(), ["mars", "venus"]), mistakesRemaining: 2 };
    const cleared = clearSelection(selected);

    expect(cleared.selectedWordIds).toEqual([]);
    expect({ ...cleared, selectedWordIds: selected.selectedWordIds }).toEqual(selected);
    expect(clearSelection(cleared)).toBe(cleared);
  });
});

describe("readSelection", () => {
  it("tam dört farklı çözülmemiş kimliği seçim sırasıyla dörtlü olarak okur", () => {
    const snapshot = selectOnly(puzzle, newGame(), ["kiraz", "mars", "elma", "adana"]);
    expect(readSelection(puzzle, snapshot)).toEqual({
      ok: true,
      wordIds: ["kiraz", "mars", "elma", "adana"],
    });
  });

  it("eksik seçimde selection-count; tekrar eden, bilinmeyen veya çözülmüş kimlikte invalid-words", () => {
    const start = newGame();
    expect(readSelection(puzzle, selectOnly(puzzle, start, ["mars", "venus", "saturn"]))).toEqual({
      ok: false,
      reason: "selection-count",
    });
    expect(readSelection(puzzle, { ...start, selectedWordIds: ["mars", "venus", "saturn", "merkur", "adana"] })).toEqual({
      ok: false,
      reason: "selection-count",
    });

    const invalid = { ok: false, reason: "invalid-words" };
    expect(readSelection(puzzle, { ...start, selectedWordIds: ["mars", "mars", "venus", "saturn"] })).toEqual(invalid);
    expect(readSelection(puzzle, { ...start, selectedWordIds: ["mars", "venus", "saturn", "pluton"] })).toEqual(invalid);

    const { snapshot: solved } = solveSelection(
      puzzle,
      selectOnly(puzzle, start, ["elma", "armut", "kiraz", "incir"]),
    );
    expect(readSelection(puzzle, { ...solved, selectedWordIds: ["elma", "mars", "venus", "saturn"] })).toEqual(invalid);
  });
});
