import { describe, expect, it } from "vitest";

import {
  GAME_CONSTANTS,
  type Four,
  type GameSnapshot,
  type SubmitOutcome,
  type SubmitResult,
  type WordId,
} from "@/features/game/contracts";
import { standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";

import { groupWordIds } from "./lookup";
import { createSeededRandom } from "./random";
import { toggleWord } from "./selection";
import { shuffleBoard } from "./shuffle";
import { submitSelection } from "./submit";
import { deepFreeze, newGame, selectOnly } from "./testHelpers";

const [renkler, meyveler, gezegenler, sehirler] = puzzle.groups;

// Standart bulmacada (ornek-001) gönderilen dörtlüler.
const RENKLER: Four<WordId> = ["kirmizi", "mavi", "yesil", "sari"];
const MEYVELER: Four<WordId> = ["kiraz", "elma", "incir", "armut"];
const GEZEGENLER: Four<WordId> = ["mars", "venus", "saturn", "merkur"];
const SEHIRLER: Four<WordId> = ["adana", "bursa", "izmir", "mugla"];
/** 3 + 1: çok yakın. */
const UC_GEZEGEN_BIR_SEHIR: Four<WordId> = ["mars", "venus", "saturn", "adana"];
/** 2 + 2: yanlış. */
const IKI_GEZEGEN_IKI_SEHIR: Four<WordId> = ["mars", "venus", "adana", "bursa"];
/** 2 + 1 + 1: yanlış. */
const KARISIK_ILK: Four<WordId> = ["mars", "kirmizi", "adana", "mavi"];
/** 2 + 1 + 1: yanlış. */
const KARISIK_IKINCI: Four<WordId> = ["bursa", "kirmizi", "venus", "izmir"];
/** 1 + 1 + 1 + 1: yanlış. */
const HEPSI_FARKLI: Four<WordId> = ["elma", "mars", "yesil", "mugla"];

const GAME_ENDED: SubmitOutcome = { verdict: "invalid", reason: "game-ended" };

/** Seçimi yalnız verilen kelimelerle kurup gönderir. */
function submit(snapshot: GameSnapshot, wordIds: readonly WordId[]): SubmitResult {
  return submitSelection(puzzle, selectOnly(puzzle, snapshot, wordIds));
}

/** Dörtlüleri sırayla gönderir; her gönderimin değerlendirmesini ve son durumu döndürür. */
function play(start: GameSnapshot, submissions: readonly (readonly WordId[])[]) {
  let snapshot = start;
  const verdicts: SubmitOutcome["verdict"][] = [];
  for (const wordIds of submissions) {
    const result = submit(snapshot, wordIds);
    verdicts.push(result.outcome.verdict);
    snapshot = result.snapshot;
  }
  return { verdicts, snapshot };
}

describe("submitSelection: yanlış", () => {
  it("bir hak düşürür; seçim, tahta ve çözülen gruplar korunur, geçmişe wrong yazılır", () => {
    const selected = selectOnly(puzzle, newGame(), KARISIK_ILK);
    const { outcome, snapshot } = submitSelection(puzzle, selected);

    expect(outcome).toEqual({ verdict: "wrong" });
    expect(snapshot).toEqual({
      ...selected,
      mistakesRemaining: GAME_CONSTANTS.maxMistakes - 1,
      attempts: [{ id: "a1", wordIds: KARISIK_ILK, verdict: "wrong" }],
    });
  });

  it("her gruptan en fazla iki kelime varsa wrong olur (2+2, 2+1+1, 1+1+1+1)", () => {
    for (const wordIds of [IKI_GEZEGEN_IKI_SEHIR, KARISIK_ILK, HEPSI_FARKLI]) {
      expect(submit(newGame(), wordIds).outcome).toEqual({ verdict: "wrong" });
    }
  });
});

describe("submitSelection: çok yakın", () => {
  it("tam üç kelime aynı gruptansa one-away: hak düşer, seçim korunur, geçmişe yazılır", () => {
    const selected = selectOnly(puzzle, newGame(), UC_GEZEGEN_BIR_SEHIR);
    const { outcome, snapshot } = submitSelection(puzzle, selected);

    expect(outcome).toEqual({ verdict: "one-away" });
    expect(snapshot).toEqual({
      ...selected,
      mistakesRemaining: GAME_CONSTANTS.maxMistakes - 1,
      attempts: [{ id: "a1", wordIds: UC_GEZEGEN_BIR_SEHIR, verdict: "one-away" }],
    });
  });

  it("hangi kelimenin farklı olduğunu söylemez: sonuç yalnız verdict taşır", () => {
    const { outcome } = submit(newGame(), UC_GEZEGEN_BIR_SEHIR);
    expect(Object.keys(outcome)).toEqual(["verdict"]);

    // Farklı kelime ve eksik grup değişse de sonuç birebir aynıdır.
    expect(submit(newGame(), ["merkur", "venus", "kiraz", "mars"]).outcome).toEqual(outcome);
    expect(submit(newGame(), ["sari", "mugla", "kirmizi", "mavi"]).outcome).toEqual(outcome);
  });

  it("başka gruplar çözüldükten sonra da tam üçte tetiklenir", () => {
    const { verdicts } = play(newGame(), [SEHIRLER, MEYVELER, ["kirmizi", "mavi", "yesil", "merkur"]]);
    expect(verdicts).toEqual(["correct", "correct", "one-away"]);
  });
});

describe("submitSelection: tekrar", () => {
  it("aynı dörtlü farklı sırayla gönderilince repeated: snapshot aynı nesne, hak ve geçmiş değişmez", () => {
    const { snapshot: afterOneAway } = submit(newGame(), UC_GEZEGEN_BIR_SEHIR);
    const reordered = selectOnly(puzzle, afterOneAway, ["adana", "saturn", "venus", "mars"]);
    const result = submitSelection(puzzle, reordered);

    expect(result.outcome).toEqual({ verdict: "repeated" });
    expect(result.snapshot).toBe(reordered);
    expect(result.snapshot.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes - 1);
    expect(result.snapshot.attempts).toEqual(afterOneAway.attempts);
    expect(result.snapshot.selectedWordIds).toEqual(["adana", "saturn", "venus", "mars"]);
  });

  it("yanlış tahmin de tekrar sayılır; araya doğru grup girse ve tahta karışsa da", () => {
    let snapshot = play(newGame(), [KARISIK_ILK, MEYVELER]).snapshot;
    snapshot = shuffleBoard(snapshot, createSeededRandom(3));

    const { outcome, snapshot: after } = submit(snapshot, ["mavi", "adana", "kirmizi", "mars"]);
    expect(outcome).toEqual({ verdict: "repeated" });
    expect(after.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes - 1);
    expect(after.attempts).toEqual(snapshot.attempts);
  });

  it("çift gönderim hakkı iki kez düşürmez: yanlıştan sonra repeated, doğrudan sonra selection-count", () => {
    const afterWrong = submit(newGame(), KARISIK_ILK).snapshot;
    const secondWrong = submitSelection(puzzle, afterWrong);
    expect(secondWrong.outcome).toEqual({ verdict: "repeated" });
    expect(secondWrong.snapshot).toBe(afterWrong);

    const afterCorrect = submit(newGame(), MEYVELER).snapshot;
    const secondCorrect = submitSelection(puzzle, afterCorrect);
    expect(secondCorrect.outcome).toEqual({ verdict: "invalid", reason: "selection-count" });
    expect(secondCorrect.snapshot).toBe(afterCorrect);
  });

  it("doğru çıkmış dörtlünün kayıttan yeniden gönderimi repeated değil invalid-words döner", () => {
    const { snapshot: solved } = submit(newGame(), MEYVELER);
    const restored: GameSnapshot = { ...solved, selectedWordIds: ["armut", "incir", "elma", "kiraz"] };
    const result = submitSelection(puzzle, restored);

    expect(result.outcome).toEqual({ verdict: "invalid", reason: "invalid-words" });
    expect(result.snapshot).toBe(restored);
  });
});

describe("submitSelection: geçersiz gönderim", () => {
  it("seçim tam dört kimlik değilse selection-count: snapshot aynı nesne, hak azalmaz", () => {
    const start = newGame();
    const cases: GameSnapshot[] = [
      start,
      selectOnly(puzzle, start, ["mars", "venus", "saturn"]),
      { ...start, selectedWordIds: ["mars", "venus", "saturn", "merkur", "adana"] },
      // Sayı, kimlik geçerliliğinden önce denetlenir.
      { ...start, selectedWordIds: ["mars", "mars", "yok"] },
    ];

    for (const snapshot of cases) {
      const result = submitSelection(puzzle, snapshot);
      expect(result.outcome).toEqual({ verdict: "invalid", reason: "selection-count" });
      expect(result.snapshot).toBe(snapshot);
    }
  });

  it("tekrar eden, bilinmeyen veya çözülmüş kimlikte invalid-words: son hakta bile hak azalmaz", () => {
    const { snapshot: solved } = submit({ ...newGame(), mistakesRemaining: 1 }, MEYVELER);
    const selections: Four<WordId>[] = [
      ["mars", "mars", "venus", "saturn"],
      ["mars", "venus", "saturn", "pluton"],
      ["elma", "mars", "venus", "saturn"],
    ];

    for (const selectedWordIds of selections) {
      const snapshot: GameSnapshot = { ...solved, selectedWordIds };
      const result = submitSelection(puzzle, snapshot);
      expect(result.outcome).toEqual({ verdict: "invalid", reason: "invalid-words" });
      expect(result.snapshot).toBe(snapshot);
      expect(result.snapshot).toMatchObject({ status: "playing", mistakesRemaining: 1 });
    }
  });
});

describe("submitSelection: bitmiş oyun", () => {
  it("won ve lost oyunda her gönderim invalid / game-ended döner; snapshot aynı nesne", () => {
    const base = newGame();
    for (const status of ["won", "lost"] as const) {
      for (const selectedWordIds of [KARISIK_ILK, MEYVELER, [], ["mars"]]) {
        const ended: GameSnapshot = { ...base, status, selectedWordIds: [...selectedWordIds] };
        const result = submitSelection(puzzle, ended);
        expect(result.outcome).toEqual(GAME_ENDED);
        expect(result.snapshot).toBe(ended);
      }
    }
  });
});

describe("submitSelection: kazanma ve kaybetme", () => {
  it("son doğru grup aynı SubmitResult içinde correct + solvedGroup ve status=won üretir; son hakta doğru hak düşürmez", () => {
    const { verdicts, snapshot } = play({ ...newGame(), mistakesRemaining: 1 }, [
      RENKLER,
      MEYVELER,
      GEZEGENLER,
    ]);
    expect(verdicts).toEqual(["correct", "correct", "correct"]);
    expect(snapshot.status).toBe("playing");

    const last = submit(snapshot, ["mugla", "izmir", "bursa", "adana"]);
    expect(last.outcome).toEqual({ verdict: "correct", solvedGroup: sehirler });
    expect(last.snapshot).toMatchObject({
      status: "won",
      selectedWordIds: [],
      remainingWordOrder: [],
      solvedGroupIds: [renkler.id, meyveler.id, gezegenler.id, sehirler.id],
      mistakesRemaining: 1,
    });
    expect(submitSelection(puzzle, last.snapshot).outcome).toEqual(GAME_ENDED);
  });

  it("dördüncü hata lost yapar: seçim temizlenir, tahta sırası ve çözülen gruplar korunur", () => {
    const { verdicts, snapshot } = play(newGame(), [
      MEYVELER,
      KARISIK_ILK,
      KARISIK_IKINCI,
      IKI_GEZEGEN_IKI_SEHIR,
    ]);
    expect(verdicts).toEqual(["correct", "wrong", "wrong", "wrong"]);
    expect(snapshot).toMatchObject({ status: "playing", mistakesRemaining: 1 });

    const fourth: Four<WordId> = ["sari", "yesil", "saturn", "mugla"];
    const { outcome, snapshot: lost } = submit(snapshot, fourth);
    expect(outcome).toEqual({ verdict: "wrong" });
    expect(lost).toEqual({
      ...snapshot,
      status: "lost",
      selectedWordIds: [],
      mistakesRemaining: 0,
      attempts: [...snapshot.attempts, { id: "a5", wordIds: fourth, verdict: "wrong" }],
    });
  });

  it("son hak çok yakın tahminle giderse sonuç one-away kalır, durum lost olur", () => {
    const { outcome, snapshot } = submit({ ...newGame(), mistakesRemaining: 1 }, UC_GEZEGEN_BIR_SEHIR);
    expect(outcome).toEqual({ verdict: "one-away" });
    expect(snapshot).toMatchObject({
      status: "lost",
      mistakesRemaining: 0,
      selectedWordIds: [],
      solvedGroupIds: [],
    });
  });

  it("son hakta repeated ve invalid hak düşürmez, oyun sürer", () => {
    const { snapshot } = play(newGame(), [KARISIK_ILK, KARISIK_IKINCI, UC_GEZEGEN_BIR_SEHIR]);
    expect(snapshot.mistakesRemaining).toBe(1);

    const repeated = submit(snapshot, [...KARISIK_ILK].reverse());
    expect(repeated.outcome).toEqual({ verdict: "repeated" });
    expect(repeated.snapshot).toMatchObject({ status: "playing", mistakesRemaining: 1 });

    const invalid = submit(snapshot, ["mars", "venus"]);
    expect(invalid.outcome).toEqual({ verdict: "invalid", reason: "selection-count" });
    expect(invalid.snapshot).toMatchObject({ status: "playing", mistakesRemaining: 1 });
  });
});

describe("submitSelection: tam oyun akışı", () => {
  it("hatalar, tekrar ve geçersiz gönderimlerle dört grubu çözer → won; sonra tahmin kabul edilmez", () => {
    const { verdicts, snapshot } = play(newGame(), [
      KARISIK_ILK,
      MEYVELER,
      UC_GEZEGEN_BIR_SEHIR,
      ["adana", "saturn", "venus", "mars"],
      ["mars", "venus"],
      GEZEGENLER,
      RENKLER,
      SEHIRLER,
      KARISIK_IKINCI,
    ]);

    expect(verdicts).toEqual([
      "wrong",
      "correct",
      "one-away",
      "repeated",
      "invalid",
      "correct",
      "correct",
      "correct",
      "invalid",
    ]);
    expect(snapshot).toMatchObject({
      status: "won",
      selectedWordIds: [],
      remainingWordOrder: [],
      solvedGroupIds: ["meyveler", "gezegenler", "renkler", "sehirler"],
      mistakesRemaining: GAME_CONSTANTS.maxMistakes - 2,
    });
    expect(snapshot.attempts.map(({ id, verdict }) => [id, verdict])).toEqual([
      ["a1", "wrong"],
      ["a2", "correct"],
      ["a3", "one-away"],
      ["a4", "correct"],
      ["a5", "correct"],
      ["a6", "correct"],
    ]);
  });

  it("dört hatayla kaybeder; tekrarlar hak düşürmez, kalan gruplar çözülmüş sayılmaz, oyun kilitlenir", () => {
    const { verdicts, snapshot: lost } = play(newGame(), [
      MEYVELER,
      KARISIK_ILK,
      [...KARISIK_ILK].reverse(),
      UC_GEZEGEN_BIR_SEHIR,
      KARISIK_IKINCI,
      ["mars", "venus"],
      IKI_GEZEGEN_IKI_SEHIR,
    ]);

    expect(verdicts).toEqual(["correct", "wrong", "repeated", "one-away", "wrong", "invalid", "wrong"]);
    expect(lost).toMatchObject({
      status: "lost",
      selectedWordIds: [],
      solvedGroupIds: ["meyveler"],
      mistakesRemaining: 0,
    });
    expect(lost.attempts.map(({ verdict }) => verdict)).toEqual([
      "correct",
      "wrong",
      "one-away",
      "wrong",
      "wrong",
    ]);

    // Açılan cevaplar çözülmüş sayılmaz: kelimeleri tahtada kalır, grupları eklenmez.
    const unsolvedWordIds = [renkler, gezegenler, sehirler].flatMap(groupWordIds);
    expect([...lost.remainingWordOrder].sort()).toEqual([...unsolvedWordIds].sort());

    // Doğru dörtlü bile artık kabul edilmez; seçim ve karıştırma etkisizdir.
    expect(submit(lost, GEZEGENLER)).toEqual({ outcome: GAME_ENDED, snapshot: lost });
    expect(submitSelection(puzzle, lost).snapshot).toBe(lost);
    expect(toggleWord(puzzle, lost, "mars")).toBe(lost);
    expect(shuffleBoard(lost, createSeededRandom(1))).toBe(lost);
  });
});

describe("submitSelection: saflık", () => {
  it("donmuş bulmaca ve durumlarla her sonuç yolunda çalışır; girdileri değiştirmez", () => {
    const frozenPuzzle = deepFreeze(structuredClone(puzzle));
    const start = newGame(frozenPuzzle);
    const oneAway = deepFreeze(selectOnly(frozenPuzzle, start, UC_GEZEGEN_BIR_SEHIR));
    const afterOneAway = deepFreeze(submitSelection(frozenPuzzle, oneAway).snapshot);

    const inputs = deepFreeze<GameSnapshot[]>([
      selectOnly(frozenPuzzle, start, MEYVELER),
      oneAway,
      { ...selectOnly(frozenPuzzle, start, KARISIK_ILK), mistakesRemaining: 1 },
      afterOneAway,
      { ...start, selectedWordIds: ["mars"] },
      { ...start, selectedWordIds: ["mars", "mars", "venus", "saturn"] },
      { ...start, status: "won" },
    ]);

    const results = inputs.map((input) => {
      const copy = structuredClone(input);
      const result = submitSelection(frozenPuzzle, input);
      expect(input).toEqual(copy);
      return [result.outcome.verdict, result.snapshot.status];
    });

    expect(results).toEqual([
      ["correct", "playing"],
      ["one-away", "playing"],
      ["wrong", "lost"],
      ["repeated", "playing"],
      ["invalid", "playing"],
      ["invalid", "playing"],
      ["invalid", "won"],
    ]);
    expect(frozenPuzzle).toEqual(puzzle);
  });
});
