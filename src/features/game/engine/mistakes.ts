/**
 * Yanlış ve çok yakın tahminler: hak tüketimi ve kaybetme (docs/GAME_RULES.md §3 ve §4).
 */

import {
  GAME_CONSTANTS,
  type Attempt,
  type Four,
  type GameSnapshot,
  type SubmitResult,
  type WordId,
} from "@/features/game/contracts";

import { appendAttempt } from "./attempts";
import { isPlaying } from "./lookup";

/** Hak tüketen değerlendirme: `one-away` ya da `wrong`. */
export type MistakeVerdict = Exclude<Attempt["verdict"], "correct">;

/**
 * Grup oluşturmayan dörtlünün değerlendirmesi. `largestShare`, dörtlüde en çok kelimesi bulunan
 * grubun kelime sayısıdır (`matchGroup` sonucu).
 *
 * - Tam üçü aynı gruptansa `one-away`. Seçim yalnız çözülmemiş kelimelerden oluştuğu için bu grup
 *   zaten çözülmemiştir.
 * - Her gruptan en fazla iki kelime varsa `wrong`.
 */
export function classifyMistake(largestShare: number): MistakeVerdict {
  return largestShare === GAME_CONSTANTS.groupSize - 1 ? "one-away" : "wrong";
}

/**
 * Yanlış veya çok yakın dörtlüyü uygular ve sözleşmedeki gönderim sonucunu döndürür:
 *
 * - Bir hak azalır, geçmişe tahminin kendi değerlendirmesiyle kayıt eklenir.
 * - Hak kalırsa oyun sürer; seçim, tahta ve çözülen gruplar korunur.
 * - Hak sıfıra inerse `status = "lost"` olur ve seçim temizlenir. Tahta sırası ve
 *   `solvedGroupIds` değişmez: kaybedince açılan cevaplar çözülmüş sayılmaz.
 * - `outcome = { verdict }`; kaybedilse de sonuç `one-away` ya da `wrong` kalır. Çok yakın
 *   sonucu hangi kelimenin farklı olduğunu söylemez.
 *
 * Ön koşul: oyun sürüyor. Gönderim akışı ayrıca dörtlünün geçerli, yeni ve grup oluşturmayan bir
 * dörtlü olduğunu önceden sağlar. Tutarsız kayıtta hak zaten sıfırsa sıfırın altına inmez ve
 * oyun kaybedilir.
 *
 * @throws Oyun sürmüyorsa. Bu bir programlama hatasıdır; oyuncu girdisiyle oluşmaz.
 */
export function applyMistake(
  snapshot: GameSnapshot,
  wordIds: Four<WordId>,
  verdict: MistakeVerdict,
): SubmitResult {
  if (!isPlaying(snapshot)) {
    throw new Error(`applyMistake: oyun sürmüyor (status: ${snapshot.status}).`);
  }

  const mistakesRemaining = Math.max(snapshot.mistakesRemaining - 1, 0);
  const lost = mistakesRemaining === 0;
  return {
    outcome: { verdict },
    snapshot: {
      ...snapshot,
      status: lost ? "lost" : "playing",
      selectedWordIds: lost ? [] : snapshot.selectedWordIds,
      mistakesRemaining,
      attempts: appendAttempt(snapshot, wordIds, verdict),
    },
  };
}
