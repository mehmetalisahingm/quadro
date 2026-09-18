/**
 * Quadro içerik doğrulayıcısı (Q18).
 *
 * Bulmaca içeriğini makine ile denetleyen tek ve resmi kaynaktır. Testler,
 * `npm run validate:content` komutu ve ileride günlük yayın katmanı (Q19) ile
 * yayın stoğu görevleri (Q26/Q27) aynı kuralları buradan okur; kural kopyası
 * başka bir dosyada tutulmaz.
 *
 * Denetlenen kuralların sözlü karşılığı `docs/CONTENT_SCHEMA.md` içindedir.
 * Şemanın tip karşılığı `src/features/game/contracts.ts` dosyasındaki
 * {@link Puzzle} tipidir; içerik dosyası buna editoryal alanlar ekler, bkz.
 * {@link DailyPuzzleFile}.
 *
 * Doğrulayıcı saf fonksiyonlardan oluşur: dosya sistemi, ağ veya zaman
 * kullanmaz ve girdiyi değiştirmez. Girdi tipi garanti edilmeyen ham JSON
 * olabilir; her alan `unknown` üzerinden daraltılır.
 *
 * Not: `../contracts.ts` içe aktarımı bilerek uzantılıdır. `scripts/validate-content.mjs`
 * bu modülü Node'un yerel TypeScript desteğiyle doğrudan çalıştırır ve Node
 * göreli içe aktarımlarda açık uzantı ister.
 */

import {
  GAME_CONSTANTS,
  normalizeTr,
  type Four,
  type Puzzle,
  type PuzzleGroup,
  type PuzzleWord,
} from "../contracts.ts";

// ---------------------------------------------------------------------------
// Sorun tipleri
// ---------------------------------------------------------------------------

/**
 * Sorunun ağırlığı. `error` içeriği yayına uygunsuz kılar ve doğrulama
 * komutunu düşürür; `warning` insan kararı gerektiren bir işarettir ve tek
 * başına doğrulamayı düşürmez.
 */
export type IssueSeverity = "error" | "warning";

/** Doğrulayıcının üretebildiği tüm sorun kodları. */
export const ISSUE_CODES = [
  // Ham veri ve üst düzey alanlar
  "json-parse",
  "puzzle-not-object",
  "schema-version",
  "revision",
  "puzzle-id",
  "date-format",
  "date-invalid",
  "language",
  "status",
  "status-unknown",
  "author",
  "reviewer",
  // Gruplar
  "group-count",
  "group-not-object",
  "group-id",
  "group-id-duplicate",
  "group-title",
  "group-explanation",
  "difficulty-value",
  "difficulty-coverage",
  // Kelimeler
  "word-count",
  "word-not-object",
  "word-id",
  "word-id-format",
  "word-id-duplicate",
  "word-text",
  "word-duplicate",
  "word-length",
  // Dosya kümesi
  "file-date-mismatch",
  "date-duplicate",
  "puzzle-id-duplicate",
  // Kör tahta
  "blind-not-object",
  "blind-id",
  "blind-date",
  "blind-words",
  "blind-word-shape",
  "blind-reveals-answers",
  "blind-order",
] as const;

/** Sorun kodu; mesaj metni değişse de kod kararlıdır ve testlerde buna bakılır. */
export type IssueCode = (typeof ISSUE_CODES)[number];

/** Doğrulayıcının bulduğu tek bir sorun. */
export type ValidationIssue = {
  /** Kararlı sorun kodu. */
  code: IssueCode;
  /** Sorunun ağırlığı. */
  severity: IssueSeverity;
  /** Sorunun bulunduğu alanın yolu, ör. `groups[2].words[1].text`. */
  path: string;
  /** Türkçe, tek cümlelik açıklama. */
  message: string;
  /** Sorun bir gruba aitse grubun sırası (0 tabanlı). */
  groupIndex?: number;
  /** Sorun bir kelimeye aitse kelimenin grup içindeki sırası (0 tabanlı). */
  wordIndex?: number;
  /** Küme doğrulamasında sorunun geldiği kaynak, ör. dosya adı. */
  source?: string;
};

