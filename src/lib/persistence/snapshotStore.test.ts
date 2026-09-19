/**
 * Kayıt kapısının testleri (Q20).
 *
 * Kabul ölçütlerinin çoğu burada kanıtlanır: aynı durumdan ve aynı kart
 * sırasından devam, bozuk/uyumsuz kaydın çökertmemesi, eski kaydın bugünkü
 * bulmacaya uygulanmaması ve bitmiş oyunun sonucunun korunması.
 *
 * Durumlar elle kurulmaz; gerçek motorla oynanır. Böylece testler motorun
 * ürettiği durumlarla çalışır ve bir kural değişirse burada da görünür.
 */

import { describe, expect, it } from "vitest";

import type { GameSnapshot, Puzzle, WordId } from "@/features/game/contracts";
import {
  createInitialSnapshot,
  createSeededRandom,
  shuffleBoard,
  submitSelection,
} from "@/features/game/engine";
import { selectOnly } from "@/features/game/engine/testHelpers";
import { standardPuzzle } from "@/features/game/fixtures";

import {
  LAST_DAY_KEY,
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
  snapshotStorageKey,
} from "./snapshotStore";
import { createMemoryStorage, type SnapshotStorage } from "./storage";

const puzzle = standardPuzzle;
const DAY = puzzle.date;

/** Grubun kelime kimlikleri. */
const wordIdsOf = (index: 0 | 1 | 2 | 3): WordId[] =>
  puzzle.groups[index].words.map((word) => word.id);

/** Sabit tohumlu taze oyun. */
const freshGame = (): GameSnapshot =>
  createInitialSnapshot(puzzle, { random: createSeededRandom(7) });

/** Seçip gönderir; sonucun durumunu döndürür. */
function play(snapshot: GameSnapshot, wordIds: readonly WordId[]): GameSnapshot {
  return submitSelection(puzzle, selectOnly(puzzle, snapshot, wordIds)).snapshot;
}

/** Bir grubu çözmüş, bir hata yapmış ve iki kart seçili bırakmış oyun. */
function playedGame(): GameSnapshot {
  const solved = play(freshGame(), wordIdsOf(0));
  const mistaken = play(solved, [...wordIdsOf(1).slice(0, 2), ...wordIdsOf(2).slice(0, 2)]);
  return selectOnly(puzzle, mistaken, wordIdsOf(1).slice(0, 2));
}

/** Dört grubu da çözmüş oyun. */
function wonGame(): GameSnapshot {
  return ([0, 1, 2, 3] as const).reduce((state, index) => play(state, wordIdsOf(index)), freshGame());
}

/** Dört hatayla kaybedilmiş oyun. */
function lostGame(): GameSnapshot {
  const wrongGuesses = [
    [wordIdsOf(0)[0], wordIdsOf(1)[0], wordIdsOf(2)[0], wordIdsOf(3)[0]],
    [wordIdsOf(0)[1], wordIdsOf(1)[1], wordIdsOf(2)[1], wordIdsOf(3)[1]],
    [wordIdsOf(0)[2], wordIdsOf(1)[2], wordIdsOf(2)[2], wordIdsOf(3)[2]],
    [wordIdsOf(0)[3], wordIdsOf(1)[3], wordIdsOf(2)[3], wordIdsOf(3)[3]],
  ] as const;

  return wrongGuesses.reduce<GameSnapshot>(
    (state, guess) => play(state, guess.filter((id): id is WordId => id !== undefined)),
    freshGame(),
  );
}

/** Durumu doğrudan depoya yazar; kayıt kurallarını atlar. */
function writeRaw(storage: SnapshotStorage, snapshot: unknown, dayKey: string = DAY): void {
  storage.setItem(snapshotStorageKey(dayKey), JSON.stringify({ savedAt: "", snapshot }));
}

/** Depoda kayıt duruyor mu? */
const hasRecord = (storage: SnapshotStorage, dayKey: string = DAY): boolean =>
  storage.getItem(snapshotStorageKey(dayKey)) !== null;

