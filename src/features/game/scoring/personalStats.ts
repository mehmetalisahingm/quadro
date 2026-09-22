import {
  GAME_CONSTANTS,
  type GameSnapshot,
  type GameStatus,
} from "@/features/game/contracts";

/** İstatistiğe giren terminal günlük sonuç. */
export type DailyGameResult = {
  /** Sonucun ait olduğu Türkiye yayın günü (YYYY-MM-DD). */
  dayKey: string;
  /** Sonucun ait olduğu bulmaca kimliği. */
  puzzleId: string;
  /** Sonucun ait olduğu içerik revizyonu. */
  puzzleRevision: number;
  /** Yalnız terminal durumlar kaydedilir. */
  outcome: Exclude<GameStatus, "playing">;
  /** O oyunda kullanılan hata hakkı (0–4). */
  mistakes: number;
};

/** Arayüzün doğrudan gösterebileceği kişisel istatistik özeti. */
export type PersonalStats = {
  played: number;
  won: number;
  lost: number;
  /** 0–100 aralığında yüzde. */
  winRate: number;
  /** En son tamamlanan sonuca kadar süren günlük kazanma serisi. */
  currentStreak: number;
  /** Cihazda kaydedilmiş en uzun günlük kazanma serisi. */
  longestStreak: number;
  /** Tamamlanan oyun başına kullanılan ortalama hata hakkı. */
  averageMistakes: number;
};

export const EMPTY_PERSONAL_STATS: Readonly<PersonalStats> = Object.freeze({
  played: 0,
  won: 0,
  lost: 0,
  winRate: 0,
  currentStreak: 0,
  longestStreak: 0,
  averageMistakes: 0,
});

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * YYYY-MM-DD yayın gününü saat diliminden bağımsız gün sıra numarasına çevirir.
 * Geçersiz tarih için null döner.
 */
export function publicationDayOrdinal(dayKey: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (match === null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const at = Date.UTC(year, month - 1, day);
  const value = new Date(at);

  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }

  return Math.floor(at / DAY_MS);
}

/** Terminal oyun durumunu günlük istatistik sonucuna çevirir. */
export function resultFromSnapshot(snapshot: GameSnapshot): DailyGameResult | null {
  if (snapshot.status === "playing") return null;
  if (publicationDayOrdinal(snapshot.dayKey) === null) return null;

  const mistakes = GAME_CONSTANTS.maxMistakes - snapshot.mistakesRemaining;
  if (!Number.isInteger(mistakes) || mistakes < 0 || mistakes > GAME_CONSTANTS.maxMistakes) {
    return null;
  }

  return {
    dayKey: snapshot.dayKey,
    puzzleId: snapshot.puzzleId,
    puzzleRevision: snapshot.puzzleRevision,
    outcome: snapshot.status,
    mistakes,
  };
}

/**
 * Günlük sonuçlardan kişisel istatistikleri üretir.
 *
 * Aynı yayın günü birden çok kez verilirse ilk sonuç esas alınır. Kalıcı depo
 * zaten bunu engeller; saf hesaplayıcı da tekrar girdisine karşı deterministiktir.
 *
 * Seri takvim günlerine göre hesaplanır: kayıp seriyi sıfırlar, iki sonuç
 * arasında bir gün bile boşluk varsa yeni kazanma serisi başlar. Bugünün henüz
 * oynanmamış olması seriyi erkenden sıfırlamaz; boşluk ancak daha sonraki bir
 * sonuç kaydedildiğinde kesinleşir.
 */
export function calculatePersonalStats(results: readonly DailyGameResult[]): PersonalStats {
  const byDay = new Map<string, { result: DailyGameResult; ordinal: number }>();

  for (const result of results) {
    const ordinal = publicationDayOrdinal(result.dayKey);
    if (ordinal === null || byDay.has(result.dayKey)) continue;
    byDay.set(result.dayKey, { result, ordinal });
  }

  const ordered = [...byDay.values()].sort((a, b) => a.ordinal - b.ordinal);
  if (ordered.length === 0) return { ...EMPTY_PERSONAL_STATS };

  let won = 0;
  let mistakes = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let previousOrdinal: number | null = null;
  let previousWon = false;

  for (const { result, ordinal } of ordered) {
    mistakes += result.mistakes;

    if (result.outcome === "won") {
      won += 1;
      currentStreak =
        previousWon && previousOrdinal !== null && ordinal === previousOrdinal + 1
          ? currentStreak + 1
          : 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      previousWon = true;
    } else {
      currentStreak = 0;
      previousWon = false;
    }

    previousOrdinal = ordinal;
  }

  const played = ordered.length;
  return {
    played,
    won,
    lost: played - won,
    winRate: (won / played) * 100,
    currentStreak,
    longestStreak,
    averageMistakes: mistakes / played,
  };
}
