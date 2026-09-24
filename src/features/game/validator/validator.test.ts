import { describe, expect, it } from "vitest";

import prototip20 from "@/content/puzzles/2026-09-20.json";
import prototip21 from "@/content/puzzles/2026-09-21.json";
import prototip22 from "@/content/puzzles/2026-09-22.json";
import prototip23 from "@/content/puzzles/2026-09-23.json";
import prototip24 from "@/content/puzzles/2026-09-24.json";
import prototip1007 from "@/content/puzzles/2026-10-07.json";
import korTahta20 from "@/content/editorial/blind/2026-09-20.json";
import korTahta21 from "@/content/editorial/blind/2026-09-21.json";
import korTahta22 from "@/content/editorial/blind/2026-09-22.json";
import korTahta23 from "@/content/editorial/blind/2026-09-23.json";
import korTahta24 from "@/content/editorial/blind/2026-09-24.json";
import korTahta1007 from "@/content/editorial/blind/2026-10-07.json";
import {
  ISSUE_CODES,
  MAX_COMFORTABLE_WORD_LENGTH,
  formatIssue,
  hasErrors,
  isCalendarDate,
  issuesBySeverity,
  parseDailyPuzzleFile,
  toPuzzle,
  validateBlindBoard,
  validatePuzzle,
  validatePuzzleSet,
  type IssueCode,
  type ValidationIssue,
} from "@/features/game/validator";

/** Doğrulayıcı testlerinde kullanılan, kurallara uyan temel bulmaca. */
function gecerliBulmaca(): Record<string, unknown> {
  return {
    schemaVersion: 1,
    revision: 1,
    id: "q-test",
    date: "2026-10-01",
    language: "tr",
    status: "draft",
    author: "Utkuuzun14",
    reviewer: "mehmetalisahingm",
    groups: [1, 2, 3, 4].map((difficulty) => ({
      id: `qtest-g${difficulty}`,
      title: `GRUP ${difficulty}`,
      difficulty,
      explanation: `${difficulty}. grubun açıklaması.`,
      words: [1, 2, 3, 4].map((sira) => ({
        id: `qtest-w${difficulty}${sira}`,
        text: `KELİME${difficulty}${sira}`,
      })),
    })),
  };
}

/** Sorun listesindeki kodları sırayla verir; testler mesaj metnine değil koda bakar. */
const kodlar = (issues: readonly ValidationIssue[]): IssueCode[] =>
  issues.map((issue) => issue.code);

const prototipler = [
  ["2026-09-20", prototip20, korTahta20],
  ["2026-09-21", prototip21, korTahta21],
  ["2026-09-22", prototip22, korTahta22],
  ["2026-09-23", prototip23, korTahta23],
  ["2026-09-24", prototip24, korTahta24],
  ["2026-10-07", prototip1007, korTahta1007],
] as const;

describe("validatePuzzle — geçerli içerik", () => {
  it.each(prototipler)("%s prototipi hiçbir sorun üretmez", (_, puzzle) => {
    expect(validatePuzzle(puzzle, { requireEditorialFields: true })).toEqual([]);
  });

  it("sentetik geçerli bulmaca hiçbir sorun üretmez", () => {
    expect(validatePuzzle(gecerliBulmaca(), { requireEditorialFields: true })).toEqual([]);
  });

  it("editoryal alanlar istenmezse status/author/reviewer aranmaz", () => {
    const bulmaca = gecerliBulmaca();
    delete bulmaca.status;
    delete bulmaca.author;
    delete bulmaca.reviewer;
    expect(validatePuzzle(bulmaca)).toEqual([]);
    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "status",
      "author",
      "reviewer",
    ]);
  });

  it("iki gruplu öğretici tahta groupCount seçeneğiyle doğrulanır", () => {
    const bulmaca = gecerliBulmaca();
    bulmaca.groups = (bulmaca.groups as unknown[]).slice(0, 2);
    expect(validatePuzzle(bulmaca, { groupCount: 2 })).toEqual([]);
    expect(kodlar(validatePuzzle(bulmaca))).toEqual(["group-count"]);
  });
});

