# Quadro Deployment Runbook

Bu belge Q40 için preview, production ve rollback akışını tanımlar. Envanterin ilk hali Mehmet'in #141 PR'ından alınmış, 5 Kasım 2026'da GitHub dağıtım kayıtlarıyla güncellenmiştir.

## Platform

Hedef barındırma: Vercel.

- Framework: Next.js 16
- Node: repository `.nvmrc` / `package.json` ile uyumlu sürüm
- Build: `npm run build`
- Install: `npm ci`
- Ortam değişkenleri: `.env.example` içinde adları belgeli. Hesap ve merkezi analitik için `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` ve `NEXT_PUBLIC_SITE_URL` gerekir (bkz. [SUPABASE](SUPABASE.md)).
- Anonim oyun Supabase olmadan yerel kayıtla çalışır.

Kimlik, token veya gizli değerler repoya yazılmaz.

## Üretim envanteri

| Alan | Değer | Kaynak |
| --- | --- | --- |
| Vercel projesi | `quadro` (`prj_u8tJCbgoxNg8RAZyXYqx8JYO9kFN`) | #141, 12 Ekim |
| Üretim adresi | https://quadro-teal.vercel.app | Depo ve iş akışları |
| Son üretim dağıtımı | `af6a5f0`, https://quadro-3g05vgrsw-mehmets-projects-081d879d.vercel.app | GitHub, 5 Kasım |
| Geri alma adayı | `c806392`, https://quadro-ihjhaz55r-mehmets-projects-081d879d.vercel.app | GitHub, 5 Kasım |
| Alan adı | `playquadro.com.tr` satın alınmadı (bkz. [alan adı](qa/DOMAIN_LAUNCH.md)) | Depo |

Vercel projesi Mehmet'in hesabındadır; dağıtım kimlikleri (`dpl_…`) ve ortam değişkeni değerleri oradan doğrulanır. Bu tablo her yayında elle güncellenmez: güncel liste için `gh api "repos/mehmetalisahingm/quadro/deployments?environment=Production"`.

**Otomatik dağıtım:** `main`'e giren her commit yaklaşık bir dakika içinde üretime çıkar (ör. #154 merge 15:00:43, dağıtım 15:01:33). Yani merge, yayın demektir; aşağıdaki kapılar otomatik olarak uygulanmaz.

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

> **Karar bekliyor:** Üretim adresi kapılar kapanmadan önce de yayında ve `main` otomatik dağıtılıyor. Kapılar şu an **resmî yayın kabulünün** koşuludur, dağıtımı engellemez. Dağıtımın da kapıya bağlanması isteniyorsa Vercel'de otomatik üretim dağıtımı kapatılmalıdır; bu Mehmet ve Utku'nun ortak kararıdır.

Resmî yayın kabulü yalnız şu koşullarda verilir:

- Q33 production performans kabulü tamamlandı.
- Q36 regresyon ve gerçek Safari/iOS kontrolü tamamlandı.
- Q38 30 onaylı bulmaca takvimi tamamlandı.
- Hedef commit için GitHub CI yeşil.
- Kritik açık hata yok.

Production'a alınacak commit önce preview ortamında smoke testten geçmelidir. Mümkünse aynı doğrulanmış preview deployment production'a promote edilir; yeniden build edilerek farklı artifact üretmekten kaçınılır.

## Production smoke

Otomatik kısım: GitHub Actions'ta `Live release acceptance` iş akışı (`scripts/verify-live.mjs`). Sayfaları, günlük oyunu, Resimli ve Risk modlarının erişimini, giriş yapılandırmasını ve anonim admin reddini gerçek internet üzerinden okur; e-posta göndermez, oyuncu sonucu oluşturmaz. Her gece `Daily publication health` da `/api/health` kontrol eder.

Elle yapılacak kısım, yayın sonrası:

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

Adımlar:

1. Geri alma adayını seç: `gh api "repos/mehmetalisahingm/quadro/deployments?environment=Production&per_page=5" --jq '.[] | "\(.sha[0:7]) \(.created_at)"'`. Hatayı içermeyen en yeni commit.
2. Vercel panosunda `quadro` → Deployments → o dağıtım → **Instant Rollback**. Yeni build yapılmaz, aynı çıktı yeniden yönlendirilir.
3. `Live release acceptance` iş akışını çalıştır ve `/api/health` yanıtını kontrol et.
4. Commit, dağıtım adresi, saat ve nedeni ilgili issue'ya yaz.
5. Dikkat: Geri alma sonrası `main`'e giren yeni commit üretimi tekrar ileri alabilir. Düzeltme hazır olana kadar merge bekletilir.

Tatbikat üretimi etkilediği için ancak iki kişinin onayıyla, trafiğin düşük olduğu bir saatte yapılır.

## Q40 kanıt tablosu

| Kanıt | Durum |
| --- | --- |
| Deployment prosedürü | Hazır |
| Secret/env sözleşmesi | Hazır; değerlerin Vercel'de ayarlı olduğu Mehmet tarafından doğrulanacak |
| Vercel `quadro` projesi | Var |
| Preview URL + commit smoke | Bekliyor |
| Production otomatik kabul | `325bb25` için geçti, 6 Kasım: 16/16 kontrol, Resimli ve Risk dahil ([koşu](https://github.com/mehmetalisahingm/quadro/actions/runs/42245111471)). Aynı gün main'deki eski betik `/journey` etiketi yüzünden düşmüştü; bu PR'da düzeltildi |
| Production elle smoke | Bekliyor |
| Rollback hedefi | `c806392` belirlendi; **tatbikat yapılmadı** |

Q40, gerçek preview/production URL ve smoke kanıtları kaydedilmeden kapatılmaz.
