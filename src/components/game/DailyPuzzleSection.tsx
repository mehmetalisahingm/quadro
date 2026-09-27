import Link from "next/link";

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
      <>
        <GameBoard key={`${state.puzzle.id}:${state.puzzle.revision}`} puzzle={state.puzzle} />
        <nav aria-label="Bulmaca gezintisi" style={{ margin: "20px auto 0", textAlign: "center" }}>
          {nextPuzzleHref ? (
            <Link href={nextPuzzleHref}>Sonraki bulmaca →</Link>
          ) : (
            <span>30 bulmacanın tamamına ulaştın.</span>
          )}
        </nav>
      </>
    );
  }
  if (state.status === "loading") return <GameLoading />;
  return <GameNotice reason={state.reason} />;
}
