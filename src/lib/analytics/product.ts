/**
 * PostHog'a giden ürün olayları. Kişisel veri, kelime, grup adı ya da cevap taşımaz:
 * her alan kapalı bir küme ya da sayıdır ve `sanitizeProductProperties` dışarıdan
 * gelen her şeyi yeniden kurar.
 */

import { journeyStep } from "@/features/game/journey";
import { pictureBoardNumber } from "@/features/game/pictures";
import { trackIdentity } from "@/features/game/tracks";

export type ProductMode =
  | "daily"
  | "easy"
  | "medium"
  | "hard"
  | "ultra"
  | "journey"
  | "pictures";

export type PuzzleContext = { mode: ProductMode; level?: number; day?: string };

export type ProductEventProperties = {
  puzzle_start: PuzzleContext & { resumed: boolean };
  puzzle_complete: PuzzleContext & {
    result: "won" | "lost";
    mistakes: number;
    duration_s: number;
    hints_used: number;
  };
  share_click: PuzzleContext & { method: "share" | "copy" };
  hint_used: PuzzleContext & { hint_index: number };
};

export type ProductEventName = keyof ProductEventProperties;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Bulmaca kimliğinden mod ve bölüm/gün; içerikten hiçbir şey okumaz. */
export function puzzleContext(puzzle: { id: string; date: string }): PuzzleContext {
  const track = trackIdentity(puzzle.id);
  if (track) return { mode: track.difficulty, level: track.level };
  const step = journeyStep(puzzle.id);
  if (step !== null) return { mode: "journey", level: step };
  const board = pictureBoardNumber(puzzle.id);
  if (board !== null) return { mode: "pictures", level: board };
  return DAY_KEY.test(puzzle.date) ? { mode: "daily", day: puzzle.date } : { mode: "daily" };
}

const MODES = new Set<ProductMode>(["daily", "easy", "medium", "hard", "ultra", "journey", "pictures"]);

function count(value: unknown, max: number): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max ? value : undefined;
}

/**
 * Bir olayın özelliklerini izin verilen alanlardan yeniden kurar. Tanınmayan alan,
 * uzun metin ya da yanlış tür sessizce düşer; bu sayede çağıran taraftaki bir hata
 * bile cevap metnini PostHog'a taşıyamaz.
 */
export function sanitizeProductProperties<N extends ProductEventName>(
  name: N,
  properties: ProductEventProperties[N],
): Record<string, string | number | boolean> {
  const raw = properties as Record<string, unknown>;
  const out: Record<string, string | number | boolean> = {};
  if (typeof raw.mode === "string" && MODES.has(raw.mode as ProductMode)) out.mode = raw.mode;
  const level = count(raw.level, 999);
  if (level !== undefined && level > 0) out.level = level;
  if (typeof raw.day === "string" && DAY_KEY.test(raw.day)) out.day = raw.day;

  switch (name) {
    case "puzzle_start":
      if (typeof raw.resumed === "boolean") out.resumed = raw.resumed;
      break;
    case "puzzle_complete": {
      if (raw.result === "won" || raw.result === "lost") out.result = raw.result;
      const mistakes = count(raw.mistakes, 100);
      if (mistakes !== undefined) out.mistakes = mistakes;
      const duration = count(raw.duration_s, 86_400);
      if (duration !== undefined) out.duration_s = duration;
      const hints = count(raw.hints_used, 16);
      if (hints !== undefined) out.hints_used = hints;
      break;
    }
    case "share_click":
      if (raw.method === "share" || raw.method === "copy") out.method = raw.method;
      break;
    case "hint_used": {
      const index = count(raw.hint_index, 16);
      if (index !== undefined) out.hint_index = index;
      break;
    }
  }
  return out;
}
