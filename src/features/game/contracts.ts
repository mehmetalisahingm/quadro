/**
 * Quadro ortak oyun sözleşmesi.
 *
 * Motor, React adaptörü ve arayüz arasındaki tipler için tek doğruluk kaynağıdır.
 * Tipler PROJE_PLANI.md §6'daki sözleşmenin birebir karşılığıdır. Kesin kurallar
 * `docs/GAME_RULES.md`, tiplerin davranışı ve örnek akışlar `docs/CONTRACTS.md`
 * içinde açıklanır. Bu üç dosya aynı PR içinde birlikte güncellenir.
 */

// ---------------------------------------------------------------------------
// Temel tipler
// ---------------------------------------------------------------------------

/** Tam olarak dört elemanlı demet: bir grubun kelimeleri, bulmacanın grupları, bir tahmin. */
export type Four<T> = [T, T, T, T];

/**
 * Kelimenin bulmaca içindeki kararlı kimliği.
 * Seçim, tahmin geçmişi ve kayıt her zaman kelime metniyle değil bu kimlikle yapılır.
 */
export type WordId = string;

/** Oyunun yaşam döngüsü. `won` ve `lost` terminal durumlardır; yeni tahmin kabul edilmez. */
export type GameStatus = "playing" | "won" | "lost";

// ---------------------------------------------------------------------------
// Bulmaca verisi
// ---------------------------------------------------------------------------

/** Tahtadaki tek kelime kartı. */
export type PuzzleWord = {
  /** Bulmaca içinde benzersiz kimlik. */
  id: WordId;
  /** Oyuncuya içerikteki haliyle gösterilen metin. */
  text: string;
};

/** Ortak bir bağla birleşen dört kelimelik gizli grup. */
export type PuzzleGroup = {
  /** Bulmaca içinde benzersiz grup kimliği. */
  id: string;
  /** Grup çözülünce veya oyun kaybedilince gösterilen kategori başlığı. */
  title: string;
  /** Gruba ait dört kelime. */
  words: Four<PuzzleWord>;
  /** Editoryal zorluk katmanı: 1 kolay, 2 orta, 3 zor, 4 çetin. Oyuncuya başlangıçta gösterilmez. */
  difficulty: 1 | 2 | 3 | 4;
  /** Zorunlu kısa çözüm açıklaması. */
  explanation: string;
};

/** Günlük bulmacanın kanonik verisi. */
export type Puzzle = {
  /** Bulmaca veri şemasının sürümü. */
  schemaVersion: 1;
  /** İçerik revizyonu; yayımlanmış bulmacada yalnız zorunlu düzeltmede artar. */
  revision: number;
  /** Bulmacanın kalıcı kimliği. */
  id: string;
  date: string; // YYYY-MM-DD; Europe/Istanbul yayın günü
  /** İçerik dili. */
  language: "tr";
  /** Dört gizli grup; her zorluk katmanı bir kez kullanılır. */
  groups: Four<PuzzleGroup>;
};

// ---------------------------------------------------------------------------
// Oyun durumu
// ---------------------------------------------------------------------------

/**
 * Tahmin geçmişine yazılan gönderim.
 * Yalnız hak veya tahtayı etkileyen sonuçlar kaydedilir; `repeated` ve `invalid`
 * gönderimler geçmişe girmez ve paylaşım satırı üretmez.
 */
export type Attempt = {
  /** Snapshot içinde benzersiz tahmin kimliği. */
  id: string;
  /** Gönderilen dört kelime kimliği. Tekrar denetimi sıradan bağımsızdır, bkz. {@link attemptKey}. */
  wordIds: Four<WordId>;
  /** Tahminin değerlendirmesi. */
  verdict: "correct" | "one-away" | "wrong";
};

/**
 * Oyunun kalıcı ve geri yüklenebilir durumu.
 * UI yalnız bu durumu gösterir; hak, doğruluk veya kazanma bilgisini yeniden hesaplamaz.
 */
export type GameSnapshot = {
  /** Kayıt şemasının sürümü. */
  schemaVersion: 1;
  /** Durumun ait olduğu bulmaca kimliği. */
  puzzleId: string;
  /** Durumun oluşturulduğu bulmaca revizyonu. */
  puzzleRevision: number;
  /** Oyunun ait olduğu Europe/Istanbul yayın günü (YYYY-MM-DD). */
  dayKey: string;
  /** Oyunun yaşam döngüsü durumu. */
  status: GameStatus;
  /** Seçili, çözülmemiş 0–4 kelime kimliği. Terminal durumda boştur. */
  selectedWordIds: WordId[];
  /** Çözülmemiş kelimelerin tahtadaki gösterim sırası. */
  remainingWordOrder: WordId[];
  /** Oyuncunun gerçekten bulduğu gruplar, bulunma sırasıyla. Kaybedince açılan cevaplar eklenmez. */
  solvedGroupIds: string[];
  /** Kalan hata hakkı; başlangıç değeri {@link GAME_CONSTANTS.maxMistakes}. */
  mistakesRemaining: number;
  /** `correct`, `one-away` ve `wrong` tahminlerin kronolojik geçmişi. */
  attempts: Attempt[];
  /** Yalnız görünür ve aktif oyun ekranında geçen süre (saniye). */
  activeSeconds: number;
};

// ---------------------------------------------------------------------------
// Gönderim sonucu ve denetleyici
// ---------------------------------------------------------------------------

/**
 * Tek bir gönderimin sonucu. Geçici bir olaydır ve kaydedilmez; UI mesajı ve
 * animasyonu buna göre seçer. Oyunun vardığı durum (`won`, `lost`) sonuçta değil,
 * {@link SubmitResult.snapshot} içinde taşınır.
 */
