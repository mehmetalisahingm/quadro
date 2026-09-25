import { describe, expect, expectTypeOf, it } from "vitest";

import prototip20 from "@/content/puzzles/2026-09-20.json";
import prototip21 from "@/content/puzzles/2026-09-21.json";
import prototip22 from "@/content/puzzles/2026-09-22.json";
import prototip23 from "@/content/puzzles/2026-09-23.json";
import prototip24 from "@/content/puzzles/2026-09-24.json";
import prototip1007 from "@/content/puzzles/2026-10-07.json";
import prototip1008 from "@/content/puzzles/2026-10-08.json";
import prototip1009 from "@/content/puzzles/2026-10-09.json";
import prototip1010 from "@/content/puzzles/2026-10-10.json";
import prototip1011 from "@/content/puzzles/2026-10-11.json";
import {
  GAME_CONSTANTS,
  normalizeTr,
  slugifyTr,
  type GameStatus,
  type Puzzle,
  type SubmitOutcome,
} from "@/features/game/contracts";
import {
  SAMPLE_SCENARIO_IDS,
  createSampleScenario,
  longWordsPuzzle,
  standardPuzzle,
  tutorialPuzzle,
  type SampleScenarioId,
  type TutorialPuzzle,
} from "@/features/game/fixtures";
import { validatePuzzle } from "@/features/game/validator";

const wordsOf = (puzzle: Puzzle | TutorialPuzzle) =>
  puzzle.groups.flatMap((group) => group.words.map((word) => word));

describe("örnek bulmacalar", () => {
  it.each([
    ["standardPuzzle", standardPuzzle],
    ["longWordsPuzzle", longWordsPuzzle],
  ] as const)("%s sözleşmeye uyar: 4 grup, 16 benzersiz kelime, 1–4 zorluk", (_, puzzle) => {
    // Kural tanımları Q18 doğrulayıcısındadır; burada yalnız örneklerin uyduğu doğrulanır.
    expect(validatePuzzle(puzzle)).toEqual([]);
    expect(new Set(wordsOf(puzzle).map((word) => word.id)).size).toBe(GAME_CONSTANTS.wordCount);
  });

  it("kelime kimlikleri slugifyTr ile üretilmiştir", () => {
    for (const puzzle of [standardPuzzle, longWordsPuzzle, tutorialPuzzle]) {
      for (const word of wordsOf(puzzle)) expect(word.id).toBe(slugifyTr(word.text));
    }
  });

  it("uzun kelimeli örnek 320 px denemesi için uzun ve boşluklu kelimeler içerir", () => {
    const lengths = wordsOf(longWordsPuzzle).map((word) => word.text.length);
    expect(Math.max(...lengths)).toBeGreaterThanOrEqual(18);
    expect(Math.min(...lengths)).toBeGreaterThanOrEqual(9);
    expect(wordsOf(longWordsPuzzle).some((word) => word.text.includes(" "))).toBe(true);
  });

  it("öğretici iki gruplu ayrı bir veri türüdür ve Puzzle yerine geçmez", () => {
    expect(validatePuzzle(tutorialPuzzle, { groupCount: 2, requireDailyFields: false })).toEqual(
      [],
    );
    expect(wordsOf(tutorialPuzzle)).toHaveLength(8);
    expectTypeOf<TutorialPuzzle>().not.toMatchTypeOf<Puzzle>();
    expectTypeOf<TutorialPuzzle["groups"]>().toHaveProperty("length").toEqualTypeOf<2>();
  });

  it("örnekler günlük bulmacaların kelimelerini kullanmaz (cevap ifşası yok)", () => {
    const dailyTexts = new Set(
      [prototip20, prototip21, prototip22, prototip23, prototip24, prototip1007, prototip1008, prototip1009, prototip1010, prototip1011].flatMap((puzzle) =>
        puzzle.groups.flatMap((group) => group.words.map((word) => normalizeTr(word.text))),
      ),
    );
    const overlaps = [standardPuzzle, longWordsPuzzle, tutorialPuzzle]
      .flatMap(wordsOf)
      .filter((word) => dailyTexts.has(normalizeTr(word.text)));
    expect(overlaps).toEqual([]);
  });
});

