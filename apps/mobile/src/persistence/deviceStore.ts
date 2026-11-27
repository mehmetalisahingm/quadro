import { Storage } from "expo-sqlite/kv-store";

import type { KeyValueStore } from "./keyValue";

/** Cihaz deposu: expo-sqlite anahtar-değer tablosu. Her çağrı kendi SQLite işleminde yazılır. */
export const deviceStore: KeyValueStore = {
  get: (key) => Storage.getItemSync(key),
  set: (key, value) => Storage.setItemSync(key, value),
  remove: (key) => {
    Storage.removeItemSync(key);
  },
};
