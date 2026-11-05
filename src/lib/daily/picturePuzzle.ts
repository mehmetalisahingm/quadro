import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { pictureId, PICTURE_BOARD_COUNT } from "@/features/game/pictures";
import { hasErrors, parseDailyPuzzleFile, toPuzzle, validatePictureBoard } from "@/features/game/validator";

/** Yalnız istenen tahtayı istek anında sunucuda okur; diğer tahtalar istemciye gitmez. */
export async function loadPicturePuzzle(board: number) {
  if (!Number.isInteger(board) || board < 1 || board > PICTURE_BOARD_COUNT) return null;
  try {
    const raw = await readFile(join(/* turbopackIgnore: true */ process.cwd(), "src/content/pictures", `${board}.json`), "utf8");
    const value: unknown = JSON.parse(raw);
    const parsed = parseDailyPuzzleFile(value);
    if (!parsed.ok || hasErrors(validatePictureBoard(value))) return null;
    return parsed.file.status === "published" && parsed.file.id === pictureId(board) ? toPuzzle(parsed.file) : null;
  } catch {
    return null;
  }
}
