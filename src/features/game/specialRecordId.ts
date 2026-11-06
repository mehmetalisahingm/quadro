import type { SpecialMode } from "@/features/game/specialEnergy";
/** Compact per-browser run identity, shared by coarse analytics and account results. */
export function specialRecordId(mode: SpecialMode, day: string, puzzleId: string, visitorId: string): string {
  const text = `${visitorId}:${puzzleId}`;
  let first = 2166136261, second = 2246822519;
  for (let i = 0; i < text.length; i++) {
    first = Math.imul(first ^ text.charCodeAt(i), 16777619);
    second = Math.imul(second ^ text.charCodeAt(i), 3266489917);
  }
  const hash = (first >>> 0).toString(16).padStart(8, "0") + (second >>> 0).toString(16).padStart(8, "0");
  const board = /(?:track-(?:easy|medium|balanced|hard)-\d{3})$/.exec(puzzleId)?.[0] ?? "board";
  return `s:${mode}:${day}:${hash}:${board}`;
}
