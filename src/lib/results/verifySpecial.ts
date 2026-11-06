import { GAME_CONSTANTS, type Attempt, type GameSnapshot, type Puzzle } from "@/features/game/contracts";
import { clearSelection, createInitialSnapshot, submitSelection, toggleWord } from "@/features/game/engine";
import type { SpecialMode } from "@/features/game/specialEnergy";

type SpecialProof = { mode: SpecialMode; wagers?: unknown; bombId?: unknown };
/** Replay against the server-loaded board, including early bomb and bankrupt endings. */
export function verifySpecialFinishedSnapshot(puzzle: Puzzle, input: unknown, proof: SpecialProof): { result: "won" | "lost"; attemptCount: number; mistakesUsed: number; activeSeconds: number } | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const claim = input as Partial<GameSnapshot>;
  if (claim.schemaVersion !== 1 || claim.puzzleId !== puzzle.id || claim.puzzleRevision !== puzzle.revision || claim.dayKey !== puzzle.date || !Array.isArray(claim.attempts) || claim.attempts.length < 1 || claim.attempts.length > 7 || !Array.isArray(claim.solvedGroupIds) || !Number.isInteger(claim.mistakesRemaining) || !Number.isInteger(claim.activeSeconds) || (claim.activeSeconds ?? -1) < 0 || (claim.activeSeconds ?? 0) > 604800) return null;
  if (proof.mode === "risk" && (!Array.isArray(proof.wagers) || proof.wagers.length !== claim.attempts.length)) return null;
  const ids = new Set(puzzle.groups.flatMap(group => group.words.map(word => word.id)));
  if (proof.mode === "bomb" && (typeof proof.bombId !== "string" || !ids.has(proof.bombId))) return null;
  let state = createInitialSnapshot(puzzle, { random: () => 0.5 });
  let balance = 100; let extra = 0;
  for (let index = 0; index < claim.attempts.length; index++) {
    const attempt = claim.attempts[index] as Partial<Attempt>;
    if (!attempt || typeof attempt !== "object" || attempt.id !== `a${index + 1}` || !Array.isArray(attempt.wordIds) || attempt.wordIds.length !== 4 || !attempt.wordIds.every(id => typeof id === "string") || new Set(attempt.wordIds).size !== 4 || state.status !== "playing" || balance <= 0 || state.mistakesRemaining - extra <= 0) return null;
    let wager = 0;
    if (proof.mode === "risk") {
      wager = (proof.wagers as unknown[])[index] as number;
      if (!Number.isInteger(wager) || wager < 1 || wager > balance) return null;
    }
    state = clearSelection(state);
    for (const id of attempt.wordIds) state = toggleWord(puzzle, state, id);
    if (state.selectedWordIds.length !== 4) return null;
    const result = submitSelection(puzzle, state);
    if (result.outcome.verdict !== attempt.verdict || result.snapshot.attempts.length !== index + 1) return null;
    state = result.snapshot;
    if (proof.mode === "risk") balance += attempt.verdict === "correct" ? wager : -wager;
    if (proof.mode === "bomb" && attempt.verdict !== "correct" && attempt.wordIds.includes(proof.bombId as string)) extra++;
  }
  const remaining = Math.max(0, state.mistakesRemaining - extra);
  if (state.status === "playing" && balance > 0 && remaining > 0) return null;
  if (claim.status !== state.status || claim.mistakesRemaining !== state.mistakesRemaining || state.solvedGroupIds.length !== claim.solvedGroupIds.length || state.solvedGroupIds.some((id, i) => id !== claim.solvedGroupIds![i])) return null;
  return { result: state.status === "won" ? "won" : "lost", attemptCount: state.attempts.length, mistakesUsed: GAME_CONSTANTS.maxMistakes - remaining, activeSeconds: claim.activeSeconds! };
}
