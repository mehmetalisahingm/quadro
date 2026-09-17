import Link from "next/link";

import { GameBoard } from "@/components/game/GameBoard";
import { TutorialExperience } from "@/components/tutorial/TutorialExperience";

type PlayPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

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

      {tutorialMode ? <TutorialExperience /> : <GameBoard />}
    </main>
  );
}
