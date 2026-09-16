/**
 * Oyun kurulumu: bulmacadan başlangıç durumu üretir.
 */

import { GAME_CONSTANTS, type GameSnapshot, type Puzzle } from "@/features/game/contracts";

import { shuffleWordIds, type RandomSource } from "./random";

/** Başlangıç durumu seçenekleri. */
export type InitialSnapshotOptions = {
  /** Başlangıç kart sırası için rastgelelik kaynağı. */
  random: RandomSource;
  /** Oyunun ait olduğu Europe/Istanbul yayın günü; varsayılanı `puzzle.date`. */
  dayKey?: string;
};

/**
 * Bulmacadan boş oyun durumu üretir: 16 kelime karıştırılmış sırada, 4 hata hakkı,
 * `playing` durumu; seçim, çözülen gruplar ve tahmin geçmişi boş, süre sıfır.
 */
export function createInitialSnapshot(
  puzzle: Puzzle,
  { random, dayKey = puzzle.date }: InitialSnapshotOptions,
): GameSnapshot {
  const wordIds = puzzle.groups.flatMap((group) => group.words.map((word) => word.id));
  return {
    schemaVersion: 1,
    puzzleId: puzzle.id,
    puzzleRevision: puzzle.revision,
    dayKey,
    status: "playing",
    selectedWordIds: [],
    remainingWordOrder: shuffleWordIds(wordIds, random),
    solvedGroupIds: [],
    mistakesRemaining: GAME_CONSTANTS.maxMistakes,
    attempts: [],
    activeSeconds: 0,
  };
}
