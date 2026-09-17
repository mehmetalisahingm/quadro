# İlk akış regresyonları (Q17)

Q17 iki katmanla korunur:

1. `tests/e2e/**`: Vitest + jsdom + Testing Library ile hızlı DOM entegrasyon testleri.
2. `tests/browser/q17-smoke.mjs`: Playwright + gerçek Chromium ile production build üzerinde tarayıcı kalite kapısı.

İki katman birlikte ana sayfa → `/play` → oyna → kazan veya kaybet → sonuç ekranı → spoilersız paylaşım akışını korur.

## Hızlı jsdom katmanı

| | |
| --- | --- |
| Çalıştırıcı | Vitest (`vitest.config.ts`) |
| Ortam | `jsdom`. `environmentMatchGlobs` yalnız `tests/e2e/**` dosyalarını jsdom'da koşturur; `src/**` birim testleri `node` ortamında kalır |
| Çizim | `@testing-library/react`. Gerçek sayfa ve oyun bileşenleri çizilir |
| Etkileşim | `@testing-library/user-event`: tıklama, çift tıklama, pano |
| Oyun | Gerçek motor (`engine/`) `useGame` üzerinden; sahte sonuç yok |

Yardımcılar `helpers.ts` içindedir. Bu katman one-away, tekrar tahmin, hızlı çift gönderme, terminal durum ve paylaşım sızıntısı gibi çok sayıdaki iş kuralını hızlıca denetler.

## Gerçek Chromium katmanı

`tests/browser/q17-smoke.mjs` Playwright ile **gerçek Chromium** açar ve `next build` + `next start` çıktısına karşı çalışır. Şunları doğrular:

- ana sayfadaki gerçek Next.js bağlantısından `/play` rotasına geçiş;
- dört doğru grupla gerçek kazanma akışı ve terminal ekranı;
- dört farklı yanlış tahminle gerçek kaybetme akışı;
- spoilersız paylaşım önizlemesi ve gerçek Clipboard API ile kopyalama;
- 320 px viewport'ta yatay taşma olmaması, 16 kartın çizilmesi ve kart seçiminin çalışması.

Canlı günlük cevapları kullanılmaz; test Q03'ün yayın stoğunda olmayan `standardPuzzle` fixture'ını kullanır.

## Deterministik kalma kuralları

- **İçerik:** `standardPuzzle` kullanılır; günlük yayın stoğundan bağımsızdır.
- **Kart sırası:** motorun sabit tohumu tarafından belirlenir; jsdom testleri sıralamayı motordan hesaplar.
- **Zaman:** jsdom katmanında sahte saat vardır. Gerçek Chromium katmanı uygulamanın 260 ms geçişini butonun yeniden etkileşime açılmasını bekleyerek doğrular.
- **Paylaşım:** gerçek tarayıcı testi kelime/kategori cevaplarının paylaşım metninde bulunmadığını ve panoya yazılan metnin önizlemeyle aynı olduğunu denetler.

## Çalıştırma

Hızlı katman:

```bash
npm run test:e2e   # yalnız jsdom akış regresyonları
npm run test       # birim + jsdom akış regresyonları
npm run check      # lint + typecheck + test + build
```

Gerçek Chromium testi için önce production build ve Playwright gerekir. CI tam olarak şu modeli kullanır:

```bash
npm run build
npm install --no-save --package-lock=false --ignore-scripts @playwright/test@1.63.0
npx playwright install --with-deps chromium
npm run start -- -H 127.0.0.1 -p 3000
# ayrı terminal:
npm run test:browser
```

Playwright sabit sürümle CI aracı olarak `--no-save` kurulur; uygulamanın `package-lock.json` dosyasına eklenmez.

## CI

`.github/workflows/ci.yml` önce `npm ci → lint → typecheck → test → build` zincirini çalıştırır. Ardından Playwright 1.63.0 ve Chromium kurulur, production Next.js sunucusu başlatılır ve `npm run test:browser` çalıştırılır. Gerçek tarayıcı testi geçmeden Q17 kalite kapısı yeşil sayılmaz.

Gerçek Safari/iOS cihaz kabulü bu görevin dışında kalır ve son cihaz/yayın kabulünde ayrıca yapılır.
