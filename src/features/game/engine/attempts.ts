/**
 * Tahmin geçmişi. Doğru grup (Q09) ile yanlış ve çok yakın tahminler (Q10) aynı kayıt
 * biçimini kullanır.
 */

import {
  attemptKey,
  type Attempt,
  type Four,
  type GameSnapshot,
  type WordId,
} from "@/features/game/contracts";

/**
 * Geçmişe yeni tahmin eklenmiş yeni bir dizi döndürür; snapshot'ı değiştirmez. Kimlik, kayıt
 * sırasıdır (`a1`, `a2`, …). `repeated` ve `invalid` gönderimler geçmişe eklenmez.
 */
export function appendAttempt(
  snapshot: GameSnapshot,
  wordIds: Four<WordId>,
  verdict: Attempt["verdict"],
): Attempt[] {
  return [...snapshot.attempts, { id: `a${snapshot.attempts.length + 1}`, wordIds, verdict }];
}

/**
 * Dörtlü daha önce gönderilip geçmişe yazılmış mı? Karşılaştırma `attemptKey` ile sıradan
 * bağımsızdır; `one-away` ve `wrong` kayıtlar da tekrar sayılır.
 */
export function hasAttempted(snapshot: GameSnapshot, wordIds: Four<WordId>): boolean {
  const key = attemptKey(wordIds);
  return snapshot.attempts.some((attempt) => attemptKey(attempt.wordIds) === key);
}
