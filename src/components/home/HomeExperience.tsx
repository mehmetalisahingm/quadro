"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { trackBrowserEvent } from "@/lib/analytics";
import { defaultSnapshotStorage } from "@/lib/persistence/storage";

import { HomeHero } from "./HomeHero";
import {
  formatCountdown,
  resolveHomeState,
  type HomePuzzleIdentity,
  type HomeStateSnapshot,
} from "./homeState";

export type HomeExperienceProps = {
  today: HomePuzzleIdentity;
  puzzleNumber: number | null;
  dateLabel: string;
  nextRolloverAt: string;
  initialCountdownLabel: string;
};

const MONTHS = [
  "OCAK",
  "ŞUBAT",
  "MART",
  "NİSAN",
  "MAYIS",
  "HAZİRAN",
  "TEMMUZ",
  "AĞUSTOS",
  "EYLÜL",
  "EKİM",
  "KASIM",
  "ARALIK",
] as const;

function dayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-");
  const monthName = month === undefined ? undefined : MONTHS[Number(month) - 1];
  if (year === undefined || day === undefined || monthName === undefined) return dayKey;
  return `${Number(day)} ${monthName} ${year}`;
}

export function HomeExperience({
  today,
  puzzleNumber,
  dateLabel,
  nextRolloverAt,
  initialCountdownLabel,
}: HomeExperienceProps) {
  const router = useRouter();
  const [player, setPlayer] = useState<HomeStateSnapshot>({ state: "new" });
  const [countdown, setCountdown] = useState(initialCountdownLabel);
  const refreshedBoundaries = useRef(new Set<number>());
  const homeViewTracked = useRef(false);
  const { dayKey, puzzleId, puzzleRevision } = today;

  useEffect(() => {
    const storage = defaultSnapshotStorage();
    const identity: HomePuzzleIdentity = { dayKey, puzzleId, puzzleRevision };

    const sync = () => {
      const resolved = resolveHomeState(storage, identity);
      setPlayer(resolved);

      if (!homeViewTracked.current) {
        homeViewTracked.current = true;
        trackBrowserEvent("home_view", {
          state: resolved.state,
          dayKey,
          puzzleAvailable: puzzleId !== null,
        });
      }
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [dayKey, puzzleId, puzzleRevision]);

  useEffect(() => {
    const target = Date.parse(nextRolloverAt);
    if (!Number.isFinite(target)) return undefined;

    const tick = () => {
      const now = Date.now();
      if (now >= target) {
        setCountdown("Yeni gün hazır");

        // Refresh server data without restarting the entrance or losing focus.
        // Stale responses and clock skew must not cause a refresh loop.
        if (!refreshedBoundaries.current.has(target)) {
          refreshedBoundaries.current.add(target);
          router.refresh();
        }
        return;
      }

      setCountdown(formatCountdown(target, now));
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [nextRolloverAt, router]);

  const previous = useMemo(() => {
    if (player.previousGame === undefined) return undefined;

    return {
      dateLabel: dayLabel(player.previousGame.dayKey),
      progressLabel:
        `${player.previousGame.solvedGroups}/4 grup bulundu · ` +
        `${player.previousGame.mistakesRemaining} hata hakkı`,
      href: player.previousGame.href,
    };
  }, [player.previousGame]);

  return (
    <HomeHero
      state={player.state}
      puzzleNumber={puzzleNumber}
      dateLabel={dateLabel}
      progressLabel={player.progressLabel}
      nextPuzzleLabel={countdown}
      previousGame={previous}
    />
  );
}
