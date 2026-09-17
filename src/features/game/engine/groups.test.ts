import { describe, expect, it } from "vitest";

import { GAME_CONSTANTS, type Four, type SubmitResult, type WordId } from "@/features/game/contracts";
import { standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";

import { matchGroup, solveGroup } from "./groups";
import { readSelection, toggleWord } from "./selection";
import { newGame, selectOnly, solveSelection } from "./testHelpers";

const [renkler, meyveler, gezegenler, sehirler] = puzzle.groups;

describe("matchGroup", () => {
  it("aynı gruptan dört kelimeyi sıradan bağımsız bulur", () => {
    expect(matchGroup(puzzle, ["incir", "kiraz", "elma", "armut"])).toEqual({
      kind: "group",
      group: meyveler,
    });
    expect(matchGroup(puzzle, ["mugla", "adana", "izmir", "bursa"])).toEqual({
      kind: "group",
      group: sehirler,
    });
  });

  it("eşleşme yoksa dörtlüdeki en büyük grup payını verir (3+1, 2+2, 1+1+1+1)", () => {
    expect(matchGroup(puzzle, ["mars", "venus", "saturn", "adana"])).toEqual({
      kind: "no-group",
      largestShare: 3,
    });
    expect(matchGroup(puzzle, ["mars", "venus", "adana", "bursa"])).toEqual({
      kind: "no-group",
      largestShare: 2,
    });
    expect(matchGroup(puzzle, ["mars", "elma", "adana", "mavi"])).toEqual({
      kind: "no-group",
      largestShare: 1,
    });
  });

  it("tekrar eden veya bilinmeyen kimlik bir grubu tamamlamaz", () => {
    expect(matchGroup(puzzle, ["elma", "elma", "armut", "kiraz"])).toEqual({
      kind: "no-group",
      largestShare: 3,
    });
    expect(matchGroup(puzzle, ["elma", "armut", "kiraz", "yok"])).toEqual({
      kind: "no-group",
      largestShare: 3,
    });
  });
});

describe("solveGroup", () => {
  it("doğru grubu çözer: grup eklenir, kelimeler tahtadan çıkar, seçim temizlenir, hak azalmaz", () => {
    const selected = selectOnly(puzzle, newGame(), ["kiraz", "elma", "incir", "armut"]);
    const { outcome, snapshot } = solveSelection(puzzle, selected);

    expect(outcome).toEqual({ verdict: "correct", solvedGroup: meyveler });
    expect(snapshot.status).toBe("playing");
    expect(snapshot.solvedGroupIds).toEqual(["meyveler"]);
    expect(snapshot.remainingWordOrder).toEqual(
      selected.remainingWordOrder.filter((id) => !["elma", "armut", "kiraz", "incir"].includes(id)),
    );
    expect(snapshot.selectedWordIds).toEqual([]);
    expect(snapshot.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes);
    expect(snapshot.attempts).toEqual([
      { id: "a1", wordIds: ["kiraz", "elma", "incir", "armut"], verdict: "correct" },
    ]);
  });

  it("dördüncü grup aynı sonuçta solvedGroup ve status='won' üretir; tahta boşalır", () => {
    let snapshot = newGame();
    const order = [gezegenler, renkler, sehirler, meyveler];
    let last: SubmitResult | null = null;
    for (const group of order) {
      last = solveSelection(puzzle, selectOnly(puzzle, snapshot, group.words.map((word) => word.id)));
      snapshot = last.snapshot;
    }

    expect(last?.outcome).toEqual({ verdict: "correct", solvedGroup: meyveler });
    expect(snapshot.status).toBe("won");
    expect(snapshot.solvedGroupIds).toEqual(["gezegenler", "renkler", "sehirler", "meyveler"]);
    expect(snapshot.remainingWordOrder).toEqual([]);
    expect(snapshot.attempts.map((attempt) => attempt.id)).toEqual(["a1", "a2", "a3", "a4"]);
  });

  it("doğru grup bir kez açılır: çözülen kelimeler yeniden seçilemez ve gönderilemez", () => {
    const quartet: Four<WordId> = ["elma", "armut", "kiraz", "incir"];
    const { snapshot: solved } = solveSelection(puzzle, selectOnly(puzzle, newGame(), quartet));

    expect(quartet.reduce((state, id) => toggleWord(puzzle, state, id), solved)).toBe(solved);
    expect(readSelection(puzzle, { ...solved, selectedWordIds: quartet })).toEqual({
      ok: false,
      reason: "invalid-words",
    });
    expect(() => solveGroup(solved, quartet, meyveler)).toThrow(/zaten çözülmüş/);
  });

  it("ön koşul ihlalinde hata fırlatır: grubun kelimeleri olmayan dörtlü ve terminal oyun", () => {
    const start = newGame();
    expect(() => solveGroup(start, ["elma", "armut", "kiraz", "mars"], meyveler)).toThrow(
      /grubunun kelimeleri değil/,
    );
    expect(() =>
      solveGroup({ ...start, status: "lost" }, ["elma", "armut", "kiraz", "incir"], meyveler),
    ).toThrow(/oyun sürmüyor/);
  });
});
