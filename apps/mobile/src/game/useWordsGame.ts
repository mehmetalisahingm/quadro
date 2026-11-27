import {
  applyMove,
  canPlace,
  createGame,
  type GameState,
  type MoveResult,
  type Position,
} from "@quadro/words-engine";
import { useCallback, useRef, useState } from "react";

import { DEV_DICTIONARY } from "./devDictionary";

export type LastMove = { readonly result: MoveResult; readonly id: number; readonly clearedLetters: readonly (Position & { letter: string })[] };

function freshSeed(): number {
  // Oyun içi rastgelelik motorda tohumludur; yalnız yeni oyunun tohumu burada seçilir.
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/**
 * Oyun durumunu tutar ve hamleleri motora iletir. Kayıt ve rekorun kalıcılığı #208'de;
 * şimdilik rekor yalnız uygulama açıkken tutulur.
 */
export function useWordsGame() {
  const [state, setState] = useState<GameState>(() => createGame({ seed: freshSeed() }));
  const [best, setBest] = useState(0);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const moveId = useRef(0);

  const tryPlace = useCallback(
    (slot: number, row: number, col: number): MoveResult | null => {
      if (!canPlace(state, slot, row, col)) return null;
      const outcome = applyMove(state, { slot, row, col }, DEV_DICTIONARY);
      if (!outcome.ok) return null;
      // Silinen harfleri animasyon için yerleştirme sonrası (silme öncesi) tahtadan topla.
      const piece = state.tray[slot];
      const clearedLetters = outcome.result.cleared.map((p) => {
        const placedIndex = outcome.result.placed.findIndex((q) => q.row === p.row && q.col === p.col);
        const letter = placedIndex >= 0 ? (piece?.cells[placedIndex]?.letter ?? "") : (state.board[p.row]?.[p.col] ?? "");
        return { ...p, letter };
      });
      setState(outcome.state);
      setBest((current) => Math.max(current, outcome.state.score));
      moveId.current += 1;
      setLastMove({ result: outcome.result, id: moveId.current, clearedLetters });
      return outcome.result;
    },
    [state],
  );

  const restart = useCallback(() => {
    setState(createGame({ seed: freshSeed() }));
    setLastMove(null);
  }, []);

  return { state, best, lastMove, tryPlace, restart, canPlaceAt: (slot: number, row: number, col: number) => canPlace(state, slot, row, col) };
}
