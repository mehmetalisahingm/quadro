import { resolveGameDifficulty, type GameDifficulty } from "./difficulty";

export const TRACK_LEVEL_COUNT = 6;
export const TRACKS = [
  { id: "easy", label: "Kolay", description: "Günlük nesneler ve doğrudan kategoriler." },
  { id: "medium", label: "Orta", description: "Çift anlamlar ve ortak kullanımlar." },
  { id: "hard", label: "Zor", description: "Saklı sözcükler ve dil oyunları." },
] as const;
export function trackPuzzleId(mode: GameDifficulty, level: number): string {
  return `track-${mode}-${String(level).padStart(3, "0")}`;
}
export function trackIdentity(id: string): { difficulty: GameDifficulty; level: number } | null {
  const match = /^track-(easy|medium|hard)-(\d{3})$/.exec(id);
  if (!match) return null;
  const level = Number(match[2]);
  return level >= 1 && level <= TRACK_LEVEL_COUNT ? { difficulty: resolveGameDifficulty(match[1]), level } : null;
}
export function trackHref(mode: GameDifficulty, level = 1): string {
  return `/play?difficulty=${mode}&level=${level}`;
}
export function trackDay(level: number): string {
  return new Date(Date.UTC(2026, 9, 4 + level)).toISOString().slice(0, 10);
}
