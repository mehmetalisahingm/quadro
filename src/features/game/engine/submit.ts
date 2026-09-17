/**
 * Gönderim: seçili dörtlüyü GAME_RULES.md §3 denetim sırasıyla değerlendirir.
 */

import type { GameSnapshot, Puzzle, SubmitOutcome, SubmitResult } from "@/features/game/contracts";

import { hasAttempted } from "./attempts";
import { matchGroup, solveGroup } from "./groups";
import { isPlaying } from "./lookup";
import { applyMistake, classifyMistake } from "./mistakes";
import { readSelection } from "./selection";

/** Durumu değiştirmeyen gönderim sonucu: snapshot aynı nesnedir. */
function unchanged(snapshot: GameSnapshot, outcome: SubmitOutcome): SubmitResult {
  return { outcome, snapshot };
}

/**
 * Seçili dörtlüyü bir kez değerlendirir. İlk eşleşen adımın sonucu döner:
 *
 * 1. Oyun `playing` değil → `invalid` / `game-ended`.
 * 2. Seçim tam dört kimlik değil → `invalid` / `selection-count`.
 * 3. Tekrar eden, bilinmeyen veya çözülmüş kimlik → `invalid` / `invalid-words`.
 * 4. Aynı dörtlü daha önce gönderilmiş (sıra önemsiz) → `repeated`.
 * 5. Dört kelime aynı gruptan → `correct` (son grupsa `won`); değilse tam üçü aynı gruptan →
 *    `one-away`, aksi halde `wrong`. Bu ikisi birer hak tüketir; hak biterse `lost`.
 *
 * 1–4. adımlarda aynı snapshot nesnesi döner: hak, geçmiş ve seçim değişmez. Yalnız `correct`,
 * `one-away` ve `wrong` geçmişe eklenir. Girdiler değiştirilmez ve hata fırlatılmaz.
 */
export function submitSelection(puzzle: Puzzle, snapshot: GameSnapshot): SubmitResult {
  if (!isPlaying(snapshot)) {
    return unchanged(snapshot, { verdict: "invalid", reason: "game-ended" });
  }

  const selection = readSelection(puzzle, snapshot);
  if (!selection.ok) {
    return unchanged(snapshot, { verdict: "invalid", reason: selection.reason });
  }

  const { wordIds } = selection;
  if (hasAttempted(snapshot, wordIds)) {
    return unchanged(snapshot, { verdict: "repeated" });
  }

  const match = matchGroup(puzzle, wordIds);
  if (match.kind === "group") {
    return solveGroup(snapshot, wordIds, match.group);
  }
  return applyMistake(snapshot, wordIds, classifyMistake(match.largestShare));
}
