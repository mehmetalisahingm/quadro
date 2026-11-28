/**
 * Senkron anahtar-değer deposu sözleşmesi. Android/iOS'ta expo-sqlite (her yazma bir SQLite
 * işlemi: süreç yazma ortasında öldürülse bile yarım değer kalmaz), web önizlemesinde
 * localStorage. Testler bellek içi sahte depo kullanır.
 */
export type KeyValueStore = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
};

export function memoryStore(initial: Record<string, string> = {}): KeyValueStore & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    get: (key) => data.get(key) ?? null,
    set: (key, value) => void data.set(key, value),
    remove: (key) => void data.delete(key),
    dump: () => Object.fromEntries(data),
  };
}
