import Link from "next/link";

import { GameBoard } from "@/components/game/GameBoard";
import { TutorialExperience } from "@/components/tutorial/TutorialExperience";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";

type PlayPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

// Oyun gerçek motorla oynanır. Günlük içeriğin yüklenmesi Q17/Q19 kapsamındadır; o zamana kadar
// yayın stoğunda olmayan örnek bulmaca kullanılır, günlük cevaplar istemciye gönderilmez.
const puzzle = standardPuzzle;

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { mode } = await searchParams;
  const tutorialMode = mode === "tutorial";

  return (
    <main className="q-play-page">
      <header className="q-play-header">
        <Link className="q-play-brand" href="/" aria-label="Quadro ana sayfasına dön">
          QUADRO
        </Link>
        <span className="q-play-kicker">
          {tutorialMode ? "ÖĞRETİCİ · 2 GRUP" : "#1 · 20 EYLÜL 2026"}
        </span>
      </header>

      {tutorialMode ? <TutorialExperience /> : <GameBoard puzzle={puzzle} />}
    </main>
  );
}
