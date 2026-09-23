import type { DailyPuzzleState } from "@/lib/daily";
import { GameBoard } from "./GameBoard";
import { GameLoading } from "./GameLoading";
import { GameNotice } from "./GameNotice";

export type DailyPuzzleSectionProps = { state: DailyPuzzleState };

export function DailyPuzzleSection({ state }: DailyPuzzleSectionProps) {
  if (state.status === "ok") {
    return <GameBoard key={`${state.puzzle.id}:${state.puzzle.revision}`} puzzle={state.puzzle} />;
  }
  if (state.status === "loading") return <GameLoading />;
  return <GameNotice reason={state.reason} />;
}
