# Q37 — Metadata, favicon ve paylaşım önizlemesi QA

## Otomatik olarak doğrulananlar

- Kök sayfa Türkçe ürün başlığı ve açıklaması taşır.
- `/play` günlük oyun için, `/play?mode=tutorial` öğretici için ayrı başlık/açıklama üretir.
- `icon.svg` favicon olarak ve manifest içinde kullanılır.
- `apple-icon.tsx` 180×180 PNG mobil ikon üretir.
- `opengraph-image.tsx` ve `twitter-image.tsx` 1200×630 spoilersız sosyal önizleme üretir.
- Sosyal önizleme bileşeni günlük puzzle dosyalarını veya test fixture cevaplarını içe aktarmaz; yalnız marka/kural metni ve soyut 4×4 kart düzeni kullanır.
- Manifest standalone kullanım, Türkçe dil, tema ve arka plan rengini tanımlar.

## Beklenen üretim rotaları

- `/icon.svg`
- `/apple-icon`
- `/opengraph-image`
- `/twitter-image`
- `/manifest.webmanifest`

## Manuel yayın kabulü

Gerçek sosyal ağ/link önizlemesi yalnız herkese açık bir HTTPS URL üzerinde güvenilir biçimde doğrulanabilir. Q40 üretim/preview dağıtımı hazır olduğunda şu kontroller yapılmalıdır:

1. Ana sayfanın üretilen `<title>`, description, `og:*` ve `twitter:*` etiketlerini tarayıcı kaynak çıktısından doğrula.
2. Open Graph ve Twitter görsel rotalarının 200 ve `image/png` döndürdüğünü doğrula.
3. iPhone/Safari'de ana ekrana ekleme akışında mobil ikonun doğru göründüğünü kontrol et.
4. En az bir gerçek mesajlaşma/sosyal platform link önizlemesinde günlük kelime veya cevap bulunmadığını doğrula.

Bu son gerçek-URL kontrolü tamamlanmadan Q37'nin “gerçek bağlantı önizlemesi” kabul maddesi tamamlanmış sayılmaz.
