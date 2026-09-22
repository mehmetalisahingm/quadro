import { describe, expect, it } from "vitest";

import {
  calculatePersonalStats,
  publicationDayOrdinal,
  type DailyGameResult,
} from "./personalStats";

function result(
  dayKey: string,
  outcome: "won" | "lost" = "won",
  mistakes = 0,
): DailyGameResult {
  return {
    dayKey,
    puzzleId: `puzzle-${dayKey}`,
    puzzleRevision: 1,
    outcome,
    mistakes,
  };
}

describe("kişisel istatistik · hesap", () => {
  it("boş cihazda tüm değerler sıfırdır", () => {
    expect(calculatePersonalStats([])).toEqual({
      played: 0,
      won: 0,
      lost: 0,
      winRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      averageMistakes: 0,
    });
  });

  it("arka arkaya kazanılan yayın günlerini seri sayar", () => {
    const stats = calculatePersonalStats([
      result("2026-09-20", "won", 1),
      result("2026-09-21", "won", 2),
      result("2026-09-22", "won", 0),
    ]);

    expect(stats).toEqual({
      played: 3,
      won: 3,
      lost: 0,
      winRate: 100,
      currentStreak: 3,
      longestStreak: 3,
      averageMistakes: 1,
    });
  });

  it("kayıp güncel seriyi sıfırlar ama en uzun seriyi korur", () => {
    const stats = calculatePersonalStats([
      result("2026-09-20"),
      result("2026-09-21"),
      result("2026-09-22", "lost", 4),
    ]);

    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(2);
    expect(stats.played).toBe(3);
    expect(stats.won).toBe(2);
    expect(stats.lost).toBe(1);
    expect(stats.winRate).toBeCloseTo(66.6666667);
  });

  it("gün atlanırsa sonraki kazanç yeni seri başlatır", () => {
    const stats = calculatePersonalStats([
      result("2026-09-20"),
      result("2026-09-21"),
      result("2026-09-23"),
    ]);

    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(2);
  });

  it("sonuçlar sıra dışı gelse de yayın gününe göre hesaplar", () => {
    const stats = calculatePersonalStats([
      result("2026-09-22"),
      result("2026-09-20"),
      result("2026-09-21"),
    ]);

    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it("aynı günün tekrarlanan sonucunu ikinci kez saymaz", () => {
    const stats = calculatePersonalStats([
      result("2026-09-20", "won", 1),
      result("2026-09-20", "lost", 4),
    ]);

    expect(stats.played).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.averageMistakes).toBe(1);
  });
});

describe("kişisel istatistik · yayın günü", () => {
  it("takvimde ardışık günleri UTC saat farkına bağlı olmadan ayırır", () => {
    const first = publicationDayOrdinal("2026-12-31");
    const next = publicationDayOrdinal("2027-01-01");

    expect(first).not.toBeNull();
    expect(next).toBe(first === null ? null : first + 1);
  });

  it("geçersiz tarihleri reddeder", () => {
    expect(publicationDayOrdinal("2026-02-30")).toBeNull();
    expect(publicationDayOrdinal("22-09-2026")).toBeNull();
  });
});
