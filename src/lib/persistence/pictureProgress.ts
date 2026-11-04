import type { GameStatus } from "@/features/game/contracts";
import { GAME_CONSTANTS } from "@/features/game/contracts";
import { modeStorageKey } from "@/features/game/modes";
import { PICTURE_BOARDS, pictureId } from "@/features/game/pictures";

import { parseStoredRecord } from "./record";
import { snapshotStorageKey } from "./snapshotStore";
import { STATS_STORAGE_KEY } from "./statsStore";
import { createMemoryStorage, type SnapshotStorage } from "./storage";
import { TRACK_PROGRESS_EVENT } from "./trackStorage";

const memory = createMemoryStorage();
const unsaved = new Set<string>();

/** Tarayıcı deposu kapalıysa da ziyaret boyunca çalışan yedekli depo (Keşif Yolu ile aynı davranış). */
const browserBackend: SnapshotStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    if (unsaved.has(key)) return memory.getItem(key);
    try { return window.localStorage.getItem(key); } catch { return memory.getItem(key); }
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    memory.setItem(key, value);
    try { window.localStorage.setItem(key, value); unsaved.delete(key); } catch { unsaved.add(key); }
  },
  removeItem: (key) => {
    memory.removeItem(key);
    try { window.localStorage.removeItem(key); unsaved.delete(key); } catch { unsaved.add(key); }
  },
};

/** Tahtanın kaydı ve istatistiği yalnız mod + bulmaca + revizyon anahtarında tutulur. */
export function pictureStorage(id: string, revision: number, backend: SnapshotStorage = browserBackend): SnapshotStorage {
  const key = (name: string) => modeStorageKey("picture", id, revision, name);
  return {
    getItem: (name) => backend.getItem(key(name)),
    setItem: (name, value) => {
      const before = parseStoredRecord(backend.getItem(key(name)) ?? "");
      backend.setItem(key(name), value);
      const after = parseStoredRecord(value);
      if (typeof window !== "undefined" && after.ok &&
        (!before.ok || before.record.snapshot.status !== after.record.snapshot.status)) {
        queueMicrotask(() => window.dispatchEvent(new Event(TRACK_PROGRESS_EVENT)));
      }
    },
    removeItem: (name) => backend.removeItem(key(name)),
  };
}

export type PictureBoardProgress = {
  board: number;
  status: GameStatus | "new";
  solvedGroups: number;
  mistakesUsed: number;
};

/** Bu sürüme ait geçerli kayıtlardan tahta durumlarını okur; eski revizyon yeni tahta sayılır. */
export function readPictureProgress(backend?: SnapshotStorage): PictureBoardProgress[] {
  return PICTURE_BOARDS.map(({ board, day, revision }) => {
    const id = pictureId(board);
    const parsed = parseStoredRecord(pictureStorage(id, revision, backend).getItem(snapshotStorageKey(day)) ?? "");
    const snapshot = parsed.ok ? parsed.record.snapshot : null;
    if (snapshot?.puzzleId !== id || snapshot.puzzleRevision !== revision || snapshot.dayKey !== day) {
      return { board, status: "new", solvedGroups: 0, mistakesUsed: 0 };
    }
    return {
      board,
      status: snapshot.status,
      solvedGroups: snapshot.solvedGroupIds.length,
      mistakesUsed: GAME_CONSTANTS.maxMistakes - snapshot.mistakesRemaining,
    };
  });
}

export const pictureProgressSnapshot = () => JSON.stringify(readPictureProgress());
export const emptyPictureSnapshot = () => "";

export function subscribePictures(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(TRACK_PROGRESS_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(TRACK_PROGRESS_EVENT, listener);
  };
}

/** Yalnız seçilen tahtanın kaydını ve mod istatistiğini siler. */
export function resetPictureBoard(board: number) {
  const entry = PICTURE_BOARDS.find((item) => item.board === board);
  if (!entry) return;
  const storage = pictureStorage(pictureId(board), entry.revision);
  storage.removeItem(snapshotStorageKey(entry.day));
  storage.removeItem(STATS_STORAGE_KEY);
  window.dispatchEvent(new Event(TRACK_PROGRESS_EVENT));
}
