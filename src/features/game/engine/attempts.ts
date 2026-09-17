/**
 * Tahmin geçmişi. Doğru grup (Q09) ile yanlış ve çok yakın tahminler (Q10) aynı kayıt
 * biçimini kullanır.
 */

import type { Attempt, Four, GameSnapshot, WordId } from "@/features/game/contracts";

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
