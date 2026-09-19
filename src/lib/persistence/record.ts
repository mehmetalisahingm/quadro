/**
 * Kayıt biçimi ve yapısal çözümleme (Q20).
 *
 * Depodaki metin **güvenilmez girdidir**: başka bir sürümün yazdığı, elle
 * kurcalanmış, yarım yazılmış ya da bambaşka bir uygulamaya ait olabilir. Bu
 * dosya ham metni `unknown` üzerinden daraltır; çıktısı ya tip güvenceli bir
 * {@link StoredGameRecord} ya da gerekçeli bir rettir. Hiçbir yol hata fırlatmaz.
 *
 * Buradaki denetim bulmacadan bağımsızdır: yalnız biçim ve tipler bakılır.
 * Kaydın bugünkü bulmacaya uyup uymadığı `compatibility.ts` içinde ayrıca
 * denetlenir.
 */

import {
  GAME_CONSTANTS,
  type Attempt,
  type Four,
  type GameSnapshot,
  type GameStatus,
  type WordId,
} from "@/features/game/contracts";

/**
 * Kaydın şema sürümü. `GameSnapshot.schemaVersion` ile aynı sayıdır: kaydedilen
 * şey durumun kendisidir, sarmalayıcı yalnız yazma anını taşır. Sürüm artarsa
 * eski kayıtlar {@link ParseFailure} ile reddedilir ve oyun taze başlar.
 */
export const SNAPSHOT_SCHEMA_VERSION = 1;

/** Depoya yazılan kayıt. */
export type StoredGameRecord = {
  /** Kaydın yazıldığı an (ISO-8601). Yalnız ayıklama ve destek içindir; kurala girmez. */
  savedAt: string;
  /** Kaydedilen oyun durumu. */
  snapshot: GameSnapshot;
};

/** Yapısal çözümlemenin başarısızlık nedenleri. */
export type ParseFailureReason =
  /** Metin geçerli JSON değil (yarım yazma, elle kurcalama, başka bir biçim). */
  | "malformed-json"
  /** JSON geçerli ama kayıt beklenen yapıda değil: alan eksik ya da tipi yanlış. */
  | "malformed-record"
  /** Kayıt başka bir şema sürümünden; alanları okumaya çalışmak anlamsız. */
  | "schema-mismatch";

/** {@link parseStoredRecord} sonucu. */
export type ParseResult =
  | { ok: true; record: StoredGameRecord }
  | { ok: false; reason: ParseFailureReason };

const ret = (reason: ParseFailureReason): ParseResult => ({ ok: false, reason });

/** Değer düz bir nesne mi? (Dizi ve `null` değil.) */
function isRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Boş olmayan metin mi? */
function isText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** `0 <= değer <= max` aralığında tam sayı mı? */
function isCount(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= max;
}

/** Tekrarsız, boş olmayan metinlerden oluşan dizi mi? */
function isDistinctTextList(value: unknown): value is string[] {
  if (!Array.isArray(value) || !value.every(isText)) return false;
  return new Set(value).size === value.length;
}

/** Oyunun yaşam döngüsü değerlerinden biri mi? */
function isGameStatus(value: unknown): value is GameStatus {
  return value === "playing" || value === "won" || value === "lost";
}

/** Geçmişe yazılabilen değerlendirmelerden biri mi? */
function isVerdict(value: unknown): value is Attempt["verdict"] {
  return value === "correct" || value === "one-away" || value === "wrong";
}

/** Tam dört tekrarsız kimlikten oluşan dörtlü mü? */
function toFourWordIds(value: unknown): Four<WordId> | null {
  if (!isDistinctTextList(value) || value.length !== GAME_CONSTANTS.groupSize) return null;

  const [a, b, c, d] = value;
  if (a === undefined || b === undefined || c === undefined || d === undefined) return null;
  return [a, b, c, d];
}

/** Tek bir tahmin kaydı; yapısı bozuksa `null`. */
function toAttempt(value: unknown): Attempt | null {
  if (!isRecordObject(value)) return null;
  if (!isText(value.id) || !isVerdict(value.verdict)) return null;

  const wordIds = toFourWordIds(value.wordIds);
  if (wordIds === null) return null;

  return { id: value.id, wordIds, verdict: value.verdict };
}

/** Tahmin geçmişi; herhangi bir kayıt bozuksa `null`. */
function toAttempts(value: unknown): Attempt[] | null {
  if (!Array.isArray(value)) return null;

  const attempts: Attempt[] = [];
  for (const entry of value) {
    const attempt = toAttempt(entry);
    if (attempt === null) return null;
    attempts.push(attempt);
  }
  return attempts;
}

/**
 * Ham nesneyi {@link GameSnapshot} olarak okur; alanlardan biri eksik ya da
 * yanlış tipteyse `null` döner. Alan sırası sözleşmedeki sırayla korunur ki
 * yeni bir alan eklendiğinde burada da unutulmasın.
 */
function toSnapshot(value: Record<string, unknown>): GameSnapshot | null {
  const {
    puzzleId,
    puzzleRevision,
    dayKey,
    status,
    selectedWordIds,
    remainingWordOrder,
    solvedGroupIds,
    mistakesRemaining,
    activeSeconds,
  } = value;

  if (!isText(puzzleId) || !isText(dayKey) || !isGameStatus(status)) return null;
  if (typeof puzzleRevision !== "number" || !Number.isInteger(puzzleRevision)) return null;
  if (!isDistinctTextList(selectedWordIds)) return null;
  if (selectedWordIds.length > GAME_CONSTANTS.groupSize) return null;
  if (!isDistinctTextList(remainingWordOrder) || !isDistinctTextList(solvedGroupIds)) return null;
  if (!isCount(mistakesRemaining, GAME_CONSTANTS.maxMistakes)) return null;
  if (typeof activeSeconds !== "number" || !Number.isFinite(activeSeconds) || activeSeconds < 0) {
    return null;
  }

  const attempts = toAttempts(value.attempts);
  if (attempts === null) return null;

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    puzzleId,
    puzzleRevision,
    dayKey,
    status,
    selectedWordIds,
    remainingWordOrder,
    solvedGroupIds,
    mistakesRemaining,
    attempts,
    activeSeconds,
  };
}

/**
 * Depodan okunan metni kayda çevirir.
 *
 * Sıra bilinçlidir: önce JSON, sonra sarmalayıcı, sonra şema sürümü, en sonda
 * alanlar. Şema sürümü tutmuyorsa alanlara hiç bakılmaz; başka bir sürümün
 * alanlarını "eksik" diye raporlamak yanıltıcı olurdu.
 */
export function parseStoredRecord(raw: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return ret("malformed-json");
  }

  if (!isRecordObject(value)) return ret("malformed-record");
  if (!isRecordObject(value.snapshot)) return ret("malformed-record");
  if (value.snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION) return ret("schema-mismatch");

  const snapshot = toSnapshot(value.snapshot);
  if (snapshot === null) return ret("malformed-record");

  return {
    ok: true,
    record: { savedAt: isText(value.savedAt) ? value.savedAt : "", snapshot },
  };
}

/** Durumu depoya yazılacak metne çevirir. */
export function serializeRecord(snapshot: GameSnapshot, savedAt: string): string {
  const record: StoredGameRecord = { savedAt, snapshot };
  return JSON.stringify(record);
}
