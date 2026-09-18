/**
 * İstemci paketi denetimi (Q19).
 *
 * Kabul ölçütü: "Gelecek gün dosyaları ve editoryal kayıtlar istemci paketinde
 * bulunmuyor." Bu test o ölçütü kaynak düzeyinde, derleme beklemeden korur: istemci
 * bileşenlerinden (`"use client"`) başlayıp içe aktarım grafiğini yürür ve grafiğin
 * içerik dosyalarına, günlük yayın katmanına veya Node yerleşiklerine uzanmadığını
 * doğrular.
 *
 * Grafik yürüyüşü bir paketleyici değildir; tek başına yeterli de değildir. Derlenmiş
 * paketin kendisi `npm run check:bundle` (`scripts/check-client-bundle.mjs`) ile ayrıca
 * taranır. Bu test hızlı ve her `npm test` çalışmasında koşan erken uyarıdır: bir
 * istemci bileşenine içerik içe aktarımı eklendiği anda düşer, derlemeyi beklemez.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SOURCE_ROOT = join(REPO_ROOT, "src");
const CONTENT_ROOT = join(SOURCE_ROOT, "content");
const DAILY_ROOT = join(SOURCE_ROOT, "lib", "daily");

const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".json"];

/** Depo köküne göre, işletim sisteminden bağımsız okunur yol. */
const repoPath = (absolute: string): string => relative(REPO_ROOT, absolute).split("\\").join("/");

/** Bir dizindeki tüm kaynak dosyaları; testler hariç. */
function sourceFiles(directory: string): string[] {
  const found: string[] = [];

  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (/\.(test|spec)\.tsx?$/.test(entry.name)) continue;
      if (SOURCE_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) found.push(full);
    }
  };

  walk(directory);
  return found;
}

/** Yorumları siler; içe aktarım araması yorum içindeki örneklere takılmasın. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");

/**
 * Dosyanın çalışma zamanına giren içe aktarım tanımlayıcıları.
 *
 * Yalnız tip taşıyan içe aktarımlar (`import type ...`, tüm belirteçleri `type` olan
 * süslü parantezler) atlanır: TypeScript bunları siler, pakete hiçbir şey girmez.
 */
function runtimeImports(source: string): string[] {
  const text = stripComments(source);
  const specifiers: string[] = [];

  // `import ... from "x"` ve `export ... from "x"`
  for (const match of text.matchAll(/\b(import|export)\b([\s\S]*?)\bfrom\s*["']([^"']+)["']/g)) {
    const clause = match[2] ?? "";
    const specifier = match[3];
    if (specifier === undefined) continue;
    if (/^\s*type\s/.test(clause)) continue;

    const named = /\{([\s\S]*)\}/.exec(clause);
    if (named?.[1] !== undefined) {
      const entries = named[1]
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      const bareDefault = clause.slice(0, clause.indexOf("{")).replace(/[\s,]/g, "");
      const allTypeOnly =
        entries.length > 0 && entries.every((entry) => /^type\s/.test(entry)) && bareDefault === "";
      if (allTypeOnly) continue;
    }

    specifiers.push(specifier);
  }

  // Yan etkili `import "x"` ve dinamik `import("x")`
  for (const match of text.matchAll(/\bimport\s*\(?\s*["']([^"']+)["']/g)) {
    const specifier = match[1];
    if (specifier !== undefined) specifiers.push(specifier);
  }

  return specifiers;
}

/** Tanımlayıcıyı depodaki bir dosyaya çözer; depo dışıysa (paket) `null` döner. */
function resolveSpecifier(importer: string, specifier: string): string | null {
  let base: string;
  if (specifier.startsWith("@/")) base = join(SOURCE_ROOT, specifier.slice(2));
  else if (specifier.startsWith(".")) base = resolve(dirname(importer), specifier);
  else return null;

  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RESOLVE_EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ];

  for (const candidate of candidates) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // Aday yok; sıradakine bak.
    }
  }
  return null;
}

