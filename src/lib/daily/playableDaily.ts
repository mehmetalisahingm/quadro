import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseDailyPuzzleFile, toPuzzle } from "@/features/game/validator";
import { loadDailyPuzzle, type LoadDailyPuzzleOptions, type DailyPuzzleState } from "./dailyPuzzle";
import { resolvePublicationDay, isPublicationDayKey } from "./publicationDay";
import reserve from "@/content/daily-reserve.json";

/** Published daily content always wins. Reserve selections are labelled, never drafts. */
export async function loadPlayableDaily(options: LoadDailyPuzzleOptions & { reserveDir?: string } = {}): Promise<DailyPuzzleState> {
  const dayKey = options.dayKey ?? resolvePublicationDay({ now: options.now });
  const scheduled = await loadDailyPuzzle({ ...options, dayKey, includeDrafts: false });
  if (scheduled.status === "ok" || !isPublicationDayKey(dayKey)) return scheduled;
  // Fixture/custom content environments must explicitly opt into a reserve.
  if (!options.reserveDir && (options.contentDir || process.env.QUADRO_CONTENT_DIR)) return scheduled;
  const directory = options.reserveDir ?? join(/* turbopackIgnore: true */ process.cwd(), "src/content/modes");
  try {
    const files = reserve.files;
    const ordinal = Math.floor((Date.parse(`${dayKey}T00:00:00Z`) - Date.parse(`${reserve.anchor}T00:00:00Z`)) / 86_400_000);
    const start = ((ordinal % files.length) + files.length) % files.length;
    for (let offset = 0; offset < files.length; offset++) {
      const name = files[(start + offset) % files.length]!;
      try {
        const parsed = parseDailyPuzzleFile(JSON.parse(await readFile(join(directory, name), "utf8")));
        if (!parsed.ok || parsed.file.status !== "published") continue;
        const puzzle = toPuzzle(parsed.file);
        return { status: "ok", dayKey, source: `reserve:${parsed.file.id}`,
          puzzle: { ...puzzle, id: `daily-${dayKey}-${parsed.file.id}`, date: dayKey } };
      } catch { /* A damaged reserve entry must not take down the entire day. */ }
    }
    return scheduled;
  } catch { return scheduled; }
}
