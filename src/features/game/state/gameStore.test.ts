/**
 * Oyun mağazasının testleri (Q20).
 *
 * Mağaza React'siz çalışır, bu yüzden devralma sırası (önce taze tahta, sonra
 * kayıt) ve kaydetme davranışı burada doğrudan denenir. Aynı akışın gerçek
 * sayfadaki karşılığı `tests/e2e/kayit-devam.test.tsx` içindedir.
 */

import { describe, expect, it } from "vitest";

import type { GameSnapshot, WordId } from "@/features/game/contracts";
import { createInitialSnapshot, createSeededRandom, submitSelection } from "@/features/game/engine";
import { selectOnly } from "@/features/game/engine/testHelpers";
import { standardPuzzle } from "@/features/game/fixtures";
import {
  createMemoryStorage,
  loadSnapshot,
  saveSnapshot,
  snapshotStorageKey,
  type MemorySnapshotStorage,
} from "@/lib/persistence";

import { createGameStore } from "./gameStore";

const puzzle = standardPuzzle;

/** Grubun kelime kimlikleri. */
const wordIdsOf = (index: 0 | 1 | 2 | 3): WordId[] =>
  puzzle.groups[index].words.map((word) => word.id);

/** Bir grubu çözmüş oyun. */
function playedGame(): GameSnapshot {
  const fresh = createInitialSnapshot(puzzle, { random: createSeededRandom(5) });
  return submitSelection(puzzle, selectOnly(puzzle, fresh, wordIdsOf(0))).snapshot;
}

/** Dört grubu da çözmüş oyun. */
function wonGame(): GameSnapshot {
  return ([0, 1, 2, 3] as const).reduce<GameSnapshot>(
    (state, index) => submitSelection(puzzle, selectOnly(puzzle, state, wordIdsOf(index))).snapshot,
    createInitialSnapshot(puzzle, { random: createSeededRandom(5) }),
  );
}

/** Depodaki durum; kayıt yoksa `null`. */
function storedSnapshot(storage: MemorySnapshotStorage): GameSnapshot | null {
  const result = loadSnapshot({ puzzle, storage });
  return result.status === "restored" ? result.snapshot : null;
}

describe("oyun mağazası · devralma", () => {
  it("devralmadan önce taze tahta durur ve depoya dokunulmaz", () => {
    const storage = createMemoryStorage();
    const store = createGameStore({ puzzle, storage });

    expect(store.getState().restore).toEqual({ status: "pending" });
    expect(store.getState().snapshot.remainingWordOrder).toHaveLength(16);
    expect(storage.keys()).toEqual([]);
  });

  it("kayıt yoksa taze oyun devralınır ve hemen kaydedilir", () => {
    const storage = createMemoryStorage();
    const store = createGameStore({ puzzle, storage });

    store.hydrate();

    expect(store.getState().restore).toEqual({ status: "fresh" });
    expect(storage.keys()).toContain(snapshotStorageKey(puzzle.date));
    expect(storedSnapshot(storage)).toEqual(store.getState().snapshot);
  });

  it("kayıt varsa oyun kaydedilen durumdan sürer", () => {
    const storage = createMemoryStorage();
    const oynanan = playedGame();
    saveSnapshot(oynanan, { storage });

    const store = createGameStore({ puzzle, storage });
    store.hydrate();

    expect(store.getState().restore).toEqual({ status: "restored" });
    expect(store.getState().snapshot).toEqual(oynanan);
  });

  it("uygulanamayan kayıt gerekçesiyle düşer ve tahta taze kalır", () => {
    const storage = createMemoryStorage({ [snapshotStorageKey(puzzle.date)]: "{bozuk" });
    const store = createGameStore({ puzzle, storage });

    store.hydrate();

    expect(store.getState().restore).toEqual({
      status: "discarded",
      reason: "malformed-json",
    });
    expect(store.getState().snapshot.remainingWordOrder).toHaveLength(16);
  });

  it("devralma yalnız bir kez çalışır", () => {
    const storage = createMemoryStorage();
    const store = createGameStore({ puzzle, storage });
    store.hydrate();

    const [ilkKelime] = store.getState().snapshot.remainingWordOrder;
    if (ilkKelime !== undefined) store.toggleWord(ilkKelime);
    store.hydrate();

    // İkinci çağrı tahtayı kayda geri döndürmez; seçim yerinde kalır.
    expect(store.getState().snapshot.selectedWordIds).toEqual(ilkKelime ? [ilkKelime] : []);
  });
});

describe("oyun mağazası · kaydetme ve abonelik", () => {
  it("devralmadan sonra her durum değişimi kaydedilir", () => {
    const storage = createMemoryStorage();
    const store = createGameStore({ puzzle, storage });
    store.hydrate();

    for (const wordId of wordIdsOf(0)) store.toggleWord(wordId);
    expect(storedSnapshot(storage)?.selectedWordIds).toEqual(wordIdsOf(0));

    store.submitSelection();
    expect(storedSnapshot(storage)?.solvedGroupIds).toEqual([puzzle.groups[0].id]);
  });

  it("aboneler değişimde uyarılır ve durum nesnesi yalnız değişince yenilenir", () => {
    const store = createGameStore({ puzzle, storage: createMemoryStorage() });
    store.hydrate();

    let uyari = 0;
    const birak = store.subscribe(() => {
      uyari += 1;
    });

    const onceki = store.getState();
    expect(store.getState()).toBe(onceki);

    const [ilkKelime = ""] = store.getState().snapshot.remainingWordOrder;
    store.toggleWord(ilkKelime);
    expect(uyari).toBe(1);
    expect(store.getState()).not.toBe(onceki);

    // Kurala aykırı çağrı durumu değiştirmez: yeni bildirim de olmaz.
    store.toggleWord("bulmacada-olmayan-kelime");
    expect(uyari).toBe(1);

    birak();
    store.clearSelection();
    expect(uyari).toBe(1);
  });
});

describe("oyun mağazası · bitmiş oyun", () => {
  it("kazanılmış kayıt terminal olarak devralınır ve yeniden başlamaz", () => {
    const storage = createMemoryStorage();
    const kazanilan = wonGame();
    saveSnapshot(kazanilan, { storage });

    const store = createGameStore({ puzzle, storage });
    store.hydrate();

    expect(store.getState().snapshot.status).toBe("won");
    expect(storedSnapshot(storage)).toEqual(kazanilan);
  });

  it("bitmiş oyunda ikinci bir bitiş işlenmez", () => {
    const storage = createMemoryStorage();
    saveSnapshot(wonGame(), { storage });

    const store = createGameStore({ puzzle, storage });
    store.hydrate();
    const bitmis = store.getState().snapshot;

    for (const wordId of wordIdsOf(1)) store.toggleWord(wordId);
    const result = store.submitSelection();

    expect(result.outcome).toEqual({ verdict: "invalid", reason: "game-ended" });
    expect(store.getState().snapshot).toBe(bitmis);
    expect(storedSnapshot(storage)?.status).toBe("won");
  });
});
