# Quadro tasarım sistemi

Sürüm: 0.1 · Durum: Faz 0 tasarım temeli · Sahip: Mehmet · İsteğe bağlı geri bildirim: Utku

Quadro'nun adı geçicidir. Bu sistem, oyun adının değişmesi durumunda bile korunabilecek oyun yüzeyi kurallarını tanımlar. Hedef; gösterişli bir landing page değil, ilk saniyede anlaşılır, kartlara dokunmayı keyifli kılan ve uzun süre oynandığında yorulmayan bir günlük oyun deneyimidir.

## Tasarım kararı

Quadro sıcak bir kâğıt yüzey üzerinde çalışan modern bir kelime oyunu gibi görünür: kırık beyaz zemin, koyu mürekkep metin, kömür rengi başlıklar ve dört yumuşak kategori rengi. Renkler yalnızca kategori açıldığında anlam taşır. Seçim, odak ve hata durumları çizgi, metin ve şekil değişimleriyle de anlatılır.

Ana sayfa merak uyandırır ama oyuna giden yolu kapatmaz. Oyun tahtası her zaman en güçlü nesnedir; marka, dekoratif arka plan veya animasyon kelimelerin okunurluğunun önüne geçemez.

## Tipografi

Birinci yazı ailesi **IBM Plex Sans**'tır. Türkçe `İ, I, ı, Ş, Ğ, Ç, Ö, Ü` glifleri için self-host edilen Latin Extended dosyaları tercih edilir. Varlık yüklenemezse sistem yığını kullanılır; metin genişliği değiştiğinde kart düzeni yine çalışmalıdır.

| Kullanım | Aile | Ağırlık | Boyut / satır yüksekliği | Kural |
| --- | --- | --- | --- | --- |
| Marka ve hero başlığı | IBM Plex Sans | 700 | 40/44, mobil 32/36 | En fazla üç kısa satır; başlık kelimeyi bastırmaz. |
| Bölüm başlığı | IBM Plex Sans | 650 | 24/30 | Cümle düzeni; tamamı büyük harf yalnız kısa etiketlerde. |
| Kelime kartı | IBM Plex Sans | 650 | clamp(13px, 2.2vw, 18px) / 1.15 | Uzun kelimede satır kırılır; harf aralığı açılmaz. |
| Kategori başlığı | IBM Plex Sans | 700 | 16/20 | Renk adı tek başına kullanılmaz; anlamlı metin bulunur. |
| Gövde ve açıklama | IBM Plex Sans | 400/450 | 16/24 | En az 1.45 satır yüksekliği. |
| Tarih, numara, süre | IBM Plex Mono | 500 | 12–14/18 | Küçük üst bilgi; ana CTA değildir. |
| Buton | IBM Plex Sans | 650 | 15/20 | Etiket fiille başlar: “Bulmacayı çöz”. |

Global ölçümler `clamp` ile sınırlanır; 320 px ekran için yatay metin taşması kabul edilmez. Font yüklenmesini beklerken fallback metin gizlenmez.

## Renk tokenları

Değerler CSS custom property olarak [tokens.css](../src/styles/tokens.css) içinde bulunur. Aşağıdaki isimler bileşenlerin kullanacağı semantik katmandır; bileşenler ham hex değerlerine bağlanmaz.

### Yüzey ve metin

| Token | Değer | Kullanım |
| --- | --- | --- |
| `--q-color-canvas` | `#F6F3EE` | Uygulama zemini |
| `--q-color-surface` | `#FFFEFB` | Kart, panel ve modal |
| `--q-color-surface-raised` | `#FFFFFF` | Hover ve üst yüzey |
| `--q-color-ink` | `#20242D` | Ana metin |
| `--q-color-ink-muted` | `#696B73` | Yardımcı metin |
| `--q-color-ink-subtle` | `#8A8A90` | İkincil metadata |
| `--q-color-border` | `#D9D4CC` | Kart ve bölücü çizgiler |
| `--q-color-border-strong` | `#B8B1A8` | Odak dışı güçlü çerçeve |
| `--q-color-focus` | `#096A72` | Klavye odağı ve erişilebilir vurgu |
| `--q-color-danger` | `#B42318` | Kritik hata; tek başına renk değildir |

### Çözülmüş grup renkleri

