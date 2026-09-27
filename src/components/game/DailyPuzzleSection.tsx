import type { DailyPuzzleState } from "@/lib/daily";
import { GameBoard } from "./GameBoard";
import { GameLoading } from "./GameLoading";
import { GameNotice } from "./GameNotice";

export type DailyPuzzleSectionProps = {
  state: DailyPuzzleState;
  nextPuzzleHref?: string | null;
};

export function DailyPuzzleSection({ state, nextPuzzleHref }: DailyPuzzleSectionProps) {
  if (state.status === "ok") {
    return (
      <GameBoard
        key={`${state.puzzle.id}:${state.puzzle.revision}`}
        puzzle={state.puzzle}
        nextPuzzleHref={nextPuzzleHref}
      />
    );
  }
  if (state.status === "loading") return <GameLoading />;
  return <GameNotice reason={state.reason} />;
}
