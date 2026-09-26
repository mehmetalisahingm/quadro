/**
 * Kaydedilmiş oyunu React'e bağlayan kanca (Q20).
 *
 * Kancanın kendi durumu yoktur: tahtanın durumu mağazadadır (`gameStore.ts`) ve
 * buradan `useSyncExternalStore` ile okunur. Tek etki, mağazaya "artık
 * istemcidesin, kaydı devralabilirsin" demektir.
 *
 * Hidrasyon uyuşmazlığı böyle önlenir:
 *
 * - Sunucu `localStorage`ı göremez. Kaydı render sırasında okuyan bir kanca
 *   sunucuda "kayıt yok", istemcide "kayıt var" der; React iki ağacı
 *   karşılaştırır ve uyuşmazlık (hydration mismatch) verir.
 * - Mağaza kurulurken yalnız motorun tohumlu taze tahtasını üretir
 *   (`DEFAULT_ENGINE_SEED`), yani sunucunun ve istemcinin ilk ağacı birebir
 *   aynıdır. Kayıt bir etki içinde devralınır: React ilk ağacı eşleştirdikten
 *   sonra gelen durum değişimi sıradan bir güncellemedir, uyuşmazlık değil.
 */

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import {
  GAME_CONSTANTS,
  type GameController,
  type Puzzle,
} from "@/features/game/contracts";
import { trackBrowserEvent, trackBrowserEventOnce } from "@/lib/analytics";
import type { SnapshotStorage } from "@/lib/persistence";

import { createGameStore } from "./gameStore";
import type { GameRestoreState } from "./persistentGame";
import { useActiveTimer } from "./useActiveTimer";

/** Kancanın döndürdüğü canlı oyun. */
export type PersistentGame = {
  /** Oynanan bulmaca. */
  puzzle: Puzzle;
  /** UI'nın kullandığı denetleyici. */
  controller: GameController;
  /** Kaydın devralınıp devralınmadığı; ilk render'da `pending`. */
  restore: GameRestoreState;
};

/** {@link usePersistentGame} seçenekleri; ikisi de yalnız testler içindir. */
export type UsePersistentGameOptions = {
  /** Yayın günü; varsayılanı bulmacanın kendi günüdür. */
  dayKey?: string;
  /** Kayıt arka ucu; varsayılanı tarayıcı deposudur. */
  storage?: SnapshotStorage;
};

/**
 * Bugünün bulmacasını, varsa kaydedilmiş ilerlemesiyle açar.
 *
 * Gün anahtarı bulmacanın kendi tarihinden gelir: hangi günün oynandığına
 * sunucu karar verir (Q19), istemcinin saati bu karara karışmaz. Bulmaca
 * değişirse yeni bir mağaza kurulur ve kayıt yeniden devralınır.
 */
export function usePersistentGame(
  puzzle: Puzzle,
  options: UsePersistentGameOptions = {},
): PersistentGame {
  const { dayKey, storage } = options;

  const store = useMemo(
    () => createGameStore({ puzzle, dayKey, storage }),
    [puzzle, dayKey, storage],
  );

  // Sunucu ve hidrasyon aynı durumu okur: devralma yalnız etki içinde olur.
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const trackedGameStart = useRef<string | null>(null);

  useEffect(() => {
    store.hydrate();
  }, [store]);

  useEffect(() => {
    const identity = `${puzzle.id}:${puzzle.revision}`;
    if (
      trackedGameStart.current === identity ||
      state.restore.status === "pending" ||
      state.snapshot.status !== "playing"
    ) {
      return;
    }

    trackedGameStart.current = identity;
    trackBrowserEvent("game_start", {
      puzzleId: puzzle.id,
      revision: puzzle.revision,
      dayKey: state.snapshot.dayKey,
      resumed: state.snapshot.attempts.length > 0,
    });
  }, [
    puzzle.id,
    puzzle.revision,
    state.restore.status,
    state.snapshot.attempts.length,
    state.snapshot.dayKey,
    state.snapshot.status,
  ]);

  // Aktif süre (Q21): sayaç yalnız bu kanca kurulduğu sürece, yani oyun ekranı
  // DOM'dayken ve sekme görünürken işler. Ana sayfa ve öğretici bu kancayı hiç
  // kurmadığı için süre orada kendiliğinden durur.
  useActiveTimer(store, state.snapshot.status);

  const controller = useMemo<GameController>(
    () => ({
      snapshot: state.snapshot,
      toggleWord: store.toggleWord,
      clearSelection: store.clearSelection,
      shuffle: store.shuffle,
      submitSelection: () => {
        const before = store.getState().snapshot;
        const result = store.submitSelection();
        const verdict = result.outcome.verdict;
        const accepted = verdict === "correct" || verdict === "one-away" || verdict === "wrong";

        if (before.attempts.length === 0 && accepted) {
          trackBrowserEvent("first_attempt", {
            puzzleId: result.snapshot.puzzleId,
            revision: result.snapshot.puzzleRevision,
            verdict,
            mistakesRemaining: result.snapshot.mistakesRemaining,
          });
        }

        if (result.snapshot.status !== "playing") {
          trackBrowserEventOnce(
            `finish:${result.snapshot.puzzleId}:${result.snapshot.puzzleRevision}`,
            "game_finish",
            {
              puzzleId: result.snapshot.puzzleId,
              revision: result.snapshot.puzzleRevision,
              dayKey: result.snapshot.dayKey,
              status: result.snapshot.status,
              attemptCount: result.snapshot.attempts.length,
              mistakesUsed: GAME_CONSTANTS.maxMistakes - result.snapshot.mistakesRemaining,
              activeSeconds: result.snapshot.activeSeconds,
            },
          );
        }

        return result;
      },
    }),
    [state.snapshot, store],
  );

  return { puzzle, controller, restore: state.restore };
}
