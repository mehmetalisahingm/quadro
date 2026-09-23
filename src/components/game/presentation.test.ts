import { describe, expect, it } from "vitest";

import type { GameSnapshot, PuzzleGroup, SubmitOutcome } from "@/features/game/contracts";

import { feedbackMessage, formatDuration, getResultStats } from "./presentation";

const solvedGroup: PuzzleGroup = {
  id: "g1",
  title: "Örnek Grup",
  difficulty: 1,
  explanation: "Örnek açıklama",
  words: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
    { id: "d", text: "D" },
  ],
};

const baseSnapshot: GameSnapshot = {
  schemaVersion: 1,
  puzzleId: "p1",
  puzzleRevision: 1,
  dayKey: "2026-09-20",
  status: "won",
  selectedWordIds: [],
  remainingWordOrder: [],
  solvedGroupIds: ["g1", "g2", "g3", "g4"],
  mistakesRemaining: 2,
  attempts: [],
  activeSeconds: 125,
};

describe("game presentation helpers", () => {
  it("tüm gönderim sonuçlarını renkten bağımsız, açık kullanıcı metnine çevirir", () => {
    const cases: Array<[SubmitOutcome, string]> = [
      [{ verdict: "correct", solvedGroup }, "Doğru — Örnek Grup grubunu buldun."],
      [{ verdict: "one-away" }, "Çok yakın — bir kelime uzaktasın."],
      [{ verdict: "wrong" }, "Yanlış — bu dört kelime aynı grupta değil."],
      [{ verdict: "repeated" }, "Tekrar — bu dörtlüyü daha önce denedin."],
      [
        { verdict: "invalid", reason: "selection-count" },
        "Gruplamak için dört kelime seç.",
      ],
      [{ verdict: "invalid", reason: "invalid-words" }, "Bu seçim artık geçerli değil."],
      [{ verdict: "invalid", reason: "game-ended" }, "Bu oyun sona erdi."],
    ];

    for (const [outcome, expected] of cases) {
      expect(feedbackMessage(outcome)).toBe(expected);
    }
    expect(feedbackMessage(null)).toBe("");
  });

  it("süreyi güvenli biçimler", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65.9)).toBe("1:05");
    expect(formatDuration(-20)).toBe("0:00");
  });

  it("sonuç istatistiklerini sözleşme sabitleriyle üretir", () => {
    expect(getResultStats(baseSnapshot)).toEqual({
      found: 4,
      total: 4,
      mistakesUsed: 2,
      duration: "2:05",
    });

    expect(
      getResultStats({ ...baseSnapshot, mistakesRemaining: -10 }),
    ).toMatchObject({ mistakesUsed: 4 });
  });
});
