"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [player, setPlayer] = useState<HomeStateSnapshot>({ state: "new" });
  const [countdown, setCountdown] = useState(initialCountdownLabel);
  const reloadRequested = useRef(false);

  useEffect(() => {
    const storage = defaultSnapshotStorage();

    const sync = () => {
      setPlayer(resolveHomeState(storage, today));
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [today.dayKey, today.puzzleId, today.puzzleRevision]);

  useEffect(() => {
    const target = Date.parse(nextRolloverAt);
    if (!Number.isFinite(target)) return undefined;

    const tick = () => {
      const now = Date.now();
      if (now >= target) {
        setCountdown("Yeni gün hazır");

        // Sunucu yeni Europe/Istanbul yayın gününü ve yeni puzzle kimliğini
        // yeniden çözsün. Bir kez istenir; eski açık oyun localStorage'da
        // kaldığı için reload sonrası "dünün oyunu" kartına dönüşür.
        if (!reloadRequested.current) {
          reloadRequested.current = true;
          window.location.reload();
        }
        return;
      }

      setCountdown(formatCountdown(target, now));
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [nextRolloverAt]);

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