describe("validatePuzzle — yapısal hatalar", () => {
  it("üç gruplu bulmaca group-count üretir ve grup denetimine girmez", () => {
    const bulmaca = gecerliBulmaca();
    bulmaca.groups = (bulmaca.groups as unknown[]).slice(0, 3);
    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "group-count",
    ]);
  });

  it("beş kelimeli grup word-count üretir ve sorun doğru grubu işaret eder", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: unknown[] }[];
    const ikinciGrup = gruplar[1];
    if (ikinciGrup === undefined) throw new Error("test verisi bozuk");
    ikinciGrup.words = [...ikinciGrup.words, { id: "qtest-w25", text: "FAZLALIK" }];

    const sorunlar = validatePuzzle(bulmaca, { requireEditorialFields: true });
    expect(kodlar(sorunlar)).toEqual(["word-count"]);
    expect(sorunlar[0]?.groupIndex).toBe(1);
    expect(sorunlar[0]?.path).toBe("groups[1].words");
  });

  it("tekrarlı difficulty difficulty-coverage üretir", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { difficulty: number }[];
    const dorduncuGrup = gruplar[3];
    if (dorduncuGrup === undefined) throw new Error("test verisi bozuk");
    dorduncuGrup.difficulty = 1;

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "difficulty-coverage",
    ]);
  });

  it("aralık dışı difficulty difficulty-value ve difficulty-coverage üretir", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { difficulty: number }[];
    const ucuncuGrup = gruplar[2];
    if (ucuncuGrup === undefined) throw new Error("test verisi bozuk");
    ucuncuGrup.difficulty = 7;

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "difficulty-value",
      "difficulty-coverage",
    ]);
  });

  it("boş açıklama ve boş başlık ayrı sorunlar üretir", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { title: string; explanation: string }[];
    const ilkGrup = gruplar[0];
    if (ilkGrup === undefined) throw new Error("test verisi bozuk");
    ilkGrup.explanation = "   ";
    ilkGrup.title = "";

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "group-title",
      "group-explanation",
    ]);
  });

  it("çakışan grup kimliği group-id-duplicate üretir", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { id: string }[];
    const ikinciGrup = gruplar[1];
    const ilkGrup = gruplar[0];
    if (ikinciGrup === undefined || ilkGrup === undefined) throw new Error("test verisi bozuk");
    ikinciGrup.id = ilkGrup.id;

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "group-id-duplicate",
    ]);
  });
});

describe("validatePuzzle — kimlik ve Türkçe kuralları", () => {
  it("Türkçe karakterli WordId word-id-format üretir", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: { id: string }[] }[];
    const kelime = gruplar[0]?.words[0];
    if (kelime === undefined) throw new Error("test verisi bozuk");
    kelime.id = "qtest-w1İ";

    const sorunlar = validatePuzzle(bulmaca, { requireEditorialFields: true });
    expect(kodlar(sorunlar)).toEqual(["word-id-format"]);
    expect(sorunlar[0]?.wordIndex).toBe(0);
  });

  it("çakışan WordId word-id-duplicate üretir", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: { id: string }[] }[];
    const ilkKelime = gruplar[0]?.words[0];
    const digerKelime = gruplar[2]?.words[1];
    if (ilkKelime === undefined || digerKelime === undefined) throw new Error("test verisi bozuk");
    digerKelime.id = ilkKelime.id;

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "word-id-duplicate",
    ]);
  });

  it("normalizeTr ile aynı olan kelimeler word-duplicate üretir (büyük/küçük ve Türkçe harf)", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: { text: string }[] }[];
    const ilkKelime = gruplar[0]?.words[0];
    const digerKelime = gruplar[3]?.words[3];
    if (ilkKelime === undefined || digerKelime === undefined) throw new Error("test verisi bozuk");
    ilkKelime.text = "IŞIK";
    digerKelime.text = "ışık";

    const sorunlar = validatePuzzle(bulmaca, { requireEditorialFields: true });
    expect(kodlar(sorunlar)).toEqual(["word-duplicate"]);
    expect(sorunlar[0]?.groupIndex).toBe(3);
  });

  it("boş kelime metni word-text üretir ve yinelenen kelime denetimine girmez", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: { text: string }[] }[];
    const kelime = gruplar[1]?.words[2];
    if (kelime === undefined) throw new Error("test verisi bozuk");
    kelime.text = "  ";

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual(["word-text"]);
  });

  it("çok uzun kelime yalnız uyarı üretir; doğrulama hatayla düşmez", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: { text: string }[] }[];
    const kelime = gruplar[0]?.words[0];
    if (kelime === undefined) throw new Error("test verisi bozuk");
    kelime.text = "A".repeat(MAX_COMFORTABLE_WORD_LENGTH + 1);

    const sorunlar = validatePuzzle(bulmaca, { requireEditorialFields: true });
    expect(kodlar(sorunlar)).toEqual(["word-length"]);
    expect(hasErrors(sorunlar)).toBe(false);
    expect(issuesBySeverity(sorunlar, "warning")).toHaveLength(1);
  });

  it("tam sınırdaki kelime uyarı üretmez", () => {
    const bulmaca = gecerliBulmaca();
    const gruplar = bulmaca.groups as { words: { text: string }[] }[];
    const kelime = gruplar[0]?.words[0];
    if (kelime === undefined) throw new Error("test verisi bozuk");
    kelime.text = "A".repeat(MAX_COMFORTABLE_WORD_LENGTH);

    expect(validatePuzzle(bulmaca, { requireEditorialFields: true })).toEqual([]);
  });
});