describe("kayıt · tam tur", () => {
  it("kaydedilen oyun aynı durum ve aynı kart sırasıyla geri gelir", () => {
    const storage = createMemoryStorage();
    const oynanan = playedGame();
    // Karıştırılmış tahta: kart sırası gerçekten kayıttan gelmeli, yeniden kurulmamalı.
    const karistirilmis = shuffleBoard(oynanan, createSeededRandom(42));
    expect(karistirilmis.remainingWordOrder).not.toEqual(oynanan.remainingWordOrder);

    expect(saveSnapshot(karistirilmis, { storage })).toEqual({ status: "saved" });

    const result = loadSnapshot({ puzzle, storage });
    expect(result).toEqual({ status: "restored", snapshot: karistirilmis });
  });

  it("kayıt yoksa boş sonuç döner", () => {
    expect(loadSnapshot({ puzzle, storage: createMemoryStorage() })).toEqual({ status: "empty" });
  });

  it("kayıt güne özgü anahtarda tutulur; başka günün anahtarı bugüne okunmaz", () => {
    const storage = createMemoryStorage();
    saveSnapshot({ ...playedGame(), dayKey: "2026-09-21" }, { storage });

    expect(storage.keys()).toContain(snapshotStorageKey("2026-09-21"));
    expect(loadSnapshot({ puzzle, dayKey: DAY, storage })).toEqual({ status: "empty" });
  });

  it("silinen kayıt geri yüklenmez", () => {
    const storage = createMemoryStorage();
    saveSnapshot(playedGame(), { storage });

    clearSnapshot(DAY, storage);

    expect(loadSnapshot({ puzzle, storage })).toEqual({ status: "empty" });
  });
});

describe("kayıt · bozuk ve uyumsuz kayıtlar", () => {
  /** Reddedilen kaydın gerekçesini alır ve kaydın silindiğini doğrular. */
  function reddet(storage: SnapshotStorage): string {
    const result = loadSnapshot({ puzzle, storage });
    expect(result.status).toBe("rejected");
    expect(hasRecord(storage)).toBe(false);
    return result.status === "rejected" ? result.reason : "";
  }

  it("bozuk JSON çökertmez; kayıt reddedilir ve silinir", () => {
    const storage = createMemoryStorage({ [snapshotStorageKey(DAY)]: "{yarım" });

    expect(reddet(storage)).toBe("malformed-json");
  });

  it("JSON geçerli ama kayıt beklenen yapıda değilse reddedilir", () => {
    const storage = createMemoryStorage({ [snapshotStorageKey(DAY)]: '"sadece metin"' });

    expect(reddet(storage)).toBe("malformed-record");
  });

  it("alan tipi yanlışsa reddedilir", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), mistakesRemaining: "üç" });

    expect(reddet(storage)).toBe("malformed-record");
  });

  it("şema sürümü uyuşmuyorsa kayıt yok sayılır", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), schemaVersion: 2 });

    expect(reddet(storage)).toBe("schema-mismatch");
  });

  it("başka bulmacanın kaydı bugünkü bulmacaya uygulanmaz", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), puzzleId: "ornek-999" });

    expect(reddet(storage)).toBe("puzzle-mismatch");
  });

  it("bulmaca düzeltilmişse (revizyon farkı) eski kayıt uygulanmaz", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), puzzleRevision: puzzle.revision + 1 });

    expect(reddet(storage)).toBe("puzzle-mismatch");
  });

  it("dünün oyunu bugüne taşınmaz", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), dayKey: "2026-09-19" });

    expect(reddet(storage)).toBe("day-mismatch");
  });

  it("çözülmüş grup bulmacada yoksa reddedilir", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), solvedGroupIds: ["bilinmeyen-grup"] });

    expect(reddet(storage)).toBe("group-mismatch");
  });

  it("tahtadaki kelimeler bulmacanın kelimeleri değilse reddedilir", () => {
    const storage = createMemoryStorage();
    const oyun = playedGame();
    writeRaw(storage, {
      ...oyun,
      selectedWordIds: [],
      remainingWordOrder: oyun.remainingWordOrder.map((wordId, index) =>
        index === 0 ? "baska-bulmacadan-kelime" : wordId,
      ),
    });

    expect(reddet(storage)).toBe("word-set-mismatch");
  });

  it("eksik kart bırakan kayıt reddedilir", () => {
    const storage = createMemoryStorage();
    const oyun = playedGame();
    writeRaw(storage, {
      ...oyun,
      selectedWordIds: [],
      remainingWordOrder: oyun.remainingWordOrder.slice(1),
    });

    expect(reddet(storage)).toBe("word-set-mismatch");
  });

  it("kendi içinde tutarsız kayıt (hak geri doldurulmuş) reddedilir", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), mistakesRemaining: 4 });

    expect(reddet(storage)).toBe("state-mismatch");
  });

  it("kazanılmış gibi işaretlenmiş ama grupları çözülmemiş kayıt reddedilir", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...playedGame(), selectedWordIds: [], status: "won" });

    expect(reddet(storage)).toBe("state-mismatch");
  });

  it("depo okumada hata fırlatırsa oyun taze başlar", () => {
    const storage: SnapshotStorage = {
      getItem: () => {
        throw new Error("depo kapandı");
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    };

    expect(loadSnapshot({ puzzle, storage })).toEqual({ status: "empty" });
  });

  it("depo yazmada hata fırlatırsa oyun sürer", () => {
    const storage: SnapshotStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("kota dolu");
      },
      removeItem: () => undefined,
    };

    expect(saveSnapshot(playedGame(), { storage })).toEqual({ status: "failed" });
  });
});

