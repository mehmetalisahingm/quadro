/**
 * Üretim paketi ölçüm raporu (Q33).
 *
 * `npm run build` çıktısındaki statik JS ve CSS boyutlarını, gzip karşılıklarıyla ve
 * `public/` varlıklarını raporlar. Yalnız okur; eşik uygulamaz, karar raporu okuyana aittir.
 * Sonuç bir laboratuvar ölçümüdür, gerçek cihaz performansı yerine geçmez.
 *
 * Kullanım: `npm run report:bundle` veya `npm run report:bundle -- --json`
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

export function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** Dosyaları uzantı grubuna göre toplar, en büyükleri ayırır. */
export function summarize(entries, largestCount = 5) {
  const sorted = [...entries].sort((a, b) => b.bytes - a.bytes);
  return {
    files: entries.length,
    bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
    gzipBytes: entries.reduce((sum, entry) => sum + (entry.gzipBytes ?? 0), 0),
    largest: sorted.slice(0, largestCount),
  };
}

/** `public/` altını ilk klasör düzeyinde gruplar. */
export function groupByFolder(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const parts = entry.path.split("/");
    const key = parts.length > 2 ? parts.slice(0, 2).join("/") : parts[0];
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups].map(([folder, items]) => ({ folder, ...summarize(items, 1) })).sort((a, b) => b.bytes - a.bytes);
}

export const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

function measure(root, directory, extensions) {
  return listFiles(directory)
    .filter((path) => extensions.includes(extname(path)))
    .map((path) => {
      const content = readFileSync(path);
      return { path: relative(root, path).split("\\").join("/"), bytes: content.length, gzipBytes: gzipSync(content).length };
    });
}

function cli() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const staticDirectory = join(root, ".next", "static");
  if (!existsSync(staticDirectory)) {
    console.error("Derleme çıktısı yok. Önce `npm run build` çalıştırılmalı.");
    process.exitCode = 1;
    return;
  }

  const report = {
    javascript: summarize(measure(root, staticDirectory, [".js"])),
    css: summarize(measure(root, staticDirectory, [".css"])),
    publicAssets: groupByFolder(
      listFiles(join(root, "public")).map((path) => ({
        path: relative(join(root, "public"), path).split("\\").join("/"),
        bytes: statSync(path).size,
      })),
    ),
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  for (const [label, group] of [["Statik JS", report.javascript], ["Statik CSS", report.css]]) {
    console.log(`${label}: ${group.files} dosya · ${formatKb(group.bytes)} · gzip ${formatKb(group.gzipBytes)}`);
    for (const file of group.largest) console.log(`  ${formatKb(file.bytes)} (gzip ${formatKb(file.gzipBytes)}) ${file.path}`);
  }
  console.log("public/:");
  for (const group of report.publicAssets) {
    console.log(`  ${group.folder}: ${group.files} dosya · ${formatKb(group.bytes)} · en büyük ${formatKb(group.largest[0].bytes)}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) cli();