// ---------------------------------------------------------------------------
// İçerik dosyası tipi
// ---------------------------------------------------------------------------

/**
 * `src/content/puzzles/YYYY-MM-DD.json` dosyasının tipi: oyuncuya gidecek
 * {@link Puzzle} verisi ve yalnız içerik ekibini ilgilendiren editoryal alanlar.
 *
 * Bu ayrım Q18'in kapsamındadır: editoryal alanlar oyun motoruna ve istemciye
 * gönderilmez, {@link toPuzzle} ile soyulur.
 */
export type DailyPuzzleFile = Puzzle & {
  /** İçeriğin yayın durumu. */
  status: string;
  /** Taslağı yazan kişinin kullanıcı adı. */
  author: string;
  /** İsteğe bağlı kör denemeyi yapan kişinin kullanıcı adı. */
  reviewer: string;
};

/** Bilinen yayın durumları. Q19 günlük yayın akışıyla kesinleşecektir. */
export const KNOWN_PUZZLE_STATUSES = ["draft", "published"] as const;

/**
 * 320 px kartta rahat okunduğu kabul edilen en uzun kelime. Üstü `word-length`
 * uyarısı üretir; kesin bir yasak değildir, tasarım kontrolü ister.
 * Kaynak: `docs/PUZZLE_GUIDE.md` yazım ilkesi 8.
 */
export const MAX_COMFORTABLE_WORD_LENGTH = 18;

/** Geçerli bir {@link PuzzleWord} kimliğinin kalıbı: ASCII küçük harf, rakam ve tek tire. */
export const WORD_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Geçerli zorluk katmanları. */
const DIFFICULTIES: readonly number[] = [1, 2, 3, 4];

// ---------------------------------------------------------------------------
// Saf yardımcılar
// ---------------------------------------------------------------------------

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFilledString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** Diziyi dört elemanlı demet olarak daraltır. */
const isFour = <T,>(values: readonly T[]): values is Four<T> =>
  values.length === GAME_CONSTANTS.groupSize;

/** `YYYY-MM-DD` metninin takvimde gerçekten var olan bir güne karşılık gelip gelmediğini söyler. */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const [, yearText, monthText, dayText] = match;
  if (yearText === undefined || monthText === undefined || dayText === undefined) return false;

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Sorunları okunabilir tek satıra çevirir; doğrulama komutunun çıktısı bunu kullanır. */
export function formatIssue(issue: ValidationIssue): string {
  const etiket = issue.severity === "error" ? "HATA" : "UYARI";
  const kaynak = issue.source === undefined ? "" : `${issue.source} · `;
  return `${etiket} [${issue.code}] ${kaynak}${issue.path}: ${issue.message}`;
}

/** Listede en az bir `error` varsa `true`. */
export const hasErrors = (issues: readonly ValidationIssue[]): boolean =>
  issues.some((issue) => issue.severity === "error");

/** Yalnız belirli ağırlıktaki sorunları süzer. */
export const issuesBySeverity = (
  issues: readonly ValidationIssue[],
  severity: IssueSeverity,
): ValidationIssue[] => issues.filter((issue) => issue.severity === severity);

// ---------------------------------------------------------------------------
// Tek bulmaca doğrulaması
// ---------------------------------------------------------------------------

/** {@link validatePuzzle} davranışını ayarlayan seçenekler. */
export type PuzzleValidationOptions = {
  /**
   * Beklenen grup sayısı. Varsayılan dörttür; iki gruplu öğretici tahta gibi
   * günlük bulmaca olmayan örnekler için 2 verilir.
   */
  groupCount?: number;
  /**
   * `schemaVersion`, `revision`, `id` ve `date` alanları aransın mı?
   * Öğretici tahtada bu alanlar yoktur. Varsayılan `true`.
   */
  requireDailyFields?: boolean;
  /**
   * `status`, `author` ve `reviewer` alanları aransın mı? Yalnız
   * `src/content/puzzles` altındaki dosyalar için `true` verilir. Varsayılan `false`.
   */
  requireEditorialFields?: boolean;
};