/** İlk ifadesi `"use client"` olan dosyalar: istemci paketinin giriş noktaları. */
const clientEntryPoints = sourceFiles(SOURCE_ROOT).filter((file) =>
  /^\s*(?:["']use strict["'];?\s*)?["']use client["']/.test(readFileSync(file, "utf8")),
);

/** İstemci giriş noktalarından ulaşılabilen tüm depo dosyaları ve dış paketler. */
function walkClientGraph(): { files: Set<string>; packages: Set<string> } {
  const files = new Set<string>();
  const packages = new Set<string>();
  const queue = [...clientEntryPoints];

  while (queue.length > 0) {
    const current = queue.pop();
    if (current === undefined || files.has(current)) continue;
    files.add(current);

    if (current.endsWith(".json")) continue;

    for (const specifier of runtimeImports(readFileSync(current, "utf8"))) {
      const resolved = resolveSpecifier(current, specifier);
      if (resolved === null) {
        packages.add(specifier);
        continue;
      }
      if (!files.has(resolved)) queue.push(resolved);
    }
  }

  return { files, packages };
}

const clientGraph = walkClientGraph();

describe("istemci paketi içerik sızdırmaz", () => {
  it("istemci giriş noktaları bulunur", () => {
    // Grafik boşsa test hiçbir şey kanıtlamaz; önce yürüyüşün gerçekten iş gördüğünü doğrula.
    expect(clientEntryPoints.length).toBeGreaterThan(0);
    expect(clientGraph.files.size).toBeGreaterThan(clientEntryPoints.length);
    expect([...clientGraph.files].map(repoPath)).toContain("src/components/game/GameBoard.tsx");
  });

  it("hiçbir istemci modülü günlük içerik dosyasına ulaşmaz", () => {
    const sizinti = [...clientGraph.files]
      .filter((file) => file.startsWith(CONTENT_ROOT))
      .map(repoPath);

    expect(sizinti).toEqual([]);
  });

  it("gelecek günlerin dosyaları istemci grafiğinde yoktur", () => {
    const gunler = readdirSync(join(CONTENT_ROOT, "puzzles")).filter((name) =>
      name.endsWith(".json"),
    );
    expect(gunler.length).toBeGreaterThan(0);

    const grafik = new Set([...clientGraph.files].map(repoPath));
    for (const gun of gunler) {
      expect(grafik.has(`src/content/puzzles/${gun}`)).toBe(false);
    }
  });

  it("editoryal kayıtlar hiçbir kaynak dosyadan içe aktarılmaz", () => {
    const editoryal = sourceFiles(SOURCE_ROOT).filter((file) =>
      runtimeImports(readFileSync(file, "utf8")).some((specifier) =>
        specifier.includes("content/editorial"),
      ),
    );

    expect(editoryal.map(repoPath)).toEqual([]);
  });

  it("günlük yayın katmanı istemciye taşınmaz", () => {
    // `src/lib/daily` dosya sistemine dokunur; istemciden yalnız `import type` ile
    // alınabilir, ki o da pakete hiçbir şey koymaz.
    const sizinti = [...clientGraph.files].filter((file) => file.startsWith(DAILY_ROOT));

    expect(sizinti.map(repoPath)).toEqual([]);
  });

  it("istemci grafiğinde Node yerleşikleri bulunmaz", () => {
    const yerlesikler = [...clientGraph.packages].filter(
      (specifier) => specifier.startsWith("node:") || specifier === "fs" || specifier === "path",
    );

    expect(yerlesikler).toEqual([]);
  });

  it("içerik yalnız dosya sisteminden okunur; hiçbir kaynak dosya statik içe aktarmaz", () => {
    // Statik içe aktarım tüm günleri modül grafiğine sokar. Tek izinli okuma yolu
    // `loadDailyPuzzle`'dır; testler bu kuralın dışındadır ve taranmaz.
    const iceAktaranlar = sourceFiles(SOURCE_ROOT).filter((file) =>
      runtimeImports(readFileSync(file, "utf8")).some((specifier) =>
        posix.normalize(specifier.replace(/\\/g, "/")).includes("content/puzzles"),
      ),
    );

    expect(iceAktaranlar.map(repoPath)).toEqual([]);
  });
});
