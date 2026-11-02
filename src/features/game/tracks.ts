import { resolveGameDifficulty, type GameDifficulty } from "./difficulty";

export const TRACK_LEVEL_COUNT = 12;
export const TRACKS = [
  { id: "easy", label: "Kolay", description: "Günlük nesneler ve doğrudan kategoriler." },
  { id: "medium", label: "Orta", description: "Çift anlamlar ve ortak kullanımlar." },
  { id: "hard", label: "Zor", description: "Tanıdık temalar ve anlaşılır kelime bağlantıları." },
  { id: "ultra", label: "Ultra Zor", description: "Örtük çağrışımlar, harf oyunları ve çetin bağlantılar." },
] as const;
/** Former hard boards retain their IDs, so progress follows them into Ultra Zor. */
export function trackContentStem(mode: GameDifficulty): string {
  return mode === "ultra" ? "hard" : mode === "hard" ? "balanced" : mode;
}
export function trackPuzzleId(mode: GameDifficulty, level: number): string {
  return `track-${trackContentStem(mode)}-${String(level).padStart(3, "0")}`;
}
export function trackIdentity(id: string): { difficulty: GameDifficulty; level: number } | null {
  const match = /^track-(easy|medium|balanced|hard)-(\d{3})$/.exec(id);
  if (!match) return null;
  const level = Number(match[2]);
  const difficulty = match[1] === "balanced" ? "hard" : match[1] === "hard" ? "ultra" : resolveGameDifficulty(match[1]);
  return level >= 1 && level <= TRACK_LEVEL_COUNT ? { difficulty, level } : null;
}
export function trackHref(mode: GameDifficulty, level = 1): string {
  return `/play?difficulty=${mode}&level=${level}`;
}
export function trackDay(level: number): string {
  return new Date(Date.UTC(2026, 9, 4 + level)).toISOString().slice(0, 10);
}
