import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { auditBoards, overlap, type AuditBoard } from "@/features/game/contentAudit";

/**
 * Tekrar koruması (#171). Sayılar 6 Kasım 2026 denetiminin değeridir; içerik düzeltildikçe
 * düşürülür, yükselmesine izin verilmez. Ayrıntı: docs/qa/Q171_CONTENT_AUDIT.md.
 */
const BASELINE = { repeatedGroups: 119, nearGroups: 66 };
/** Yayın öncesi düzeltilmesi gereken, başka havuzla birebir aynı dörtlü taşıyan günlük taslaklar. */
const KNOWN_DAILY_SHARED = ["q-002", "q-016", "q-025", "q-031"];

const pools: [string, string][] = [
  ["günlük", "src/content/puzzles"],
  ["mod", "src/content/modes"],
  ["keşif", "src/content/journey"],
  ["resimli", "src/content/pictures"],
];
const boards: AuditBoard[] = pools.flatMap(([pool, dir]) => readdirSync(dir).filter((name) => name.endsWith(".json")).map((name) => {
  const data = JSON.parse(readFileSync(join(dir, name), "utf8"));
  return { pool, id: data.id, groups: data.groups };
}));
const report = auditBoards(boards);

const board = (id: string, ...groups: string[][]): AuditBoard => ({
  pool: "t",
  id,
  groups: groups.map((words, i) => ({ title: `G${i}`, words: words.map((text) => ({ text })) })),
});

describe("içerik tekrar denetimi", () => {
  it("birebir aynı tahta yok", () => {
    expect(report.exactBoards).toEqual([]);
  });

  it("tekrar eden ve çok benzer dörtlüler bugünkü düzeyin üstüne çıkmaz", () => {
    expect(report.repeatedGroups.length).toBeLessThanOrEqual(BASELINE.repeatedGroups);
    expect(report.nearGroups.length).toBeLessThanOrEqual(BASELINE.nearGroups);
  });

  it("yeni bir günlük taslak başka havuzla birebir aynı dörtlü taşımaz", () => {
    const shared = report.repeatedGroups
      .filter(({ uses }) => uses.some((use) => use.startsWith("günlük:")) && uses.some((use) => !use.startsWith("günlük:")))
      .flatMap(({ uses }) => uses.filter((use) => use.startsWith("günlük:")).map((use) => use.slice("günlük:".length)));
    for (const id of shared) expect(KNOWN_DAILY_SHARED, `${id} başka havuzla aynı dörtlüyü taşıyor`).toContain(id);
  });

  it("kurallar: sıra farkı aynı dörtlüdür, tek kelime tekrarı sayılmaz", () => {
    const result = auditBoards([
      board("a", ["ELMA", "ARMUT", "KİRAZ", "İNCİR"], ["MASA", "SANDALYE", "DOLAP", "RAF"]),
      board("b", ["incir", "Kiraz", "armut", "elma"], ["KALEM", "SİLGİ", "DEFTER", "MASA"]),
      board("c", ["ELMA", "ARMUT", "KİRAZ", "ERİK"], ["TREN", "UÇAK", "GEMİ", "OTOBÜS"]),
    ]);
    expect(result.exactBoards).toEqual([]);
    expect(result.repeatedGroups.map((group) => group.uses)).toEqual([["t:a", "t:b"]]);
    expect(result.nearGroups).toEqual([{ a: "t:a", b: "t:c" }]);
    expect(overlap("a|b|c|d", "d|e|f|g")).toBe(1);
  });
});
