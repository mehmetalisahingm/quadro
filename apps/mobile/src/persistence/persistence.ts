import { parseState, serializeState, type GameState } from "@quadro/words-engine";

import type { KeyValueStore } from "./keyValue";

/**
 * Yerel kayıt (#208). Üç ayrı kayıt tutulur; biri bozulsa diğerleri etkilenmez:
 * - oyun: süren oyunun tam durumu (motorun sürümlü snapshot'ı) ve bir önceki iyi kayıt (yedek),
 * - rekorlar: destekli ve desteksiz en yüksek skor ayrı, istatistikler,
 * - ayarlar: titreşim, öğretici görüldü mü.
 *
 * Kayıttaki hiçbir değere körü körüne güvenilmez: her okuma doğrulanır, bozuk kayıt yok sayılır.
 */
export const KEYS = {
  game: "quadro-words:game:v1",
  gameBackup: "quadro-words:game:v1:backup",
  gameMeta: "quadro-words:game-meta:v1",
  records: "quadro-words:records:v1",
  settings: "quadro-words:settings:v1",
} as const;

export type Records = {
  readonly version: 1;
  /** Kurtarma (ödüllü devam) kullanılmadan alınan en yüksek skor. */
  readonly best: number;
  /** Kurtarma kullanılan oyunların en yüksek skoru; ayrı tutulur ve ayrı gösterilir (#202). */
  readonly bestAssisted: number;
  readonly games: number;
  readonly words: number;
  /** En uzun kelimenin harf sayısı (kelimenin kendisi değil; paylaşım spoilersız kalır). */
  readonly longestWord: number;
};

export type Settings = { readonly version: 1; readonly haptics: boolean; readonly tutorialSeen: boolean };

/** Süren oyunun motor dışı bilgileri: paylaşım ve rekor ayrımı için. */
export type GameMeta = { readonly longestWord: number; readonly assisted: boolean };
export const EMPTY_META: GameMeta = { longestWord: 0, assisted: false };

export const EMPTY_RECORDS: Records = { version: 1, best: 0, bestAssisted: 0, games: 0, words: 0, longestWord: 0 };
export const DEFAULT_SETTINGS: Settings = { version: 1, haptics: true, tutorialSeen: false };

export type LoadResult =
  | { readonly state: GameState; readonly meta: GameMeta; readonly source: "main" | "backup" }
  | { readonly state: null; readonly source: "none" | "corrupt" };

const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

function parseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function createPersistence(store: KeyValueStore) {
  const safeGet = (key: string): string | null => {
    try {
      return store.get(key);
    } catch {
      return null;
    }
  };
  const safeSet = (key: string, value: string): boolean => {
    try {
      store.set(key, value);
      return true;
    } catch {
      return false;
    }
  };
  const safeRemove = (key: string) => {
    try {
      store.remove(key);
    } catch {
      // Silinemeyen kayıt bir sonraki okumada doğrulamadan geçemezse yine yok sayılır.
    }
  };

  /**
   * Süren oyunu yükler: önce ana kayıt, o bozuksa yedek. Bitmiş oyun devam ettirilmez.
   * İkisi de bozuksa `corrupt` döner ve çağıran yeni oyun başlatır.
   */
  function loadGame(): LoadResult {
    const mainRaw = safeGet(KEYS.game);
    const main = mainRaw ? parseState(mainRaw) : null;
    if (main && !main.over) return { state: main, meta: loadMeta(), source: "main" };
    const backupRaw = safeGet(KEYS.gameBackup);
    const backup = backupRaw ? parseState(backupRaw) : null;
    if (backup && !backup.over) return { state: backup, meta: loadMeta(), source: "backup" };
    if (main?.over || backup?.over) return { state: null, source: "none" };
    return { state: null, source: mainRaw || backupRaw ? "corrupt" : "none" };
  }

  /**
   * Her hamlede çağrılır. Önce mevcut ana kayıt (doğrulanırsa) yedeğe alınır, sonra yeni durum
   * yazılır. Her yazma tek başına atomik olduğu için süreç arada öldürülse bile en az bir geçerli
   * kayıt kalır.
   */
  function saveGame(state: GameState, meta: GameMeta): boolean {
    const current = safeGet(KEYS.game);
    if (current && parseState(current)) safeSet(KEYS.gameBackup, current);
    safeSet(KEYS.gameMeta, JSON.stringify(meta));
    return safeSet(KEYS.game, serializeState(state));
  }

  function loadMeta(): GameMeta {
    const m = parseJson(safeGet(KEYS.gameMeta));
    if (!m || !isCount(m.longestWord) || typeof m.assisted !== "boolean") return EMPTY_META;
    return { longestWord: m.longestWord, assisted: m.assisted };
  }

  function clearGame() {
    safeRemove(KEYS.game);
    safeRemove(KEYS.gameBackup);
    safeRemove(KEYS.gameMeta);
  }

  function loadRecords(): Records {
    const r = parseJson(safeGet(KEYS.records));
    if (!r || r.version !== 1) return EMPTY_RECORDS;
    const fields = ["best", "bestAssisted", "games", "words", "longestWord"] as const;
    if (!fields.every((field) => isCount(r[field]))) return EMPTY_RECORDS;
    return r as unknown as Records;
  }

  /** Bir hamlenin kelimeleri: toplam kelime ve en uzun kelime güncellenir. */
  function recordWords(records: Records, lengths: readonly number[]): Records {
    if (lengths.length === 0) return records;
    const next: Records = {
      ...records,
      words: records.words + lengths.length,
      longestWord: Math.max(records.longestWord, ...lengths),
    };
    safeSet(KEYS.records, JSON.stringify(next));
    return next;
  }

  /** Oyun bittiğinde (ya da yeni oyuna geçildiğinde) skor ilgili rekora işlenir. */
  function recordGameEnd(records: Records, score: number, assisted: boolean): Records {
    const next: Records = {
      ...records,
      games: records.games + 1,
      best: assisted ? records.best : Math.max(records.best, score),
      bestAssisted: assisted ? Math.max(records.bestAssisted, score) : records.bestAssisted,
    };
    safeSet(KEYS.records, JSON.stringify(next));
    return next;
  }

  function loadSettings(): Settings {
    const s = parseJson(safeGet(KEYS.settings));
    if (!s || s.version !== 1 || typeof s.haptics !== "boolean" || typeof s.tutorialSeen !== "boolean") return DEFAULT_SETTINGS;
    return s as unknown as Settings;
  }

  function saveSettings(settings: Settings) {
    safeSet(KEYS.settings, JSON.stringify(settings));
  }

  /** "Kayıtlı verileri sil": oyun, yedek, rekorlar ve ayarlar cihazdan silinir. */
  function clearAll() {
    for (const key of Object.values(KEYS)) safeRemove(key);
  }

  return { loadGame, saveGame, clearGame, loadRecords, recordWords, recordGameEnd, loadSettings, saveSettings, clearAll };
}

export type Persistence = ReturnType<typeof createPersistence>;

/** Spoilersız paylaşım metni: kelimelerin kendisi değil, yalnız sayılar. */
export function shareText(score: number, words: number, longestWord: number): string {
  const longest = longestWord > 0 ? ` · en uzun kelime ${longestWord} harf` : "";
  return `Quadro Words · ${score} puan · ${words} kelime${longest}\nplayquadro.com.tr`;
}