describe("validatePuzzle — üst düzey alanlar", () => {
  it("nesne olmayan girdi tek bir puzzle-not-object üretir", () => {
    for (const girdi of [null, undefined, 42, "bulmaca", [], true]) {
      expect(kodlar(validatePuzzle(girdi))).toEqual(["puzzle-not-object"]);
    }
  });

  it("şema, revizyon, kimlik ve dil hataları birlikte raporlanır", () => {
    const bulmaca = gecerliBulmaca();
    bulmaca.schemaVersion = 2;
    bulmaca.revision = 0;
    bulmaca.id = "";
    bulmaca.language = "en";

    expect(kodlar(validatePuzzle(bulmaca, { requireEditorialFields: true }))).toEqual([
      "schema-version",
      "revision",
      "puzzle-id",
      "language",
    ]);
  });

  it("biçimi bozuk tarih date-format, takvimde olmayan gün date-invalid üretir", () => {
    const bicimsiz = gecerliBulmaca();
    bicimsiz.date = "24.09.2026";
    expect(kodlar(validatePuzzle(bicimsiz, { requireEditorialFields: true }))).toEqual([
      "date-format",
    ]);

    const takvimDisi = gecerliBulmaca();
    takvimDisi.date = "2026-02-30";
    expect(kodlar(validatePuzzle(takvimDisi, { requireEditorialFields: true }))).toEqual([
      "date-invalid",
    ]);

    expect(isCalendarDate("2026-02-28")).toBe(true);
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2024-02-29")).toBe(true);
  });

  it("bilinmeyen status uyarı üretir, boş status hata üretir", () => {
    const bilinmeyen = gecerliBulmaca();
    bilinmeyen.status = "taslak";
    const uyarilar = validatePuzzle(bilinmeyen, { requireEditorialFields: true });
    expect(kodlar(uyarilar)).toEqual(["status-unknown"]);
    expect(hasErrors(uyarilar)).toBe(false);

    const bos = gecerliBulmaca();
    bos.status = "";
    expect(kodlar(validatePuzzle(bos, { requireEditorialFields: true }))).toEqual(["status"]);
  });
});

describe("parseDailyPuzzleFile — ham JSON daraltma", () => {
  it.each(prototipler)("%s dosyası tip güvenli biçimde daraltılır", (_, puzzle) => {
    const sonuc = parseDailyPuzzleFile(puzzle);
    expect(sonuc.ok).toBe(true);
    if (!sonuc.ok) return;

    expect(sonuc.file.groups).toHaveLength(4);
    expect(sonuc.file.groups[0].words).toHaveLength(4);
    expect(sonuc.file.language).toBe("tr");
    expect(sonuc.file.schemaVersion).toBe(1);
    expect(typeof sonuc.file.author).toBe("string");
    expect(sonuc.issues).toEqual([]);
  });

  it("bozuk JSON güvenle reddedilir; daraltılmış veri döndürülmez", () => {
    const sonuc = parseDailyPuzzleFile({ schemaVersion: 1, groups: "dört grup" });
    expect(sonuc.ok).toBe(false);
    if (sonuc.ok) return;
    expect(hasErrors(sonuc.issues)).toBe(true);
    expect(kodlar(sonuc.issues)).toContain("group-count");
  });

  it("toPuzzle editoryal alanları soyar; oyuncu verisinde status/author/reviewer bulunmaz", () => {
    const sonuc = parseDailyPuzzleFile(prototip24);
    expect(sonuc.ok).toBe(true);
    if (!sonuc.ok) return;

    const puzzle = toPuzzle(sonuc.file);
    const alanlar = Object.keys(puzzle).sort();
    expect(alanlar).toEqual(["date", "groups", "id", "language", "revision", "schemaVersion"]);
    expect(puzzle.groups).toBe(sonuc.file.groups);
  });
});

