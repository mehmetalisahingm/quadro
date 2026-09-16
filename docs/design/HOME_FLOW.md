# Quadro ana sayfa akışı

Durum: Q05 tasarım teslimi  
Sahip: Mehmet  
Bağlı sistem: `docs/DESIGN_SYSTEM.md`

Bu belge ana sayfanın üç kullanıcı durumunu, mobil/masaüstü yerleşimini ve tıklanabilir akış sözleşmesini tanımlar. Q11 bu sözleşmeyi gerçek kayıt ve günlük bulmaca verisine bağlar.

## Ürün hedefi

Ana sayfa ilk bakışta üç şeyi anlatmalıdır:

1. Bugün tek bir günlük bulmaca var.
2. Oyuncu 16 kelimeyi 4 gizli gruba ayırıyor.
3. Ana eylem ilk ekranda ve gecikmeden kullanılabiliyor.

Zorunlu intro yoktur. İsteğe bağlı kısa örnek, günlük bulmacanın kelimelerini veya cevaplarını kullanmaz.

## Ortak bilgi mimarisi

Her durumda üstten alta aynı iskelet korunur:

- küçük marka satırı: `QUADRO · GÜNLÜK BULMACA`
- hero başlığı: `16 kelime. 4 gizli bağ.`
- tek cümlelik açıklama
- gün / bulmaca numarası
- duruma göre ana CTA
- yalnız gerektiğinde ikincil CTA
- küçük, cevap göstermeyen 4×4 kart motifi

İlk ekranın görevi oyunu satmak değil, oyuna başlatmaktır. Uzun açıklama, istatistik kartları veya dekoratif animasyon ana CTA'nın önüne geçmez.

## Durum 1 — İlk ziyaret

### İçerik

Başlık: `16 kelime. 4 gizli bağ.`  
Alt metin: `Dört kelimenin ortak noktasını bul, dört grubu tamamla.`  
Ana CTA: `Bugünün bulmacasını çöz`  
İkincil CTA: `Kısa örneği dene`

### Davranış

- Ana CTA doğrudan `/play` akışına gider.
- İkincil CTA `/play?mode=tutorial` girişine gider; Q12 gerçek öğreticiyi bağlayacaktır.
- Kullanıcı intro animasyonunun bitmesini beklemez.
- Günlük cevap veya günlük kelime örneği gösterilmez.

## Durum 2 — Yarım kalmış oyun

### İçerik

Başlık: `Bulmacan seni bekliyor.`  
Alt metin: `Kaldığın yer ve seçtiğin sıra bu cihazda korunur.`  
Ana CTA: `Kaldığın yerden devam et`  
Yardımcı bilgi: `2/4 grup bulundu · 3 hata hakkı kaldı` gibi gerçek kayıt verisi.

### Davranış

- Ana CTA aynı puzzle kimliğine devam eder.
- Yeni oyun başlatan ikinci bir birincil CTA gösterilmez.
- Öğretici bağlantısı küçük metin bağlantısı olarak kalabilir; ana eylemle yarışmaz.

## Durum 3 — Bugünün oyunu bitmiş

### İçerik

Başlık: `Bugünün bağlantıları tamamlandı.`  
Alt metin: kazanma/kaybetme sonucunu nötr ve kısa anlatır.  
Ana CTA: `Sonucunu gör`  
İkincil alan: sonraki bulmacaya kalan süre; Q23 gerçek Türkiye saati verisine bağlar.

### Davranış

- CTA günlük oyunu yeniden başlatmaz; sonuç görünümüne gider.
- Paylaşım ana sayfada zorlanmaz. Sonuç ekranının görevidir.
- Sonuç kartında cevap kelimeleri ana sayfada ifşa edilmez.

## 320 px mobil tasarım

Hedef viewport: `320 × 568` ve üstü.

İlk viewport içinde şu öğeler bulunmalıdır:

1. marka satırı
2. hero başlığı
3. en fazla iki satırlık açıklama
4. gün/numara satırı
5. ana CTA'nın tamamı

Önerilen dikey bütçe:

