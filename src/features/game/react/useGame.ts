/**
 * Gerçek oyun motoru için React kancası (Q16).
 *
 * Üretim akışındaki oyun ekranı bu kancayı kullanır. Kanca iş kuralı hesaplamaz; gerçek motor
 * denetleyicisine (`createGameController`) abone olur ve her değişiklikte güncel `snapshot` ile
 * yeniden çizim sağlar. Dönüşü örnek adaptörün kancasıyla (`useSampleGame`) aynı biçimdedir:
 * bileşenler yalnız `puzzle` ve `controller` kullanır.
 */

import { useMemo, useState, useSyncExternalStore } from "react";

import type { GameController, GameSnapshot, Puzzle } from "@/features/game/contracts";
import { createSeededRandom } from "@/features/game/engine";

import { createGameController, type EngineGameController } from "./gameController";

/** `useGame` seçenekleri. Yalnız oyun açılırken (ilk çizimde veya bulmaca değişince) okunur. */
export type UseGameOptions = {
  /** Kayıttan geri yüklenen durum; verilmezse boş oyun başlar. */
  initialSnapshot?: GameSnapshot;
  /** Başlangıç sırası ve karıştırma tohumu; varsayılanı bulmacadan türetilir (`puzzleSeed`). */
  seed?: number;
};

/** `useGame` dönüşü. */
export type Game = {
  /** Oynanan bulmaca; kelime metni, grup başlığı ve açıklaması için. */
  puzzle: Puzzle;
  /** Sözleşmeye uyan denetleyici; `controller.snapshot` her çizimde günceldir. */
  controller: GameController;
};

type OpenGame = { key: string; source: EngineGameController };

/** Bulmacanın oyun kimliği. Sunucudan aynı içerik yeni nesneyle gelse de oyun sıfırlanmaz. */
function gameKey(puzzle: Puzzle): string {
  return `${puzzle.id}#${puzzle.revision}`;
}

function openGame(puzzle: Puzzle, { initialSnapshot, seed }: UseGameOptions): OpenGame {
  return {
    key: gameKey(puzzle),
    source: createGameController({
      puzzle,
      snapshot: initialSnapshot,
      random: seed === undefined ? undefined : createSeededRandom(seed),
    }),
  };
}

/**
 * Bulmacayı gerçek motorla açar ve sözleşmeye uyan denetleyici döndürür.
 *
 * Başlangıç kart sırası tohumlu olduğundan sunucu ve istemci aynı tahtayı çizer. Bulmacanın
 * kimliği veya revizyonu değişirse yeni oyun açılır.
 *
 * @throws `initialSnapshot` başka bir bulmacaya aitse.
 */
export function useGame(puzzle: Puzzle, options: UseGameOptions = {}): Game {
  const [state, setState] = useState(() => openGame(puzzle, options));

  let current = state;
  if (state.key !== gameKey(puzzle)) {
    // Önceki çizimden gelen bilgiyle durumu güncelleme kalıbı.
    current = openGame(puzzle, options);
    setState(current);
  }

  const { source } = current;
  const snapshot = useSyncExternalStore(
    source.subscribe,
    () => source.snapshot,
    () => source.snapshot,
  );

  const controller = useMemo<GameController>(
    () => ({
      snapshot,
      toggleWord: source.toggleWord,
      clearSelection: source.clearSelection,
      shuffle: source.shuffle,
      submitSelection: source.submitSelection,
    }),
    [snapshot, source],
  );

  return { puzzle: source.puzzle, controller };
}
