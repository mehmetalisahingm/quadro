/**
 * Günlük bulmaca yükleyicisi (Q19).
 *
 * Sunucuda çalışır ve bir istek için **yalnız o günün** içerik dosyasını okur:
 * `${contentDir}/${dayKey}.json`. İçerik bilerek statik olarak içe aktarılmaz
 * (`import ... from "@/content/puzzles/..."`); statik içe aktarım tüm günleri paket
 * grafiğine sokar ve yarının cevapları bugün istemciye sızabilir. Dosya sistemi
 * okuması bu sızıntıyı yapısal olarak imkânsız kılar: bir gün, bir dosya.
 */

import { readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import type { Puzzle } from "@/features/game/contracts";
import { parseDailyPuzzleFile, toPuzzle, type ValidationIssue } from "@/features/game/validator";

import { isPublicationDayKey, resolvePublicationDay } from "./publicationDay";

export const CONTENT_DIR_ENV_VAR = "QUADRO_CONTENT_DIR";
export const DEFAULT_CONTENT_DIR = "src/content/puzzles";
export const PUBLISHED_STATUS = "published";

export type DailyMissingReason = "no-content" | "not-published" | "invalid-content" | "unreadable";

export type DailyPuzzleState =
  | {
      status: "loading";
      dayKey: string;
    }
  | {
      status: "ok";
      dayKey: string;
      puzzle: Puzzle;
      source: string;
    }
  | {
      status: "missing";
      dayKey: string;
      reason: DailyMissingReason;
      detail: string;
      issues: ValidationIssue[];
    };

export function loadingState(dayKey: string): DailyPuzzleState {
  return { status: "loading", dayKey };
}

function missing(
  dayKey: string,
  reason: DailyMissingReason,
  detail: string,
  issues: ValidationIssue[] = [],
): DailyPuzzleState {
  return { status: "missing", dayKey, reason, detail, issues };
}

export function resolveContentDir(override?: string): string {
  const configured = override ?? process.env[CONTENT_DIR_ENV_VAR];
  const directory =
    configured !== undefined && configured.trim().length > 0
      ? configured.trim()
      : DEFAULT_CONTENT_DIR;

  return isAbsolute(directory)
    ? directory
    : resolve(/* turbopackIgnore: true */ process.cwd(), directory);
}

export type LoadDailyPuzzleOptions = {
  now?: Date;
  dayKey?: string;
  contentDir?: string;
  /**
   * Geçici test/arşiv akışlarında doğrulanmış `draft` içeriği açar.
   * Varsayılan false kalır; normal günlük yayın kapısı değişmez.
   */
  includeDrafts?: boolean;
};

export async function loadDailyPuzzle(
  options: LoadDailyPuzzleOptions = {},
): Promise<DailyPuzzleState> {
  const dayKey = options.dayKey ?? resolvePublicationDay({ now: options.now });

  if (!isPublicationDayKey(dayKey)) {
    return missing(
      dayKey,
      "invalid-content",
      `Gün anahtarı takvimde var olan bir YYYY-MM-DD günü değil: ${dayKey}`,
    );
  }

  const fileName = `${dayKey}.json`;
  const filePath = join(resolveContentDir(options.contentDir), fileName);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return missing(dayKey, "no-content", `Bu güne ait içerik dosyası yok: ${fileName}`);
    }
    return missing(dayKey, "unreadable", `İçerik dosyası okunamadı (${fileName}): ${String(error)}`);
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    return missing(dayKey, "invalid-content", `İçerik dosyası geçerli JSON değil: ${fileName}`, [
      {
        code: "json-parse",
        severity: "error",
        path: ".",
        message: `Dosya okunamadı veya geçerli JSON değil: ${String(error)}`,
        source: fileName,
      },
    ]);
  }

  const parsed = parseDailyPuzzleFile(value);
  if (!parsed.ok) {
    return missing(
      dayKey,
      "invalid-content",
      `İçerik dosyası şemaya uymuyor: ${fileName}`,
      parsed.issues.map((issue) => ({ ...issue, source: fileName })),
    );
  }

  if (parsed.file.date !== dayKey) {
    return missing(dayKey, "invalid-content", "Dosya adı ile date alanı farklı gün gösteriyor", [
      {
        code: "file-date-mismatch",
        severity: "error",
        path: "date",
        message: `Dosya adı ile date alanı farklı gün gösteriyor: ${fileName} ≠ ${parsed.file.date}`,
        source: fileName,
      },
    ]);
  }

  if (!options.includeDrafts && parsed.file.status !== PUBLISHED_STATUS) {
    return missing(
      dayKey,
      "not-published",
      `İçerik yayına açılmamış (status: ${parsed.file.status}): ${fileName}`,
    );
  }

  return { status: "ok", dayKey, puzzle: toPuzzle(parsed.file), source: fileName };
}

export function puzzleNumberFromId(id: string): number | null {
  const match = /(\d+)\s*$/.exec(id);
  if (match === null) return null;

  const captured = match[1];
  if (captured === undefined) return null;

  const value = Number.parseInt(captured, 10);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
