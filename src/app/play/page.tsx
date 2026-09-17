import type { Metadata } from "next";
import Link from "next/link";

import { GameBoard } from "@/components/game/GameBoard";
import { TutorialExperience } from "@/components/tutorial/TutorialExperience";
import { PLAY_DESCRIPTION, TUTORIAL_DESCRIPTION } from "@/lib/config";

type PlayPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export async function generateMetadata({ searchParams }: PlayPageProps): Promise<Metadata> {
  const { mode } = await searchParams;
  const tutorialMode = mode === "tutorial";

  return tutorialMode
    ? {
        title: "Kısa öğretici",
        description: TUTORIAL_DESCRIPTION,
      }
    : {
        title: "Bugünün bulmacası",
        description: PLAY_DESCRIPTION,
      };
}

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