Bu renkler yalnızca grup çözüldükten sonra görünür. Seçili kartta kategori rengi kullanılmaz; böylece oyuncuya cevap sızmaz.

| Seviye | Token | Zemin | Metin | Anlam |
| --- | --- | --- | --- | --- |
| Kolay | `--q-group-yellow` | `#F2CF62` | `#332700` | İlk bulunan, sıcak vurgu |
| Orta | `--q-group-green` | `#8AC79A` | `#11351E` | Doğal ve dengeli bağlantı |
| Zor | `--q-group-blue` | `#8ABBD7` | `#092D3A` | Serin bilgi bağlantısı |
| Çetin | `--q-group-purple` | `#B8A3DE` | `#291B4D` | Kelime oyunu ve sürpriz |

Her renk metniyle birlikte kullanılır. Normal metin kontrastı hedefi WCAG AA'dır; büyük metin ve kategori renklerinde gerçek cihaz kontrast testi yayın öncesi yapılır. Renk körlüğünde grup sırası, başlık ve simge anlamı korur.

## Ölçü, ızgara ve responsive davranış

| Token | Değer | Kullanım |
| --- | --- | --- |
| `--q-space-1` … `--q-space-8` | 4, 8, 12, 16, 20, 24, 32, 48 px | Tüm boşluklar için 4 px tabanlı ölçek |
| `--q-radius-sm` | 10 px | Küçük kontrol ve rozet |
| `--q-radius-md` | 16 px | Kelime kartı ve panel |
| `--q-radius-lg` | 24 px | Hero ve sonuç paneli |
| `--q-radius-pill` | 999 px | Durum rozeti ve sayaç |
| `--q-content-max` | 1120 px | Masaüstü toplam içerik genişliği |
| `--q-board-max` | 640 px | Oyun tahtası üst sınırı |
| `--q-touch-target` | 44 px | Minimum dokunma/klavye hedefi |

### Ekran tarifleri

- **320–479 px:** Tek sütun. Sayfa kenarı 16 px. Tahta 4 sütun; kart aralığı 6 px, kart iç boşluğu 8 px. Kelime kartında en az iki satır için alan vardır. Butonlar tam genişliktedir.
- **480–767 px:** Tek sütun. Sayfa kenarı 20–24 px. Tahta genişliği `min(100%, 640px)`; kart aralığı 8 px.
- **768–1199 px:** Hero ve kısa kural açıklaması iki bölüme ayrılabilir. Tahta ortalanır. Ana CTA metin genişliğini artırmaz.
- **1200 px ve üstü:** İçerik `--q-content-max` ile sınırlanır. Oyun tahtası merkezde, günlük bilgi ve yardım yan panelde olabilir; yan panel tahtadan daha baskın olamaz.

Kart yüksekliği içerik uzunluğuna göre değil, satır kırma için sabit bir taban ve içerik güvenliğine göre belirlenir. 320 px'te 16 karakterli Türkçe bir kelime test kartında okunur kalmalıdır.

## Durum sözleşmesi

| Durum | Görsel dil | Metin / erişilebilir bilgi |
| --- | --- | --- |
| Varsayılan | `surface`, ince border, düşük gölge | Kart kelimesi |
| Hover | Yüzey bir ton yükselir, 1 px yukarı hareket | Fare olmayan cihaz etkilenmez |
| Seçili | `focus` çerçevesi + ince iç halka + 1–2 px yükselme | “Seçildi”; kategori rengi verilmez |
| Klavye odağı | 3 px dış `focus` halkası, offset 3 px | Odak sırası görünür |
| Pasif | Metin ve border kontrastı azalır, tıklama kapanır | “Çözüldü” veya “Oyun bitti” |
| Doğru grup | Grup rengi, kategori başlığı ve birleşme | “Kategori çözüldü: …” |
| Yanlış | Kısa yatay titreşim ve metin mesajı | “Bu grup değil. 3 hata hakkın kaldı.” |
| One-away | Daha sakin titreşim, amber uyarı çizgisi | “Çok yakın — bir kelime uzaktasın.” |
| Tekrarlanan | Titreşim yok; açıklayıcı küçük mesaj | “Bu dörtlüyü zaten denedin.” |
| Yükleniyor | Kart ölçüsü korunur, eylemler kilitlenir | “Bulmaca yükleniyor.” |
| Hata | Nötr hata paneli ve yeniden dene eylemi | Teknik ayrıntı yerine sonraki adım |

