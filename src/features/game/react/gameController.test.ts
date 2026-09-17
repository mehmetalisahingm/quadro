import { describe, expect, expectTypeOf, it } from "vitest";

import {
  GAME_CONSTANTS,
  type Four,
  type GameController,
  type GameSnapshot,
  type SubmitResult,
  type WordId,
} from "@/features/game/contracts";
import { createInitialSnapshot, createSeededRandom } from "@/features/game/engine";
import { longWordsPuzzle, standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";
import { createSampleController } from "@/features/game/sampleController";

import {
  createGameController,
  puzzleSeed,
  type EngineGameController,
} from "./gameController";

const [renkler, meyveler, gezegenler, sehirler] = puzzle.groups;

const MEYVELER: Four<WordId> = ["kiraz", "elma", "incir", "armut"];
const RENKLER: Four<WordId> = ["kirmizi", "mavi", "yesil", "sari"];
const GEZEGENLER: Four<WordId> = ["mars", "venus", "saturn", "merkur"];
const SEHIRLER: Four<WordId> = ["adana", "bursa", "izmir", "mugla"];
const UC_GEZEGEN_BIR_SEHIR: Four<WordId> = ["mars", "venus", "saturn", "adana"];
const KARISIK_ILK: Four<WordId> = ["mars", "kirmizi", "adana", "mavi"];
const KARISIK_IKINCI: Four<WordId> = ["bursa", "kirmizi", "venus", "izmir"];
const IKI_GEZEGEN_IKI_SEHIR: Four<WordId> = ["mars", "venus", "adana", "bursa"];

/** Denetleyicinin kendi eylemleriyle seçimi kurar ve gönderir; arayüzün yaptığı çağrılar. */
function submit(controller: GameController, wordIds: readonly WordId[]): SubmitResult {
  controller.clearSelection();
  wordIds.forEach((wordId) => controller.toggleWord(wordId));
  return controller.submitSelection();
}

describe("createGameController: sözleşme", () => {
  it("GameController sözleşmesini karşılar; başlangıç durumu motorun boş oyunudur", () => {
    expectTypeOf<EngineGameController>().toMatchTypeOf<GameController>();

    const controller = createGameController({ puzzle });
    for (const method of ["toggleWord", "clearSelection", "shuffle", "submitSelection"] as const) {
      expect(controller[method]).toBeTypeOf("function");
    }
    expect(controller.puzzle).toBe(puzzle);
    expect(controller.snapshot).toEqual(
      createInitialSnapshot(puzzle, { random: createSeededRandom(puzzleSeed(puzzle)) }),
    );
    expect(controller.snapshot).toMatchObject({
      status: "playing",
      mistakesRemaining: GAME_CONSTANTS.maxMistakes,
      selectedWordIds: [],
      solvedGroupIds: [],
    });
    expect(controller.snapshot.remainingWordOrder).toHaveLength(GAME_CONSTANTS.wordCount);
  });

  it("başlangıç tahtası deterministiktir: aynı bulmaca ve tohum aynı sırayı verir", () => {
    const first = createGameController({ puzzle }).snapshot.remainingWordOrder;
    expect(createGameController({ puzzle }).snapshot.remainingWordOrder).toEqual(first);
    expect(puzzleSeed(puzzle)).toBe(puzzleSeed({ id: puzzle.id, revision: puzzle.revision }));

    // Tohum bulmacaya özgüdür: başka bulmaca veya revizyon başka tohum verir.
    expect(puzzleSeed(longWordsPuzzle)).not.toBe(puzzleSeed(puzzle));
    expect(puzzleSeed({ ...puzzle, revision: puzzle.revision + 1 })).not.toBe(puzzleSeed(puzzle));

    const seeded = () => createGameController({ puzzle, random: createSeededRandom(42) });
    expect(seeded().snapshot.remainingWordOrder).toEqual(seeded().snapshot.remainingWordOrder);
    expect(seeded().snapshot.remainingWordOrder).not.toEqual(first);
  });

  it("submitSelection motorun sonucunu döndürür; dönen snapshot controller.snapshot'ın yeni değeridir", () => {
    const controller = createGameController({ puzzle });
    const result = submit(controller, MEYVELER);

    expect(result.outcome).toEqual({ verdict: "correct", solvedGroup: meyveler });
    expect(result.snapshot).toBe(controller.snapshot);
    expect(controller.snapshot.solvedGroupIds).toEqual(["meyveler"]);
  });

  it("kayıttan gelen durumla açılır; başka bulmacanın durumunu reddeder", () => {
    const played = createGameController({ puzzle });
    submit(played, KARISIK_ILK);
    const restored = createGameController({ puzzle, snapshot: played.snapshot });

    expect(restored.snapshot).toBe(played.snapshot);
    expect(submit(restored, [...KARISIK_ILK].reverse()).outcome).toEqual({ verdict: "repeated" });
    expect(() => createGameController({ puzzle: longWordsPuzzle, snapshot: played.snapshot })).toThrow(
      /bulmacasına ait/,
    );
  });

  it("dinleyicileri yalnız durum değişince çağırır; abonelik bırakılabilir", () => {
    const controller = createGameController({ puzzle });
    let calls = 0;
    const unsubscribe = controller.subscribe(() => {
      calls += 1;
    });

    controller.submitSelection(); // selection-count: durum aynı
    controller.clearSelection(); // boş seçim: durum aynı
    expect(calls).toBe(0);

    KARISIK_ILK.forEach((wordId) => controller.toggleWord(wordId));
    expect(calls).toBe(4);
    controller.toggleWord("bursa"); // beşinci kart: etkisiz
    controller.submitSelection(); // wrong: hak düşer
    controller.submitSelection(); // repeated: durum aynı
    expect(calls).toBe(5);

    unsubscribe();
    controller.shuffle();
    expect(calls).toBe(5);
  });
});

describe("createGameController: oyun akışları", () => {
  it("kazanılır: son doğru grup correct + solvedGroup ile won'u aynı yanıtta verir; sonra eylemler etkisiz", () => {
    const controller = createGameController({ puzzle });
    expect(submit(controller, KARISIK_ILK).outcome).toEqual({ verdict: "wrong" });
    expect(submit(controller, RENKLER).outcome.verdict).toBe("correct");
    expect(submit(controller, UC_GEZEGEN_BIR_SEHIR).outcome).toEqual({ verdict: "one-away" });
    expect(submit(controller, GEZEGENLER).outcome.verdict).toBe("correct");
    expect(submit(controller, MEYVELER).outcome.verdict).toBe("correct");
    controller.shuffle();

    const last = submit(controller, SEHIRLER);
    expect(last.outcome).toEqual({ verdict: "correct", solvedGroup: sehirler });
    expect(last.snapshot).toBe(controller.snapshot);
    expect(last.snapshot).toMatchObject({
      status: "won",
      remainingWordOrder: [],
      selectedWordIds: [],
      solvedGroupIds: [renkler.id, gezegenler.id, meyveler.id, sehirler.id],
      mistakesRemaining: GAME_CONSTANTS.maxMistakes - 2,
    });

    const won = controller.snapshot;
    controller.toggleWord("mars");
    controller.shuffle();
    controller.clearSelection();
    expect(controller.submitSelection()).toEqual({
      outcome: { verdict: "invalid", reason: "game-ended" },
      snapshot: won,
    });
    expect(controller.snapshot).toBe(won);
  });

  it("kaybedilir: tekrar ve geçersiz gönderim hak düşürmez; dördüncü hatada lost, açılan cevaplar çözülmüş sayılmaz", () => {
    const controller = createGameController({ puzzle });
    const verdicts = [
      submit(controller, MEYVELER),
      submit(controller, KARISIK_ILK),
      submit(controller, [...KARISIK_ILK].reverse()),
      submit(controller, ["mars", "venus"]),
      submit(controller, UC_GEZEGEN_BIR_SEHIR),
      submit(controller, KARISIK_IKINCI),
    ].map((result) => result.outcome.verdict);
    expect(verdicts).toEqual(["correct", "wrong", "repeated", "invalid", "one-away", "wrong"]);
    expect(controller.snapshot).toMatchObject({ status: "playing", mistakesRemaining: 1 });

    const last = submit(controller, IKI_GEZEGEN_IKI_SEHIR);
    expect(last.outcome).toEqual({ verdict: "wrong" });
    expect(last.snapshot).toBe(controller.snapshot);
    expect(last.snapshot).toMatchObject({
      status: "lost",
      mistakesRemaining: 0,
      selectedWordIds: [],
      solvedGroupIds: ["meyveler"],
    });
    expect(last.snapshot.remainingWordOrder).toHaveLength(12);
    expect(submit(controller, RENKLER).outcome).toEqual({ verdict: "invalid", reason: "game-ended" });
  });

  it("örnek adaptörle aynı tohum ve aynı eylemlerle her adımda birebir aynı sonuç ve durumu verir", () => {
    const real = createGameController({ puzzle, random: createSeededRandom(7) });
    const sample = createSampleController({ puzzle, random: createSeededRandom(7) });
    const controllers: GameController[] = [real, sample];

    const same = <T>(act: (controller: GameController) => T): T => {
      const [fromReal, fromSample] = controllers.map(act);
      expect(fromReal).toEqual(fromSample);
      expect(real.snapshot).toEqual(sample.snapshot);
      return fromReal as T;
    };

    const snapshots: GameSnapshot[] = [same((controller) => controller.snapshot)];
    same((controller) => controller.toggleWord("mars"));
    same((controller) => controller.shuffle());
    same((controller) => controller.toggleWord("mars"));
    for (const wordIds of [
      ["mars", "venus"],
      KARISIK_ILK,
      [...KARISIK_ILK].reverse(),
      MEYVELER,
      UC_GEZEGEN_BIR_SEHIR,
      KARISIK_IKINCI,
      IKI_GEZEGEN_IKI_SEHIR,
      RENKLER,
    ]) {
      same((controller) => controller.shuffle());
      snapshots.push(same((controller) => submit(controller, wordIds)).snapshot);
    }

    expect(snapshots.map(({ status, mistakesRemaining }) => `${status}:${mistakesRemaining}`)).toEqual([
      "playing:4",
      "playing:4",
      "playing:3",
      "playing:3",
      "playing:3",
      "playing:2",
      "playing:1",
      "lost:0",
      "lost:0",
    ]);
  });
});
