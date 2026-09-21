import type {
  GameController,
  GameSnapshot,
  Puzzle,
  SubmitResult,
  WordId,
} from "@/features/game/contracts";
import {
  clearSelection,
  createInitialSnapshot,
  createSeededRandom,
  shuffleBoard,
  submitSelection,
  toggleWord,
  type RandomSource,
} from "@/features/game/engine";

/** Gerçek motorun deterministik başlangıç/karıştırma tohumu. */
export const DEFAULT_ENGINE_SEED = 20260920;

export type EngineControllerOptions = {
  puzzle: Puzzle;
  snapshot?: GameSnapshot;
  random?: RandomSource;
};

/**
 * Q09/Q10 saf motorunu UI'nın kullandığı `GameController` sözleşmesine bağlayan adaptör.
 * İş kuralları burada yeniden uygulanmaz; bütün durum geçişleri engine fonksiyonlarından gelir.
 */
export type EngineGameController = GameController & {
  readonly puzzle: Puzzle;
  subscribe: (listener: () => void) => () => void;
  /**
   * Kaydedilmiş bir durumu tahtaya uygular (Q20) ve uygulanıp uygulanmadığını döndürür.
   *
   * Durum olduğu gibi kabul edilir; motor kuralları yeniden çalıştırılmaz. Kaydın
   * bugünkü bulmacaya uygunluğu kalıcılık katmanında denetlenir, bu yüzden buradaki
   * tek denetim bulmaca kimliği ve revizyonudur: başka bir bulmacanın durumu sessizce
   * reddedilir, tahta taze kalır.
   */
  restore: (snapshot: GameSnapshot) => boolean;
  /**
   * Aktif süreyi (saniye) tahtaya yazar (Q21).
   *
   * Süre bir oyun kuralı değildir: motor onu üretmez, yalnız durumun parçası
   * olarak taşır. Ne zaman işlediğine durum katmanı karar verir
   * (`src/features/game/state/`), buradaki iş yalnız değeri tek doğruluk
   * kaynağına — motorun snapshot'ına — koymaktır. Böylece arayüz, kayıt ve
   * paylaşım ayrı bir sayaca değil aynı `snapshot.activeSeconds`a bakar.
   *
   * Değer normalize edilir (sonlu, negatif olmayan tam sayı) ve değişmediyse
   * durum nesnesi korunur; gereksiz bildirim ve render olmaz.
   */
  setActiveSeconds: (seconds: number) => void;
};

export function createEngineController({
  puzzle,
  snapshot: initialSnapshot,
  random: providedRandom,
}: EngineControllerOptions): EngineGameController {
  const random = providedRandom ?? createSeededRandom(DEFAULT_ENGINE_SEED);
  let snapshot = initialSnapshot ?? createInitialSnapshot(puzzle, { random });

  if (snapshot.puzzleId !== puzzle.id || snapshot.puzzleRevision !== puzzle.revision) {
    throw new Error(
      `Başlangıç durumu ${snapshot.puzzleId}@${snapshot.puzzleRevision} için; beklenen ${puzzle.id}@${puzzle.revision}.`,
    );
  }

  const listeners = new Set<() => void>();

  const commit = (next: GameSnapshot) => {
    if (next === snapshot) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  return {
    puzzle,

    get snapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    restore(next: GameSnapshot): boolean {
      if (next.puzzleId !== puzzle.id || next.puzzleRevision !== puzzle.revision) return false;
      commit(next);
      return true;
    },

    setActiveSeconds(seconds: number) {
      const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
      if (snapshot.activeSeconds === safe) return;
      commit({ ...snapshot, activeSeconds: safe });
    },

    toggleWord(wordId: WordId) {
      commit(toggleWord(puzzle, snapshot, wordId));
    },

    clearSelection() {
      commit(clearSelection(snapshot));
    },

    shuffle() {
      commit(shuffleBoard(snapshot, random));
    },

    submitSelection(): SubmitResult {
      const result = submitSelection(puzzle, snapshot);
      commit(result.snapshot);
      return result;
    },
  };
}
