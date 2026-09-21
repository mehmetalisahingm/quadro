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

import { MAX_ACTIVE_SECONDS } from "./activeTimer";
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

// ---------------------------------------------------------------------------
// Aktif oyun süresi (Q21)
// ---------------------------------------------------------------------------

/**
 * Kontrollü saat: zaman yalnız {@link Clock.advance} ile ilerler.
 *
 * Mağaza saati dışarıdan alır ve `setInterval`e gömülü değildir, bu yüzden
 * burada gerçek bir bekleme yoktur; saatler milisaniye sayılarıyla geçirilir.
 */
type Clock = { now: () => number; advance: (ms: number) => void };

function createClock(start = 1_000_000): Clock {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

/** Verilen süreyi taşıyan, bir grup çözülmüş kayıt. */
function savedGameWith(activeSeconds: number): GameSnapshot {
  return { ...playedGame(), activeSeconds };
}

/** Devralınmış, ekranı önde ve süresi işleyen oyun. */
function runningStore(clock: Clock, storage: MemorySnapshotStorage) {
  const store = createGameStore({ puzzle, storage, now: clock.now });
  store.hydrate();
  store.setScreenVisible(true);
  return store;
}

describe("oyun mağazası · aktif süre", () => {
  it("ekran önde ve oyun sürerken süre işler", () => {
    const clock = createClock();
    const store = runningStore(clock, createMemoryStorage());

    expect(store.getState().snapshot.activeSeconds).toBe(0);

    clock.advance(5_000);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(5);
  });

  it("devralmadan önce süre işlemez", () => {
    const clock = createClock();
    const store = createGameStore({ puzzle, storage: createMemoryStorage(), now: clock.now });

    // Kayıt henüz okunmadı: sayılan her saniye taze sıfırın üstüne biner ve
    // okunmamış kaydı ezerdi.
    store.setScreenVisible(true);
    clock.advance(30_000);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(0);
  });

  it("ekran önde değilken süre işlemez", () => {
    const clock = createClock();
    const store = createGameStore({ puzzle, storage: createMemoryStorage(), now: clock.now });
    store.hydrate();

    // Ekranın önde olduğu hiç bildirilmedi: arka plandaki sekme, ana sayfa.
    clock.advance(45_000);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(0);
  });

  it("gizli geçen süre eklenmez ve geri dönüşte iki kez sayılmaz", () => {
    const clock = createClock();
    const store = runningStore(clock, createMemoryStorage());

    clock.advance(10_000);
    store.setScreenVisible(false);
    expect(store.getState().snapshot.activeSeconds).toBe(10);

    // Sekme bir saat arka planda.
    clock.advance(3_600_000);
    store.tick();
    expect(store.getState().snapshot.activeSeconds).toBe(10);

    // Geri dönüş: yalnız bundan sonrası sayılır, gizli geçen saat eklenmez.
    store.setScreenVisible(true);
    clock.advance(4_000);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(14);
  });

  it("aynı görünürlük tekrar bildirilirse süre bozulmaz", () => {
    const clock = createClock();
    const store = runningStore(clock, createMemoryStorage());

    // Yeniden odaklanmada `focus` ve `visibilitychange` birlikte gelebilir.
    clock.advance(6_000);
    store.setScreenVisible(true);
    store.setScreenVisible(true);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(6);
  });

  it("yenilemede kayıtlı süreden devam eder, sıfırlanmaz", () => {
    const storage = createMemoryStorage();
    saveSnapshot(savedGameWith(120), { storage });

    // Yenileme: yeni mağaza, yeni saat, aynı depo.
    const clock = createClock(9_000_000);
    const store = runningStore(clock, storage);

    expect(store.getState().snapshot.activeSeconds).toBe(120);

    clock.advance(7_000);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(127);
  });

  it("oyun bitince süre donar", () => {
    const clock = createClock();
    const store = runningStore(clock, createMemoryStorage());

    // Dört grubu da çözerek kazan; son gönderim oyunu bitirir.
    clock.advance(8_000);
    for (const index of [0, 1, 2] as const) {
      for (const wordId of wordIdsOf(index)) store.toggleWord(wordId);
      store.submitSelection();
    }
    for (const wordId of wordIdsOf(3)) store.toggleWord(wordId);
    const result = store.submitSelection();

    expect(result.snapshot.status).toBe("won");
    expect(result.snapshot.activeSeconds).toBe(8);

    // Sonuç ekranı açıkken saat işlemeye devam etse de süre sabittir.
    clock.advance(600_000);
    store.tick();
    store.setScreenVisible(false);
    store.setScreenVisible(true);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(8);
  });

  it("gönderim sonucu ile mağazanın durumu aynı süreyi taşır", () => {
    const clock = createClock();
    const store = runningStore(clock, createMemoryStorage());

    clock.advance(3_000);
    for (const wordId of wordIdsOf(0)) store.toggleWord(wordId);
    const result = store.submitSelection();

    // Sonuç ekranı ve paylaşım tek kaynağı okur: ayrı bir hesap yoktur.
    expect(result.snapshot.activeSeconds).toBe(store.getState().snapshot.activeSeconds);
    expect(result.snapshot.activeSeconds).toBe(3);
  });

  it("süre kayda yazılır ve kayıttan aynı değerle geri okunur", () => {
    const clock = createClock();
    const storage = createMemoryStorage();
    const store = runningStore(clock, storage);

    clock.advance(12_000);
    store.tick();

    expect(storedSnapshot(storage)?.activeSeconds).toBe(12);
    expect(storedSnapshot(storage)).toEqual(store.getState().snapshot);
  });

  it("makul olmayan kayıtlı süre kırpılarak devralınır", () => {
    const storage = createMemoryStorage();
    // Elle kurcalanmış ya da bozuk saatin ürettiği uçuk değer.
    saveSnapshot(savedGameWith(999_999_999), { storage });

    const clock = createClock();
    const store = runningStore(clock, storage);

    clock.advance(1_000);
    store.tick();

    expect(store.getState().snapshot.activeSeconds).toBe(MAX_ACTIVE_SECONDS);
  });
});
