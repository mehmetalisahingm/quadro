/**
 * Arayüz durumları için hazır oyun senaryoları (Q03).
 *
 * Her senaryo, örnek adaptöre sırayla gönderimler yaptırılarak üretilir; durumlar elle
 * yazılmadığı için `docs/GAME_RULES.md` kurallarıyla her zaman tutarlıdır. Aynı senaryo her
 * çağrıda aynı durumu verir.
 */

import type { Four, Puzzle, SubmitResult, WordId } from "@/features/game/contracts";
import {
  DEFAULT_SAMPLE_SEED,
  createInitialSampleSnapshot,
  createSampleController,
  createSeededRandom,
  type SampleGameController,
} from "@/features/game/sampleController";

import { longWordsPuzzle, standardPuzzle } from "./puzzles";

/** Hazır senaryoların kimlikleri. */
export const SAMPLE_SCENARIO_IDS = [
  "empty",
  "in-progress",
  "correct",
  "one-away",
  "wrong",
  "repeated",
  "last-chance",
  "won",
  "lost",
  "long-words",
] as const;

export type SampleScenarioId = (typeof SAMPLE_SCENARIO_IDS)[number];

/** Açılmış bir senaryo: bulmaca, oynamaya devam edilebilen denetleyici ve son sonuç. */
export type SampleScenario = {
  id: SampleScenarioId;
  /** Senaryonun kısa Türkçe açıklaması. */
  description: string;
  puzzle: Puzzle;
  /** Senaryonun vardığı durumdan oynamaya devam eden örnek adaptör. */
  controller: SampleGameController;
  /**
   * Son gönderimin sonucu. Arayüz geri bildirim durumunu bununla başlatabilir. Gönderim yoksa
   * veya senaryo yenileme sonrası açılmış bir oyunu temsil ediyorsa `null`.
   */
  lastResult: SubmitResult | null;
};

type ScenarioScript = {
  description: string;
  puzzle: Puzzle;
  /** Sırayla gönderilen dörtlüler. */
  submissions: Four<WordId>[];
  /** Gönderimlerden sonra seçili bırakılacak kelimeler. */
  selection?: WordId[];
  /** Sayfa yenilenmiş gibi son sonucu gizler; `outcome` kaydedilmez. */
  restored?: boolean;
  /** Temsilî aktif süre (saniye); örnek adaptör süre ölçmez. */
  activeSeconds: number;
};

// Standart bulmacadaki (ornek-001) gönderimler.
const renkler: Four<WordId> = ["kirmizi", "mavi", "yesil", "sari"];
const meyveler: Four<WordId> = ["kiraz", "elma", "incir", "armut"];
const gezegenler: Four<WordId> = ["mars", "venus", "saturn", "merkur"];
const sehirler: Four<WordId> = ["adana", "bursa", "izmir", "mugla"];
const ucGezegenBirSehir: Four<WordId> = ["mars", "venus", "saturn", "adana"];
const ucRenkBirSehir: Four<WordId> = ["kirmizi", "mavi", "yesil", "mugla"];
const karisikIlk: Four<WordId> = ["mars", "kirmizi", "adana", "mavi"];
const karisikIkinci: Four<WordId> = ["bursa", "kirmizi", "venus", "izmir"];

const SCRIPTS: Record<SampleScenarioId, ScenarioScript> = {
  empty: {
    description: "Boş oyun: 16 kart, 4 hak, seçim yok.",
    puzzle: standardPuzzle,
    submissions: [],
    activeSeconds: 0,
  },
  "in-progress": {
    description:
      "Yarım kalmış oyun (yenileme sonrası): 2/4 grup, 3 hak, iki kart seçili; son sonuç yok.",
    puzzle: standardPuzzle,
    submissions: [renkler, ucGezegenBirSehir, meyveler],
    selection: ["bursa", "merkur"],
    restored: true,
    activeSeconds: 64,
  },
  correct: {
    description: "İlk doğru grup açıldı: 1/4 grup, 4 hak, seçim temizlendi.",
    puzzle: standardPuzzle,
    submissions: [meyveler],
    activeSeconds: 21,
  },
  "one-away": {
    description: "Çok yakın: üç gezegen ve bir şehir; seçim korunur, 3 hak.",
    puzzle: standardPuzzle,
    submissions: [ucGezegenBirSehir],
    activeSeconds: 35,
  },
  wrong: {
    description: "Yanlış tahmin: seçim korunur, 3 hak.",
    puzzle: standardPuzzle,
    submissions: [karisikIlk],
    activeSeconds: 30,
  },
  repeated: {
    description: "Çok yakın dörtlü farklı sırayla yeniden gönderildi: hak ve geçmiş değişmedi.",
    puzzle: standardPuzzle,
    submissions: [ucGezegenBirSehir, ["adana", "saturn", "venus", "mars"]],
    activeSeconds: 48,
  },
  "last-chance": {
    description: "Son hak: 1/4 grup, 1 hak; son tahmin çok yakın.",
    puzzle: standardPuzzle,
    submissions: [meyveler, ucGezegenBirSehir, karisikIlk, ucRenkBirSehir],
    activeSeconds: 95,
  },
  won: {
    description: "Kazanılmış oyun: 4/4 grup, 1 hata, 02:18.",
    puzzle: standardPuzzle,
    submissions: [renkler, ucGezegenBirSehir, meyveler, gezegenler, sehirler],
    activeSeconds: 138,
  },
  lost: {
    description: "Kaybedilmiş oyun: 1/4 grup, 0 hak; kalan üç grup çözülmüş sayılmaz.",
    puzzle: standardPuzzle,
    submissions: [meyveler, ucGezegenBirSehir, karisikIlk, ucRenkBirSehir, karisikIkinci],
    activeSeconds: 171,
  },
  "long-words": {
    description: "Uzun Türkçe kelimelerle dolu boş tahta (320 px denemesi).",
    puzzle: longWordsPuzzle,
    submissions: [],
    activeSeconds: 0,
  },
};

/** Senaryo açma seçenekleri. */
export type SampleScenarioOptions = {
  /** Başlangıç sırası ve karıştırma kaynağı; varsayılanı tohumludur. */
  random?: () => number;
};

/**
 * Hazır bir senaryoyu açar: örnek adaptörü oluşturur ve senaryonun gönderimlerini sırayla
 * uygular. Dönen denetleyiciyle oynamaya devam edilebilir.
 */
export function createSampleScenario(
  id: SampleScenarioId,
  options: SampleScenarioOptions = {},
): SampleScenario {
  const script = SCRIPTS[id];
  const random = options.random ?? createSeededRandom(DEFAULT_SAMPLE_SEED);
  const controller = createSampleController({
    puzzle: script.puzzle,
    snapshot: {
      ...createInitialSampleSnapshot(script.puzzle, random),
      activeSeconds: script.activeSeconds,
    },
    random,
  });

  let lastResult: SubmitResult | null = null;
  for (const wordIds of script.submissions) {
    controller.clearSelection();
    for (const wordId of wordIds) controller.toggleWord(wordId);
    lastResult = controller.submitSelection();
  }

  if (script.selection) {
    controller.clearSelection();
    for (const wordId of script.selection) controller.toggleWord(wordId);
  }

  return {
    id,
    description: script.description,
    puzzle: script.puzzle,
    controller,
    lastResult: script.restored ? null : lastResult,
  };
}