Seçili, doğru ve hata durumlarında anlamı yalnız renk taşımaz. CSS `[data-state]` seçicileri için eşdeğer metin ve `aria-live` mesajları bileşen katmanında sağlanır.

## Gölge ve katman

```css
--q-shadow-card: 0 1px 1px rgb(32 36 45 / 0.05), 0 6px 18px rgb(32 36 45 / 0.06);
--q-shadow-card-hover: 0 2px 2px rgb(32 36 45 / 0.06), 0 10px 24px rgb(32 36 45 / 0.10);
--q-shadow-focus: 0 0 0 3px rgb(9 106 114 / 0.24);
```

Bir kart aynı anda ikiden fazla gölge kullanmaz. Modal ve sonuç paneli yüzeyle ayrılır; tam ekran karartma oyunu kapatıyorsa geri dönüş eylemi görünür kalır. Z-index sırası: normal yüzey 0, sticky başlık 10, mesaj 20, modal 30, sistem hata bildirimi 40.

## Hareket ve zamanlama

Varsayılan hareket kısa ve fiziksel his verir:

| Token | Değer | Kullanım |
| --- | --- | --- |
| `--q-motion-fast` | 120 ms | Seçim, hover, toggle |
| `--q-motion-feedback` | 220 ms | Yanlış, one-away, tekrar |
| `--q-motion-group` | 380 ms | Dört kartın grup satırına birleşmesi |
| `--q-motion-final` | 520 ms | Son grup ve sonuç geçişi |
| `--q-ease-standard` | `cubic-bezier(.2,.8,.2,1)` | Genel hareket |
| `--q-ease-spring` | `cubic-bezier(.22,1.2,.36,1)` | Kart yükselişi; geri sekme sınırlı |

Bir element aynı anda Motion ve GSAP tarafından yönetilmez. Oyun eylemi animasyonun bitmesini beklemez; yalnız aynı gönderimi iki kez işleyen kontroller kilitlenir. `prefers-reduced-motion: reduce` geldiğinde transform ve titreşimler kaldırılır, durum geçişleri en fazla 1 ms opacity değişimine iner.

Intro ilk ziyarette bir kez görülebilir: logo işareti dört parçaya ayrılır, 16 karta dönüşür ve “4 bağlantıyı bul” cümlesiyle biter. Süresi 900 ms'yi aşmaz. Tekrar ziyaretçi intro beklemez. Oynama CTA'sı introdan önce de etkindir.

## Ses

Ses varsayılan kapalıdır. `--q-sound-selection`, `--q-sound-feedback`, `--q-sound-correct` ve `--q-sound-finish` olayları tek bir olayda bir kez çalar. Ses kapalıyken metin/animasyon eşdeğeri korunur. Kullanıcının tercihi cihazda saklanır; otomatik ses oynatma için tarayıcı izni beklenmez.

## Erişilebilirlik kabulü

- Kartlar klavye ile erişilir; görünür odak sırası satır sırasını takip eder.
- Seçim `aria-pressed`, çözülen kart `aria-disabled`/uygun durum metni ve mesajlar `aria-live="polite"` ile anlatılır.
- Dokunma hedefi 44×44 px'ten küçük değildir.
- Metin ve durum yalnız renk, yalnız ses veya yalnız hareketle verilmez.
- 200% yakınlaştırmada kritik CTA ve oyun tahtası yatay kaydırma olmadan kullanılabilir.
- Uzun Türkçe kelimeler kırpılmaz; gerekiyorsa içerik yeniden yazılır veya kart ölçüsü artırılır.

## Ekran kabul listesi

Her UI PR'ında aşağıdaki altı durum en az 320 px ve masaüstünde kontrol edilir:

1. İlk ziyaret ana sayfası.
2. Yarım kalmış oyun için “Kaldığın yerden devam et”.
3. Dört seçimli oyun tahtası.
4. One-away ve son hak sonrası yanlış.
5. Kazanma sonucu ve paylaşım.
6. Kayıp sonucu ve cevap açıklamaları.

Kanıt, PR'ye cihaz/viewport bilgisiyle eklenir. Görsel doğrulama henüz gerçek uygulama bileşenleri olmadığı için bu issue'da token ve ekran tarifleriyle sınırlıdır; Q11–Q15 ile gerçek bileşenlerde yeniden kontrol edilir.
