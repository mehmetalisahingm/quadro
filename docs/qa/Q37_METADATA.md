# Q37 — Metadata, favicon ve paylaşım önizlemesi QA

## Kabul matrisi

| Kontrol | Kanıt | Durum |
| --- | --- | --- |
| Ana sayfa anlamlı Türkçe başlık/açıklama taşıyor | `src/app/layout.tsx` kök metadata + `src/app/metadata.test.ts` | ✅ |
| Oyun bağlantısı anlamlı başlık/açıklama taşıyor | `/play` → `Bugünün bulmacası`, öğretici → `Kısa öğretici` | ✅ |
| Tarayıcı favicon'u tanımlı | `/icon.svg`, root metadata `icons.icon`, manifest | ✅ |
| Mobil/Apple ikonu tanımlı | `/apple-icon`, 180×180 PNG ve root metadata `icons.apple` | ✅ |
| OG/Twitter önizlemesi var | `/opengraph-image` ve `/twitter-image`, 1200×630 PNG | ✅ |
| Önizleme günlük kelime/cevap sızdırmıyor | `SocialPreview` yalnız marka metni ve soyut 4×4 kart düzeni kullanıyor; puzzle/fixture import'u testle yasak | ✅ |
| Manifest marka/tema bilgileri tutarlı | `/manifest.webmanifest`; standalone, `tr`, tema/arka plan renkleri | ✅ |
| Üretim derlemesi metadata/image route'larını oluşturuyor | PR CI production build | CI ile doğrulanır |

## Beklenen rotalar

- `/icon.svg` — SVG favicon
- `/apple-icon` — 180×180 PNG mobil ikon
- `/opengraph-image` — 1200×630 PNG spoilersız Open Graph görseli
- `/twitter-image` — 1200×630 PNG spoilersız Twitter/X görseli
- `/manifest.webmanifest` — uygulama manifesti

## Sosyal önizleme güvenliği

`src/components/branding/SocialPreview.tsx` günlük içerik kaynağını okumaz. Günün bulmacasındaki kelimeler, grup başlıkları, çözümler veya fixture cevapları görsele taşınamaz. Önizleme yalnız şu sabit ürün bilgisini gösterir:

- Quadro adı
- günlük bulmaca etiketi
- "16 kelime / 4 gizli bağ" ürün açıklaması
- dört marka renginden oluşan soyut 4×4 kart düzeni

`src/app/metadata.test.ts`, sosyal önizleme kaynağında puzzle/fixture bağımlılığı bulunmadığını regresyon testi olarak kontrol eder.

## Mobil ikon kontrolü

Next.js metadata dosya konvansiyonuna ek olarak root metadata içinde ikonlar açıkça bildirilir:

- standart ikon: `/icon.svg` (`image/svg+xml`)
- Apple touch icon: `/apple-icon` (`image/png`, `180x180`)

Böylece tarayıcı sekme ikonu ile mobil ana-ekran ikonu birbirinden bağımsız ve test edilebilir durumdadır.

## Q37 / Q40 sınırı

Q37, metadata ve önizleme çıktısının uygulama/production-build seviyesinde doğru ve spoilersız olduğunu doğrular. Q40 ise gerçek preview/production URL'si açıldıktan sonra hedef ortam smoke testini, HTTP erişimini ve dağıtım URL'sini ayrıca kaydeder.

Bu ayrım bağımlılık yönünü korur: Q40, Q37 tamamlandıktan sonra başlayabilir; Q37'nin kapanması Q40'a bağlı değildir.
