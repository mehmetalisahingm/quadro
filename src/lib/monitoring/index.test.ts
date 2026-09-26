import { describe, expect, it } from "vitest";

import { MONITORING_STORAGE_KEY, captureTechnicalError } from "./index";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("teknik hata kaydı", () => {
  it("stack ve bulmaca içeriği eklemeden sınırlı bir kayıt üretir", () => {
    const storage = new MemoryStorage();
    const error = new Error("A".repeat(400));
    error.stack = "gizli-stack";

    const record = captureTechnicalError(
      storage,
      { source: "manual", error, path: "/play" },
      new Date("2026-09-26T20:00:00Z"),
    );

    expect(record?.name).toBe("Error");
    expect(record?.message).toHaveLength(240);
    expect(record?.path).toBe("/play");
    const raw = storage.getItem(MONITORING_STORAGE_KEY) ?? "";
    expect(raw).not.toContain("gizli-stack");
    expect(raw).not.toContain("wordIds");
  });

  it("en fazla son 50 hatayı tutar", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 60; index += 1) {
      captureTechnicalError(storage, {
        source: "manual",
        error: new Error(`hata-${index}`),
        path: "/play",
      });
    }

    const records = JSON.parse(storage.getItem(MONITORING_STORAGE_KEY) ?? "[]") as unknown[];
    expect(records).toHaveLength(50);
    expect(JSON.stringify(records)).not.toContain("hata-0\"");
    expect(JSON.stringify(records)).toContain("hata-59");
  });
});
