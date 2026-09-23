import { describe, expect, it } from "vitest";

import type { GameSnapshot } from "@/features/game/contracts";

import { saveSnapshot } from "./snapshotStore";
import {
  loadPersonalStats,
  recordTerminalResult,
  STATS_STORAGE_KEY,
} from "./statsStore";
import { createMemoryStorage } from "./storage";

const istanbulNoon = (dayKey: string): Date => new Date(`${dayKey}T12:00:00+03:00`);

function terminal(
  dayKey: string,
  status: "won" | "lost" = "won",
  mistakesRemaining = status === "lost" ? 0 : 3,
): GameSnapshot {
  return {
    schemaVersion: 1,
    puzzleId: `puzzle-${dayKey}`,
    puzzleRevision: 1,
    dayKey,
    status,
    selectedWordIds: [],
    remainingWordOrder: status === "won" ? [] : ["w1", "w2", "w3", "w4"],
    solvedGroupIds: status === "won" ? ["g1", "g2", "g3", "g4"] : [],
    mistakesRemaining,
    attempts: [],
    activeSeconds: 42,
  };
}

describe("istatistik kaydı · tek sonuç", () => {
  it("aynı günlük sonuç tekrar kaydedilse de yalnız bir kez sayılır", () => {
    const storage = createMemoryStorage();
    const won = terminal("2026-09-20", "won", 2);

    expect(recordTerminalResult(won, storage, istanbulNoon("2026-09-20")).status).toBe("recorded");
    expect(recordTerminalResult(won, storage, istanbulNoon("2026-09-20")).status).toBe("duplicate");

    expect(loadPersonalStats(storage).stats).toMatchObject({
      played: 1,
      won: 1,
      currentStreak: 1,
      longestStreak: 1,
      averageMistakes: 2,
    });
  });

  it("oyun snapshotı terminal olunca saveSnapshot istatistiği otomatik işler", () => {
    const storage = createMemoryStorage();
    const won = terminal("2026-09-20");

    saveSnapshot(won, { storage, now: istanbulNoon("2026-09-20") });
    saveSnapshot(won, { storage, now: istanbulNoon("2026-09-20") });

    expect(loadPersonalStats(storage).stats.played).toBe(1);
  });

  it("playing durum istatistiği değiştirmez", () => {
    const storage = createMemoryStorage();
    const playing = { ...terminal("2026-09-20"), status: "playing" as const };

    expect(recordTerminalResult(playing, storage, istanbulNoon("2026-09-20")).status).toBe("ignored");
    expect(loadPersonalStats(storage).stats.played).toBe(0);
  });
});

describe("istatistik kaydı · tarih ve seri", () => {
  it("gece yarısından sonra bitirilen eski oyun kaydolur ama seriyi ilerletmez", () => {
    const storage = createMemoryStorage();

    saveSnapshot(terminal("2026-09-20"), {
      storage,
      now: new Date("2026-09-21T00:30:00+03:00"),
    });
    saveSnapshot(terminal("2026-09-21"), {
      storage,
      now: new Date("2026-09-21T12:00:00+03:00"),
    });

    const loaded = loadPersonalStats(storage);
    expect(loaded.results.map((result) => result.dayKey)).toEqual([
      "2026-09-20",
      "2026-09-21",
    ]);
    expect(loaded.stats.currentStreak).toBe(1);
    expect(loaded.stats.longestStreak).toBe(1);
    expect(loaded.stats.played).toBe(2);
    expect(loaded.stats.won).toBe(2);
  });

  it("atlanan yayın günü seriyi böler", () => {
    const storage = createMemoryStorage();

    saveSnapshot(terminal("2026-09-20"), {
      storage,
      now: istanbulNoon("2026-09-20"),
    });
    saveSnapshot(terminal("2026-09-22"), {
      storage,
      now: istanbulNoon("2026-09-22"),
    });

    const stats = loadPersonalStats(storage).stats;
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
  });

  it("kayıp seriyi sıfırlar ve dört hata olarak ortalamaya girer", () => {
    const storage = createMemoryStorage();

    saveSnapshot(terminal("2026-09-20", "won", 3), {
      storage,
      now: istanbulNoon("2026-09-20"),
    });
    saveSnapshot(terminal("2026-09-21", "lost", 0), {
      storage,
      now: istanbulNoon("2026-09-21"),
    });

    const stats = loadPersonalStats(storage).stats;
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(1);
    expect(stats.averageMistakes).toBe(2.5);
  });
});

describe("istatistik kaydı · cihaz ve kurtarma", () => {
  it("farklı depolar birbirinin istatistiğini görmez", () => {
    const firstDevice = createMemoryStorage();
    const secondDevice = createMemoryStorage();

    saveSnapshot(terminal("2026-09-20"), {
      storage: firstDevice,
      now: istanbulNoon("2026-09-20"),
    });

    expect(loadPersonalStats(firstDevice).stats.played).toBe(1);
    expect(loadPersonalStats(secondDevice).stats.played).toBe(0);
  });

  it("bozuk istatistik kaydını siler ve boş özetle güvenle devam eder", () => {
    const storage = createMemoryStorage({ [STATS_STORAGE_KEY]: "{yarım" });

    const recovered = loadPersonalStats(storage);

    expect(recovered.status).toBe("recovered");
    expect(recovered.stats.played).toBe(0);
    expect(storage.getItem(STATS_STORAGE_KEY)).toBeNull();
  });

  it("bozuk kayıt kurtarıldıktan sonra yeni terminal sonuç tekrar yazılabilir", () => {
    const storage = createMemoryStorage({ [STATS_STORAGE_KEY]: "{yarım" });

    saveSnapshot(terminal("2026-09-20"), {
      storage,
      now: istanbulNoon("2026-09-20"),
    });

    const loaded = loadPersonalStats(storage);
    expect(loaded.status).toBe("loaded");
    expect(loaded.stats.played).toBe(1);
  });
});
