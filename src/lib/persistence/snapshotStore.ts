/**
 * Oyun kaydının okunması ve yazılması (Q20).
 *
 * Katmanın dışa açık kapısıdır: depo (`storage.ts`), biçim (`record.ts`) ve
 * uyumluluk (`compatibility.ts`) burada birleşir. İki söz verir:
 *
 * 1. **Hata fırlatmaz.** Bozuk JSON, eski şema, başka günün kaydı, kapalı depo —
 *    hepsi tipli bir sonuç döner. Çağıran "kayıt yok" ile "kayıt reddedildi"
 *    arasını ayırabilir ama ikisinde de oyun taze başlar.
 * 2. **Geçmiş sonucu korur.** Bitmiş bir oyunun kaydı, aynı bulmaca için taze
 *    bir `playing` durumuyla ezilmez; bkz. {@link saveSnapshot}.
 *
 * Kayıt güne özgü bir anahtarda tutulur ({@link snapshotStorageKey}). Gün
 * anahtarı istemcinin saatinden değil, sunucunun çözdüğü yayın gününden gelir
 * (bkz. `src/lib/daily/publicationDay.ts`); cihaz saati ileri alınmış bir
 * oyuncu böylece yarının kaydını bugüne yazamaz.
 */

import type { GameSnapshot, Puzzle } from "@/features/game/contracts";

import { checkCompatibility, type IncompatibleReason } from "./compatibility";
import { parseStoredRecord, serializeRecord, type ParseFailureReason } from "./record";
import { defaultSnapshotStorage, type SnapshotStorage } from "./storage";

/** Kayıt anahtarlarının ortak öneki; şema sürümü anahtarın içindedir. */
export const STORAGE_KEY_PREFIX = "quadro:save:v1";

/** Günün kaydının anahtarı. */
export function snapshotStorageKey(dayKey: string): string {
  return `${STORAGE_KEY_PREFIX}:${dayKey}`;
}

/**
 * En son yazılan günü tutan işaretçi.
 *
 * Anahtar güne özgü olduğu için her yeni gün yeni bir kayıt açar; eskisi
 * kendiliğinden düşmez. Depo arayüzü anahtarları listelemediğinden (ve
 * listelemesi de gerekmediğinden) son gün burada saklanır ve gün dönünce
 * dünün kaydı silinir. Böylece depoda tek bir oyun kaydı kalır.
 */
export const LAST_DAY_KEY = `${STORAGE_KEY_PREFIX}:last-day`;

/** Kaydın uygulanmama nedeni: biçim hatası ya da bulmacayla uyumsuzluk. */
export type RejectionReason = ParseFailureReason | IncompatibleReason;

/** {@link loadSnapshot} sonucu. */
export type LoadResult =
  /** Kayıt uygundu; oyun bu durumdan sürer. */
  | { status: "restored"; snapshot: GameSnapshot }
  /** Bu gün için kayıt yok. */
  | { status: "empty" }
  /** Kayıt vardı ama uygulanamadı; oyun taze başlar. */
  | { status: "rejected"; reason: RejectionReason };

/** {@link saveSnapshot} sonucu. */
export type SaveResult =
  /** Durum yazıldı. */
  | { status: "saved" }
  /** Yazılmadı: depodaki bitmiş oyun korundu. */
  | { status: "kept-result" }
  /** Yazılamadı; depo kapalı ya da beklenmedik bir hata verdi. */
  | { status: "failed" };

/** Kayıt okuma/yazma seçenekleri. */
export type SnapshotStoreOptions = {
  /** Bugün oynanan bulmaca. */
  puzzle: Puzzle;
  /** Yayın günü; varsayılanı bulmacanın kendi günüdür. */
  dayKey?: string;
  /** Kayıt arka ucu; varsayılanı tarayıcı deposudur (sunucuda no-op). */
  storage?: SnapshotStorage;
};

/**
 * Günün kaydını okur ve yalnız bugünkü bulmacaya uygulanabiliyorsa döndürür.
 *
 * Reddedilen kayıt depodan silinir: uygulanamayacağı kesindir ve her açılışta
 * yeniden çözümlenmesinin faydası yoktur. Silme başarısız olsa da sonuç
 * değişmez, kayıt zaten yok sayılır.
 */
