import type { GameSnapshot } from "@/features/game/contracts";
import { parseStoredRecord } from "@/lib/persistence/record";
import { LAST_DAY_KEY, snapshotStorageKey } from "@/lib/persistence/snapshotStore";
import type { SnapshotStorage } from "@/lib/persistence/storage";

export type HomePlayerState = "new" | "in-progress" | "completed";

export type HomePuzzleIdentity = {
  dayKey: string;
  puzzleId: string | null;
  puzzleRevision: number | null;
};

export type PreviousGameSummary = {
  dayKey: string;
  solvedGroups: number;
  mistakesRemaining: number;
  href: string;
};

export type HomeStateSnapshot = {
  state: HomePlayerState;
  progressLabel?: string;
  previousGame?: PreviousGameSummary;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function calendarOrdinal(dayKey: string): number | null {
  const match = DATE_RE.exec(dayKey);
  if (match === null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const at = Date.UTC(year, month - 1, day);
  const value = new Date(at);

  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }

  return Math.floor(at / 86_400_000);
}

export function previousCalendarDay(dayKey: string): string | null {
  const ordinal = calendarOrdinal(dayKey);
  if (ordinal === null) return null;
  return new Date((ordinal - 1) * 86_400_000).toISOString().slice(0, 10);
}

function readSnapshot(storage: SnapshotStorage, dayKey: string): GameSnapshot | null {
  let raw: string | null;
  try {
    raw = storage.getItem(snapshotStorageKey(dayKey));
  } catch {
    return null;
  }

  if (raw === null) return null;
  const parsed = parseStoredRecord(raw);
  return parsed.ok ? parsed.record.snapshot : null;
}

function matchesToday(snapshot: GameSnapshot, today: HomePuzzleIdentity): boolean {
  if (snapshot.dayKey !== today.dayKey) return false;

  if (today.puzzleId !== null && snapshot.puzzleId !== today.puzzleId) return false;
  if (
    today.puzzleRevision !== null &&
    snapshot.puzzleRevision !== today.puzzleRevision
  ) {
    return false;
  }

  return true;
}

function progressOf(snapshot: GameSnapshot): string {
  return `${snapshot.solvedGroupIds.length}/4 grup bulundu · ${snapshot.mistakesRemaining} hata hakkı`;
}

function previousGame(
  storage: SnapshotStorage,
  today: HomePuzzleIdentity,
): PreviousGameSummary | undefined {
  const yesterday = previousCalendarDay(today.dayKey);
  if (yesterday === null) return undefined;

  let lastDay: string | null;
  try {
    lastDay = storage.getItem(LAST_DAY_KEY);
  } catch {
    return undefined;
  }

  // Q23 yalnız gece yarısı geçişini korur; arşiv ilk sürüm kapsamı değildir.
  if (lastDay !== yesterday) return undefined;

  const snapshot = readSnapshot(storage, yesterday);
  if (snapshot === null || snapshot.dayKey !== yesterday || snapshot.status !== "playing") {
    return undefined;
  }

  return {
    dayKey: yesterday,
    solvedGroups: snapshot.solvedGroupIds.length,
    mistakesRemaining: snapshot.mistakesRemaining,
    href: `/play?day=${encodeURIComponent(yesterday)}`,
  };
}

export function resolveHomeState(
  storage: SnapshotStorage,
  today: HomePuzzleIdentity,
): HomeStateSnapshot {
  const previous = previousGame(storage, today);
  const current = readSnapshot(storage, today.dayKey);

  if (current === null || !matchesToday(current, today)) {
    return previous === undefined ? { state: "new" } : { state: "new", previousGame: previous };
  }

  if (current.status === "playing") {
    return {
      state: "in-progress",
      progressLabel: progressOf(current),
      ...(previous === undefined ? {} : { previousGame: previous }),
    };
  }

  return {
    state: "completed",
    progressLabel:
      current.status === "won"
        ? `4/4 grup bulundu · ${4 - current.mistakesRemaining} hata`
        : `${current.solvedGroupIds.length}/4 grup bulundu · 4 hata`,
    ...(previous === undefined ? {} : { previousGame: previous }),
  };
}

export function formatCountdown(targetMs: number, nowMs: number): string {
  const remaining = Math.max(0, targetMs - nowMs);
  const totalMinutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")} sa ${String(minutes).padStart(2, "0")} dk`;
}
