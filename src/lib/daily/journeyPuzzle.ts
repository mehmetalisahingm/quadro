import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseDailyPuzzleFile, toPuzzle } from "@/features/game/validator";
import { journeyId, JOURNEY_LENGTH } from "@/features/game/journey";
export async function loadJourneyPuzzle(step: number) {
  if (!Number.isInteger(step) || step < 1 || step > JOURNEY_LENGTH) return null;
  try {
    const raw = await readFile(join(/* turbopackIgnore: true */ process.cwd(), "src/content/journey", `${step}.json`), "utf8");
    const parsed = parseDailyPuzzleFile(JSON.parse(raw));
    return parsed.ok && parsed.file.status === "published" && parsed.file.id === journeyId(step) ? toPuzzle(parsed.file) : null;
  } catch { return null; }
}
