/**
 * Günlük bulmaca yükleyicisi (Q19).
 *
 * Sunucuda çalışır ve bir istek için **yalnız o günün** içerik dosyasını okur:
 * `${contentDir}/${dayKey}.json`. İçerik bilerek statik olarak içe aktarılmaz
 * (`import ... from "@/content/puzzles/..."`); statik içe aktarım tüm günleri paket
 * grafiğine sokar ve yarının cevapları bugün istemciye sızabilir. Dosya sistemi
 * okuması bu sızıntıyı yapısal olarak imkânsız kılar: bir gün, bir dosya.
 *
 * Kurallar bu dosyada tekrar edilmez; şema denetimi ve tip daraltması Q18'in resmi
 * doğrulayıcısından (`src/features/game/validator`) gelir. Buradaki tek ek kural
 * yayın kapısıdır: yalnız `status: "published"` içerik oyuncuya sunulur.
 *
 * Sonuç her zaman {@link DailyPuzzleState} ayrık birleşimidir; yükleyici hata
 * fırlatmaz. Arayüz "içerik yok" durumunu bir kaza değil, beklenen bir durum olarak
 * işler (bkz. Q24).
 */

import { readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import type { Puzzle } from "@/features/game/contracts";
import { parseDailyPuzzleFile, toPuzzle, type ValidationIssue } from "@/features/game/validator";

import { isPublicationDayKey, resolvePublicationDay } from "./publicationDay";

/**
 * Günlük içerik dizinini değiştiren ortam değişkeni. Yalnız sunucuda okunur;
 * testler ve önizleme dağıtımları gerçek yayın stoğu yerine kendi içeriklerini verir.
 * Göreli yol verilirse süreç çalışma dizinine göre çözümlenir.
 */
export const CONTENT_DIR_ENV_VAR = "QUADRO_CONTENT_DIR";

/** Yayın stoğunun varsayılan yeri, depo köküne göre. */
export const DEFAULT_CONTENT_DIR = "src/content/puzzles";

/**
 * Oyuncuya sunulabilecek tek yayın durumu.
 *
 * `docs/CONTENT_SCHEMA.md` sözlüğü Q19 ile kesinleşti: `draft` içerik depoda durur,
 * doğrulayıcıdan geçer ve gözden geçirilir ama yayınlanmaz; `published` içerik kendi
 * gününde sunulur. Kapı gün anahtarından bağımsızdır: tarihi gelmiş bir taslak da
 * yayına çıkmaz.
 */
export const PUBLISHED_STATUS = "published";

/**
 * Günün bulmacasının neden sunulamadığı. Arayüz için ayrı bir ekran tasarımı değil,
 * makine tarafından okunabilir bir gerekçedir; Q24 metni buna göre seçer.
 *
 * - `no-content`: o güne ait dosya yok (yayın stoğu tükenmiş ya da gün henüz gelmemiş).
 * - `not-published`: dosya var ama `status` alanı `published` değil.
 * - `invalid-content`: dosya bozuk JSON veya şemaya uymuyor.
 * - `unreadable`: dosya var görünüyor ama okunamadı (izin, G/Ç hatası).
 */
export type DailyMissingReason = "no-content" | "not-published" | "invalid-content" | "unreadable";

/**
 * Bir gün için içerik durumu.
 *
 * `loading` bu yükleyicinin ürettiği bir sonuç değildir: sunucu okuması ya başarılı
 * olur ya da gerekçeli biçimde başarısız. Birleşimde yer almasının nedeni, arayüzün
 * içeriği henüz beklediği anı (akış sırasında, istemci geçişlerinde) aynı `switch`
 * içinde ele alabilmesidir; bkz. {@link loadingState}.
 */
export type DailyPuzzleState =
  | {
      status: "loading";
      /** Beklenen yayın günü. */
      dayKey: string;
    }
  | {
      status: "ok";
      /** Sunulan yayın günü. */
      dayKey: string;
      /** Oyuncuya gidecek bulmaca; editoryal alanlar soyulmuştur. */
      puzzle: Puzzle;
      /** İçeriğin okunduğu dosya adı; sunucu günlüğünde kaynağı belli etmek için. */
      source: string;
    }
  | {
      status: "missing";
      /** İçeriğin arandığı yayın günü. */
      dayKey: string;
      /** Makine tarafından okunabilir gerekçe. */
      reason: DailyMissingReason;
      /** Sunucu günlüğü için tek cümlelik Türkçe açıklama; oyuncuya gösterilmez. */
      detail: string;
      /** Gerekçe `invalid-content` ise doğrulayıcının bulduğu sorunlar, değilse boş. */
      issues: ValidationIssue[];
    };

/**
 * Arayüzün "henüz beklemede" durumu. Sunucu bileşeni bunu üretmez; istemci tarafı
 * geçişlerde ve Q24'ün yükleme ekranında kullanılır.
 */
export function loadingState(dayKey: string): DailyPuzzleState {
  return { status: "loading", dayKey };
}

function missing(
  dayKey: string,
  reason: DailyMissingReason,
  detail: string,
  issues: ValidationIssue[] = [],
): DailyPuzzleState {
  return { status: "missing", dayKey, reason, detail, issues };
}

/**
 * Günlük içerik dizinini mutlak yola çözümler.
 *
 * Dizin ortam değişkeninden gelebildiği için yol derleme anında bilinmez. Turbopack
 * böyle bir okumayı gördüğünde, hangi dosyaların gerektiğini kestiremediği için tüm
 * projeyi sunucu çıktısına kopyalar; bu hem dağıtımı şişirir hem de editoryal
 * kayıtları sunucuya taşır. Otomatik izleme bu yüzden kapatılır ve gereken dosyalar
 * `next.config.mjs` içindeki `outputFileTracingIncludes` ile adıyla bildirilir:
 * yalnız `src/content/puzzles/*.json`.
 *
 * @param override Ortam değişkeni yerine kullanılacak dizin.
 */
export function resolveContentDir(override?: string): string {
  const configured = override ?? process.env[CONTENT_DIR_ENV_VAR];
  const directory =
    configured !== undefined && configured.trim().length > 0
      ? configured.trim()
      : DEFAULT_CONTENT_DIR;

  return isAbsolute(directory)
    ? directory
    : resolve(/* turbopackIgnore: true */ process.cwd(), directory);
}

/** {@link loadDailyPuzzle} seçenekleri. */
export type LoadDailyPuzzleOptions = {
  /** Yayın gününü belirlemek için değerlendirilecek an; varsayılanı gerçek saattir. */
  now?: Date;
  /** Gün hesabını tamamen atlayıp doğrudan bu günü yükler. */
  dayKey?: string;
  /** Ortam değişkeni yerine kullanılacak içerik dizini. */
  contentDir?: string;
};

/**
 * Yayın gününün bulmacasını yükler.
 *
 * Yalnız tek bir dosya okunur; dizin listelenmez, başka gün açılmaz. Gün anahtarı
 * dosya adına girdiği için önce biçimi doğrulanır: geçersiz bir anahtarla dosya
 * sistemine hiç dokunulmaz, böylece `../` gibi bir değerin yol olarak yorumlanma
 * ihtimali kalmaz.
 *
 * @returns Her zaman bir durum; asla hata fırlatmaz.
 */
export async function loadDailyPuzzle(
  options: LoadDailyPuzzleOptions = {},
): Promise<DailyPuzzleState> {
  const dayKey = options.dayKey ?? resolvePublicationDay({ now: options.now });

  if (!isPublicationDayKey(dayKey)) {
    return missing(
      dayKey,
      "invalid-content",
      `Gün anahtarı takvimde var olan bir YYYY-MM-DD günü değil: ${dayKey}`,
    );
  }

  const fileName = `${dayKey}.json`;
  const filePath = join(resolveContentDir(options.contentDir), fileName);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return missing(dayKey, "no-content", `Bu güne ait içerik dosyası yok: ${fileName}`);
    }
    return missing(dayKey, "unreadable", `İçerik dosyası okunamadı (${fileName}): ${String(error)}`);
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    return missing(dayKey, "invalid-content", `İçerik dosyası geçerli JSON değil: ${fileName}`, [
      {
        code: "json-parse",
        severity: "error",
        path: ".",
        message: `Dosya okunamadı veya geçerli JSON değil: ${String(error)}`,
        source: fileName,
      },
    ]);
  }

  const parsed = parseDailyPuzzleFile(value);
  if (!parsed.ok) {
    return missing(
      dayKey,
      "invalid-content",
      `İçerik dosyası şemaya uymuyor: ${fileName}`,
      parsed.issues.map((issue) => ({ ...issue, source: fileName })),
    );
  }

  // Dosya adı ile `date` alanının aynı günü göstermesi yalnız dosya kümesinin değil tek
  // dosyanın da kuralıdır: uyuşmazlarsa hangi günün sunulduğu belirsizleşir.
  if (parsed.file.date !== dayKey) {
    return missing(dayKey, "invalid-content", "Dosya adı ile date alanı farklı gün gösteriyor", [
      {
        code: "file-date-mismatch",
        severity: "error",
        path: "date",
        message: `Dosya adı ile date alanı farklı gün gösteriyor: ${fileName} ≠ ${parsed.file.date}`,
        source: fileName,
      },
    ]);
  }

  if (parsed.file.status !== PUBLISHED_STATUS) {
    return missing(
      dayKey,
      "not-published",
      `İçerik yayına açılmamış (status: ${parsed.file.status}): ${fileName}`,
    );
  }

  return { status: "ok", dayKey, puzzle: toPuzzle(parsed.file), source: fileName };
}

/**
 * Bulmaca kimliğinden arayüzde gösterilen sıra numarasını çıkarır (`q-001` → 1).
 * Kimlik bu kalıba uymuyorsa `null` döner ve arayüz numarayı hiç göstermez.
 */
export function puzzleNumberFromId(id: string): number | null {
  const match = /(\d+)\s*$/.exec(id);
  if (match === null) return null;

  const captured = match[1];
  if (captured === undefined) return null;

  const value = Number.parseInt(captured, 10);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
