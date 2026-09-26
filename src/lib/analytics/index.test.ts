import { describe, expect, it } from "vitest";

import {
  ANALYTICS_STORAGE_KEY,
  calendarDayOffset,
  createAnalyticsClient,
  istanbulDayKey,
} from "./index";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("analytics istemcisi", () => {
  it("olayları sırayla kaydeder ve cevap içeriği gerektirmez", () => {
    const storage = new MemoryStorage();
    const client = createAnalyticsClient({
      storage,
      now: () => new Date("2026-09-26T20:00:00Z"),
      makeId: () => "evt-1",
    });

    client.track("first_attempt", {
      puzzleId: "q-024",
      revision: 1,
      verdict: "one-away",
      mistakesRemaining: 4,
    });

    expect(client.readEvents()).toEqual([
      {
        id: "evt-1",
        name: "first_attempt",
        at: "2026-09-26T20:00:00.000Z",
        properties: {
          puzzleId: "q-024",
          revision: 1,
          verdict: "one-away",
          mistakesRemaining: 4,
        },
      },
    ]);
    expect(storage.getItem(ANALYTICS_STORAGE_KEY)).not.toContain("wordIds");
    expect(storage.getItem(ANALYTICS_STORAGE_KEY)).not.toContain("groupTitle");
  });

  it("aynı bitiş anahtarını iki kez saymaz", () => {
    const storage = new MemoryStorage();
    let id = 0;
    const client = createAnalyticsClient({
      storage,
      makeId: () => `evt-${++id}`,
    });
    const properties = {
      puzzleId: "q-024",
      revision: 1,
      dayKey: "2026-10-13",
      status: "won" as const,
      attemptCount: 5,
      mistakesUsed: 1,
      activeSeconds: 92,
    };

    expect(client.trackOnce("finish:q-024:1", "game_finish", properties)).not.toBeNull();
    expect(client.trackOnce("finish:q-024:1", "game_finish", properties)).toBeNull();
    expect(client.readEvents().filter((event) => event.name === "game_finish")).toHaveLength(1);
  });
});

describe("D1/D7 gün hesabı", () => {
  it("İstanbul yayın gününü üretir", () => {
    expect(istanbulDayKey(new Date("2026-09-26T21:30:00Z"))).toBe("2026-09-27");
  });

  it("takvim günü farkını D1 ve D7 için deterministik hesaplar", () => {
    expect(calendarDayOffset("2026-09-20", "2026-09-21")).toBe(1);
    expect(calendarDayOffset("2026-09-20", "2026-09-27")).toBe(7);
  });
});
