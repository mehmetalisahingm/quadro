/**
 * Örnek oyun adaptörü (Q03).
 *
 * `GameController` sözleşmesini bellekte uygulayan ve arayüzün gerçek motoru beklemeden
 * geliştirilebilmesi için hazırlanan örnek denetleyicidir. Davranışı `docs/GAME_RULES.md`
 * kurallarına uyar; ancak gerçek motor değildir: kayıt, süre ölçümü ve gün değişimi yoktur.
 * Gerçek motor Q09/Q10'da saf fonksiyonlarla yazılır ve Q16'da bu adaptörün yerini alır.
 * Sözleşme aynı kaldığı için arayüz kodu değişmez.
 */

import {
  GAME_CONSTANTS,
  attemptKey,
  type Attempt,
  type Four,
  type GameController,
  type GameSnapshot,
  type Puzzle,
  type PuzzleGroup,
  type SubmitOutcome,
  type SubmitResult,
  type WordId,
} from "@/features/game/contracts";
import { createSeededRandom, shuffleWordIds } from "@/features/game/engine/random";

// Rastgelelik motorla ortaktır; aynı tohum motorda ve örnek adaptörde aynı sırayı verir.
export { createSeededRandom };

/** Varsayılan karıştırma tohumu. Sunucu ve istemcide aynı başlangıç sırasını verir. */
export const DEFAULT_SAMPLE_SEED = 20260920;

/** Örnek adaptörün seçenekleri. */
export type SampleControllerOptions = {
  /** Oynanacak bulmaca. */
  puzzle: Puzzle;
  /** Başlangıç durumu. Verilmezse boş oyun oluşturulur; `puzzleId` bulmacayla eşleşmelidir. */
  snapshot?: GameSnapshot;
  /** `[0, 1)` aralığında sayı üreten kaynak. Varsayılanı {@link DEFAULT_SAMPLE_SEED} tohumludur. */
  random?: () => number;
};

/** Sözleşmedeki `GameController` ile React ve testler için abonelik desteği. */
export type SampleGameController = GameController & {
  /** Denetleyicinin oynattığı bulmaca; kelime metni ve grup başlığı göstermek için. */
  readonly puzzle: Puzzle;
  /** Durum her değiştiğinde çağrılacak dinleyiciyi ekler; aboneliği bitiren fonksiyon döner. */
  subscribe: (listener: () => void) => () => void;
};

/** Seçim tam dört kimlikse dörtlü demet, değilse `null` döndürür. */
function asFour(ids: readonly WordId[]): Four<WordId> | null {
  const [a, b, c, d] = ids;
  if (
    ids.length !== GAME_CONSTANTS.groupSize ||
    a === undefined ||
    b === undefined ||
    c === undefined ||
    d === undefined
  ) {
    return null;
  }
  return [a, b, c, d];
}

/**
 * Bulmaca için boş başlangıç durumu üretir: 16 kart karıştırılmış sırada, 4 hak, seçim ve
 * geçmiş boş. `dayKey` bulmacanın yayın günüdür.
 */
export function createInitialSampleSnapshot(
  puzzle: Puzzle,
  random: () => number = createSeededRandom(DEFAULT_SAMPLE_SEED),
): GameSnapshot {
  const wordIds = puzzle.groups.flatMap((group) => group.words.map((word) => word.id));
  return {
    schemaVersion: 1,
    puzzleId: puzzle.id,
    puzzleRevision: puzzle.revision,
    dayKey: puzzle.date,
    status: "playing",
    selectedWordIds: [],
    remainingWordOrder: shuffleWordIds(wordIds, random),
    solvedGroupIds: [],
    mistakesRemaining: GAME_CONSTANTS.maxMistakes,
    attempts: [],
    activeSeconds: 0,
  };
}

/**
 * Örnek bulmacayla çalışan, `GameController` sözleşmesine uyan bellek içi adaptör oluşturur.
 *
 * Her değişiklik yeni bir `GameSnapshot` nesnesi üretir; önceki durum değiştirilmez.
 * Kurala aykırı çağrılar (terminal oyunda seçim, beşinci kart, çözülmüş kelime vb.) durumu
 * değiştirmez ve dinleyicileri tetiklemez.
 *
 * @throws Başlangıç durumu başka bir bulmacaya aitse.
 */
