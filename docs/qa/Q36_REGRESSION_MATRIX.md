# Q36 — Günlük kullanım regresyon matrisi

Durum: otomatik kapsam tamam, **gerçek Safari/iOS kontrolü bekliyor**. Bu kayıt olmadan veya otomatik WebKit sonucuyla Q36 kapanmaz.

## Otomatik kapsam

Her satır, kabul ölçütündeki senaryoyu çalıştıran testi gösterir. Tarayıcı testleri `npm run build` çıktısı üzerinde, CI'da Chromium ve WebKit ile koşar.

| Senaryo | jsdom (`tests/e2e`) | Üretim derlemesi (`tests/playwright`) |
| --- | --- | --- |
| Yenileme sonrası devam | `kayit-devam.test.tsx` | `kayit.spec.ts` |
| Bozuk kayıt | `kayit-devam.test.tsx`, `kurtarma-istatistik.test.tsx` | `kayit.spec.ts` |
| Eski günün kaydı | `kayit-devam.test.tsx` | `kayit.spec.ts` |
| Gün değişimi | `gun-degisimi.test.tsx` | Yok; sahte saat gerektirir |
| Son hak ve kaybetme | `tahmin-ve-kontroller.test.tsx` | `kayit.spec.ts`, `gonderim.spec.ts` |
| Yinelenen tahmin | `tahmin-ve-kontroller.test.tsx`, `kayit-devam.test.tsx` | `gonderim.spec.ts`, `kayit.spec.ts` |
| Hızlı çift gönderim | `tahmin-ve-kontroller.test.tsx` | `gonderim.spec.ts` |
| Kazanma ve spoilersız paylaşım | `tahmin-ve-kontroller.test.tsx` | `akis.spec.ts`, `paylasim.spec.ts` |
| 320 px | Yok | `mobil.spec.ts`, `resimli.spec.ts` |
| Resimli mod | `resimli-quadro.test.tsx` | `resimli.spec.ts` |

## Yerelde koşum

`vitest.config.mts` ve `playwright.config.mjs` yerelde en fazla 4 işçi kullanır. Çok çekirdekli geliştirici makinesinde varsayılan işçi sayısı, kod hatası olmadan zaman aşımı üretiyordu (20 mantıksal çekirdek: `npm run check` kırmızı; 4 işçi: 566/566). Testlerin süre sınırları değiştirilmedi.

## Gerçek Safari/iOS kontrolü

Otomatik WebKit, Safari motorunu Linux üzerinde çalıştırır; iPhone donanımını, dokunmayı ve iOS Safari'nin depo davranışını kanıtlamaz. Aşağıdaki tablo gerçek cihazda doldurulur.

| Kontrol | Cihaz ve iOS sürümü | Tarih | Commit | Sonuç |
| --- | --- | --- | --- | --- |
| `/play` açılır, kart seçilir ve kaldırılır | — | — | — | Bekliyor |
| Sayfa yenilenince oyun devam eder | — | — | — | Bekliyor |
| Sekme kapatılıp açılınca oyun devam eder | — | — | — | Bekliyor |
| Kazanma ve kaybetme sonucu | — | — | — | Bekliyor |
| Paylaş veya kopyala | — | — | — | Bekliyor |
| `/pictures` tahtası ve görseller | — | — | — | Bekliyor |

Sonuçlar [Q39 cihaz matrisiyle](Q39_REAL_DEVICE_ACCEPTANCE.md) aynı oturumda alınabilir.