| Alan | Yaklaşık yükseklik |
| --- | ---: |
| Üst boşluk + marka | 48 px |
| Hero başlığı | 78 px |
| Açıklama | 48 px |
| Gün bilgisi | 24 px |
| Aralıklar | 52 px |
| Ana CTA | 52 px |
| Alt güvenli alan | 24 px |
| **Toplam** | **326 px** |

Böylece 568 px yüksekliğin önemli bölümü boş kalır; kullanıcı ilk eyleme kaydırmadan ulaşır. 320 px genişlikte yatay sayfa boşluğu 16 px, CTA genişliği `%100` olur.

## Yaygın telefon tasarımı — 390/430 px

- İçerik genişliği en fazla 420 px.
- Hero başlığı 32–36 px aralığında iki satırı geçmez.
- Ana CTA tam genişlikte veya en az 280 px genişlikte.
- 4×4 dekoratif kart motifi hero altında görünür; gerçek günlük kelime içermez.
- Kart motifi ilk CTA'yı aşağı itiyorsa kaldırılır.

## Masaüstü tasarımı — 1024 px ve üstü

İki kolon kullanılabilir:

- sol kolon: başlık, açıklama, gün bilgisi ve CTA
- sağ kolon: 4×4 cevap göstermeyen kart motifi / hareketli marka önizlemesi

Ana CTA sol kolonda ilk bakışta görünür. Sağ kolon görsel olarak daha parlak olsa bile metin kontrastı ve boyutu ana CTA'dan baskın değildir.

## Tıklanabilir akış sözleşmesi

```text
NEW
  ├─ Bugünün bulmacasını çöz ──> /play
  └─ Kısa örneği dene ─────────> /play?mode=tutorial

IN_PROGRESS
  └─ Kaldığın yerden devam et ─> /play

COMPLETED
  └─ Sonucunu gör ─────────────> /play?view=result
```

Q11 rotaları uygularken query biçimini değiştirebilir; kullanıcı davranışı ve CTA hiyerarşisi korunmalıdır.

## Bileşen sözleşmesi

`HomeHero` yalnız sunum kararını verir. Günlük bulmacanın varlığı, kayıt verisi, Türkiye saati veya istatistik hesabı yapmaz.

Önerilen giriş:

```ts
type HomePlayerState = "new" | "in-progress" | "completed";

type HomeHeroProps = {
  state: HomePlayerState;
  puzzleNumber: number;
  dateLabel: string;
  progressLabel?: string;
};
```

Gerçek verinin hangi state'e dönüştürüleceği Q23'te tek kaynaktan hesaplanır.

## Durum metinleri

| Durum | Ana CTA | İkincil CTA |
| --- | --- | --- |
| `new` | Bugünün bulmacasını çöz | Kısa örneği dene |
| `in-progress` | Kaldığın yerden devam et | Nasıl oynanır? |
| `completed` | Sonucunu gör | yok |

CTA etiketleri fiille başlar. “Başla” gibi bağlamsız tek kelimelik etiket kullanılmaz.

## Erişilebilirlik

- CTA en az `44px` yüksekliğinde.
- Ana ve ikincil eylem görsel olarak ayırt edilir; ikisi de yalnız renkle tanımlanmaz.
- Klavye sırası: ana CTA → ikincil CTA → alt yardımcı bağlantılar.
- Hero içindeki dekoratif kartlar `aria-hidden="true"` olur.
- Durum başlığı, devam bilgisi ve gün numarası ekran okuyucuda mantıklı sırayla okunur.
- Hareket azaltıldığında hero kart motifi statik kalır.

## Kabul kanıtı

Q05'in tasarım kararı aşağıdaki üç fixture ile doğrulanır:

```ts
const homeStates = [
  { state: "new", progressLabel: undefined },
  { state: "in-progress", progressLabel: "2/4 grup bulundu · 3 hata hakkı kaldı" },
  { state: "completed", progressLabel: "4/4 grup · 1 hata · 02:18" },
];
```

Q11 sırasında 320 px, 390 px ve 1280 px gerçek tarayıcı görüntüsü alınır. Q05 kapsamında düzen ölçüleri, CTA hiyerarşisi, üç kullanıcı durumu ve bağlantı hedefleri bu belge ve `HomeHero` prototipiyle sabitlenmiştir.