export function loadSnapshot({
  puzzle,
  dayKey = puzzle.date,
  storage = defaultSnapshotStorage(),
}: SnapshotStoreOptions): LoadResult {
  const key = snapshotStorageKey(dayKey);

  let raw: string | null;
  try {
    raw = storage.getItem(key);
  } catch {
    // Arka uç okumada patladıysa kayıt yok sayılır; oyun taze başlar.
    return { status: "empty" };
  }
  if (raw === null) return { status: "empty" };

  const parsed = parseStoredRecord(raw);
  if (!parsed.ok) return reject(storage, key, parsed.reason);

  const compatibility = checkCompatibility(puzzle, dayKey, parsed.record.snapshot);
  if (!compatibility.ok) return reject(storage, key, compatibility.reason);

  return { status: "restored", snapshot: parsed.record.snapshot };
}

/** Uygulanamayan kaydı siler ve gerekçeyi döndürür. */
function reject(storage: SnapshotStorage, key: string, reason: RejectionReason): LoadResult {
  try {
    storage.removeItem(key);
  } catch {
    // Silinemedi; kayıt her açılışta yeniden reddedilir, oyun yine taze başlar.
  }
  return { status: "rejected", reason };
}

/** {@link saveSnapshot} seçenekleri. */
export type SaveSnapshotOptions = {
  /** Kayıt arka ucu; varsayılanı tarayıcı deposudur (sunucuda no-op). */
  storage?: SnapshotStorage;
  /** Kaydın yazıldığı an; varsayılanı gerçek saattir. */
  now?: Date;
};

/**
 * Durumu günün anahtarına yazar.
 *
 * Tek kuralı vardır: **bitmiş oyunun sonucu ezilmez.** Depoda aynı bulmacanın
 * aynı gününe ait `won`/`lost` bir kayıt varken taze bir `playing` durumu
 * yazılmak istenirse yazma yapılmaz ve `kept-result` döner. Kabul ölçütündeki
 * "iki kez bitiş işlenmesi engelleniyor" maddesinin kalıcılık tarafı budur:
 * geri yükleme bir nedenle atlanıp tahta sıfırdan kurulsa bile oyuncunun
 * bugünkü sonucu ve istatistiği depoda olduğu gibi kalır.
 *
 * Bitmiş oyunun kendi durumunu yeniden yazması (aynı sonuç) serbesttir; kural
 * yalnız terminal durumdan `playing`e dönüşü engeller.
 */
export function saveSnapshot(
  snapshot: GameSnapshot,
  { storage = defaultSnapshotStorage(), now = new Date() }: SaveSnapshotOptions = {},
): SaveResult {
  const key = snapshotStorageKey(snapshot.dayKey);

  try {
    if (snapshot.status === "playing" && hasStoredResult(storage, key, snapshot)) {
      return { status: "kept-result" };
    }

    storage.setItem(key, serializeRecord(snapshot, now.toISOString()));
    pruneOtherDays(storage, snapshot.dayKey);
    return { status: "saved" };
  } catch {
    return { status: "failed" };
  }
}

/**
 * Depoda aynı bulmacanın aynı gününe ait bitmiş bir oyun var mı?
 *
 * Yalnız okunabilen ve aynı bulmacaya ait kayıtlar korunur; bozuk ya da başka
 * bir bulmacanın kaydı yeni durumun üzerine yazılmasını engellemez.
 */
function hasStoredResult(storage: SnapshotStorage, key: string, next: GameSnapshot): boolean {
  const raw = storage.getItem(key);
  if (raw === null) return false;

  const parsed = parseStoredRecord(raw);
  if (!parsed.ok) return false;

  const stored = parsed.record.snapshot;
  return (
    stored.status !== "playing" &&
    stored.puzzleId === next.puzzleId &&
    stored.puzzleRevision === next.puzzleRevision &&
    stored.dayKey === next.dayKey
  );
}

/** Gün dönmüşse önceki günün kaydını siler ve işaretçiyi günceller. */
function pruneOtherDays(storage: SnapshotStorage, dayKey: string): void {
  const previous = storage.getItem(LAST_DAY_KEY);
  if (previous === dayKey) return;

  if (previous !== null) storage.removeItem(snapshotStorageKey(previous));
  storage.setItem(LAST_DAY_KEY, dayKey);
}

/** Günün kaydını siler. Kayıt yoksa etkisizdir. */
export function clearSnapshot(
  dayKey: string,
  storage: SnapshotStorage = defaultSnapshotStorage(),
): void {
  try {
    storage.removeItem(snapshotStorageKey(dayKey));
  } catch {
    // Silinemeyen kayıt uyumluluk denetiminden geçmiyorsa zaten uygulanmaz.
  }
}
