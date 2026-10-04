/** Shared bounds for the playable archive and the admin chapter selector. */
export const GAME_ARCHIVE_START = "2026-09-20";
export const GAME_ARCHIVE_END = "2026-10-19";

export function archiveDayOffset(day: string, offset: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);
}

export const GAME_ARCHIVE_DAYS = Array.from(
  { length: Math.round((Date.parse(GAME_ARCHIVE_END) - Date.parse(GAME_ARCHIVE_START)) / 86_400_000) + 1 },
  (_, index) => archiveDayOffset(GAME_ARCHIVE_START, index),
);
