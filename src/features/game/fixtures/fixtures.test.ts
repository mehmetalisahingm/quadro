import { describe, expect, expectTypeOf, it } from "vitest";

import prototip20 from "@/content/puzzles/2026-09-20.json";
import prototip21 from "@/content/puzzles/2026-09-21.json";
import prototip22 from "@/content/puzzles/2026-09-22.json";
import prototip23 from "@/content/puzzles/2026-09-23.json";
import korTahta23 from "@/content/editorial/blind/2026-09-23.json";
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

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFilledString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Değerin `Puzzle` sözleşmesine yapısal olarak uyup uymadığını denetler ve sorunları listeler.
 * Yalnız bu testler içindir; kapsamlı içerik doğrulayıcısı Q18'de yazılır.
 */
function puzzleProblems(value: unknown, groupCount: number = GAME_CONSTANTS.groupCount): string[] {
  if (!isRecord(value)) return ["bulmaca nesne değil"];

  const problems: string[] = [];
  if (!isFilledString(value.id)) problems.push("id boş");
  if (value.language !== "tr") problems.push("language 'tr' değil");
  if (!Array.isArray(value.groups) || value.groups.length !== groupCount) {
    return [...problems, `grup sayısı ${groupCount} değil`];
  }

  const groupIds = new Set<string>();
  const wordIds = new Set<string>();
  const texts = new Set<string>();
  const difficulties = new Set<unknown>();

  value.groups.forEach((group: unknown, index) => {
    if (!isRecord(group)) {
      problems.push(`grup ${index} nesne değil`);
      return;
    }
    if (!isFilledString(group.id) || groupIds.has(group.id)) problems.push(`grup ${index} id geçersiz`);
    else groupIds.add(group.id);
    if (!isFilledString(group.title)) problems.push(`grup ${index} başlığı boş`);
    if (!isFilledString(group.explanation)) problems.push(`grup ${index} açıklaması boş`);
    if (typeof group.difficulty !== "number" || ![1, 2, 3, 4].includes(group.difficulty)) {
      problems.push(`grup ${index} zorluğu geçersiz`);
    }
    difficulties.add(group.difficulty);

    if (!Array.isArray(group.words) || group.words.length !== GAME_CONSTANTS.groupSize) {
      problems.push(`grup ${index} dört kelime içermiyor`);
      return;
    }
    group.words.forEach((word: unknown) => {
      if (!isRecord(word) || !isFilledString(word.id) || !isFilledString(word.text)) {
        problems.push(`grup ${index} içinde geçersiz kelime`);
        return;
      }
      if (wordIds.has(word.id)) problems.push(`yinelenen kelime kimliği: ${word.id}`);
      wordIds.add(word.id);
      const normalized = normalizeTr(word.text);
      if (texts.has(normalized)) problems.push(`yinelenen kelime: ${word.text}`);
      texts.add(normalized);
    });
  });

  if (difficulties.size !== groupCount) problems.push("zorluk değerleri birer kez kullanılmamış");
  return problems;
}

/** Günlük bulmacaya özgü alanlar: şema, revizyon ve tarih. */
function dailyFieldProblems(value: unknown): string[] {
  if (!isRecord(value)) return ["bulmaca nesne değil"];
  const problems: string[] = [];
  if (value.schemaVersion !== 1) problems.push("schemaVersion 1 değil");
  if (typeof value.revision !== "number" || !Number.isInteger(value.revision) || value.revision < 1) {
    problems.push("revision pozitif tam sayı değil");
  }
  if (typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
    problems.push("date YYYY-MM-DD değil");
  }
  return problems;
}

const wordsOf = (puzzle: Puzzle | TutorialPuzzle) =>
  puzzle.groups.flatMap((group) => group.words.map((word) => word));

describe("örnek bulmacalar", () => {
  it.each([
    ["standardPuzzle", standardPuzzle],
    ["longWordsPuzzle", longWordsPuzzle],
  ] as const)("%s sözleşmeye uyar: 4 grup, 16 benzersiz kelime, 1–4 zorluk", (_, puzzle) => {
    expect(puzzleProblems(puzzle)).toEqual([]);
    expect(dailyFieldProblems(puzzle)).toEqual([]);
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
    expect(puzzleProblems(tutorialPuzzle, 2)).toEqual([]);
    expect(wordsOf(tutorialPuzzle)).toHaveLength(8);
    expectTypeOf<TutorialPuzzle>().not.toMatchTypeOf<Puzzle>();
    expectTypeOf<TutorialPuzzle["groups"]>().toHaveProperty("length").toEqualTypeOf<2>();
  });

  it("örnekler günlük bulmacaların kelimelerini kullanmaz (cevap ifşası yok)", () => {
    const dailyTexts = new Set(
      [prototip20, prototip21, prototip22, prototip23].flatMap((puzzle) =>
        puzzle.groups.flatMap((group) => group.words.map((word) => normalizeTr(word.text))),
      ),
    );
    const overlaps = [standardPuzzle, longWordsPuzzle, tutorialPuzzle]
      .flatMap(wordsOf)
      .filter((word) => dailyTexts.has(normalizeTr(word.text)));
    expect(overlaps).toEqual([]);
  });
});

describe("mevcut günlük prototipler (src/content/puzzles)", () => {
  it.each([
    ["2026-09-20", prototip20],
    ["2026-09-21", prototip21],
    ["2026-09-22", prototip22],
    ["2026-09-23", prototip23],
  ] as const)("%s Puzzle şekline uyar", (date, puzzle) => {
    expect(puzzleProblems(puzzle)).toEqual([]);
    expect(dailyFieldProblems(puzzle)).toEqual([]);
    expect(puzzle.date).toBe(date);
  });

  it("q-004 kör tahtası bulmacayla aynı 16 kelimeyi grup bilgisi olmadan taşır", () => {
    const beklenen = prototip23.groups
      .flatMap((group) => group.words.map((word) => `${word.id}:${word.text}`))
      .sort();
    const korTahtada = korTahta23.words.map((word) => `${word.id}:${word.text}`).sort();

    expect(korTahtada).toEqual(beklenen);
    expect(korTahta23.id).toBe(prototip23.id);
    expect(korTahta23.date).toBe(prototip23.date);

    // Kör tahta cevap ipucu taşımamalı: grup, başlık, zorluk veya açıklama alanı olmamalı.
    const alanlar = Object.keys(korTahta23);
    expect(alanlar).not.toContain("groups");
    expect(alanlar).not.toContain("difficulty");
    for (const word of korTahta23.words) expect(Object.keys(word).sort()).toEqual(["id", "text"]);

    // Sıra karıştırılmış olmalı; kanonik sırayla birebir aynı olmamalı.
    const kanonikSira = prototip23.groups.flatMap((group) => group.words.map((word) => word.id));
    expect(korTahta23.words.map((word) => word.id)).not.toEqual(kanonikSira);
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
