# Quadro Deployment Runbook

Bu belge Q40 için preview, production ve rollback akışını tanımlar. Gerçek production yayını; Q33, Q36 ve Q38 kapanmadan yapılmaz.

## Platform

Hedef barındırma: Vercel.

- Framework: Next.js 16
- Node: repository `.nvmrc` / `package.json` ile uyumlu sürüm
- Build: `npm run build`
- Install: `npm ci`
- Runtime secret: şu an yok
- Uygulama tarafından zorunlu ortam değişkeni: şu an yok

Vercel hesabında `quadro` projesi oluşturulduğunda proje kimliği/URL bu belgeye eklenir. Kimlik, token veya gizli değerler repoya yazılmaz.

## Preview akışı

1. `main` güncel ve CI yeşil olmalı.
2. Preview branch/PR Vercel Git entegrasyonu ile deploy edilir.
3. Preview URL üzerinde en az şu smoke kontrolleri yapılır:
   - `/` açılıyor.
   - `/play` günün bulmacasını açıyor.
   - Kart seçme ve `Grupla` çalışıyor.
   - Yenilemede devam eden oyun korunuyor.
   - Kazanma/kaybetme sonuç ekranı açılıyor.
   - `Kopyala`/paylaşım fallback'i çalışıyor.
   - `/stats` açılıyor.
4. Preview build commit SHA ile kaydedilir.

## Production gate

Production yalnız şu koşullarda promote/deploy edilir:

- Q33 production performans kabulü tamamlandı.
- Q36 regresyon ve gerçek Safari/iOS kontrolü tamamlandı.
- Q38 30 onaylı bulmaca takvimi tamamlandı.
- Hedef commit için GitHub CI yeşil.
- Kritik açık hata yok.

Production'a alınacak commit önce preview ortamında smoke testten geçmelidir. Mümkünse aynı doğrulanmış preview deployment production'a promote edilir; yeniden build edilerek farklı artifact üretmekten kaçınılır.

## Production smoke

Yayın sonrası:

1. `/` HTTP 200 ve ana CTA görünür.
2. `/play` yüklenir; tarih/günlük yayın doğru.
3. Bir seçim + temizle/karıştır akışı çalışır.
4. Local persistence yenilemede korunur.
5. Sonuç paylaşım metni spoiler içermez.
6. `/stats` açılır.
7. Runtime error/log kontrolü yapılır.

## Rollback

Her production yayını için şu üç bilgi kaydedilir:

- yayınlanan commit SHA,
- production deployment ID/URL,
- bir önceki sağlam production deployment ID/URL.

Kritik regresyonda yeni kod üzerinde acil düzeltme beklenmez; önce Vercel'de bir önceki sağlam deployment'a rollback/promote yapılır. Ardından hata ayrı branch/PR ile düzeltilir ve normal CI + preview doğrulamasından geçer.

## Q40 kanıt tablosu

| Kanıt | Durum |
| --- | --- |
| Deployment prosedürü | Hazır |
| Secret/env sözleşmesi | Hazır; uygulama için zorunlu env yok |
| Vercel `quadro` projesi | Bekliyor |
| Preview URL + commit smoke | Bekliyor |
| Production URL + commit smoke | Q33/Q36/Q38 sonrası |
| Rollback hedefi doğrulaması | İlk production deployment sonrası |

Q40, gerçek preview/production URL ve smoke kanıtları kaydedilmeden kapatılmaz.
