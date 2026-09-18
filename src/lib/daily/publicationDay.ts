/**
 * Europe/Istanbul yayın günü (Q19).
 *
 * Quadro'nun günü herkes için Türkiye gece yarısında döner: oyuncunun cihaz saati,
 * sistem saat dilimi veya sunucunun bulunduğu bölge sonucu değiştirmez. Gün anahtarı
 * (`YYYY-MM-DD`) tek bu modülde üretilir; içerik yükleyici, kayıt katmanı ve arayüz
 * aynı değeri buradan okur.
 *
 * Hesap `Intl.DateTimeFormat` ile IANA saat dilimi verisi üzerinden yapılır; UTC+3
 * gibi sabit bir kaydırma varsayılmaz. Türkiye 2016'dan beri yaz saati uygulamıyor,
 * ancak bu bir politika kararıdır ve geri alınabilir: kural değişirse doğru davranış
 * saat dilimi verisinden gelir, bu dosyadan değil. Aynı nedenle 1970–2016 arasındaki
 * tarihlerde de o günün gerçek yerel saati kullanılır.
 *
 * Saat her zaman dışarıdan verilebilir ({@link PublicationDayOptions.now}); modül
 * kendi başına `Date.now()` çağırmaz, böylece gece yarısı sınırları test edilebilir.
 */

import { isCalendarDate } from "@/features/game/validator";

/** Yayın gününün belirlendiği IANA saat dilimi. */
export const PUBLICATION_TIME_ZONE = "Europe/Istanbul";

/**
 * Gerçek saat yerine sabit bir yayın günü dayatan ortam değişkeni.
 *
 * Yalnız sunucuda okunur. Testler, önizleme dağıtımları ve "yarının bulmacasını
 * bugün gözden geçir" gibi editoryal denemeler için vardır; üretimde tanımsız bırakılır.
 * Değer `YYYY-MM-DD` ve takvimde var olan bir gün olmalıdır; değilse yok sayılır ve
 * gerçek saate dönülür (yanlış bir değer siteyi düşürmez).
 */
export const TODAY_ENV_VAR = "QUADRO_TODAY";

/** `YYYY-MM-DD` gün anahtarı. */
export type PublicationDayKey = string;

/** Türkçe ay adları; büyük harfli arayüz etiketlerinde kullanılır. */
const TURKISH_MONTHS = [
  "OCAK",
  "ŞUBAT",
  "MART",
  "NİSAN",
  "MAYIS",
  "HAZİRAN",
  "TEMMUZ",
  "AĞUSTOS",
  "EYLÜL",
  "EKİM",
  "KASIM",
  "ARALIK",
] as const;

/**
 * Saat dilimi başına bir biçimlendirici. `Intl.DateTimeFormat` kurulumu pahalıdır ve
 * her istekte yeniden kurulmasının bir faydası yoktur; biçimlendirici durumsuzdur.
 */
const dayFormatters = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dayFormatters.get(timeZone);
  if (cached !== undefined) return cached;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  dayFormatters.set(timeZone, formatter);
  return formatter;
}

/** Metnin geçerli bir gün anahtarı olup olmadığını söyler: biçim ve takvimde var olma. */
export function isPublicationDayKey(value: unknown): value is PublicationDayKey {
  return typeof value === "string" && isCalendarDate(value);
}

/**
 * Verilen anın Europe/Istanbul yayın gününü döndürür.
 *
 * Biçimlendiricinin çıktısı parça parça okunur (`formatToParts`); yerel ayarın
 * tarihleri hangi sırayla dizdiğine güvenilmez.
 *
 * @param now Değerlendirilecek an.
 * @param timeZone Yayın saat dilimi; varsayılanı {@link PUBLICATION_TIME_ZONE}.
 * @throws {RangeError} `now` geçerli bir tarih değilse.
 *
 * @example publicationDayOf(new Date("2026-09-19T20:59:59.999Z")) // "2026-09-19"
 * @example publicationDayOf(new Date("2026-09-19T21:00:00.000Z")) // "2026-09-20"
 */
export function publicationDayOf(
  now: Date,
  timeZone: string = PUBLICATION_TIME_ZONE,
): PublicationDayKey {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("Yayın günü geçerli bir tarihten hesaplanabilir; verilen an geçersiz.");
  }

  const parts = dayFormatter(timeZone).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** {@link resolvePublicationDay} seçenekleri. */
export type PublicationDayOptions = {
  /** Değerlendirilecek an; varsayılanı gerçek saattir. */
  now?: Date;
  /** Yayın saat dilimi; varsayılanı {@link PUBLICATION_TIME_ZONE}. */
  timeZone?: string;
  /**
   * Gerçek saat yerine kullanılacak gün anahtarı; varsayılanı
   * {@link TODAY_ENV_VAR} ortam değişkenidir. Geçersiz değer yok sayılır.
   */
  override?: string | undefined;
};

/**
 * Sunucunun bu an için sunması gereken yayın gününü döndürür.
 *
 * Önce ortam değişkeni (veya açıkça verilen `override`) denenir; geçerli bir gün
 * anahtarıysa o kullanılır. Değilse gerçek saatten Europe/Istanbul günü hesaplanır.
 */
export function resolvePublicationDay(options: PublicationDayOptions = {}): PublicationDayKey {
  const raw = options.override ?? process.env[TODAY_ENV_VAR];

  if (raw !== undefined) {
    const trimmed = raw.trim();
    // Uyarı metni daraltmadan önce hazırlanır: `isPublicationDayKey` başarısız olan
    // dalda değeri `never`e indirir ve içeriği artık okunamaz.
    const uyari = `${TODAY_ENV_VAR} geçerli bir YYYY-MM-DD günü değil, yok sayılıyor: ${trimmed}`;
    const bos = trimmed.length === 0;

    if (isPublicationDayKey(trimmed)) return trimmed;
    // Tanımlı ama boş değer (ör. `QUADRO_TODAY=`) bir yapılandırma hatası değildir.
    if (!bos) console.warn(uyari);
  }

  return publicationDayOf(options.now ?? new Date(), options.timeZone ?? PUBLICATION_TIME_ZONE);
}

/**
 * Gün anahtarını arayüzdeki Türkçe etikete çevirir.
 *
 * Ay adları bilerek elde tutulur: `Intl` çıktısı çalışma ortamının yerel ayar verisine
 * göre değişebilir, bu etiket ise her ortamda aynı olmalıdır. Anahtar geçersizse
 * olduğu gibi döndürülür.
 *
 * @example formatDayLabel("2026-09-20") // "20 EYLÜL 2026"
 */
export function formatDayLabel(dayKey: string): string {
  if (!isPublicationDayKey(dayKey)) return dayKey;

  const [year, month, day] = dayKey.split("-");
  if (year === undefined || month === undefined || day === undefined) return dayKey;

  const monthName = TURKISH_MONTHS[Number(month) - 1];
  if (monthName === undefined) return dayKey;

  return `${Number(day)} ${monthName} ${year}`;
}
