/**
 * Kaydedilmiş oyunun motora bağlanması: saf taraf (Q20).
 *
 * Kalıcılık katmanı "bu kayıt uygulanabilir mi?" sorusunu yanıtlar; burası
 * yanıtı motorun anladığı dile çevirir: başlangıç durumu ya kayıttan gelir ya
 * da `undefined` kalır ve motor taze tahta kurar. React içermez, bu yüzden
 * bellekteki depoyla tek başına test edilir.
 */

import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import {
  loadSnapshot,
  saveSnapshot,
  type RejectionReason,
  type SnapshotStorage,
} from "@/lib/persistence";

/** Geri yükleme denemesinin sonucu; arayüz gerekirse bunu gösterebilir. */
export type GameRestoreState =
  /** Kayıt henüz okunmadı: sunucu render'ı ve istemcinin ilk render'ı. */
  | { status: "pending" }
  /** Bu gün için kayıt yoktu; oyun baştan başlıyor. */
  | { status: "fresh" }
  /** Kayıt uygulandı; oyun kaldığı yerden sürüyor. */
  | { status: "restored" }
  /** Kayıt vardı ama uygulanamadı; oyun baştan başlıyor. */
  | { status: "discarded"; reason: RejectionReason };

/** Oyunun hangi durumdan açılacağı ve nedeni. */
export type PersistedGameStart = {
  /** Motora verilecek başlangıç durumu; kayıt uygulanmadıysa `undefined`. */
  snapshot: GameSnapshot | undefined;
  /** Bu başlangıcın nasıl belirlendiği. */
  restore: GameRestoreState;
};

/** {@link readPersistedGame} seçenekleri. */
export type PersistedGameOptions = {
  /** Bugün oynanan bulmaca. */
  puzzle: Puzzle;
  /** Yayın günü; varsayılanı bulmacanın kendi günüdür. */
  dayKey?: string;
  /** Kayıt arka ucu; varsayılanı tarayıcı deposudur. */
  storage?: SnapshotStorage;
};

/**
 * Kaydı okur ve oyunun hangi durumdan açılacağını söyler.
 *
 * Kayıt yoksa da reddedildiyse de sonuç aynıdır: taze oyun. Ayrım yalnız
 * {@link GameRestoreState} içinde taşınır; oyuncuya bir şey göstermek gerekirse
 * (Q24 kurtarma ekranı) gerekçe oradan okunur.
 */
export function readPersistedGame(options: PersistedGameOptions): PersistedGameStart {
  const result = loadSnapshot(options);

  if (result.status === "restored") {
    return { snapshot: result.snapshot, restore: { status: "restored" } };
  }
  if (result.status === "rejected") {
    return { snapshot: undefined, restore: { status: "discarded", reason: result.reason } };
  }
  return { snapshot: undefined, restore: { status: "fresh" } };
}

/**
 * Güncel durumu kaydeder.
 *
 * Yazma kuralları (bitmiş oyunun korunması, gün dönünce eski kaydın silinmesi)
 * kalıcılık katmanındadır; burada yalnız depo enjeksiyonu vardır.
 */
export function writePersistedGame(snapshot: GameSnapshot, storage?: SnapshotStorage): void {
  saveSnapshot(snapshot, { storage });
}
