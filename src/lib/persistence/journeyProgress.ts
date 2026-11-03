import { JOURNEY_LENGTH, journeyId, journeyDay } from "@/features/game/journey";
import { trackStorage, TRACK_PROGRESS_EVENT } from "./trackStorage";
import { createMemoryStorage, type SnapshotStorage } from "./storage";
import { snapshotStorageKey } from "./snapshotStore";
import { parseStoredRecord } from "./record";
import { STATS_STORAGE_KEY } from "./statsStore";

const memory = createMemoryStorage();
const unsaved = new Set<string>();
/** Also works for the current visit when browser storage is blocked. */
export function journeyStorage(id: string, provided?: SnapshotStorage) {
  if (provided) return trackStorage(id, provided);
  return trackStorage(id, {
    getItem: key => {
      if (typeof window === "undefined") return null;
      if (unsaved.has(key)) return memory.getItem(key);
      try { return window.localStorage.getItem(key); } catch { return memory.getItem(key); }
    },
    setItem: (key, value) => {
      if (typeof window === "undefined") return;
      memory.setItem(key, value);
      try { window.localStorage.setItem(key, value); unsaved.delete(key); } catch { unsaved.add(key); }
    },
    removeItem: key => {
      memory.removeItem(key);
      try { window.localStorage.removeItem(key); unsaved.delete(key); } catch { unsaved.add(key); }
    },
  });
}
export type JourneyProgress = { unlocked: number; complete: number; stars: number[]; states: string[] };
export function readJourneyProgress(storage?: SnapshotStorage): JourneyProgress {
  const stars: number[] = [];
  const states: string[] = [];
  for (let i = 1; i <= JOURNEY_LENGTH; i++) {
    const parsed = parseStoredRecord(journeyStorage(journeyId(i), storage).getItem(snapshotStorageKey(journeyDay(i))) ?? "");
    const snapshot = parsed.ok ? parsed.record.snapshot : null;
    const valid = snapshot?.puzzleId === journeyId(i) && snapshot.puzzleRevision === 1 && snapshot.dayKey === journeyDay(i);
    states.push(valid ? snapshot.status : "new");
    stars.push(valid && snapshot.status === "won" ? snapshot.mistakesRemaining >= 3 ? 3 : snapshot.mistakesRemaining === 2 ? 2 : 1 : 0);
  }
  let complete = 0;
  while (complete < JOURNEY_LENGTH && states[complete] === "won") complete++;
  return { unlocked: Math.min(JOURNEY_LENGTH, complete + 1), complete, stars, states };
}
export const journeyProgressSnapshot = () => JSON.stringify(readJourneyProgress());
export const emptyJourneySnapshot = () => "";
export function subscribeJourney(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(TRACK_PROGRESS_EVENT, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(TRACK_PROGRESS_EVENT, listener); };
}
export function retryJourneyStep(step: number) {
  const storage = journeyStorage(journeyId(step));
  storage.removeItem(snapshotStorageKey(journeyDay(step)));
  storage.removeItem(STATS_STORAGE_KEY);
  window.dispatchEvent(new Event(TRACK_PROGRESS_EVENT));
}
