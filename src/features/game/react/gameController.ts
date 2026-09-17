/**
 * Gerçek oyun motorunun `GameController` adaptörü (Q16).
 *
 * Saf motor fonksiyonlarını (`engine/`) sözleşmedeki `GameController` biçiminde bellekte tutulan
 * tek bir duruma bağlar. İş kuralı burada yazılmaz; her eylem motorun ilgili fonksiyonuna
 * devredilir. React'e bağımlı değildir: `useGame` kancası bu denetleyiciye
 * `useSyncExternalStore` ile abone olur.
 *
 * Örnek adaptörün (`sampleController.ts`) yerini üretim akışında alır; örnek adaptör testler ve
 * tasarım önizlemeleri için kalır. İkisi aynı tohum ve aynı eylemlerle birebir aynı sonucu verir.
 */

import type { GameController, GameSnapshot, Puzzle } from "@/features/game/contracts";
import {
  clearSelection,
  createInitialSnapshot,
  createSeededRandom,
  shuffleBoard,
  submitSelection,
  toggleWord,
  type RandomSource,
} from "@/features/game/engine";

/** Gerçek motor denetleyicisinin seçenekleri. */
export type GameControllerOptions = {
  /** Oynanacak bulmaca. */
  puzzle: Puzzle;
  /**
   * Başlangıç durumu (ör. kayıttan geri yüklenen oyun). Verilmezse boş oyun başlar;
   * `puzzleId` bulmacayla eşleşmelidir.
   */
  snapshot?: GameSnapshot;
  /** Başlangıç sırası ve karıştırma için rastgelelik; varsayılanı {@link puzzleSeed} tohumludur. */
  random?: RandomSource;
};

/** Sözleşmedeki `GameController` ile React aboneliği için ekler. */
export type EngineGameController = GameController & {
  /** Denetleyicinin oynattığı bulmaca; kelime metni ve grup başlığı göstermek için. */
  readonly puzzle: Puzzle;
  /** Durum her değiştiğinde çağrılacak dinleyiciyi ekler; aboneliği bitiren fonksiyon döner. */
  subscribe: (listener: () => void) => () => void;
};

/**
 * Bulmacanın kimliği ve revizyonundan kararlı bir tohum üretir (FNV-1a, 32 bit).
 *
 * Aynı bulmaca her ortamda aynı başlangıç tahtasını verir: sunucu çizimi ile istemci hidrasyonu
 * uyuşur ve her oyuncu aynı kart sırasıyla başlar. Revizyon değişirse sıra da değişir.
 */
export function puzzleSeed(puzzle: Pick<Puzzle, "id" | "revision">): number {
  let hash = 0x811c9dc5;
  for (const char of `${puzzle.id}#${puzzle.revision}`) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Gerçek motorla çalışan, `GameController` sözleşmesine uyan bellek içi denetleyici oluşturur.
 *
 * - Eylemler motor fonksiyonlarına devredilir; motor değişiklik yoksa aynı snapshot nesnesini
 *   döndürdüğü için etkisiz çağrılar (beşinci kart, bitmiş oyunda seçim, tekrar veya geçersiz
 *   gönderim) dinleyicileri tetiklemez.
 * - `submitSelection` motorun `SubmitResult` değerini olduğu gibi döndürür; dönen `snapshot`,
 *   `controller.snapshot`'ın yeni değeridir. Son doğru grup animasyonu ile sonuç ekranı aynı
 *   yanıttan beslenir.
 *
 * @throws Başlangıç durumu başka bir bulmacaya aitse.
 */
export function createGameController(options: GameControllerOptions): EngineGameController {
  const { puzzle } = options;
  const random = options.random ?? createSeededRandom(puzzleSeed(puzzle));
  let snapshot = options.snapshot ?? createInitialSnapshot(puzzle, { random });

  if (snapshot.puzzleId !== puzzle.id) {
    throw new Error(
      `Başlangıç durumu "${snapshot.puzzleId}" bulmacasına ait; beklenen "${puzzle.id}".`,
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
      return () => {
        listeners.delete(listener);
      };
    },

    toggleWord(wordId) {
      commit(toggleWord(puzzle, snapshot, wordId));
    },

    clearSelection() {
      commit(clearSelection(snapshot));
    },

    shuffle() {
      commit(shuffleBoard(snapshot, random));
    },

    submitSelection() {
      const result = submitSelection(puzzle, snapshot);
      commit(result.snapshot);
      return result;
    },
  };
}
