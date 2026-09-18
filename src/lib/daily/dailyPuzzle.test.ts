import { afterEach, describe, expect, it, vi } from "vitest";

import { standardPuzzle } from "@/features/game/fixtures";

import {
  CONTENT_DIR_ENV_VAR,
  DEFAULT_CONTENT_DIR,
  loadDailyPuzzle,
  loadingState,
  puzzleNumberFromId,
  resolveContentDir,
  type DailyPuzzleState,
} from "./dailyPuzzle";
import { TODAY_ENV_VAR } from "./publicationDay";

/**
 * Okunan dosya yollarını kaydeden ince bir sarmalayıcı. Gerçek okuma yerinde durur;
 * amaç yükleyicinin dosya sistemine kaç kez ve hangi yolla dokunduğunu görmektir.
 */
const fsIzleyici = vi.hoisted(() => ({ okunanYollar: [] as string[] }));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile(path: string, encoding: BufferEncoding) {
      fsIzleyici.okunanYollar.push(path);
      return actual.readFile(path, encoding);
    },
  };
});

/** Testlerin okuduğu sahte yayın stoğu; bkz. `tests/fixtures/content/README.md`. */
const TEST_CONTENT_DIR = "tests/fixtures/content/puzzles";

/** Europe/Istanbul 20 Eylül 2026 gece yarısı. */
const ISTANBUL_MIDNIGHT_2026_09_20 = "2026-09-19T21:00:00.000Z";

const load = (options: Parameters<typeof loadDailyPuzzle>[0] = {}) =>
  loadDailyPuzzle({ contentDir: TEST_CONTENT_DIR, ...options });

/** Durum `missing` ise gerekçeyi, değilse durumun kendisini döndürür (hata mesajı okunur olsun). */
const reasonOf = (state: DailyPuzzleState): string =>
  state.status === "missing" ? state.reason : state.status;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("günlük içerik yükleme", () => {
  it("yayına açık günü oyuncu verisiyle döndürür", async () => {
    const state = await load({ dayKey: "2026-09-20" });

    expect(reasonOf(state)).toBe("ok");
    if (state.status !== "ok") return;

    expect(state.dayKey).toBe("2026-09-20");
    expect(state.source).toBe("2026-09-20.json");
    expect(state.puzzle.id).toBe("ornek-001");
    expect(state.puzzle.groups).toHaveLength(4);
  });

  it("oyuncuya giden veride editoryal alanlar bulunmaz", async () => {
    const state = await load({ dayKey: "2026-09-20" });
    if (state.status !== "ok") throw new Error(`Beklenen ok, gelen ${reasonOf(state)}`);

    const alanlar = Object.keys(state.puzzle);
    expect(alanlar).not.toContain("status");
    expect(alanlar).not.toContain("author");
    expect(alanlar).not.toContain("reviewer");
  });

  it("test içeriği standardPuzzle örneğiyle birebir aynıdır", async () => {
    // Akış testleri (`tests/e2e/`) gerçek yayın kablolamasını bu dosya üzerinden oynar.
    // İkisi ayrışırsa testlerin oynadığı tahta sessizce değişir; bu yüzden denetlenir.
    const state = await load({ dayKey: "2026-09-20" });
    if (state.status !== "ok") throw new Error(`Beklenen ok, gelen ${reasonOf(state)}`);

    expect(state.puzzle).toEqual(standardPuzzle);
  });

  it("o güne dosya yoksa no-content döndürür", async () => {
    const state = await load({ dayKey: "2026-09-19" });

    expect(reasonOf(state)).toBe("no-content");
    if (state.status !== "missing") return;
    expect(state.detail).toContain("2026-09-19.json");
    expect(state.issues).toEqual([]);
  });

  it("taslak içerik yayına çıkmaz", async () => {
    const state = await load({ dayKey: "2026-09-21" });

    expect(reasonOf(state)).toBe("not-published");
    if (state.status !== "missing") return;
    expect(state.detail).toContain("draft");
  });

  it("şemaya uymayan dosya doğrulayıcının sorunlarıyla birlikte reddedilir", async () => {
    const state = await load({ dayKey: "2026-09-22" });

    expect(reasonOf(state)).toBe("invalid-content");
    if (state.status !== "missing") return;
    expect(state.issues.map((issue) => issue.code)).toContain("group-count");
    expect(state.issues.every((issue) => issue.source === "2026-09-22.json")).toBe(true);
  });

  it("bozuk JSON dosyası json-parse sorunu üretir", async () => {
    const state = await load({ dayKey: "2026-09-23" });

    expect(reasonOf(state)).toBe("invalid-content");
    if (state.status !== "missing") return;
    expect(state.issues.map((issue) => issue.code)).toEqual(["json-parse"]);
  });

  it("dosya adı ile date alanı farklı günü gösteriyorsa içerik sunulmaz", async () => {
    const state = await load({ dayKey: "2026-09-24" });

    expect(reasonOf(state)).toBe("invalid-content");
    if (state.status !== "missing") return;
    expect(state.issues.map((issue) => issue.code)).toEqual(["file-date-mismatch"]);
  });

  it("takvimde olmayan gün anahtarıyla dosya sistemine hiç dokunulmaz", async () => {
    const state = await load({ dayKey: "2026-02-30" });

    expect(reasonOf(state)).toBe("invalid-content");
    if (state.status !== "missing") return;
    expect(state.dayKey).toBe("2026-02-30");
  });

  it("yol kaçışı denemesi gün anahtarı doğrulamasında durur", async () => {
    const state = await load({ dayKey: "../../../package" });

    expect(reasonOf(state)).toBe("invalid-content");
  });

  it("gün verilmezse yayın gününü saatten hesaplar", async () => {
    const state = await load({ now: new Date(ISTANBUL_MIDNIGHT_2026_09_20) });

    expect(state.dayKey).toBe("2026-09-20");
    expect(reasonOf(state)).toBe("ok");
  });

  it("gece yarısından hemen önce hâlâ önceki günün içeriği aranır", async () => {
    const state = await load({ now: new Date("2026-09-19T20:59:59.999Z") });

    expect(state.dayKey).toBe("2026-09-19");
    expect(reasonOf(state)).toBe("no-content");
  });

  it("gece yarısında sunulan gün değişir", async () => {
    const once = await load({ now: new Date("2026-09-20T20:59:59.999Z") });
    const sonra = await load({ now: new Date("2026-09-20T21:00:00.000Z") });

    expect(once.dayKey).toBe("2026-09-20");
    expect(reasonOf(once)).toBe("ok");
    expect(sonra.dayKey).toBe("2026-09-21");
    expect(reasonOf(sonra)).toBe("not-published");
  });

  it(`${TODAY_ENV_VAR} ortam değişkeni sunulan günü belirler`, async () => {
    vi.stubEnv(TODAY_ENV_VAR, "2026-09-20");

    const state = await load({ now: new Date("2030-01-01T12:00:00.000Z") });
    expect(state.dayKey).toBe("2026-09-20");
    expect(reasonOf(state)).toBe("ok");
  });

  it("bir istek yalnız o günün dosyasını okur", async () => {
    // Yükleyici dizini listelemez ve komşu günleri açmaz: okunan tek yol bugünündür.
    // Dizinde 20–24 Eylül dosyaları duruyor; hiçbiri açılmamalı.
    fsIzleyici.okunanYollar.length = 0;

    await load({ dayKey: "2026-09-20" });

    expect(fsIzleyici.okunanYollar).toHaveLength(1);
    expect(fsIzleyici.okunanYollar[0]).toMatch(/2026-09-20\.json$/);
  });
});

