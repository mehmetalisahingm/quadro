/**
 * Kayıt arka ucu: anahtar/değer deposu soyutlaması (Q20).
 *
 * Kalıcılık katmanının tamamı bu üç yöntemli sözleşmeyle konuşur; `localStorage`
 * adı yalnız bu dosyada geçer. Böylece kurallar (uyumluluk, reddetme, terminal
 * koruması) tarayıcı olmadan, bellekteki sahte depoyla test edilir ve ileride
 * başka bir arka uç (IndexedDB, hesap eşitlemesi) yazmak tek dosyalık iştir.
 *
 * Depo **her ortamda güvenlidir**: sunucuda `window` yoktur, gizli sekmede
 * `localStorage`a erişim ya da yazma hata fırlatabilir, kota dolabilir. Bunların
 * hiçbiri oyunu düşürmemelidir; hepsi "kayıt yok" gibi davranır (no-op). Bu,
 * Q20'nin "bozuk veya uyumsuz kayıt uygulamayı çökertmiyor" ölçütünün ilk
 * halkasıdır: ikinci halka kaydın içeriğini denetleyen `snapshotStore`dur.
 */

/**
 * Oyun kaydının yazıldığı anahtar/değer deposu.
 *
 * `Storage` arayüzünün yalnız kullanılan üç yöntemidir; `localStorage` bu tipe
 * yapısal olarak uyar ama doğrudan kullanılmaz, çünkü uygulama içindeki her
 * çağrı hata yutan sarmalayıcıdan geçmelidir (bkz. {@link createBrowserSnapshotStorage}).
 */
export type SnapshotStorage = {
  /** Anahtarın değeri; kayıt yoksa `null`. Hata fırlatmaz. */
  getItem: (key: string) => string | null;
  /** Değeri yazar. Yazılamazsa sessizce vazgeçer. */
  setItem: (key: string, value: string) => void;
  /** Kaydı siler. Silinemezse sessizce vazgeçer. */
  removeItem: (key: string) => void;
};

/** Bellekteki sahte depo; testler yazılanları doğrudan okuyabilsin diye anahtarlarını açar. */
export type MemorySnapshotStorage = SnapshotStorage & {
  /** Depodaki anahtarlar, yazılma sırasıyla. */
  keys: () => string[];
};

/**
 * Bellekte yaşayan depo. Testlerin ve sunucu tarafının varsayılanıdır; süreç
 * bitince kaybolur.
 *
 * @param seed Başlangıç içeriği; bozuk kayıt senaryolarını kurmak için.
 */
export function createMemoryStorage(
  seed: Readonly<Record<string, string>> = {},
): MemorySnapshotStorage {
  const entries = new Map<string, string>(Object.entries(seed));

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
    keys: () => [...entries.keys()],
  };
}

/**
 * Hiçbir şey saklamayan depo: sunucuda ve `localStorage`ın kapalı olduğu
 * tarayıcılarda kullanılır. Okuma her zaman `null` döner, yazma etkisizdir.
 */
export const NOOP_SNAPSHOT_STORAGE: SnapshotStorage = Object.freeze({
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
});

/** Erişilebilirlik yoklamasında kullanılan geçici anahtar; yoklamadan sonra silinir. */
const PROBE_KEY = "quadro:probe";

/**
 * Kullanılabilir `localStorage`; yoksa `null`.
 *
 * Varlık denetimi yetmez: gizli sekmede ve "site verilerini engelle" ayarında
 * nesne durur ama ilk yazmada `SecurityError`/`QuotaExceededError` fırlar. Bu
 * yüzden bir kez gerçekten yazılıp silinir.
 */
function openLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    const storage = window.localStorage;
    storage.setItem(PROBE_KEY, "1");
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    // Depo yok ya da kapalı; oyun kayıtsız oynanır.
    return null;
  }
}

/**
 * Tarayıcı deposu. Sunucuda (SSR) ve `localStorage`ın kapalı olduğu yerde
 * {@link NOOP_SNAPSHOT_STORAGE} döner.
 *
 * Yoklamadan sonra da her çağrı ayrıca sarmalanır: kota oyun sırasında dolabilir,
 * kullanıcı sekme açıkken site verilerini temizleyebilir.
 */
export function createBrowserSnapshotStorage(): SnapshotStorage {
  const storage = openLocalStorage();
  if (storage === null) return NOOP_SNAPSHOT_STORAGE;

  return {
    getItem: (key) => {
      try {
        return storage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        storage.setItem(key, value);
      } catch {
        // Kota dolu ya da depo kapandı: ilerleme kaydedilemez, oyun sürer.
      }
    },
    removeItem: (key) => {
      try {
        storage.removeItem(key);
      } catch {
        // Silinemeyen kayıt zaten uyumluluk denetiminden geçemez; yok sayılır.
      }
    },
  };
}

/**
 * Süreç başına tek tarayıcı deposu.
 *
 * Kimlik kararlı olmalıdır: React tarafı depoyu etki (effect) bağımlılığı olarak
 * taşır, her render yeni nesne üretilirse kayıt döngüye girer. Yoklama da
 * böylece bir kez yapılır.
 */
let sharedBrowserStorage: SnapshotStorage | null = null;

/** Uygulamanın kullandığı ortak depo; ilk çağrıda kurulur. */
export function defaultSnapshotStorage(): SnapshotStorage {
  sharedBrowserStorage ??= createBrowserSnapshotStorage();
  return sharedBrowserStorage;
}
