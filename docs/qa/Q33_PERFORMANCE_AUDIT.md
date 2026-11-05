# Q33 — Üretim performansı ve istemci paket denetimi

Bu kayıt Q33 için laboratuvar/CI kanıtını gerçek cihaz gözleminden ayırır. Gerçek cihaz sonucu burada uydurulmaz; Q33 ancak hedef cihaz gözlemi de eklendiğinde tamamen kapanır.

## Kasım 2026 yeniden ölçüm

Eylül ölçümünden sonra Keşif Yolu, Resimli Quadro, Risk modları ve açılış görselleri eklendi. Bu bölüm aşağıdaki eski sayıların yerine geçer; eski bölümler kayıt için duruyor. Ölçüm yerel üretim derlemesinde yapıldı, tek koşudur ve **son kullanıcı cihaz performansı değildir.**

Paket boyutu (`npm run build`, sonra `npm run report:bundle`, commit `af6a5f0`):

| Varlık | Dosya | Ham | Gzip |
| --- | ---: | ---: | ---: |
| Statik JS | 28 | 882,1 KB | 283,6 KB |
| Statik CSS | 6 | 149,8 KB | 35,5 KB |

Sayfa ağırlığı (Windows, Chromium, localhost, soğuk önbellek, yüklemeden sonra 2,5 sn bekleme, bant kısıtı yok):

| Sayfa | İstek | Toplam | Script | Görsel | FCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 33 | 229 KB | 174 KB | 1 KB | 1756 ms (ilk istek, sunucu soğuk) |
| `/play` | 21 | 247 KB | 202 KB | 0 KB | 348 ms |
| `/pictures/board` | 38 | 256 KB | 197 KB | 14 KB | 252 ms |
| `/stats` | 18 | 196 KB | 153 KB | 0 KB | 196 ms |
| **`/journey`** | 39 | **7121 KB** | 156 KB | **6913 KB** | 308 ms |

### Bulgular

1. **Açık: `/journey` ilk açılışta yaklaşık 7 MB görsel indiriyor.** `public/images/journey` toplam 8,5 MB ve sayfa bu görsellerin çoğunu tek açılışta yüklüyor. Günlük oyunu bekletmez, ama mobil veride Keşif Yolu için ciddi bir maliyettir; aşağıdaki "ağır medya yok" sonucu bu sayfa için artık geçerli değildir. Düzeltme `src/components/journey/` içinde, sahibi Mehmet: ekranda olmayan dünyaların görselleri ertelenmeli.
2. **Günlük oyun ana eylemi bekletmiyor.** `/play` görsel indirmeden yaklaşık 250 KB ile açılıyor.
3. **İçerik sızıntısı yok.** `npm run check:bundle` bu commit'te geçti; denetim günlük, mod, Keşif Yolu ve Resimli içeriği kapsıyor.

## Durum

- Laboratuvar / CI denetimi: **TAMAM**
- İstemci içerik sızıntısı denetimi: **TAMAM**
- Ses / font maliyeti kod incelemesi: **TAMAM**
- Kart animasyonu / layout incelemesi: **TAMAM**
- `/journey` görsel yükü: **AÇIK BULGU** (Mehmet)
- Gerçek cihaz gözlemi: **BEKLİYOR**

## Referans laboratuvar koşusu

Kaynak: GitHub Actions CI #132, PR #95 üzerinde Ubuntu 24.04, Node 22.23.2, Next.js 16.3.5 / Turbopack ve Playwright Chromium 153.

- `npm audit --audit-level=moderate`: **0 vulnerability**
- Vitest: **41 test dosyası / 403 test geçti**
- Optimize production build: **4.7 s compile**
- TypeScript build aşaması: **3.9 s**
- Static page generation: **10/10 sayfa, 639 ms**
- `/play`: dinamik, request sırasında server-rendered
- `check:bundle`: **32 günlük içerik, 20 statik dosya, 20 önceden çizilmiş sayfa** tarandı; günlük bulmaca içeriği istemci paketinde bulunmadı
- Gerçek Chromium regresyonu: **15/15 test geçti, 25.0 s**

Bu sayılar GitHub-hosted runner laboratuvar verisidir; son kullanıcı cihaz performansı olarak yorumlanmaz.

## İstemci paket denetimi

Mevcut `scripts/check-client-bundle.mjs` production build sonrasında `.next/static/**` ile önceden çizilmiş `.html/.rsc` çıktılarını tarıyor.

Kabul açısından sonuç:

1. Gelecek günlerin bulmaca kimliği, kelimeleri, grup başlıkları ve açıklamaları statik istemci paketine girmiyor.
2. Editoryal/kör-review içerikleri de aynı izler üzerinden istemci sızıntısına karşı denetleniyor.
3. Günlük oyun `/play` üzerinden sunucuda istek anında çözülüyor; bütün stok client bundle'a gömülmüyor.

