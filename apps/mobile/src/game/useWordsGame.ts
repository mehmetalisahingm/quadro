import {
  applyMove,
  canPlace,
  createGame,
  type GameState,
  type MoveResult,
  type Position,
} from "@quadro/words-engine";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { deviceStore } from "../persistence/deviceStore";
import {
  createPersistence,
  DEFAULT_SETTINGS,
  EMPTY_META,
  EMPTY_RECORDS,
  type GameMeta,
  type Persistence,
  type Records,
  type Settings,
} from "../persistence/persistence";
import { DEV_DICTIONARY } from "./devDictionary";

export type LastMove = { readonly result: MoveResult; readonly id: number; readonly clearedLetters: readonly (Position & { letter: string })[] };

function freshSeed(): number {
  // Oyun içi rastgelelik motorda tohumludur; yalnız yeni oyunun tohumu burada seçilir.
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

type Boot = {
  persistence: Persistence;
  state: GameState;
  meta: GameMeta;
  records: Records;
  settings: Settings;
  notice: string | null;
};

/** Açılış: kayıtlı oyun varsa oradan devam, yoksa yeni oyun. Okuma senkron ve doğrulanmış. */
function boot(): Boot {
  const persistence = createPersistence(deviceStore);
  const loaded = persistence.loadGame();
  const notice =
    loaded.source === "backup"
      ? "Son kayıt okunamadı; bir önceki hamleden devam ediliyor."
      : loaded.source === "corrupt"
        ? "Kayıtlı oyun okunamadı; yeni oyun başlatıldı."
        : null;
  return {
    persistence,
    state: loaded.state ?? createGame({ seed: freshSeed() }),
    meta: loaded.state ? loaded.meta : EMPTY_META,
    records: persistence.loadRecords(),
    settings: persistence.loadSettings(),
    notice,
  };
}

/**
 * Oyun durumu, kayıt ve rekorlar. Her hamle anında cihaza yazılır (#208); süreç öldürülse ya da
 * uygulama arka planda kapatılsa bile açılışta son hamleden devam edilir.
 */
export function useWordsGame() {
  const [initial] = useState(boot);
  const { persistence } = initial;
  const [state, setState] = useState<GameState>(initial.state);
  const [meta, setMeta] = useState<GameMeta>(initial.meta);
  const [records, setRecords] = useState<Records>(initial.records);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const moveId = useRef(0);

  // Arka plana geçerken son durumu bir kez daha yaz (her hamlede zaten yazılıyor).
  const latest = useRef({ state, meta });
  useEffect(() => {
    latest.current = { state, meta };
  });
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") persistence.saveGame(latest.current.state, latest.current.meta);
    });
    return () => subscription.remove();
  }, [persistence]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

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

      const lengths = outcome.result.words.map((w) => w.word.length);
      const nextMeta: GameMeta = { ...meta, longestWord: Math.max(meta.longestWord, ...lengths, 0) };
      persistence.saveGame(outcome.state, nextMeta);
      let nextRecords = persistence.recordWords(records, lengths);
      if (outcome.state.over) nextRecords = persistence.recordGameEnd(nextRecords, outcome.state.score, nextMeta.assisted);

      setState(outcome.state);
      setMeta(nextMeta);
      setRecords(nextRecords);
      moveId.current += 1;
      setLastMove({ result: outcome.result, id: moveId.current, clearedLetters });
      return outcome.result;
    },
    [state, meta, records, persistence],
  );

  /** Ücretsiz yeniden başlatma. Yarım bırakılan oyunun skoru da rekora işlenir. */
  const restart = useCallback(() => {
    let nextRecords = records;
    if (!state.over && state.moveCount > 0) nextRecords = persistence.recordGameEnd(records, state.score, meta.assisted);
    const fresh = createGame({ seed: freshSeed() });
    persistence.clearGame();
    persistence.saveGame(fresh, EMPTY_META);
    setRecords(nextRecords);
    setState(fresh);
    setMeta(EMPTY_META);
    setLastMove(null);
  }, [state, meta, records, persistence]);

  const updateSettings = useCallback(
    (patch: Partial<Omit<Settings, "version">>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        persistence.saveSettings(next);
        return next;
      });
    },
    [persistence],
  );

  /** Cihazdaki tüm Quadro Words verisini siler ve temiz bir oyunla başlar. */
  const eraseAll = useCallback(() => {
    persistence.clearAll();
    const fresh = createGame({ seed: freshSeed() });
    setRecords(EMPTY_RECORDS);
    setSettings(DEFAULT_SETTINGS);
    setState(fresh);
    setMeta(EMPTY_META);
    setLastMove(null);
    setNotice("Kayıtlı veriler silindi.");
  }, [persistence]);

  const best = meta.assisted ? records.best : Math.max(records.best, state.score);

  return {
    state,
    meta,
    best,
    records,
    settings,
    notice,
    lastMove,
    tryPlace,
    restart,
    updateSettings,
    eraseAll,
    canPlaceAt: (slot: number, row: number, col: number) => canPlace(state, slot, row, col),
  };
}
