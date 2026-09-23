import type { GameStatus, SubmitOutcome } from "@/features/game/contracts";

export type TileAnimationVerdict = "one-away" | "wrong";

const TRANSITION_MS = {
  neutral: 180,
  wrong: 320,
  oneAway: 360,
  correct: 420,
  terminalLoss: 360,
  terminalWin: 520,
} as const;

/**
 * Oyun motorunun sonucunu geciktirmeden yalnız sunum katmanının ne kadar kilitli
 * kalacağını belirler. Reduced-motion tercihinde görsel bekleme tamamen kalkar.
 */
export function gameTransitionDuration(
  outcome: SubmitOutcome,
  status: GameStatus,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0;

  if (status !== "playing") {
    return outcome.verdict === "correct"
      ? TRANSITION_MS.terminalWin
      : TRANSITION_MS.terminalLoss;
  }

  switch (outcome.verdict) {
    case "correct":
      return TRANSITION_MS.correct;
    case "one-away":
      return TRANSITION_MS.oneAway;
    case "wrong":
      return TRANSITION_MS.wrong;
    case "repeated":
    case "invalid":
      return TRANSITION_MS.neutral;
  }
}

/** Yalnız tahtada kalan yanlış/çok-yakın seçimler kart animasyonu alır. */
export function tileAnimationVerdict(outcome: SubmitOutcome): TileAnimationVerdict | null {
  if (outcome.verdict === "one-away" || outcome.verdict === "wrong") {
    return outcome.verdict;
  }
  return null;
}
