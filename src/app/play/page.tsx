import type { Metadata } from "next";
import Link from "next/link";

import { DailyPuzzleSection } from "@/components/game/DailyPuzzleSection";
import { TutorialExperience } from "@/components/tutorial/TutorialExperience";
import { PLAY_DESCRIPTION, TUTORIAL_DESCRIPTION } from "@/lib/config";
import {
  formatDayLabel,
  loadDailyPuzzle,
  puzzleNumberFromId,
  type DailyPuzzleState,
} from "@/lib/daily";

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

/**
 * Sayfa başlığındaki gün etiketi: "#1 · 20 EYLÜL 2026".
 *
 * Numara bulmaca kimliğinden gelir; kimlik numara taşımıyorsa yalnız tarih yazılır.
 * İçerik yoksa da gün gösterilir: oyuncu hangi güne baktığını görür.
 */
function dailyKicker(state: DailyPuzzleState): string {
  const dayLabel = formatDayLabel(state.dayKey);
  if (state.status !== "ok") return dayLabel;

  const number = puzzleNumberFromId(state.puzzle.id);
  return number === null ? dayLabel : `#${number} · ${dayLabel}`;
}

/**
 * Günlük oyun sayfası.
 *
 * Günün bulmacası burada, sunucuda çözülür: yayın günü Europe/Istanbul saatine göre
 * belirlenir ve yalnız o günün içerik dosyası okunur (Q19). Bulmaca istemciye bir
 * prop olarak iner; içerik dosyaları modül grafiğine hiç girmez, dolayısıyla gelecek
 * günler istemci paketinde bulunmaz.
 *
 * Öğretici kipi günlük içerikten bağımsızdır ve yayın stoğuna hiç bakmaz.
 */
export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { mode } = await searchParams;
  const tutorialMode = mode === "tutorial";
  const daily = tutorialMode ? null : await loadDailyPuzzle();

  return (
    <main className="q-play-page">
      <header className="q-play-header">
        <Link className="q-play-brand" href="/" aria-label="Quadro ana sayfasına dön">
          QUADRO
        </Link>
        <span className="q-play-kicker">
          {daily === null ? "ÖĞRETİCİ · 2 GRUP" : dailyKicker(daily)}
        </span>
      </header>

      {daily === null ? <TutorialExperience /> : <DailyPuzzleSection state={daily} />}
    </main>
  );
}
