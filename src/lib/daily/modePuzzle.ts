import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseDailyPuzzleFile, toPuzzle } from "@/features/game/validator";
import type { GameDifficulty } from "@/features/game/difficulty";
import { TRACK_LEVEL_COUNT, trackPuzzleId } from "@/features/game/tracks";

export async function loadModePuzzle(mode: GameDifficulty, level: number) {
  if (!["easy", "medium", "hard"].includes(mode) || !Number.isInteger(level) || level < 1 || level > TRACK_LEVEL_COUNT) return null;
  try {
    const raw = await readFile(join(/* turbopackIgnore: true */ process.cwd(), "src/content/modes", `${mode}-${level}.json`), "utf8");
    const parsed = parseDailyPuzzleFile(JSON.parse(raw));
    return parsed.ok && parsed.file.status === "published" && parsed.file.id === trackPuzzleId(mode, level) ? toPuzzle(parsed.file) : null;
  } catch { return null; }
}
