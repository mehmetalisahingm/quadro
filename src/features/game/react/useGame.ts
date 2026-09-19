import type { GameController, Puzzle } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures";
import { usePersistentGame } from "@/features/game/state";

export type LiveGame = {
  puzzle: Puzzle;
  controller: GameController;
};

/**
 * Standart oyun çalışma zamanını gerçek Q09/Q10 motoruna bağlar.
 *
 * Günün bulmacası Q19 ile sunucudan gelir ve `/play` tarafından buraya geçirilir.
 * Bulmaca verilmezse Q03'ün deterministik standart bulmacası açılır; bu yalnız
 * tahtayı tek başına çizen çağrılar içindir, günlük akışta kullanılmaz. Seçim,
 * gönderim, hata hakkı, tekrar ve terminal durumlar her iki durumda da tamamen
 * gerçek motor tarafından üretilir.
 *
 * İlerleme kaydı Q20 ile durum katmanındadır (`src/features/game/state/`): tahta
 * açılırken günün kaydı okunur, her değişimde geri yazılır. Bu kanca yalnız ince
 * bir sarmalayıcıdır; kayıt kuralları ve geri yükleme ayrıntısı burada değil,
 * orada durur.
 */
export function useGame(puzzle: Puzzle = standardPuzzle): LiveGame {
  return usePersistentGame(puzzle);
}
