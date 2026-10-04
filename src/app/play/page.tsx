import type { Metadata } from "next";
import Link from "next/link";

import { DailyPuzzleSection } from "@/components/game/DailyPuzzleSection";
import { TutorialExperience } from "@/components/tutorial/TutorialExperience";
import { PLAY_DESCRIPTION, TUTORIAL_DESCRIPTION } from "@/lib/config";
import { GAME_ARCHIVE_START as TEMP_ARCHIVE_START, GAME_ARCHIVE_END as TEMP_ARCHIVE_END, archiveDayOffset } from "@/lib/gameArchive";
import {
  formatDayLabel,
  isPublicationDayKey,
  loadDailyPuzzle,
  puzzleNumberFromId,
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

function resolvePlayableDay(requestedDay?: string): string {
  const requested = requestedDay?.trim();
  if (
    requested &&
    isPublicationDayKey(requested) &&
    requested >= TEMP_ARCHIVE_START &&
    requested <= TEMP_ARCHIVE_END
  ) {
    return requested;
  }
  return TEMP_ARCHIVE_START;
}

function nextPuzzleDay(dayKey: string): string | null {
  if (dayKey >= TEMP_ARCHIVE_END) return null;
  return archiveDayOffset(dayKey, 1);
}

function dailyKicker(state: DailyPuzzleState): string {
  const dayLabel = formatDayLabel(state.dayKey);
  if (state.status !== "ok") return dayLabel;

  const number = puzzleNumberFromId(state.puzzle.id);
  return number === null ? dayLabel : `#${number} · ${dayLabel}`;
}

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const { mode, day } = await searchParams;
  const tutorialMode = mode === "tutorial";
  const dayKey = resolvePlayableDay(day);
  const daily = tutorialMode
    ? null
    : await loadDailyPuzzle({ dayKey, includeDrafts: true });
  const nextDay = tutorialMode ? null : nextPuzzleDay(dayKey);

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

      {daily === null ? (
        <TutorialExperience />
      ) : (
        <DailyPuzzleSection
          state={daily}
          nextPuzzleHref={nextDay ? `/play?day=${nextDay}` : null}
        />
      )}
    </main>
  );
}