CI #132 sonucu: **sızıntı yok**.

## Ses maliyeti

Ses sistemi harici `.mp3/.wav` dosyası yüklemiyor. `gameSound.ts` kısa cue'ları Web Audio oscillator/gain düğümleriyle üretiyor.

`useGameSounds.ts` içinde motor ve `AudioContext` tembel oluşturuluyor:

- varsayılan ses tercihi kapalı,
- kullanıcı sesi açmadan `AudioContext` oluşturulmuyor,
- ses dosyası için ek ağ isteği yok,
- autoplay için context yalnız kullanıcı etkileşimi içinde unlock ediliyor.

Sonuç: başlangıç ana eylemini bekleten ses indirme/decode maliyeti bulunmadı. Bu nedenle bu denetimde ses tarafında runtime değişikliği gerekli görülmedi.

## Font maliyeti

Uygulama layout'unda `next/font`, uzaktan stylesheet veya `@font-face` ile web font yüklenmiyor. Tasarım token'ları `IBM Plex Sans` / `IBM Plex Mono` adlarını ilk tercih olarak içeriyor; cihazda yoksa `Segoe UI`, `system-ui`, `Cascadia Mono`, `Consolas` gibi yerel fallback'lere geçiliyor.

Sonuç: uygulamanın başlatma yolunda font indirme isteği yok. Font kaynaklı ağ bloklaması eklenmediği için bu denetimde değişiklik gerekli görülmedi.

## Kart etkileşimi ve layout

`GameAnimations.module.css` animasyonları ağırlıklı olarak `transform` ve `opacity` kullanıyor:

- yanlış tahmin: `translateX`,
- one-away: `translateY + scale`,
- grup birleşimi: `translateY + scale + opacity`,
- feedback/final girişleri: `translateY + scale + opacity`.

Animasyon sırasında `width`, `height`, `top`, `left` gibi layout hesaplatan özellikler değiştirilmediğinden kod incelemesinde sürekli layout thrash işareti bulunmadı. Kart boyutları ve feedback alanı için minimum yükseklikler de görsel sıçramayı sınırlıyor.

`prefers-reduced-motion: reduce` hem global token katmanında hem oyun animasyonlarında destekleniyor.

## Ana eylemin bekletilmemesi

Kod/CI incelemesinde oyun başlangıcını bloklayan şu tür yükler bulunmadı:

- harici ses dosyası,
- uygulamanın indirdiği web font,
- tüm gelecek bulmacaları taşıyan client bundle,
- ana oyun etkileşimine bağlı ağır medya asset'i.

Production build ve gerçek Chromium regresyonu birlikte geçtiği için laboratuvar düzeyinde ana akışta bloklayıcı regresyon görülmedi.

## Önce / sonra

Q33 denetiminde doğrudan kaldırılması gereken gereksiz bir ses/font/içerik yükü saptanmadı. Bu nedenle yalnız sayı iyileştirmek adına riskli bir runtime değişikliği yapılmadı.

| Alan | Önce | Denetim sonrası |
| --- | --- | --- |
| Gelecek içerik client bundle | Otomatik kontrol mevcut | CI ile 32 gün üzerinde tekrar doğrulandı: sızıntı yok |
| Ses asset maliyeti | Web Audio oscillator | Aynı; dosya indirme olmadığı doğrulandı |
| Font asset maliyeti | Yerel/system fallback | Aynı; uygulama font indirmiyor |
| Kart animasyonları | transform/opacity ağırlıklı | Aynı; layout-thrashing özellik tespit edilmedi |
| Chromium regresyonu | CI mevcut | 15/15 geçti |

## Kalan gerçek cihaz kabulü

Bu doküman gerçek cihaz testi yerine geçmez. Kapanıştan önce en az aşağıdaki gözlemler gerçek cihazda kaydedilmeli:

- iPhone / Safari: ilk açılış, `/play` geçişi, kart seçme ve grup animasyonu,
- Android / Chrome: aynı akış,
- Windows / Chrome veya Edge: klavye + mouse akışı,
- görünür layout sıçraması, dokunma gecikmesi, takılan animasyon veya ses açma gecikmesi olup olmadığı.

Laboratuvar ölçümü ile gerçek cihaz gözlemi özellikle ayrı raporlanacaktır. Gerçek cihaz kanıtı Q39 kabul matrisiyle birlikte yeniden kullanılabilir.

## Q33 karar kaydı

**Günlük akışta laboratuvar blocker'ı yok.** Issue iki nedenle açık kalmalıdır: gerçek cihaz gözlemi eksik ve `/journey` görsel yükü için karar bekleniyor.
