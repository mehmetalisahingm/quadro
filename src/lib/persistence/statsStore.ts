/**
 * Cihaz bazlı kişisel istatistik kaydı (Q22).
 *
 * Oyun ilerlemesi güne özgü ayrı anahtarlarda tutulur; istatistik ise terminal
 * günlük sonuçların küçük bir defteridir. Defter yalnız yayın gününü ve sonucu
 * saklar, hesaplanan değerleri saklamaz. Böylece seri, kazanma oranı ve ortalama
 * hata her okumada tek bir saf kaynaktan yeniden üretilir.
 */

import type { GameSnapshot } from "@/features/game/contracts";
import {
  calculatePersonalStats,
  EMPTY_PERSONAL_STATS,
  publicationDayOrdinal,
  resultFromSnapshot,
  type DailyGameResult,
  type PersonalStats,
} from "@/features/game/scoring";

import { defaultSnapshotStorage, type SnapshotStorage } from "./storage";

export const STATS_SCHEMA_VERSION = 1;
export const STATS_STORAGE_KEY = `quadro:stats:v${STATS_SCHEMA_VERSION}`;

type StoredStatsRecord = {
  schemaVersion: typeof STATS_SCHEMA_VERSION;
  results: DailyGameResult[];
};

export type StatsLoadResult = {
  /** empty: hiç kayıt yok; loaded: sağlam kayıt; recovered: bozuk kayıt silindi. */
  status: "empty" | "loaded" | "recovered";
  results: DailyGameResult[];
  stats: PersonalStats;
};

export type RecordTerminalResult =
  | { status: "recorded"; stats: PersonalStats }
  | { status: "duplicate"; stats: PersonalStats }
  | { status: "ignored"; stats: PersonalStats }
  | { status: "failed"; stats: PersonalStats };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDailyResult(value: unknown): DailyGameResult | null {
  if (!isRecord(value)) return null;

  const { dayKey, puzzleId, puzzleRevision, outcome, mistakes } = value;
  if (typeof dayKey !== "string" || publicationDayOrdinal(dayKey) === null) return null;
  if (typeof puzzleId !== "string" || puzzleId.length === 0) return null;
  if (
    typeof puzzleRevision !== "number" ||
    !Number.isInteger(puzzleRevision) ||
    puzzleRevision < 0
  ) {
    return null;
  }
  if (outcome !== "won" && outcome !== "lost") return null;
  if (
    typeof mistakes !== "number" ||
    !Number.isInteger(mistakes) ||
    mistakes < 0 ||
    mistakes > 4
  ) {
    return null;
  }

  return { dayKey, puzzleId, puzzleRevision, outcome, mistakes };
}

function parseStats(raw: string): DailyGameResult[] | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(value) || value.schemaVersion !== STATS_SCHEMA_VERSION) return null;
  if (!Array.isArray(value.results)) return null;

  const results: DailyGameResult[] = [];
  const days = new Set<string>();

  for (const entry of value.results) {
    const result = toDailyResult(entry);
    if (result === null || days.has(result.dayKey)) return null;
    days.add(result.dayKey);
    results.push(result);
  }

  return results;
}

function emptyLoad(status: "empty" | "recovered"): StatsLoadResult {
  return { status, results: [], stats: { ...EMPTY_PERSONAL_STATS } };
}

/**
 * Cihazdaki kişisel istatistik defterini okur.
 *
 * Bozuk kayıt yalnız istatistik anahtarından silinir; günlük oyun kaydına
 * dokunulmaz. Bu davranış veri kaybını istatistikle sınırlar ve oyunu hiçbir
 * durumda açılmaz hale getirmez.
 */
export function loadPersonalStats(
  storage: SnapshotStorage = defaultSnapshotStorage(),
): StatsLoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STATS_STORAGE_KEY);
  } catch {
    return emptyLoad("empty");
  }

  if (raw === null) return emptyLoad("empty");

  const results = parseStats(raw);
  if (results === null) {
    try {
      storage.removeItem(STATS_STORAGE_KEY);
    } catch {
      // Silinemese de bozuk kayıt bu okumada kullanılmaz.
    }
    return emptyLoad("recovered");
  }

  return {
    status: "loaded",
    results,
    stats: calculatePersonalStats(results),
  };
}

/**
 * Terminal sonucu istatistik defterine en fazla bir kez yazar.
 *
 * Kimlik yayın günüdür. Aynı gün terminal snapshot tekrar kaydedilse, sayfa
 * yenilense veya bitmiş oyun yeniden açılsa bile ikinci kayıt oluşmaz.
 */
export function recordTerminalResult(
  snapshot: GameSnapshot,
  storage: SnapshotStorage = defaultSnapshotStorage(),
): RecordTerminalResult {
  const loaded = loadPersonalStats(storage);
  const result = resultFromSnapshot(snapshot);
  if (result === null) return { status: "ignored", stats: loaded.stats };

  if (loaded.results.some((entry) => entry.dayKey === result.dayKey)) {
    return { status: "duplicate", stats: loaded.stats };
  }

  const results = [...loaded.results, result].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  const record: StoredStatsRecord = { schemaVersion: STATS_SCHEMA_VERSION, results };

  try {
    storage.setItem(STATS_STORAGE_KEY, JSON.stringify(record));
  } catch {
    return { status: "failed", stats: loaded.stats };
  }

  return { status: "recorded", stats: calculatePersonalStats(results) };
}
