/**
 * Seçim kuralları (docs/GAME_RULES.md §2 ve §3'ün 2–3. adımları).
 */

import {
  GAME_CONSTANTS,
  type Four,
  type GameSnapshot,
  type Puzzle,
  type SubmitOutcome,
  type WordId,
} from "@/features/game/contracts";

import { isPlaying, isUnsolvedWord } from "./lookup";

/**
 * Çözülmemiş bir kelimeyi seçer veya seçimini kaldırır.
 *
 * - Seçili kelimeye tekrar basmak seçimi kaldırır.
 * - En fazla dört farklı kelime seçilir; dördü seçiliyken yeni kelime etkisizdir.
 * - Bilinmeyen veya çözülmüş kimlik ve terminal oyun etkisizdir.
 *
 * Değişiklik yoksa aynı snapshot nesnesi döner.
 */
export function toggleWord(puzzle: Puzzle, snapshot: GameSnapshot, wordId: WordId): GameSnapshot {
  if (!isPlaying(snapshot) || !isUnsolvedWord(puzzle, snapshot, wordId)) return snapshot;

  const { selectedWordIds } = snapshot;
  if (selectedWordIds.includes(wordId)) {
    return { ...snapshot, selectedWordIds: selectedWordIds.filter((id) => id !== wordId) };
  }
  if (selectedWordIds.length >= GAME_CONSTANTS.groupSize) return snapshot;
  return { ...snapshot, selectedWordIds: [...selectedWordIds, wordId] };
}

/**
 * Seçimi boşaltır; hak, geçmiş ve tahta değişmez. Boş seçimde ve terminal oyunda etkisizdir;
 * değişiklik yoksa aynı snapshot nesnesi döner.
 */
export function clearSelection(snapshot: GameSnapshot): GameSnapshot {
  if (!isPlaying(snapshot) || snapshot.selectedWordIds.length === 0) return snapshot;
  return { ...snapshot, selectedWordIds: [] };
}

/** Gönderilemeyen seçimin nedeni; sözleşmedeki `invalid` nedenlerinin seçime ait olanları. */
export type SelectionProblem = Exclude<
  Extract<SubmitOutcome, { verdict: "invalid" }>["reason"],
  "game-ended"
>;

/** {@link readSelection} sonucu. */
export type SelectionRead =
  | { ok: true; wordIds: Four<WordId> }
  | { ok: false; reason: SelectionProblem };

/**
 * Seçimi gönderilebilir bir dörtlü olarak okur (GAME_RULES.md §3, 2–3. adımlar):
 *
 * - Seçim tam dört kimlik değilse `selection-count`.
 * - Tekrar eden, bilinmeyen veya çözülmüş kimlik varsa `invalid-words`.
 *
 * Oyunun bitip bitmediğini denetlemez; `game-ended` kontrolü gönderim sırasında bundan önce
 * yapılır. Dörtlü seçim sırasını korur.
 */
export function readSelection(puzzle: Puzzle, snapshot: GameSnapshot): SelectionRead {
  const [a, b, c, d] = snapshot.selectedWordIds;
  if (
    snapshot.selectedWordIds.length !== GAME_CONSTANTS.groupSize ||
    a === undefined ||
    b === undefined ||
    c === undefined ||
    d === undefined
  ) {
    return { ok: false, reason: "selection-count" };
  }

  const wordIds: Four<WordId> = [a, b, c, d];
  const distinct = new Set(wordIds).size === wordIds.length;
  if (!distinct || !wordIds.every((wordId) => isUnsolvedWord(puzzle, snapshot, wordId))) {
    return { ok: false, reason: "invalid-words" };
  }
  return { ok: true, wordIds };
}