export type SubmitOutcome =
  | { verdict: "correct"; solvedGroup: PuzzleGroup }
  | { verdict: "one-away" }
  | { verdict: "wrong" }
  | { verdict: "repeated" }
  | {
      verdict: "invalid";
      reason: "selection-count" | "invalid-words" | "game-ended";
    };

/**
 * `submitSelection` dönüşü: gönderimin sonucu ve gönderimden sonraki durum.
 * Son doğru tahmin `outcome.verdict = "correct"` ile `snapshot.status = "won"`,
 * dördüncü hata kendi sonucu ile `snapshot.status = "lost"` döndürür.
 */
export type SubmitResult = {
  /** Bu gönderimin sonucu. */
  outcome: SubmitOutcome;
  /** Gönderim işlendikten sonraki güncel durum. */
  snapshot: GameSnapshot;
};

/**
 * UI'nın oyunla konuştuğu tek arayüz. Örnek adaptör ve gerçek motor aynı sözleşmeyi uygular.
 * Kurala aykırı çağrılar (terminal oyunda seçim, beşinci kart vb.) durumu değiştirmez.
 */
export type GameController = {
  /** Güncel oyun durumu. */
  snapshot: GameSnapshot;
  /** Çözülmemiş bir kelimeyi seçer veya seçimini kaldırır. En fazla dört kelime seçilebilir. */
  toggleWord: (wordId: WordId) => void;
  /** Seçimi boşaltır; hak ve geçmiş değişmez. */
  clearSelection: () => void;
  /** Yalnız çözülmemiş kelimelerin sırasını karıştırır; seçim ve haklar korunur. */
  shuffle: () => void;
  /** Seçili dörtlüyü bir kez değerlendirir ve sonucu yeni durumla birlikte döndürür. */
  submitSelection: () => SubmitResult;
};

// ---------------------------------------------------------------------------
// Sabitler
// ---------------------------------------------------------------------------

/** Oyunun sayısal kuralları. Kaynak: PROJE_PLANI.md §1 ve §4. */
export const GAME_CONSTANTS = {
  /** Bir bulmacadaki toplam kelime sayısı. */
  wordCount: 16,
  /** Bir bulmacadaki grup sayısı. */
  groupCount: 4,
  /** Bir gruptaki ve bir tahmindeki kelime sayısı. */
  groupSize: 4,
  /** Başlangıçtaki hata hakkı; dördüncü hatada oyun kaybedilir. */
  maxMistakes: 4,
} as const;

// ---------------------------------------------------------------------------
// Saf yardımcılar
// ---------------------------------------------------------------------------

/**
 * Türkçe duyarlı metin normalizasyonu. İçerik karşılaştırmaları (ör. yinelenen
 * kelime denetimi) için kullanılır; kelime kimliğinin yerine geçmez.
 *
 * - Metni Unicode NFC biçimine getirir (ayrışık `I` + birleşik nokta → `İ`).
 * - Türkçe kurallarla küçültür: `I` → `ı`, `İ` → `i`; diğer harfler standart biçimde küçülür.
 *   Başka yerel ayarla küçültülmüş `i̇` (i + birleşik nokta) de `i` olur.
 * - Baştaki ve sondaki boşlukları kırpar, içteki boşluk dizilerini tek boşluğa indirir.
 *
 * Çalışma ortamının yerel ayar verisine bağlı değildir; her ortamda aynı sonucu verir.
 *
 * @example normalizeTr("  İSTANBUL ") // "istanbul"
 * @example normalizeTr("IŞIK") // "ışık"
 */
export function normalizeTr(text: string): string {
  return text
    .normalize("NFC")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Metinden kararlı ve yalnız ASCII içeren bir {@link WordId} üretir (`a-z`, `0-9`, tek tire).
 * İçerik araçlarında ve örnek verilerde kimlik üretmek için kullanılır; aynı metin her
 * ortamda aynı kimliği verir.
 *
 * Adımlar: {@link normalizeTr} → Türkçe harfleri ASCII karşılığına indirme
 * (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u; â, î, û gibi şapkalar da atılır) → harf ve rakam
 * dışındaki dizileri tek tireye çevirme → baştaki ve sondaki tireleri kırpma.
 *
 * Dönüşüm bilgi kaybettirir: `ÇAM` ve `CAM` aynı kimliği (`cam`) verir. Bulmaca içinde
 * kimliklerin benzersizliği içerik doğrulayıcısında denetlenir. Metinde hiç harf veya
 * rakam yoksa boş dize döner; boş kimlik geçersizdir.
 *
 * @example slugifyTr("GÜNEŞ") // "gunes"
 * @example slugifyTr("Kara Deniz!") // "kara-deniz"
 */
export function slugifyTr(text: string): WordId {
  return normalizeTr(text)
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Bir dörtlü için sıradan bağımsız kanonik anahtar üretir. Tekrarlanan tahmin
 * denetiminde kullanılır: aynı dört kimlik hangi sırayla gönderilirse gönderilsin
 * aynı anahtarı verir.
 *
 * Kimlikler yerel ayardan bağımsız biçimde UTF-16 kod birimi sırasına göre sıralanır ve
 * JSON dizisi olarak birleştirilir; kimliklerde ayırıcı karakter geçse bile farklı
 * dörtlülerin anahtarları çakışmaz. Geçerlilik (tekrar eden, bilinmeyen veya çözülmüş
 * kimlik) denetimi yapmaz; bu motorun işidir.
 *
 * @example
 * attemptKey(["kiraz", "elma", "incir", "armut"]) ===
 *   attemptKey(["armut", "elma", "incir", "kiraz"]); // true
 */
export function attemptKey(wordIds: Readonly<Four<WordId>>): string {
  return JSON.stringify([...wordIds].sort());
}
