import { defaultSnapshotStorage, type SnapshotStorage } from "./storage";
import { parseStoredRecord } from "./record";

export const TRACK_PROGRESS_EVENT = "quadro:track-progress";
export const trackStorageKey = (id: string, name: string) => `quadro:tracks:v1:${id}:${name}`;

/** Chapter saves and chapter statistics never replace daily or other mode records. */
export function trackStorage(id: string, storage?: SnapshotStorage): SnapshotStorage {
  const key = (name: string) => trackStorageKey(id, name);
  let resolved = storage;
  const backend = () => {
    if (typeof window !== "undefined") resolved ??= defaultSnapshotStorage();
    return resolved ?? defaultSnapshotStorage();
  };
  return {
    getItem: (name) => backend().getItem(key(name)),
    setItem: (name, value) => {
      const target = backend();
      const before = parseStoredRecord(target.getItem(key(name)) ?? "");
      target.setItem(key(name), value);
      const after = parseStoredRecord(value);
      if (typeof window !== "undefined" && after.ok &&
        (!before.ok || before.record.snapshot.status !== after.record.snapshot.status)) {
        queueMicrotask(() => window.dispatchEvent(new Event(TRACK_PROGRESS_EVENT)));
      }
    },
    removeItem: (name) => backend().removeItem(key(name)),
  };
}
