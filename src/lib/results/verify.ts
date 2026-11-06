import type { Puzzle, GameSnapshot, Attempt } from "@/features/game/contracts";
import { GAME_CONSTANTS } from "@/features/game/contracts";
import { createInitialSnapshot, submitSelection, toggleWord } from "@/features/game/engine";

/** Replay a submitted terminal run against the published server-side puzzle.
 * This rejects arbitrary result/status flips, although full anti-cheat requires
 * keeping puzzle answers and live attempt state on the server as well. */
export function verifyFinishedSnapshot(puzzle: Puzzle, input: unknown): { result: "won" | "lost"; attemptCount: number; mistakesUsed: number; activeSeconds: number } | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const claim = input as Partial<GameSnapshot>;
  if (claim.schemaVersion !== 1 || claim.puzzleId !== puzzle.id || claim.puzzleRevision !== puzzle.revision || claim.dayKey !== puzzle.date) return null;
  if (claim.status !== "won" && claim.status !== "lost") return null;
  if (!Array.isArray(claim.attempts) || claim.attempts.length < 4 || claim.attempts.length > GAME_CONSTANTS.maxMistakes + 3) return null;
  if (!Number.isInteger(claim.activeSeconds) || (claim.activeSeconds ?? 0) < 0 || (claim.activeSeconds ?? 0) > 604800) return null;
  if (!Number.isInteger(claim.mistakesRemaining) || !Array.isArray(claim.solvedGroupIds)) return null;

  let state = createInitialSnapshot(puzzle, { random: () => 0.5 });
  for (let index = 0; index < claim.attempts.length; index++) {
    const attempt: Partial<Attempt> = claim.attempts[index] as Partial<Attempt>;
    if (!attempt || typeof attempt !== "object" || attempt.id !== `a${index + 1}` ||
        !Array.isArray(attempt.wordIds) || attempt.wordIds.length !== 4 ||
        !attempt.wordIds.every(id => typeof id === "string") || new Set(attempt.wordIds).size !== 4) return null;
    if (state.status !== "playing") return null;
    for (const id of attempt.wordIds) {
      state = toggleWord(puzzle, state, id);
    }
    if (state.selectedWordIds.length !== 4) return null;
    const result = submitSelection(puzzle, state);
    if (result.outcome.verdict !== attempt.verdict || result.snapshot.attempts.length !== index + 1) return null;
    state = result.snapshot;
  }
  if (state.status !== claim.status || state.mistakesRemaining !== claim.mistakesRemaining ||
      state.solvedGroupIds.length !== claim.solvedGroupIds.length ||
      state.solvedGroupIds.some((id, i) => id !== claim.solvedGroupIds![i])) return null;
  return {
    result: state.status,
    attemptCount: state.attempts.length,
    mistakesUsed: GAME_CONSTANTS.maxMistakes - state.mistakesRemaining,
    activeSeconds: claim.activeSeconds!,
  };
}
