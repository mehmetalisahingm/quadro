import type { KeyValueStore } from "./keyValue";

/** Yalnız web önizlemesi: localStorage. Erişilemezse (gizli pencere) kayıt sessizce atlanır. */
export const deviceStore: KeyValueStore = {
  get: (key) => {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Depolama kapalıysa oyun yine oynanır, yalnız kaydedilmez.
    }
  },
  remove: (key) => {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Yok sayılır.
    }
  },
};
