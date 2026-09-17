# İlk akışın tarayıcı regresyonları (Q17)

Bu dizindeki testler oyuncunun ilk akışını uçtan uca korur: ana sayfa → `/play` → oyna → kazan veya kaybet → sonuç ekranı → spoilersız paylaşım.

## Nasıl çalışır

| | |
| --- | --- |
| Çalıştırıcı | Vitest (`vitest.config.ts`) |
| Ortam | `jsdom`. `environmentMatchGlobs` yalnız `tests/e2e/**` dosyalarını jsdom'da koşturur; `src/**` birim testleri `node` ortamında kalır |
| Çizim | `@testing-library/react`. Gerçek sayfa bileşenleri çizilir: `src/app/page.tsx` ve `/play` sunucu bileşeni `src/app/play/page.tsx` |
| Etkileşim | `@testing-library/user-event`: gerçek DOM tıklamaları, çift tıklama, pano |
| Oyun | Gerçek motor (`engine/`) `useGame` üzerinden; sahte sonuç yok |

Yardımcılar `helpers.ts` içindedir. Testler kelimeleri metinleriyle seçer (`ELMA`, `MARS`…), rol ve erişilebilir adlarla sorgular.

## Deterministik kalma kuralları

- **İçerik:** Yayın stoğunda olmayan `standardPuzzle` kullanılır. Canlı günün cevaplarına bağlı değildir; bunu bir test ayrıca denetler.
- **Kart sırası:** Motorun sabit tohumundan (`DEFAULT_ENGINE_SEED`) gelir. Beklenen sıra testte motorla hesaplanır, elle yazılmaz.
- **Zaman:** Gerçek bekleme yoktur. `setTimeout` sahte saattedir; Grupla'daki geri bildirim geçişi `finishTransition()` ile bitirilir. Testing Library'nin eylem sarmalayıcısı saati global `jest` üzerinden ilerlettiği için vitest saati `vi.stubGlobal("jest", …)` ile tanıtılır.
- **Hız:** Sık çağrılan konum bulucular (kart, Grupla, Karıştır, Temizle) düğmeyi metniyle bulur. Rol sorgularında görünürlük hesabı kapalıdır (`defaultHidden: true`). Adlı rol sorguları (`getByRole(..., { name })`) jsdom'da her çağrıda tüm düğmelerin erişilebilir adını pahalı stil sorgularıyla hesaplıyor; aynı dosyada birkaç oyun bittikten sonra test başına 3–4 saniyeye çıkıp 5 saniyelik sınıra yaklaşıyordu. Anlamsal doğrulamalar (bölge, makale, bağlantı, başlık) rol sorgularıyla yapılır.

## Çalıştırma

```bash
npm run test:e2e   # yalnız akış regresyonları
npm run test       # birim + akış regresyonları
npm run check      # lint + typecheck + test + build
```

## CI

`.github/workflows/ci.yml` içindeki **Test (birim + akış regresyonları)** adımı `npm run test` çalıştırır ve bu testler oraya dahildir. jsdom ve Testing Library `devDependencies` içindedir, `npm ci` ile kurulur; ayrı tarayıcı kurulumu gerekmez. `next lint` de `tests/` dizinini denetler (`next.config.mjs` → `eslint.dirs`).

## Kapsamadıkları

jsdom gerçek bir tarayıcı değildir. CSS, yerleşim, 320 px görünüm, animasyonlar ve Next.js istemci yönlendirmesi burada doğrulanmaz. Ana sayfa bağlantısının yalnız hedefi (`/play`) denetlenir. Bunlar için ileride Playwright ile gerçek tarayıcı testi eklenebilir.
