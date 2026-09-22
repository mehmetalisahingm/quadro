import type { Metadata } from "next";
import Link from "next/link";

import { DailyPuzzleSection } from "@/components/game/DailyPuzzleSection";
import { TutorialExperience } from "@/components/tutorial/TutorialExperience";
import { PLAY_DESCRIPTION, TUTORIAL_DESCRIPTION } from "@/lib/config";
import {
  formatDayLabel,
  loadDailyPuzzle,
  puzzleNumberFromId,
  resolvePublicationDay,
  type DailyPuzzleState,
} from "@/lib/daily";

type PlayPageProps = {
  searchParams: Promise<{ mode?: string; day?: string; view?: string }>;
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

function previousCalendarDay(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const at = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1) - 86_400_000;
  return new Date(at).toISOString().slice(0, 10);
}

/**
 * İlk sürüm arşiv sunmaz. Q23 gece yarısında yarım kalan oyunu kaybetmemek için
 * yalnız bir önceki yayın gününe dönüşe izin verir; daha eski veya gelecek bir
 * gün istenirse bugünün bulmacası açılır.
 */
export function resolvePlayableDay(currentDay: string, requestedDay?: string): string {
  const requested = requestedDay?.trim();
  if (requested !== undefined && requested === previousCalendarDay(currentDay)) {
    return requested;
  }
  return currentDay;
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
 * Varsayılan yayın günü Europe/Istanbul saatine göre belirlenir. Q23 kapsamında
 * ana sayfa, gece yarısından sonra yalnız dünden kalan açık oyun için
 * `?day=YYYY-MM-DD` ekleyebilir; sunucu bu parametreyi bir önceki yayın günüyle
 * sınırlar. Böylece yarım oyun devam ederken genel bir arşiv açılmaz.
 *
 * Öğretici kipi günlük içerikten bağımsızdır ve yayın stoğuna hiç bakmaz.
 */
export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { mode, day } = await searchParams;
  const tutorialMode = mode === "tutorial";
  const currentDay = resolvePublicationDay();
  const dayKey = resolvePlayableDay(currentDay, day);
  const daily = tutorialMode ? null : await loadDailyPuzzle({ dayKey });

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