describe("kayıt · bitmiş oyunun korunması", () => {
  it("kazanılmış oyun terminal olarak geri yüklenir", () => {
    const storage = createMemoryStorage();
    const kazanilan = wonGame();
    saveSnapshot(kazanilan, { storage });

    const result = loadSnapshot({ puzzle, storage });

    expect(result).toEqual({ status: "restored", snapshot: kazanilan });
    expect(result.status === "restored" && result.snapshot.status).toBe("won");
  });

  it("kaybedilmiş oyunun sonucu ve istatistiği korunur", () => {
    const storage = createMemoryStorage();
    const kaybedilen = lostGame();
    saveSnapshot(kaybedilen, { storage });

    const result = loadSnapshot({ puzzle, storage });

    expect(result.status).toBe("restored");
    if (result.status !== "restored") return;
    expect(result.snapshot.status).toBe("lost");
    expect(result.snapshot.mistakesRemaining).toBe(0);
    expect(result.snapshot.attempts).toHaveLength(4);
  });

  it("bitmiş oyun taze bir oyunla ezilmez", () => {
    const storage = createMemoryStorage();
    const kazanilan = wonGame();
    saveSnapshot(kazanilan, { storage });

    // İkinci bir "bitiş" işlenmesine yol açacak taze durum yazılmak istenirse yazılmaz.
    expect(saveSnapshot(freshGame(), { storage })).toEqual({ status: "kept-result" });
    expect(loadSnapshot({ puzzle, storage })).toEqual({ status: "restored", snapshot: kazanilan });
  });

  it("bitmiş oyun kendi durumunu yeniden yazabilir", () => {
    const storage = createMemoryStorage();
    const kaybedilen = lostGame();
    saveSnapshot(kaybedilen, { storage });

    expect(saveSnapshot(kaybedilen, { storage })).toEqual({ status: "saved" });
  });

  it("başka bir bulmacanın bitmiş kaydı bugünkü oyunu engellemez", () => {
    const storage = createMemoryStorage();
    writeRaw(storage, { ...wonGame(), puzzleId: "ornek-999" });

    expect(saveSnapshot(freshGame(), { storage })).toEqual({ status: "saved" });
  });
});

describe("kayıt · gün dönümü", () => {
  it("yeni gün kaydedilince dünün kaydı silinir", () => {
    const storage = createMemoryStorage();
    saveSnapshot(playedGame(), { storage });
    expect(storage.getItem(LAST_DAY_KEY)).toBe(DAY);

    const yarin: GameSnapshot = { ...freshGame(), dayKey: "2026-09-21" };
    saveSnapshot(yarin, { storage });

    expect(hasRecord(storage, DAY)).toBe(false);
    expect(hasRecord(storage, "2026-09-21")).toBe(true);
    expect(storage.getItem(LAST_DAY_KEY)).toBe("2026-09-21");
  });

  it("aynı gün içindeki yazmalar depoda tek kayıt bırakır", () => {
    const storage = createMemoryStorage();
    const oyun = playedGame();

    saveSnapshot(oyun, { storage });
    saveSnapshot(shuffleBoard(oyun, createSeededRandom(3)), { storage });

    expect(storage.keys()).toEqual([snapshotStorageKey(DAY), LAST_DAY_KEY]);
  });

  it("kaydın yazılma anı kayıtta tutulur", () => {
    const storage = createMemoryStorage();
    saveSnapshot(playedGame(), { storage, now: new Date("2026-09-20T09:30:00.000Z") });

    const raw = storage.getItem(snapshotStorageKey(DAY)) ?? "";
    expect(JSON.parse(raw)).toMatchObject({ savedAt: "2026-09-20T09:30:00.000Z" });
  });
});

describe("kayıt · bulmaca sözleşmesi", () => {
  it("gün anahtarı verilmezse bulmacanın kendi günü kullanılır", () => {
    const storage = createMemoryStorage();
    saveSnapshot(playedGame(), { storage });

    const bulmaca: Puzzle = { ...puzzle };
    expect(loadSnapshot({ puzzle: bulmaca, storage }).status).toBe("restored");
    expect(loadSnapshot({ puzzle: bulmaca, dayKey: "2026-09-21", storage }).status).toBe("empty");
  });
});