describe("içerik dizininin çözümlenmesi", () => {
  it("varsayılan dizin yayın stoğudur", () => {
    expect(resolveContentDir()).toBe(
      // Depo kökü + varsayılan yol; ayırıcı işletim sistemine göre değişir.
      resolveContentDir(DEFAULT_CONTENT_DIR),
    );
    expect(resolveContentDir()).toContain("content");
  });

  it(`${CONTENT_DIR_ENV_VAR} ortam değişkeni dizini değiştirir`, async () => {
    vi.stubEnv(CONTENT_DIR_ENV_VAR, TEST_CONTENT_DIR);

    const state = await loadDailyPuzzle({ dayKey: "2026-09-20" });
    expect(reasonOf(state)).toBe("ok");
  });

  it("var olmayan dizin no-content olarak bildirilir", async () => {
    const state = await loadDailyPuzzle({
      dayKey: "2026-09-20",
      contentDir: "tests/fixtures/content/boyle-bir-dizin-yok",
    });

    expect(reasonOf(state)).toBe("no-content");
  });
});

describe("arayüz yardımcıları", () => {
  it("loading durumu yükleyiciden değil arayüzden gelir", async () => {
    const beklemede = loadingState("2026-09-20");
    expect(beklemede).toEqual({ status: "loading", dayKey: "2026-09-20" });

    // Sunucu okuması her zaman sonuçlanır; hiçbir yol `loading` döndürmez.
    const gunler = ["2026-09-19", "2026-09-20", "2026-09-21", "2026-09-22", "2026-09-23"];
    const durumlar = await Promise.all(gunler.map((dayKey) => load({ dayKey })));
    expect(durumlar.map((state) => state.status)).not.toContain("loading");
  });

  it("bulmaca kimliğinden sıra numarasını çıkarır", () => {
    expect(puzzleNumberFromId("q-001")).toBe(1);
    expect(puzzleNumberFromId("q-042")).toBe(42);
    expect(puzzleNumberFromId("ornek-001")).toBe(1);
    expect(puzzleNumberFromId("gunluk")).toBeNull();
    expect(puzzleNumberFromId("q-000")).toBeNull();
  });
});
