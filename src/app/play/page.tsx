import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DifficultyLobby } from "@/components/game/DifficultyLobby";
import { PlayExperience } from "@/components/game/PlayExperience";
import { TrackNavigation } from "@/components/game/TrackNavigation";
import { loadModePuzzle } from "@/lib/daily/modePuzzle";
import { TRACKS, TRACK_LEVEL_COUNT, trackHref } from "@/features/game/tracks";

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
  searchParams: Promise<{ mode?: string; day?: string; view?: string; difficulty?: string; level?: string }>;
};


export async function generateMetadata({ searchParams }: PlayPageProps): Promise<Metadata> {
  const { mode, difficulty, level, day } = await searchParams;
  const tutorialMode = mode === "tutorial";
  const track = TRACKS.find(item => item.id === difficulty);
  if (!tutorialMode && !day) return {
    title: track ? `${track.label} · Bölüm ${level ?? 1}` : "Kolay, Orta, Zor",
    description: "Üç zorluk modu, her modda altı farklı bulmaca. 16 kelimenin gizli bağlarını keşfet.",
  };

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
  const { mode, day, difficulty, level: requestedLevel } = await searchParams;
  if (mode !== "tutorial" && (difficulty !== undefined || day === undefined)) {
    if (difficulty === undefined) return <main className="q-play-page"><DifficultyLobby /></main>;
    const track = TRACKS.find((item) => item.id === difficulty);
    const level = requestedLevel === undefined ? 1 : Number(requestedLevel);
    if (!track || !Number.isInteger(level) || level < 1 || level > TRACK_LEVEL_COUNT) notFound();
    const puzzle = await loadModePuzzle(track.id, level);
    if (!puzzle) notFound();
    return <main className="q-play-page">
      <header className="q-play-header"><Link className="q-play-brand" href="/play">QUADRO</Link><span className="q-play-kicker">{track.label} · Bölüm {level} / {TRACK_LEVEL_COUNT}</span></header>
      <PlayExperience key={puzzle.id} puzzle={puzzle} />
      <nav aria-label="Bulmaca gezintisi" style={{ textAlign: "center", margin: "24px 0" }}>
        {level < TRACK_LEVEL_COUNT ? <Link href={trackHref(track.id, level + 1)}>Sonraki bulmaca →</Link> : <Link href="/play">Bu modun son bölümündesin. Başka bir mod seç →</Link>}
      </nav>
      <TrackNavigation difficulty={track.id} level={level} />
    </main>;
  }
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
