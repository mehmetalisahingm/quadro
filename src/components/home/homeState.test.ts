import { describe, expect, it } from "vitest";

import type { GameSnapshot } from "@/features/game/contracts";
import {
  LAST_DAY_KEY,
  createMemoryStorage,
  saveSnapshot,
  snapshotStorageKey,
} from "@/lib/persistence";

import {
  formatCountdown,
  previousCalendarDay,
  resolveHomeState,
  type HomePuzzleIdentity,
} from "./homeState";

const today: HomePuzzleIdentity = {
  dayKey: "2026-09-21",
  puzzleId: "q-002",
  puzzleRevision: 1,
};

function snapshot(
  dayKey: string,
  status: "playing" | "won" | "lost" = "playing",
): GameSnapshot {
  return {
    schemaVersion: 1,
    puzzleId: dayKey === today.dayKey ? today.puzzleId ?? "q-002" : "q-001",
    puzzleRevision: 1,
    dayKey,
    status,
    selectedWordIds: [],
    remainingWordOrder: status === "won" ? [] : ["a", "b", "c", "d"],
    solvedGroupIds: status === "won" ? ["g1", "g2", "g3", "g4"] : ["g1"],
    mistakesRemaining: status === "lost" ? 0 : 3,
    attempts: [],
    activeSeconds: 20,
  };
}

describe("ana sayfa durumu", () => {
  it("kayıt yoksa yeni oyuncu durumudur", () => {
    expect(resolveHomeState(createMemoryStorage(), today)).toEqual({ state: "new" });
  });

  it("bugünün yarım oyununu doğru bulmacaya devam durumu olarak gösterir", () => {
    const storage = createMemoryStorage();
    saveSnapshot(snapshot(today.dayKey), { storage });

    expect(resolveHomeState(storage, today)).toMatchObject({
      state: "in-progress",
      progressLabel: "1/4 grup bulundu · 3 hata hakkı",
    });
  });

  it.each(["won", "lost"] as const)("bugünün %s sonucu tamamlandı durumudur", (status) => {
    const storage = createMemoryStorage();
    saveSnapshot(snapshot(today.dayKey, status), { storage });

    expect(resolveHomeState(storage, today).state).toBe("completed");
  });

  it("başka bulmaca veya revizyon kaydını bugünün oyunu saymaz", () => {
    const storage = createMemoryStorage();
    const bad = { ...snapshot(today.dayKey), puzzleId: "q-baska" };
    storage.setItem(
      snapshotStorageKey(today.dayKey),
      JSON.stringify({ savedAt: "", snapshot: bad }),
    );

    expect(resolveHomeState(storage, today).state).toBe("new");
  });
});

describe("gece yarısı geçişi", () => {
  it("dünün açık oyununu yeni gün geldiğinde görünür ve devam edilebilir tutar", () => {
    const storage = createMemoryStorage();
    const yesterday = "2026-09-20";
    saveSnapshot(snapshot(yesterday), { storage });

    const state = resolveHomeState(storage, today);

    expect(storage.getItem(LAST_DAY_KEY)).toBe(yesterday);
    expect(state.state).toBe("new");
    expect(state.previousGame).toEqual({
      dayKey: yesterday,
      solvedGroups: 1,
      mistakesRemaining: 3,
      href: "/play?day=2026-09-20",
    });
  });

  it("iki günden eski oyunu arşiv gibi sunmaz", () => {
    const storage = createMemoryStorage();
    saveSnapshot(snapshot("2026-09-19"), { storage });

    expect(resolveHomeState(storage, today).previousGame).toBeUndefined();
  });

  it("takvim sınırında önceki günü doğru hesaplar", () => {
    expect(previousCalendarDay("2027-01-01")).toBe("2026-12-31");
  });
});

describe("yeni bulmaca geri sayımı", () => {
  it("kalan süreyi yukarı yuvarlanmış saat ve dakika olarak verir", () => {
    const now = Date.parse("2026-09-20T20:30:30.000Z");
    const midnightIstanbul = Date.parse("2026-09-20T21:00:00.000Z");

    expect(formatCountdown(midnightIstanbul, now)).toBe("00 sa 30 dk");
  });

  it("sınır geçince negatif süre göstermez", () => {
    expect(formatCountdown(1000, 2000)).toBe("00 sa 00 dk");
  });
});
