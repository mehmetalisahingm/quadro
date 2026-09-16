import Link from "next/link";

import { GameBoard } from "@/components/game/GameBoard";

export default function PlayPage() {
  return (
    <main className="q-play-page">
      <header className="q-play-header">
        <Link className="q-play-brand" href="/" aria-label="Quadro ana sayfasına dön">
          QUADRO
        </Link>
        <span className="q-play-kicker">#1 · 20 EYLÜL 2026</span>
      </header>

      <GameBoard />
    </main>
  );
}
