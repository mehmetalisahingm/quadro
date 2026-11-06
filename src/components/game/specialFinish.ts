import type { GameSnapshot } from "@/features/game/contracts";

/** Özel modun bitişte kapıya bildirdiği sonuç. Skor ve enerji kapıda hesaplanır. */
export type SpecialFinish = { won: boolean; mistakes: number; bonus: number };

/** Geçerli yanlış tahmin sayısı: `wrong` ve `one-away`. Yinelenen ve geçersiz gönderim sayılmaz. */
export function wrongGuesses(snapshot: GameSnapshot): number {
  return snapshot.attempts.filter((attempt) => attempt.verdict !== "correct").length;
}