/**
 * Bir bulmacayı (ya da tipi garanti edilmeyen ham JSON değerini) doğrular ve
 * bulunan tüm sorunları döndürür. Boş liste "sorun yok" demektir.
 *
 * İlk hatada durmaz: yapı izin verdiği sürece tüm kuralları uygular ki içerik
 * yazan kişi bir PR'da tüm sorunları birlikte görsün.
 */
export function validatePuzzle(
  value: unknown,
  options: PuzzleValidationOptions = {},
): ValidationIssue[] {
  const groupCount = options.groupCount ?? GAME_CONSTANTS.groupCount;
  const requireDailyFields = options.requireDailyFields ?? true;
  const requireEditorialFields = options.requireEditorialFields ?? false;

  const issues: ValidationIssue[] = [];
  const add = (issue: ValidationIssue): void => {
    issues.push(issue);
  };

  if (!isRecord(value)) {
    add({
      code: "puzzle-not-object",
      severity: "error",
      path: ".",
      message: "Bulmaca bir nesne değil.",
    });
    return issues;
  }

  if (requireDailyFields) {
    if (value.schemaVersion !== 1) {
      add({
        code: "schema-version",
        severity: "error",
        path: "schemaVersion",
        message: "schemaVersion 1 olmalı.",
      });
    }
    if (
      typeof value.revision !== "number" ||
      !Number.isInteger(value.revision) ||
      value.revision < 1
    ) {
      add({
        code: "revision",
        severity: "error",
        path: "revision",
        message: "revision 1 veya daha büyük bir tam sayı olmalı.",
      });
    }
    if (!isFilledString(value.id)) {
      add({
        code: "puzzle-id",
        severity: "error",
        path: "id",
        message: "Bulmaca kimliği boş olamaz.",
      });
    }
    if (typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
      add({
        code: "date-format",
        severity: "error",
        path: "date",
        message: "date alanı YYYY-MM-DD biçiminde olmalı.",
      });
    } else if (!isCalendarDate(value.date)) {
      add({
        code: "date-invalid",
        severity: "error",
        path: "date",
        message: `date takvimde bulunmayan bir gün: ${value.date}`,
      });
    }
  }

  if (value.language !== "tr") {
    add({
      code: "language",
      severity: "error",
      path: "language",
      message: 'language "tr" olmalı.',
    });
  }

  if (requireEditorialFields) {
    if (!isFilledString(value.status)) {
      add({
        code: "status",
        severity: "error",
        path: "status",
        message: "status alanı boş olamaz.",
      });
    } else if (!KNOWN_PUZZLE_STATUSES.some((known) => known === value.status)) {
      add({
        code: "status-unknown",
        severity: "warning",
        path: "status",
        message: `status bilinen değerlerden biri değil (${KNOWN_PUZZLE_STATUSES.join(", ")}): ${value.status}`,
      });
    }
    if (!isFilledString(value.author)) {
      add({
        code: "author",
        severity: "error",
        path: "author",
        message: "author alanı boş olamaz.",
      });
    }
    if (!isFilledString(value.reviewer)) {
      add({
        code: "reviewer",
        severity: "error",
        path: "reviewer",
        message: "reviewer alanı boş olamaz.",
      });
    }
  }

  if (!Array.isArray(value.groups) || value.groups.length !== groupCount) {
    add({
      code: "group-count",
      severity: "error",
      path: "groups",
      message: `Bulmaca tam ${groupCount} grup içermeli.`,
    });
    return issues;
  }

  const groupIds = new Set<string>();
  const wordIds = new Set<string>();
  const normalizedTexts = new Set<string>();
  const difficulties: number[] = [];

  value.groups.forEach((group: unknown, groupIndex) => {
    const groupPath = `groups[${groupIndex}]`;

    if (!isRecord(group)) {
      add({
        code: "group-not-object",
        severity: "error",
        path: groupPath,
        message: "Grup bir nesne değil.",
        groupIndex,
      });
      return;
    }

    if (!isFilledString(group.id)) {
      add({
        code: "group-id",
        severity: "error",
        path: `${groupPath}.id`,
        message: "Grup kimliği boş olamaz.",
        groupIndex,
      });
    } else if (groupIds.has(group.id)) {
      add({
        code: "group-id-duplicate",
        severity: "error",
        path: `${groupPath}.id`,
        message: `Yinelenen grup kimliği: ${group.id}`,
        groupIndex,
      });
    } else {
      groupIds.add(group.id);
    }

    if (!isFilledString(group.title)) {
      add({
        code: "group-title",
        severity: "error",
        path: `${groupPath}.title`,
        message: "Grup başlığı boş olamaz.",
        groupIndex,
      });
    }

    if (!isFilledString(group.explanation)) {
      add({
        code: "group-explanation",
        severity: "error",
        path: `${groupPath}.explanation`,
        message: "Grup açıklaması zorunludur ve boş olamaz.",
        groupIndex,
      });
    }

    if (typeof group.difficulty !== "number" || !DIFFICULTIES.includes(group.difficulty)) {
      add({
        code: "difficulty-value",
        severity: "error",
        path: `${groupPath}.difficulty`,
        message: "difficulty 1, 2, 3 veya 4 olmalı.",
        groupIndex,
      });
    } else {
      difficulties.push(group.difficulty);
    }

    if (!Array.isArray(group.words) || group.words.length !== GAME_CONSTANTS.groupSize) {
      add({
        code: "word-count",
        severity: "error",
        path: `${groupPath}.words`,
        message: `Grup tam ${GAME_CONSTANTS.groupSize} kelime içermeli.`,
        groupIndex,
      });
      return;
    }

    group.words.forEach((word: unknown, wordIndex) => {
      const wordPath = `${groupPath}.words[${wordIndex}]`;

      if (!isRecord(word)) {
        add({
          code: "word-not-object",
          severity: "error",
          path: wordPath,
          message: "Kelime bir nesne değil.",
          groupIndex,
          wordIndex,
        });
        return;
      }

      if (!isFilledString(word.id)) {
        add({
          code: "word-id",
          severity: "error",
          path: `${wordPath}.id`,
          message: "Kelime kimliği boş olamaz.",
          groupIndex,
          wordIndex,
        });
      } else {
        if (!WORD_ID_PATTERN.test(word.id)) {
          add({
            code: "word-id-format",
            severity: "error",
            path: `${wordPath}.id`,
            message: `Kelime kimliği yalnız ASCII küçük harf, rakam ve tek tire içerebilir: ${word.id}`,
            groupIndex,
            wordIndex,
          });
        }
        if (wordIds.has(word.id)) {
          add({
            code: "word-id-duplicate",
            severity: "error",
            path: `${wordPath}.id`,
            message: `Yinelenen kelime kimliği: ${word.id}`,
            groupIndex,
            wordIndex,
          });
        } else {
          wordIds.add(word.id);
        }
      }

      if (!isFilledString(word.text)) {
        add({
          code: "word-text",
          severity: "error",
          path: `${wordPath}.text`,
          message: "Kelime metni boş olamaz.",
          groupIndex,
          wordIndex,
        });
        return;
      }

      const normalized = normalizeTr(word.text);
      if (normalizedTexts.has(normalized)) {
        add({
          code: "word-duplicate",
          severity: "error",
          path: `${wordPath}.text`,
          message: `Tahtada yinelenen kelime: ${word.text}`,
          groupIndex,
          wordIndex,
        });
      } else {
        normalizedTexts.add(normalized);
      }

      if (word.text.length > MAX_COMFORTABLE_WORD_LENGTH) {
        add({
          code: "word-length",
          severity: "warning",
          path: `${wordPath}.text`,
          message: `Kelime ${word.text.length} karakter; 320 px kartta okunurluk kontrol edilmeli (sınır ${MAX_COMFORTABLE_WORD_LENGTH}).`,
          groupIndex,
          wordIndex,
        });
      }
    });
  });

  if (new Set(difficulties).size !== groupCount) {
    add({
      code: "difficulty-coverage",
      severity: "error",
      path: "groups[].difficulty",
      message: `Her zorluk katmanı tam bir kez kullanılmalı; ${groupCount} farklı değer bekleniyor.`,
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Ham JSON'u güvenle daraltma
// ---------------------------------------------------------------------------

/** {@link parseDailyPuzzleFile} sonucu. */
export type PuzzleParseResult =
  | {
      ok: true;
      /** Doğrulanmış içerik dosyası. */
      file: DailyPuzzleFile;
      /** Yalnız uyarılar; hata varsa sonuç `ok: false` olur. */
      issues: ValidationIssue[];
    }
  | {
      ok: false;
      /** En az bir `error` içeren sorun listesi. */
      issues: ValidationIssue[];
    };

function narrowWord(value: unknown): PuzzleWord | null {
  if (!isRecord(value)) return null;
  const { id, text } = value;
  if (typeof id !== "string" || typeof text !== "string") return null;
  return { id, text };
}

function narrowGroup(value: unknown): PuzzleGroup | null {
  if (!isRecord(value)) return null;
  const { id, title, difficulty, explanation, words } = value;
  if (typeof id !== "string" || typeof title !== "string" || typeof explanation !== "string") {
    return null;
  }
  if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3 && difficulty !== 4) return null;
  if (!Array.isArray(words)) return null;

  const narrowed: PuzzleWord[] = [];
  for (const word of words) {
    const narrowedWord = narrowWord(word);
    if (narrowedWord === null) return null;
    narrowed.push(narrowedWord);
  }
  if (!isFour(narrowed)) return null;

  return { id, title, words: narrowed, difficulty, explanation };
}

/**
 * Ham JSON değerini önce doğrular, hata yoksa tip güvenli
 * {@link DailyPuzzleFile} nesnesine daraltır.
 *
 * JSON'dan gelen değerlerde `difficulty` yalnız `number`, `groups` ise düz
 * dizidir; bu fonksiyon dört elemanlı demet ({@link Four}) daralmasını da yapar.
 * Tip zorlaması (cast) kullanılmaz; her alan tek tek kontrol edilir.
 */
export function parseDailyPuzzleFile(value: unknown): PuzzleParseResult {
  const issues = validatePuzzle(value, { requireEditorialFields: true });
  if (hasErrors(issues)) return { ok: false, issues };

  if (!isRecord(value)) {
    return {
      ok: false,
      issues: [
        {
          code: "puzzle-not-object",
          severity: "error",
          path: ".",
          message: "Bulmaca bir nesne değil.",
        },
      ],
    };
  }

  const { schemaVersion, revision, id, date, language, status, author, reviewer, groups } = value;
  const narrowedGroups: PuzzleGroup[] = [];
  if (Array.isArray(groups)) {
    for (const group of groups) {
      const narrowedGroup = narrowGroup(group);
      if (narrowedGroup !== null) narrowedGroups.push(narrowedGroup);
    }
  }

  if (
    schemaVersion !== 1 ||
    typeof revision !== "number" ||
    typeof id !== "string" ||
    typeof date !== "string" ||
    language !== "tr" ||
    typeof status !== "string" ||
    typeof author !== "string" ||
    typeof reviewer !== "string" ||
    !isFour(narrowedGroups)
  ) {
    return {
      ok: false,
      issues: [
        {
          code: "puzzle-not-object",
          severity: "error",
          path: ".",
          message: "Bulmaca doğrulamayı geçti ama tip daraltması başarısız oldu; şema uyumsuz.",
        },
      ],
    };
  }

  return {
    ok: true,
    file: {
      schemaVersion: 1,
      revision,
      id,
      date,
      language: "tr",
      status,
      author,
      reviewer,
      groups: narrowedGroups,
    },
    issues,
  };
}

/**
 * İçerik dosyasından oyuncuya gidecek {@link Puzzle} verisini üretir.
 * Editoryal alanlar (`status`, `author`, `reviewer`) burada düşer.
 */
export function toPuzzle(file: DailyPuzzleFile): Puzzle {
  return {
    schemaVersion: file.schemaVersion,
    revision: file.revision,
    id: file.id,
    date: file.date,
    language: file.language,
    groups: file.groups,
  };
}

// ---------------------------------------------------------------------------
// Kör tahta doğrulaması
// ---------------------------------------------------------------------------

/** Kör tahtada bulunmasına izin verilen alanlar. */
const BLIND_ALLOWED_KEYS = ["schemaVersion", "id", "date", "language", "purpose", "words"];

/** Kör tahtanın asla taşımaması gereken, cevabı ele veren alanlar. */
const BLIND_FORBIDDEN_KEYS = ["groups", "difficulty", "title", "explanation", "status"];

/**
 * `src/content/editorial/blind/YYYY-MM-DD.json` kör tahtasını kanonik bulmacayla
 * karşılaştırır: aynı 16 kelime bulunmalı, grup bilgisi bulunmamalı ve sıra
 * kanonik sıradan farklı olmalıdır.
 *
 * Kanonik bulmaca geçersizse denetim yapılmaz; önce {@link validatePuzzle}
 * çalıştırılmalıdır.
 */
export function validateBlindBoard(puzzleValue: unknown, blindValue: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isRecord(blindValue)) {
    return [
      {
        code: "blind-not-object",
        severity: "error",
        path: ".",
        message: "Kör tahta bir nesne değil.",
      },
    ];
  }

  const parsed = parseDailyPuzzleFile(puzzleValue);
  if (!parsed.ok) {
    return [
      {
        code: "blind-not-object",
        severity: "error",
        path: ".",
        message: "Kanonik bulmaca geçersiz olduğu için kör tahta karşılaştırılamadı.",
      },
    ];
  }
  const { file } = parsed;

  if (blindValue.id !== file.id) {
    issues.push({
      code: "blind-id",
      severity: "error",
      path: "id",
      message: `Kör tahta kimliği bulmacayla aynı olmalı: ${file.id}`,
    });
  }
  if (blindValue.date !== file.date) {
    issues.push({
      code: "blind-date",
      severity: "error",
      path: "date",
      message: `Kör tahta tarihi bulmacayla aynı olmalı: ${file.date}`,
    });
  }

  for (const key of BLIND_FORBIDDEN_KEYS) {
    if (key in blindValue) {
      issues.push({
        code: "blind-reveals-answers",
        severity: "error",
        path: key,
        message: `Kör tahta cevap ipucu taşıyamaz; "${key}" alanı kaldırılmalı.`,
      });
    }
  }
  for (const key of Object.keys(blindValue)) {
    if (!BLIND_ALLOWED_KEYS.includes(key) && !BLIND_FORBIDDEN_KEYS.includes(key)) {
      issues.push({
        code: "blind-reveals-answers",
        severity: "warning",
        path: key,
        message: `Kör tahtada beklenmeyen alan: "${key}".`,
      });
    }
  }

  const canonical = file.groups.flatMap((group) =>
    group.words.map((word) => ({ id: word.id, text: word.text })),
  );

  if (!Array.isArray(blindValue.words) || blindValue.words.length !== GAME_CONSTANTS.wordCount) {
    issues.push({
      code: "blind-words",
      severity: "error",
      path: "words",
      message: `Kör tahta tam ${GAME_CONSTANTS.wordCount} kelime içermeli.`,
    });
    return issues;
  }

  const blindWords: PuzzleWord[] = [];
  blindValue.words.forEach((word: unknown, index) => {
    if (!isRecord(word)) {
      issues.push({
        code: "blind-word-shape",
        severity: "error",
        path: `words[${index}]`,
        message: "Kör tahta kelimesi bir nesne değil.",
        wordIndex: index,
      });
      return;
    }
    const keys = Object.keys(word).sort();
    if (keys.length !== 2 || keys[0] !== "id" || keys[1] !== "text") {
      issues.push({
        code: "blind-word-shape",
        severity: "error",
        path: `words[${index}]`,
        message: `Kör tahta kelimesi yalnız "id" ve "text" alanlarını taşımalı; bulunan: ${keys.join(", ")}`,
        wordIndex: index,
      });
      return;
    }
    const narrowed = narrowWord(word);
    if (narrowed !== null) blindWords.push(narrowed);
  });

  if (blindWords.length !== GAME_CONSTANTS.wordCount) return issues;

  const beklenen = canonical.map((word) => `${word.id}:${word.text}`).sort();
  const bulunan = blindWords.map((word) => `${word.id}:${word.text}`).sort();
  if (beklenen.join("|") !== bulunan.join("|")) {
    issues.push({
      code: "blind-words",
      severity: "error",
      path: "words",
      message: "Kör tahta bulmacayla birebir aynı 16 kelimeyi taşımıyor.",
    });
    return issues;
  }

  const kanonikSira = canonical.map((word) => word.id).join("|");
  const korSira = blindWords.map((word) => word.id).join("|");
  if (kanonikSira === korSira) {
    issues.push({
      code: "blind-order",
      severity: "error",
      path: "words",
      message: "Kör tahtanın sırası karıştırılmalı; kanonik sırayla birebir aynı olamaz.",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Dosya kümesi doğrulaması
// ---------------------------------------------------------------------------

/** Küme doğrulamasına verilen tek bir içerik dosyası. */
export type PuzzleSetEntry = {
  /** Dosya adı, ör. `2026-09-24.json`. Sorun mesajlarında kaynak olarak görünür. */
  source: string;
  /** Dosyanın ham içeriği. */
  value: unknown;
};

/**
 * Dosyalar arası kuralları denetler: aynı güne iki bulmaca atanmamalı, bulmaca
 * kimliği tekrar etmemeli ve dosya adı `date` alanıyla aynı günü göstermelidir.
 *
 * Tek dosya kuralları burada tekrar edilmez; her girdi ayrıca
 * {@link validatePuzzle} ile denetlenmelidir.
 */
export function validatePuzzleSet(entries: readonly PuzzleSetEntry[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenDates = new Map<string, string>();
  const seenIds = new Map<string, string>();

  for (const entry of entries) {
    if (!isRecord(entry.value)) continue;
    const { id, date } = entry.value;

    if (typeof date === "string") {
      const fileDate = entry.source.replace(/\.json$/i, "");
      if (fileDate !== date) {
        issues.push({
          code: "file-date-mismatch",
          severity: "error",
          path: "date",
          message: `Dosya adı ile date alanı farklı gün gösteriyor: ${entry.source} ≠ ${date}`,
          source: entry.source,
        });
      }

      const previous = seenDates.get(date);
      if (previous !== undefined) {
        issues.push({
          code: "date-duplicate",
          severity: "error",
          path: "date",
          message: `Aynı güne iki bulmaca atanmış (${date}); diğer dosya: ${previous}`,
          source: entry.source,
        });
      } else {
        seenDates.set(date, entry.source);
      }
    }

    if (typeof id === "string") {
      const previous = seenIds.get(id);
      if (previous !== undefined) {
        issues.push({
          code: "puzzle-id-duplicate",
          severity: "error",
          path: "id",
          message: `Yinelenen bulmaca kimliği (${id}); diğer dosya: ${previous}`,
          source: entry.source,
        });
      } else {
        seenIds.set(id, entry.source);
      }
    }
  }

  return issues;
}
