/**
 * İçerik tekrar denetimi komutu (#171). Kurallar `src/features/game/contentAudit.ts` içindedir;
 * bu dosya yalnız içerik dosyalarını okur ve özet yazar. Cevap kelimelerini yazdırmaz.
 *
 * Kullanım: `npm run audit:content` veya `npm run audit:content -- --json`
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const { auditBoards } = await import(pathToFileURL(join(root, "src/features/game/contentAudit.ts")).href);

const POOLS = [
  ["günlük", "src/content/puzzles"],
  ["mod", "src/content/modes"],
  ["keşif", "src/content/journey"],
  ["resimli", "src/content/pictures"],
];

const boards = POOLS.flatMap(([pool, dir]) => readdirSync(join(root, dir)).filter((name) => name.endsWith(".json")).map((name) => {
  const data = JSON.parse(readFileSync(join(root, dir, name), "utf8"));
  return { pool, id: data.id, groups: data.groups };
}));
const report = auditBoards(boards);

if (process.argv.includes("--json")) {
  // Cevap içermesin diye dörtlü imzaları çıkarılır; yalnız tahta kimlikleri yazılır.
  console.log(JSON.stringify({ ...report, repeatedGroups: report.repeatedGroups.map(({ uses }) => ({ uses })), sameTheme: report.sameTheme.map(({ boards: list }) => ({ boards: list })) }, null, 2));
} else {
  console.log(`Havuzlar: ${JSON.stringify(report.pools)} · ${report.boards} tahta · ${report.groups} grup`);
  console.log(`Birebir aynı tahta: ${report.exactBoards.length}`);
  console.log(`Birden fazla tahtada geçen dörtlü: ${report.repeatedGroups.length}`);
  console.log(`Dörtte üçü aynı dörtlü çifti: ${report.nearGroups.length}`);
  console.log(`Aynı başlık, en az iki ortak kelime: ${report.sameTheme.length}`);
}
