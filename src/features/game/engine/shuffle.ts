/**
 * Karıştırma kuralı (docs/GAME_RULES.md §2).
 */

import type { GameSnapshot } from "@/features/game/contracts";

import { isPlaying } from "./lookup";
import { shuffleWordIds, type RandomSource } from "./random";

/**
 * Yalnız çözülmemiş kartların sırasını (`remainingWordOrder`) karıştırır. Seçim, haklar,
 * çözülen gruplar ve tahmin geçmişi aynı kalır; seçim kimlikle tutulduğu için seçili kartlar
 * yeni yerlerinde seçili kalır.
 *
 * Terminal oyunda veya karıştırılacak en az iki kart yoksa aynı snapshot nesnesi döner.
 */
export function shuffleBoard(snapshot: GameSnapshot, random: RandomSource): GameSnapshot {
  if (!isPlaying(snapshot) || snapshot.remainingWordOrder.length < 2) return snapshot;
  return { ...snapshot, remainingWordOrder: shuffleWordIds(snapshot.remainingWordOrder, random) };
}
