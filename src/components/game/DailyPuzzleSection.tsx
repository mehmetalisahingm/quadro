import Link from "next/link";

import type { DailyPuzzleState } from "@/lib/daily";
import { PlayExperience } from "./PlayExperience";
import { GameLoading } from "./GameLoading";
import { GameNotice } from "./GameNotice";

export type DailyPuzzleSectionProps = {
  state: DailyPuzzleState;
  nextPuzzleHref?: string | null;
  dailyMode?: boolean;
};

export function DailyPuzzleSection({ state, nextPuzzleHref, dailyMode }: DailyPuzzleSectionProps) {
  if (state.status === "ok") {
    return (
      <>
        {state.source.startsWith("reserve:") && <p role="note" style={{ textAlign: "center" }}>Günlük seçki · Bölüm arşivinden seçildi. Her gün Türkiye saatiyle 00.00’da değişir.</p>}
        <PlayExperience key={`${state.puzzle.date}:${state.puzzle.id}:${state.puzzle.revision}`} puzzle={state.puzzle} />
        <nav aria-label="Bulmaca gezintisi" style={{ margin: "20px auto 0", textAlign: "center" }}>
          {dailyMode ? <Link href="/play">Diğer bölümleri keşfet →</Link> : nextPuzzleHref ? (
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
