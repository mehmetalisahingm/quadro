/**
 * Bulmaca ve durum üzerinde salt okunur sorgular. Hiçbiri girdileri değiştirmez.
 */

import type {
  Four,
  GameSnapshot,
  Puzzle,
  PuzzleGroup,
  WordId,
} from "@/features/game/contracts";

/** Oyun sürüyor mu? `won` ve `lost` terminal durumlardır. */
export function isPlaying(snapshot: GameSnapshot): boolean {
  return snapshot.status === "playing";
}

/** Kelimenin ait olduğu grup; kimlik bulmacada yoksa `undefined`. */
export function findGroupOfWord(puzzle: Puzzle, wordId: WordId): PuzzleGroup | undefined {
  return puzzle.groups.find((group) => group.words.some((word) => word.id === wordId));
}

/** Kelime bulmacaya ait ve grubu henüz çözülmemiş mi? */
export function isUnsolvedWord(puzzle: Puzzle, snapshot: GameSnapshot, wordId: WordId): boolean {
  const group = findGroupOfWord(puzzle, wordId);
  return group !== undefined && !snapshot.solvedGroupIds.includes(group.id);
}

/** Grubun dört kelime kimliği, içerikteki sırayla. */
export function groupWordIds(group: PuzzleGroup): Four<WordId> {
  const [a, b, c, d] = group.words;
  return [a.id, b.id, c.id, d.id];
}