export function createSampleController(options: SampleControllerOptions): SampleGameController {
  const { puzzle } = options;
  const random = options.random ?? createSeededRandom(DEFAULT_SAMPLE_SEED);
  let snapshot = options.snapshot ?? createInitialSampleSnapshot(puzzle, random);

  if (snapshot.puzzleId !== puzzle.id) {
    throw new Error(
      `Başlangıç durumu "${snapshot.puzzleId}" bulmacasına ait; beklenen "${puzzle.id}".`,
    );
  }

  const groupByWordId = new Map<WordId, PuzzleGroup>(
    puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, group] as const)),
  );
  const listeners = new Set<() => void>();

  const commit = (next: GameSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const isPlaying = () => snapshot.status === "playing";

  const isUnsolved = (wordId: WordId) => {
    const group = groupByWordId.get(wordId);
    return group !== undefined && !snapshot.solvedGroupIds.includes(group.id);
  };

  const resultOf = (outcome: SubmitOutcome): SubmitResult => ({ outcome, snapshot });

  return {
    puzzle,

    get snapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    toggleWord(wordId) {
      if (!isPlaying() || !isUnsolved(wordId)) return;

      const { selectedWordIds } = snapshot;
      if (selectedWordIds.includes(wordId)) {
        commit({ ...snapshot, selectedWordIds: selectedWordIds.filter((id) => id !== wordId) });
      } else if (selectedWordIds.length < GAME_CONSTANTS.groupSize) {
        commit({ ...snapshot, selectedWordIds: [...selectedWordIds, wordId] });
      }
    },

    clearSelection() {
      if (!isPlaying() || snapshot.selectedWordIds.length === 0) return;
      commit({ ...snapshot, selectedWordIds: [] });
    },

    shuffle() {
      if (!isPlaying()) return;
      commit({ ...snapshot, remainingWordOrder: shuffleWordIds(snapshot.remainingWordOrder, random) });
    },

    submitSelection() {
      // Denetim sırası: docs/GAME_RULES.md §3.
      if (!isPlaying()) return resultOf({ verdict: "invalid", reason: "game-ended" });

      const wordIds = asFour(snapshot.selectedWordIds);
      if (!wordIds) return resultOf({ verdict: "invalid", reason: "selection-count" });

      if (new Set(wordIds).size !== wordIds.length || !wordIds.every(isUnsolved)) {
        return resultOf({ verdict: "invalid", reason: "invalid-words" });
      }

      const key = attemptKey(wordIds);
      if (snapshot.attempts.some((attempt) => attemptKey(attempt.wordIds) === key)) {
        return resultOf({ verdict: "repeated" });
      }

      // Seçimde en çok kelimesi bulunan grup ve kelime sayısı.
      const counts = new Map<PuzzleGroup, number>();
      for (const wordId of wordIds) {
        const group = groupByWordId.get(wordId);
        if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
      }
      let topGroup: PuzzleGroup | undefined;
      let topCount = 0;
      for (const [group, count] of counts) {
        if (count > topCount) {
          topGroup = group;
          topCount = count;
        }
      }

      const attempt = (verdict: Attempt["verdict"]): Attempt => ({
        id: `a${snapshot.attempts.length + 1}`,
        wordIds,
        verdict,
      });

      if (topGroup && topCount === GAME_CONSTANTS.groupSize) {
        const solvedGroupIds = [...snapshot.solvedGroupIds, topGroup.id];
        const solvedWordIds = new Set(topGroup.words.map((word) => word.id));
        commit({
          ...snapshot,
          status: solvedGroupIds.length === GAME_CONSTANTS.groupCount ? "won" : "playing",
          selectedWordIds: [],
          remainingWordOrder: snapshot.remainingWordOrder.filter((id) => !solvedWordIds.has(id)),
          solvedGroupIds,
          attempts: [...snapshot.attempts, attempt("correct")],
        });
        return resultOf({ verdict: "correct", solvedGroup: topGroup });
      }

      const verdict = topCount === GAME_CONSTANTS.groupSize - 1 ? "one-away" : "wrong";
      const mistakesRemaining = Math.max(snapshot.mistakesRemaining - 1, 0);
      const lost = mistakesRemaining === 0;
      commit({
        ...snapshot,
        status: lost ? "lost" : "playing",
        selectedWordIds: lost ? [] : snapshot.selectedWordIds,
        mistakesRemaining,
        attempts: [...snapshot.attempts, attempt(verdict)],
      });
      return resultOf({ verdict });
    },
  };
}
