import { describe, expect, it } from "vitest";

import { pickUnseenSlot, seenTrackIds, slotPuzzleId, slotTrack } from "./challengeSlots";

describe("özel mod slotları", () => {
  it("slotlar parkur bölümlerine API ile aynı biçimde eşlenir", () => {
    expect(slotTrack(0)).toEqual({ mode: "medium", level: 1 });
    expect(slotTrack(13)).toEqual({ mode: "hard", level: 2 });
    expect(slotTrack(47)).toEqual({ mode: "ultra", level: 12 });
    expect(slotPuzzleId(0)).toBe("track-medium-001");
    expect(slotPuzzleId(12)).toBe("track-balanced-001");
    expect(slotPuzzleId(36)).toBe("track-hard-001");
  });

  it("görülen tahtaları atlar, deterministiktir", () => {
    const seen = new Set(["track-medium-001", "track-medium-002"]);
    expect(pickUnseenSlot(0, seen)).toBe(2);
    expect(pickUnseenSlot(0, seen)).toBe(2);
    expect(pickUnseenSlot(5, seen)).toBe(5);
    expect(pickUnseenSlot(47, new Set(["track-hard-012"]))).toBe(0);
  });

  it("hepsi görülmüşse başlangıç slotunu verir", () => {
    const all = new Set(Array.from({ length: 48 }, (_, slot) => slotPuzzleId(slot)));
    expect(pickUnseenSlot(7, all)).toBe(7);
  });

  it("parkur, günlük yedek ve önceki özel oyun kayıtlarından görülenleri çıkarır", () => {
    const seen = seenTrackIds([
      ["quadro:tracks:v1:track-easy-003:quadro:save:v1:2026-10-07", "{}"],
      ["quadro:save:v1:2026-11-05", JSON.stringify({ snapshot: { puzzleId: "daily-2026-11-05-track-balanced-004" } })],
      ["quadro:ladder:v1:2026-11-06:special-3-track-hard-009:1", "{}"],
      ["quadro:save:v1:2026-11-04", "{bozuk"],
      ["quadro:save:v1:2026-11-03", JSON.stringify({ snapshot: { puzzleId: "q-001" } })],
      ["quadro:stats:v1", "{}"],
    ]);
    expect([...seen].sort()).toEqual(["track-balanced-004", "track-easy-003", "track-hard-009"]);
  });
});
