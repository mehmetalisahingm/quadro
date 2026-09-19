/**
 * Kayıt arka ucunun testleri (Q20).
 *
 * Bu testler node ortamında koşar: `window` yoktur. Tarayıcı davranışı gerçek
 * bir DOM yerine sahte bir `window` ile denenir, çünkü denenmek istenen şey
 * `localStorage`ın kendisi değil, ona dokunan sarmalayıcının hata yutma
 * davranışıdır. Gerçek `localStorage` üzerinden uçtan uca akış
 * `tests/e2e/kayit-devam.test.tsx` içindedir.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  NOOP_SNAPSHOT_STORAGE,
  createBrowserSnapshotStorage,
  createMemoryStorage,
} from "./storage";

/** Verilen `localStorage` taklidiyle tarayıcı ortamını kurar. */
function stubWindow(localStorage: unknown): void {
  vi.stubGlobal("window", { localStorage });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bellekteki depo", () => {
  it("yazılan değeri aynen döndürür ve silinen değeri unutur", () => {
    const storage = createMemoryStorage();

    expect(storage.getItem("a")).toBeNull();

    storage.setItem("a", "1");
    expect(storage.getItem("a")).toBe("1");

    storage.removeItem("a");
    expect(storage.getItem("a")).toBeNull();
    expect(storage.keys()).toEqual([]);
  });

  it("başlangıç içeriğiyle kurulabilir", () => {
    const storage = createMemoryStorage({ "quadro:save:v1:2026-09-20": "{}" });

    expect(storage.keys()).toEqual(["quadro:save:v1:2026-09-20"]);
    expect(storage.getItem("quadro:save:v1:2026-09-20")).toBe("{}");
  });
});

describe("boş depo", () => {
  it("yazmayı yutar ve her okumada null döner", () => {
    NOOP_SNAPSHOT_STORAGE.setItem("a", "1");
    NOOP_SNAPSHOT_STORAGE.removeItem("a");

    expect(NOOP_SNAPSHOT_STORAGE.getItem("a")).toBeNull();
  });
});

describe("tarayıcı deposu", () => {
  it("sunucuda (window yokken) boş depoya düşer", () => {
    expect(typeof window).toBe("undefined");

    const storage = createBrowserSnapshotStorage();
    storage.setItem("a", "1");

    expect(storage).toBe(NOOP_SNAPSHOT_STORAGE);
    expect(storage.getItem("a")).toBeNull();
  });

  it("tarayıcıda localStorage'a yazar ve oradan okur", () => {
    const backing = createMemoryStorage();
    stubWindow(backing);

    const storage = createBrowserSnapshotStorage();
    storage.setItem("quadro:save:v1:2026-09-20", "kayıt");

    expect(storage.getItem("quadro:save:v1:2026-09-20")).toBe("kayıt");
    // Erişilebilirlik yoklaması iz bırakmaz.
    expect(backing.keys()).toEqual(["quadro:save:v1:2026-09-20"]);
  });

  it("localStorage erişimi hata fırlatıyorsa (gizli sekme) boş depoya düşer", () => {
    stubWindow({
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
      removeItem: () => undefined,
    });

    const storage = createBrowserSnapshotStorage();

    expect(storage).toBe(NOOP_SNAPSHOT_STORAGE);
    expect(storage.getItem("a")).toBeNull();
  });

  it("kota oyun sırasında dolarsa yazma sessizce düşer, okuma sürer", () => {
    const backing = createMemoryStorage();
    let kotaDoldu = false;

    stubWindow({
      getItem: (key: string) => backing.getItem(key),
      setItem: (key: string, value: string) => {
        if (kotaDoldu) throw new Error("QuotaExceededError");
        backing.setItem(key, value);
      },
      removeItem: (key: string) => backing.removeItem(key),
    });

    const storage = createBrowserSnapshotStorage();
    storage.setItem("a", "1");
    kotaDoldu = true;

    expect(() => storage.setItem("a", "2")).not.toThrow();
    expect(storage.getItem("a")).toBe("1");
  });
});