describe("validateBlindBoard", () => {
  it.each(prototipler)("%s kör tahtası kanonik bulmacayla tutarlı", (_, puzzle, korTahta) => {
    expect(validateBlindBoard(puzzle, korTahta)).toEqual([]);
  });

  it("grup bilgisi taşıyan kör tahta blind-reveals-answers üretir", () => {
    const korTahta = { ...korTahta24, groups: [] };
    expect(kodlar(validateBlindBoard(prototip24, korTahta))).toContain("blind-reveals-answers");
  });

  it("kanonik sırayla aynı olan kör tahta blind-order üretir", () => {
    const kanonikSirali = {
      ...korTahta24,
      words: prototip24.groups.flatMap((group) =>
        group.words.map((word) => ({ id: word.id, text: word.text })),
      ),
    };
    expect(kodlar(validateBlindBoard(prototip24, kanonikSirali))).toEqual(["blind-order"]);
  });

  it("eksik kelime, farklı kelime ve fazladan alan yakalanır", () => {
    const eksik = { ...korTahta24, words: korTahta24.words.slice(0, 15) };
    expect(kodlar(validateBlindBoard(prototip24, eksik))).toEqual(["blind-words"]);

    const farkli = {
      ...korTahta24,
      words: korTahta24.words.map((word, index) =>
        index === 0 ? { id: word.id, text: "BAŞKA" } : word,
      ),
    };
    expect(kodlar(validateBlindBoard(prototip24, farkli))).toEqual(["blind-words"]);

    const fazlaAlan = {
      ...korTahta24,
      words: korTahta24.words.map((word, index) =>
        index === 0 ? { ...word, difficulty: 1 } : word,
      ),
    };
    expect(kodlar(validateBlindBoard(prototip24, fazlaAlan))).toContain("blind-word-shape");
  });

  it("kimlik veya tarih uyuşmazlığı ayrı kodlar üretir", () => {
    const uyusmaz = { ...korTahta24, id: "q-999", date: "2026-10-09" };
    expect(kodlar(validateBlindBoard(prototip24, uyusmaz))).toEqual(["blind-id", "blind-date"]);
  });
});

describe("validatePuzzleSet — dosyalar arası kurallar", () => {
  it("mevcut beş prototip kümesi sorunsuz", () => {
    const girdiler = prototipler.map(([tarih, puzzle]) => ({
      source: `${tarih}.json`,
      value: puzzle,
    }));
    expect(validatePuzzleSet(girdiler)).toEqual([]);
  });

  it("aynı güne iki bulmaca date-duplicate üretir", () => {
    const ilk = gecerliBulmaca();
    const ikinci = gecerliBulmaca();
    ikinci.id = "q-test-2";

    const sorunlar = validatePuzzleSet([
      { source: "2026-10-01.json", value: ilk },
      { source: "2026-10-01.json", value: ikinci },
    ]);
    expect(kodlar(sorunlar)).toEqual(["date-duplicate"]);
    expect(sorunlar[0]?.source).toBe("2026-10-01.json");
  });

  it("yinelenen bulmaca kimliği puzzle-id-duplicate üretir", () => {
    const ilk = gecerliBulmaca();
    const ikinci = gecerliBulmaca();
    ikinci.date = "2026-10-02";

    expect(
      kodlar(
        validatePuzzleSet([
          { source: "2026-10-01.json", value: ilk },
          { source: "2026-10-02.json", value: ikinci },
        ]),
      ),
    ).toEqual(["puzzle-id-duplicate"]);
  });

  it("dosya adı ile date alanı uyuşmazsa file-date-mismatch üretir", () => {
    expect(
      kodlar(validatePuzzleSet([{ source: "2026-10-05.json", value: gecerliBulmaca() }])),
    ).toEqual(["file-date-mismatch"]);
  });
});

describe("sorun biçimi", () => {
  it("tüm üretilen kodlar ISSUE_CODES listesinde tanımlı", () => {
    const bulmaca = gecerliBulmaca();
    bulmaca.groups = "dört grup";
    const sorunlar = [
      ...validatePuzzle(bulmaca, { requireEditorialFields: true }),
      ...validatePuzzle(null),
      ...validateBlindBoard(prototip24, { ...korTahta24, id: "q-999" }),
      ...validatePuzzleSet([{ source: "2026-10-05.json", value: gecerliBulmaca() }]),
    ];
    expect(sorunlar.length).toBeGreaterThan(0);
    for (const sorun of sorunlar) {
      expect(ISSUE_CODES).toContain(sorun.code);
      expect(["error", "warning"]).toContain(sorun.severity);
      expect(sorun.message.length).toBeGreaterThan(0);
      expect(sorun.path.length).toBeGreaterThan(0);
    }
  });

  it("formatIssue okunabilir tek satır üretir", () => {
    const satir = formatIssue({
      code: "word-duplicate",
      severity: "error",
      path: "groups[1].words[2].text",
      message: "Tahtada yinelenen kelime: NANE",
      source: "2026-09-24.json",
    });
    expect(satir).toBe(
      "HATA [word-duplicate] 2026-09-24.json · groups[1].words[2].text: Tahtada yinelenen kelime: NANE",
    );
  });
});
