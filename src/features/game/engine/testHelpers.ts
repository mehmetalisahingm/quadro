/**
 * Motor testlerinin ortak yardımcıları. Uygulama kodu tarafından kullanılmaz.
 */

import type { GameSnapshot, Puzzle, SubmitResult, WordId } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";

import { matchGroup, solveGroup } from "./groups";
import { createSeededRandom } from "./random";
import { clearSelection, readSelection, toggleWord } from "./selection";
import { createInitialSnapshot } from "./setup";

/** Testlerde kullanılan sabit tohum. */
export const TEST_SEED = 7;

/** Standart örnek bulmacayla, sabit tohumla boş oyun. */
export function newGame(puzzle: Puzzle = standardPuzzle): GameSnapshot {
  return createInitialSnapshot(puzzle, { random: createSeededRandom(TEST_SEED) });
}

/** Seçimi temizleyip verilen kelimeleri sırayla seçer. */
export function selectOnly(
  puzzle: Puzzle,
  snapshot: GameSnapshot,
  wordIds: readonly WordId[],
): GameSnapshot {
  return wordIds.reduce((state, wordId) => toggleWord(puzzle, state, wordId), clearSelection(snapshot));
}

/**
 * Doğru seçimi motor yapı taşlarıyla çözer: `readSelection` → `matchGroup` → `solveGroup`.
 * Seçim doğru bir grup değilse hata fırlatır.
 */
export function solveSelection(puzzle: Puzzle, snapshot: GameSnapshot): SubmitResult {
  const read = readSelection(puzzle, snapshot);
  if (!read.ok) throw new Error(`Seçim gönderilemez: ${read.reason}`);
  const match = matchGroup(puzzle, read.wordIds);
  if (match.kind !== "group") throw new Error("Seçim bir grup oluşturmuyor.");
  return solveGroup(snapshot, read.wordIds, match.group);
}

/** Değeri ve tüm iç nesnelerini dondurur; mutasyon denemesi katı kipte hata fırlatır. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value) as unknown[]) deepFreeze(child);
  }
  return value;
}
