/**
 * Arayüz geliştirmesi ve testler için örnek bulmacalar (Q03).
 *
 * Bu veriler yayın stoğunda yer almaz ve `src/content/puzzles/` altındaki günlük bulmacaların
 * kelimelerini kullanmaz; böylece günlük cevapları ve kör denemeleri ifşa etmez. Zorluk
 * değerleri temsilîdir. Kelime kimlikleri `slugifyTr` ile üretilir.
 */

import { slugifyTr, type Four, type Puzzle, type PuzzleGroup } from "@/features/game/contracts";

/**
 * İki gruplu ana sayfa öğreticisinin veri türü. Günlük `Puzzle` değildir: tarih, revizyon,
 * hak, süre ve istatistik taşımaz; `GameController` ile oynatılmaz.
 */
export type TutorialPuzzle = {
  id: string;
  language: "tr";
  groups: [PuzzleGroup, PuzzleGroup];
};

type SampleGroupInput = {
  id: string;
  title: string;
  difficulty: PuzzleGroup["difficulty"];
  texts: Four<string>;
  explanation: string;
};

/** Metinlerden `slugifyTr` kimlikli dört kelimelik grup oluşturur. */
function sampleGroup({ id, title, difficulty, texts, explanation }: SampleGroupInput): PuzzleGroup {
  const [a, b, c, d] = texts;
  const word = (text: string) => ({ id: slugifyTr(text), text });
  return { id, title, words: [word(a), word(b), word(c), word(d)], difficulty, explanation };
}

/**
 * Standart oyun örneği: 4 grup, 16 benzersiz kelime. `docs/CONTRACTS.md` örnek akışları
 * bu bulmacayı kullanır.
 */
export const standardPuzzle: Puzzle = {
  schemaVersion: 1,
  revision: 1,
  id: "ornek-001",
  date: "2026-09-20",
  language: "tr",
  groups: [
    sampleGroup({
      id: "renkler",
      title: "RENKLER",
      difficulty: 1,
      texts: ["KIRMIZI", "MAVİ", "YEŞİL", "SARI"],
      explanation: "Kırmızı, mavi, yeşil ve sarı temel renk adlarıdır.",
    }),
    sampleGroup({
      id: "meyveler",
      title: "MEYVELER",
      difficulty: 2,
      texts: ["ELMA", "ARMUT", "KİRAZ", "İNCİR"],
      explanation: "Elma, armut, kiraz ve incir ağaçta yetişen meyvelerdir.",
    }),
    sampleGroup({
      id: "gezegenler",
      title: "GEZEGENLER",
      difficulty: 3,
      texts: ["MARS", "VENÜS", "SATÜRN", "MERKÜR"],
      explanation: "Mars, Venüs, Satürn ve Merkür Güneş Sistemi'ndeki gezegenlerdir.",
    }),
    sampleGroup({
      id: "sehirler",
      title: "ŞEHİRLER",
      difficulty: 4,
      texts: ["ADANA", "BURSA", "İZMİR", "MUĞLA"],
      explanation: "Adana, Bursa, İzmir ve Muğla Türkiye'deki il adlarıdır.",
    }),
  ],
};

/**
 * Uzun kelimeli örnek: 320 px tahtada kırpma ve satır kırılımı denemeleri için. En uzun
 * kelime 18 harflidir (MUVAFFAKİYETSİZLİK); boşluklu bir kelime (DİŞ HEKİMİ) de bulunur.
 */
export const longWordsPuzzle: Puzzle = {
  schemaVersion: 1,
  revision: 1,
  id: "ornek-uzun-001",
  date: "2026-09-20",
  language: "tr",
  groups: [
    sampleGroup({
      id: "il-adlari",
      title: "İL ADLARI",
      difficulty: 1,
      texts: ["AFYONKARAHİSAR", "KAHRAMANMARAŞ", "KIRKLARELİ", "GÜMÜŞHANE"],
      explanation: "Afyonkarahisar, Kahramanmaraş, Kırklareli ve Gümüşhane Türkiye'deki il adlarıdır.",
    }),
    sampleGroup({
      id: "meslekler",
      title: "MESLEKLER",
      difficulty: 2,
      texts: ["ANESTEZİYOLOG", "KÜTÜPHANECİ", "DİŞ HEKİMİ", "FOTOĞRAFÇI"],
      explanation: "Anesteziyolog, kütüphaneci, diş hekimi ve fotoğrafçı meslek adlarıdır.",
    }),
    sampleGroup({
      id: "bilim-dallari",
      title: "BİLİM DALLARI",
      difficulty: 3,
      texts: ["PALEONTOLOJİ", "MİKROBİYOLOJİ", "ASTROFİZİK", "ANTROPOLOJİ"],
      explanation: "Paleontoloji, mikrobiyoloji, astrofizik ve antropoloji bilim dallarıdır.",
    }),
    sampleGroup({
      id: "sizlik-ekiyle",
      title: "-SIZLIK EKİYLE KURULANLAR",
      difficulty: 4,
      texts: ["SORUMSUZLUK", "BAŞARISIZLIK", "MUVAFFAKİYETSİZLİK", "GÖRGÜSÜZLÜK"],
      explanation:
        "Dört kelime de yokluk bildiren -sız/-siz/-suz/-süz ekine -lık/-lik/-luk/-lük eklenerek kurulur.",
    }),
  ],
};

/** İki gruplu ana sayfa öğreticisi örneği (Q12). Günlük bulmacadan bağımsızdır. */
export const tutorialPuzzle: TutorialPuzzle = {
  id: "ogretici-001",
  language: "tr",
  groups: [
    sampleGroup({
      id: "mevsimler",
      title: "MEVSİMLER",
      difficulty: 1,
      texts: ["İLKBAHAR", "YAZ", "SONBAHAR", "KIŞ"],
      explanation: "İlkbahar, yaz, sonbahar ve kış yılın dört mevsimidir.",
    }),
    sampleGroup({
      id: "yonler",
      title: "YÖNLER",
      difficulty: 2,
      texts: ["KUZEY", "GÜNEY", "DOĞU", "BATI"],
      explanation: "Kuzey, güney, doğu ve batı dört ana yöndür.",
    }),
  ],
};
