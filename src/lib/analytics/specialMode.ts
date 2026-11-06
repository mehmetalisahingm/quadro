import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import type { SpecialMode } from "@/features/game/specialEnergy";
import { trackBrowserEventOnce } from "@/lib/analytics";
import { getOrCreateVisitorId } from "@/lib/analytics/remote";
import { specialRecordId } from "@/features/game/specialRecordId";

function identity(puzzle: Puzzle, mode: SpecialMode) { const visitor = getOrCreateVisitorId(); return visitor ? specialRecordId(mode, puzzle.date, puzzle.id, visitor) : null; }
export function specialStart(puzzle: Puzzle, mode: SpecialMode, resumed: boolean) {
  const puzzleId = identity(puzzle, mode);
  if (!puzzleId) return;
  trackBrowserEventOnce(`special-start:${puzzleId}`, "game_start", { puzzleId, revision: puzzle.revision, dayKey: puzzle.date, resumed, mode });
}
export function specialProgress(puzzle: Puzzle, mode: SpecialMode, snapshot: GameSnapshot, remaining: number) {
  const puzzleId = identity(puzzle, mode);
  if (!puzzleId) return;
  trackBrowserEventOnce(`special-progress:${puzzleId}:${snapshot.attempts.length}`, "game_progress", { puzzleId, revision: puzzle.revision, dayKey: puzzle.date, solvedGroups: snapshot.solvedGroupIds.length, attemptCount: snapshot.attempts.length, mistakesRemaining: remaining, activeSeconds: 0, mode });
}
export function specialFinish(puzzle: Puzzle, mode: SpecialMode, snapshot: GameSnapshot, remaining: number, score: number) {
  const puzzleId = identity(puzzle, mode);
  if (!puzzleId) return;
  trackBrowserEventOnce(`special-finish:${puzzleId}`, "game_finish", { puzzleId, revision: puzzle.revision, dayKey: puzzle.date, status: snapshot.status === "won" ? "won" : "lost", attemptCount: snapshot.attempts.length, mistakesUsed: 4 - remaining, activeSeconds: 0, mode, score });
}
