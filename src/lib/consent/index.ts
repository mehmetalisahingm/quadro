/**
 * Çerez ve ölçüm onayı. Kullanıcı karar vermeden analitik ve reklam kapalıdır.
 *
 * Bu modül yalnız tercihi saklar: kimlik, olay ya da kişisel veri tutmaz. Saklanan
 * kayıt zorunlu kategoridedir (seçimi hatırlamak için gerekir) ve 12 ay geçerlidir.
 */

export const CONSENT_STORAGE_KEY = "quadro:consent:v1";
export const CONSENT_CHANGE_EVENT = "quadro:consent-change";
export const CONSENT_OPEN_EVENT = "quadro:consent-open";
export const CONSENT_VERSION = 1;
export const CONSENT_MAX_AGE_DAYS = 365;

export type ConsentCategories = { analytics: boolean; ads: boolean };

export type ConsentRecord = ConsentCategories & {
  version: typeof CONSENT_VERSION;
  decidedAt: string;
};

type ConsentStorage = Pick<Storage, "getItem" | "setItem">;

/** Depolama yazılamadığında seçim yalnız bu sayfa ömrü boyunca bellekte tutulur. */
let pageOnlyRecord: ConsentRecord | null = null;

function browserStorage(): ConsentStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Bozuk, eski sürüm ya da süresi dolmuş kayıt "karar verilmedi" sayılır. */
export function parseConsent(raw: string | null, now = new Date()): ConsentRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      record.version !== CONSENT_VERSION ||
      typeof record.analytics !== "boolean" ||
      typeof record.ads !== "boolean" ||
      typeof record.decidedAt !== "string"
    ) {
      return null;
    }
    const decidedAt = Date.parse(record.decidedAt);
    if (!Number.isFinite(decidedAt)) return null;
    if (now.getTime() - decidedAt > CONSENT_MAX_AGE_DAYS * 86_400_000) return null;
    return {
      version: CONSENT_VERSION,
      analytics: record.analytics,
      ads: record.ads,
      decidedAt: record.decidedAt,
    };
  } catch {
    return null;
  }
}

export function readConsent(storage = browserStorage(), now = new Date()): ConsentRecord | null {
  if (storage) {
    try {
      const stored = parseConsent(storage.getItem(CONSENT_STORAGE_KEY), now);
      if (stored) return stored;
    } catch {
      // Okunamayan depolama: aşağıdaki sayfa içi seçime düş.
    }
  }
  return pageOnlyRecord;
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true;
}

export function hasAdsConsent(): boolean {
  return readConsent()?.ads === true;
}

/**
 * Seçimi kaydeder ve dinleyicilere duyurur. Depolama engelliyse seçim yalnız bu
 * sayfa için geçerli olur; reddetme her durumda reddetme olarak uygulanır.
 */
export function saveConsent(
  categories: ConsentCategories,
  storage = browserStorage(),
  now = new Date(),
): ConsentRecord {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    analytics: categories.analytics,
    ads: categories.ads,
    decidedAt: now.toISOString(),
  };
  try {
    if (!storage) throw new Error("storage-unavailable");
    storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    pageOnlyRecord = null;
  } catch {
    // Gizli sekme veya kota: seçim kalıcı olmaz ama bu sayfada uygulanır.
    pageOnlyRecord = record;
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record }));
    } catch {
      // Olay gönderilemese de kayıt yapılmıştır.
    }
  }
  return record;
}

/** Footer'daki "Çerez tercihleri" bağlantısı banner'ı yeniden açar. */
export function openConsentPreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

/** React `useSyncExternalStore` için: aynı sekmedeki ve diğer sekmelerdeki değişiklikler. */
export function subscribeConsent(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === CONSENT_STORAGE_KEY) listener();
  };
  window.addEventListener(CONSENT_CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Anlık durum için kararlı bir metin anahtarı (snapshot karşılaştırması için). */
export function consentSnapshot(): string {
  const record = readConsent();
  return record ? `${record.analytics ? 1 : 0}${record.ads ? 1 : 0}` : "undecided";
}

export function serverConsentSnapshot(): string {
  return "pending";
}
