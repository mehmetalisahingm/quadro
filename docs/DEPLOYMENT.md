# Quadro Deployment Runbook

Bu belge Q40 için preview, production ve rollback akışını tanımlar. Gerçek production yayını; Q33, Q36 ve Q38 kapanmadan yapılmaz.

## Platform

Hedef barındırma: Vercel.

- Framework: Next.js 16
- Node: repository `.nvmrc` / `package.json` ile uyumlu sürüm
- Build: `npm run build`
- Install: `npm ci`
- Supabase bağlantısı opsiyoneldir; hesap ve merkezi analytics için `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` ve `NEXT_PUBLIC_SITE_URL` yapılandırılmalıdır (bkz. [SUPABASE](SUPABASE.md)). Bu değerlerin Vercel ortamlarında gerçekten ayarlı olduğu burada doğrulanmış değildir.
- Supabase kullanılmazsa anonim oyun yerel kayıtla çalışabilmelidir; giriş ve merkezi analytics kabulü için gerçek bağlantı şarttır.
- Secret anahtarlar yalnızca sunucuda tutulur ve repoya yazılmaz.

## Canlı Vercel envanteri — 12 Ekim 2026

Bu kayıt **deploy keşfi ve hedef tanımıdır, yayın kabulü veya manuel smoke kanıtı değildir.**

| Alan | Doğrulanan değer |
| --- | --- |
| Vercel proje adı | `quadro` |
| Proje ID | `prj_u8tJCbgoxNg8RAZyXYqx8JYO9kFN` |
| Mevcut production adresi | https://quadro-teal.vercel.app |
| Projeye bağlı doğrulanmış domain | `quadro-teal.vercel.app` |
| Son READY production deployment | `dpl_DhLFcHL95tkYyNRKeNiXcUXNcH99` |
| Bu deployment'ın commit'i | `e15d1b023c5b86e7ba907cbe60d68581fb877d05` (main, #137) |
| Önceki READY rollback adayı | `dpl_7VmuXv2s3Xh7zsW17ZcwdVNhMvQW` |
| Rollback adayının commit'i | `d04cb7f4d35e35e6d6c189e261119b9d27b85ca1` (#136) |
| `playquadro.com` | **Vercel projesine henüz ekli değil**; satın alındığı da doğrulanmadı |
| Q40 production/preview smoke ve rollback tatbikatı | **BEKLİYOR** |

**Not:** Hazır bir production deployment bulunması, Q35/Q38/Q39/Q40/Q41 release kapılarının geçtiği anlamına gelmez. Yeni kodu production'a otomatik promote etmeyin; GitHub CI, görsel ve gerçek cihaz kabulü önce tamamlanmalıdır.

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

Yeni **resmî yayın adayı / promote** yalnız şu koşullarda kabul edilir; mevcut production URL'nin varlığı bu kapıları atlamaz:

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
| Vercel `quadro` projesi | **Var**, ID ve domain bu sayfada kayıtlı |
| Preview URL + commit smoke | **Bekliyor** (sadece production deployment incelendi) |
| Production URL + commit smoke | **Bekliyor**, `READY` smoke sonucu değildir |
| Rollback hedefi | Önceki `READY` deployment ID'si belirlendi; **tatbikat yapılmadı** |
| Alan adı `playquadro.com` | Bağlantı ve DNS doğrulaması bekliyor |

Q40, gerçek preview/production URL ve smoke kanıtları kaydedilmeden kapatılmaz.