describe("senaryolar", () => {
  type Expected = {
    puzzle: Puzzle;
    status: GameStatus;
    solved: number;
    mistakesRemaining: number;
    selected: number;
    lastVerdict: SubmitOutcome["verdict"] | null;
  };

  // Record tipi yeni bir senaryonun beklentisiz eklenmesini engeller.
  const expected: Record<SampleScenarioId, Expected> = {
    empty: { puzzle: standardPuzzle, status: "playing", solved: 0, mistakesRemaining: 4, selected: 0, lastVerdict: null },
    "in-progress": { puzzle: standardPuzzle, status: "playing", solved: 2, mistakesRemaining: 3, selected: 2, lastVerdict: null },
    correct: { puzzle: standardPuzzle, status: "playing", solved: 1, mistakesRemaining: 4, selected: 0, lastVerdict: "correct" },
    "one-away": { puzzle: standardPuzzle, status: "playing", solved: 0, mistakesRemaining: 3, selected: 4, lastVerdict: "one-away" },
    wrong: { puzzle: standardPuzzle, status: "playing", solved: 0, mistakesRemaining: 3, selected: 4, lastVerdict: "wrong" },
    repeated: { puzzle: standardPuzzle, status: "playing", solved: 0, mistakesRemaining: 3, selected: 4, lastVerdict: "repeated" },
    "last-chance": { puzzle: standardPuzzle, status: "playing", solved: 1, mistakesRemaining: 1, selected: 4, lastVerdict: "one-away" },
    won: { puzzle: standardPuzzle, status: "won", solved: 4, mistakesRemaining: 3, selected: 0, lastVerdict: "correct" },
    lost: { puzzle: standardPuzzle, status: "lost", solved: 1, mistakesRemaining: 0, selected: 0, lastVerdict: "wrong" },
    "long-words": { puzzle: longWordsPuzzle, status: "playing", solved: 0, mistakesRemaining: 4, selected: 0, lastVerdict: null },
  };

  it.each(SAMPLE_SCENARIO_IDS)("%s beklenen arayüz durumunu üretir", (id) => {
    const scenario = createSampleScenario(id);
    const want = expected[id];
    const { snapshot } = scenario.controller;

    expect(scenario.description.length).toBeGreaterThan(0);
    expect(scenario.puzzle).toBe(want.puzzle);
    expect(snapshot.status).toBe(want.status);
    expect(snapshot.solvedGroupIds).toHaveLength(want.solved);
    expect(snapshot.mistakesRemaining).toBe(want.mistakesRemaining);
    expect(snapshot.selectedWordIds).toHaveLength(want.selected);
    expect(snapshot.remainingWordOrder).toHaveLength((4 - want.solved) * GAME_CONSTANTS.groupSize);
    expect(scenario.lastResult?.outcome.verdict ?? null).toBe(want.lastVerdict);
    if (scenario.lastResult) expect(scenario.lastResult.snapshot).toBe(snapshot);
  });

  it("repeated senaryosu geçmişe yeni kayıt eklemez; lost senaryosu açılan grupları çözmez", () => {
    expect(createSampleScenario("repeated").controller.snapshot.attempts).toHaveLength(1);
    expect(createSampleScenario("lost").controller.snapshot.solvedGroupIds).toEqual(["meyveler"]);
  });

  it("senaryolar deterministiktir ve birbirinden bağımsızdır", () => {
    const first = createSampleScenario("in-progress");
    const second = createSampleScenario("in-progress");
    expect(first.controller.snapshot).toEqual(second.controller.snapshot);

    first.controller.clearSelection();
    expect(second.controller.snapshot.selectedWordIds).toHaveLength(2);
  });

  it("senaryodan oynamaya devam edilebilir: son haktaki yanlış oyunu kaybettirir", () => {
    const { controller } = createSampleScenario("last-chance");
    controller.clearSelection();
    for (const wordId of ["bursa", "kirmizi", "venus", "izmir"]) controller.toggleWord(wordId);
    const { outcome, snapshot } = controller.submitSelection();
    expect(outcome).toEqual({ verdict: "wrong" });
    expect(snapshot.status).toBe("lost");
  });
});
