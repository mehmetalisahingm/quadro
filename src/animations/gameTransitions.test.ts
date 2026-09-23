import { describe, expect, it } from "vitest";

import type { SubmitOutcome } from "@/features/game/contracts";

import { gameTransitionDuration, tileAnimationVerdict } from "./gameTransitions";

const correct: SubmitOutcome = {
  verdict: "correct",
  solvedGroup: {
    id: "g1",
    title: "TEST",
    words: [
      { id: "w1", text: "A" },
      { id: "w2", text: "B" },
      { id: "w3", text: "C" },
      { id: "w4", text: "D" },
    ],
    difficulty: 1,
    explanation: "Test grubu.",
  },
};

describe("Q30 oyun geçiş süreleri", () => {
  it("reduced-motion tercihinde bütün görsel beklemeyi kaldırır", () => {
    for (const outcome of [
      correct,
      { verdict: "one-away" } as const,
      { verdict: "wrong" } as const,
      { verdict: "repeated" } as const,
    ]) {
      expect(gameTransitionDuration(outcome, "playing", true)).toBe(0);
    }
    expect(gameTransitionDuration(correct, "won", true)).toBe(0);
  });

  it("son doğru gruba normal doğru tahminden daha uzun final payı verir", () => {
    expect(gameTransitionDuration(correct, "won", false)).toBeGreaterThan(
      gameTransitionDuration(correct, "playing", false),
    );
  });

  it("yalnız yanlış ve çok-yakın sonuçları kart animasyonuna çevirir", () => {
    expect(tileAnimationVerdict({ verdict: "wrong" })).toBe("wrong");
    expect(tileAnimationVerdict({ verdict: "one-away" })).toBe("one-away");
    expect(tileAnimationVerdict(correct)).toBeNull();
    expect(tileAnimationVerdict({ verdict: "repeated" })).toBeNull();
    expect(tileAnimationVerdict({ verdict: "invalid", reason: "selection-count" })).toBeNull();
  });
});
