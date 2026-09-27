# Quadro — Supabase kurulum ve veri sözleşmesi

Bu belge Q43 için merkezi analytics + opsiyonel hesap altyapısının kurulum sözleşmesidir.

## Hedef mimari

Quadro hesap zorunlu olmadan çalışmaya devam eder.

- Login olmayan oyuncu: tarayıcıda rastgele `visitor_id` alır; temel ürün olayları merkezi analytics'e gider.
- Login olan oyuncu: Supabase Auth kullanır; sonuç/geçmiş verisi kendi `user_id` değerine bağlanır.
- Browser yalnız publishable key görür.
- Server route'ları yalnız server-side `SUPABASE_SECRET_KEY` kullanır.
- Secret key hiçbir zaman `NEXT_PUBLIC_` değişkenine konmaz.

## Ortam değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Gerçek değerler repoya commit edilmez. Lokal geliştirmede `.env.local`, Vercel'de Project Settings → Environment Variables kullanılır.

Yeni `sb_publishable_...` ve `sb_secret_...` anahtarları tercih edilir. Secret key server-side REST çağrısında `apikey` header'ında gönderilir; JWT olmadığı için Bearer token gibi kullanılmaz.

## Veritabanı

İlk migration:

`supabase/migrations/202609270001_q43_foundation.sql`

Oluşturduğu ana nesneler:

- `profiles` — Supabase Auth kullanıcısının uygulama profili.
- `visitors` — login gerektirmeyen anonim cihaz/ziyaretçi kimliği.
- `analytics_events` — merkezi ürün olayları.
- `game_results` — login olmuş kullanıcıların oyun sonuçları.
- `record_analytics_event(...)` — visitor upsert + analytics insert işlemini atomik yapan server-only RPC.
- `private` schema — doğrudan Data API yüzeyine çıkmaması gereken trigger yardımcıları.

## RLS / güvenlik

- `public` şemasındaki bütün uygulama tablolarında RLS açıktır.
- `visitors` ve `analytics_events` browser'dan doğrudan okunamaz/yazılamaz.
- Bu iki tabloya yalnız server-side secret key ile çalışan `/api/analytics` yazar.
- `profiles` yalnız authenticated kullanıcının kendi kaydını okumasına/güncellemesine izin verir.
- `game_results` yalnız authenticated kullanıcının kendi sonuçlarını okumasına/yazmasına izin verir.
- Secret key `service_role` yetkisiyle RLS'i bypass ettiği için yalnız server ortamında tutulur.
- Auth user trigger'ı için gereken `SECURITY DEFINER` fonksiyonu exposed `public` yerine `private` şemadadır.
- Analytics RPC `SECURITY INVOKER` çalışır ve yalnız `service_role` rolüne `EXECUTE` verilmiştir.
- Kullanıcı metadata'sı yetkilendirme kararı için kullanılmaz; yalnız profil görünen adını ilk kez doldurmak için kullanılır.

## Analytics akışı

1. Mevcut local analytics event'i üretilir.
2. Event localStorage'da tutulmaya devam eder.
3. Browser `quadro:visitor:v1` anahtarında UUID visitor kimliği oluşturur.
4. Event `POST /api/analytics` ile aynı origin'e gönderilir.
5. Route event adı, event kimliği, visitor UUID'si ve payload boyutunu doğrular.
6. Next.js server route secret key ile Supabase RPC çağrısı yapar.
7. DB visitor'ın `last_seen_at` değerini kendi sunucu saatiyle günceller ve event'i kaydeder.

Her browser event'inin `event.id` değeri DB'de `(visitor_id, client_event_id)` ikilisiyle benzersizdir. Ağ tekrarları aynı olayı ikinci kez saymaz.

`occurred_at` için tarayıcı saati güvenilir kaynak kabul edilmez; merkezi DB kaydı Postgres `now()` zamanını kullanır. Browser event zamanı yalnız local analytics kaydında kalır.

Merkezi analytics erişilemezse oyun akışı hata vermez.

## Toplanmayan veriler

Q43 temel analytics katmanı bilerek şunları toplamaz:

- isim/e-posta (`analytics_events` içinde),
- IP adresini uygulama DB'sine kopyalama,
- cevap kelimeleri,
- seçilen kelimelerin ham listesi,
- cihaz fingerprint'i.

Auth kullanıcısının e-postası Supabase Auth içinde kalır; `analytics_events` içine kopyalanmaz.

## Auth

Quadro'nun auth katmanı **opsiyoneldir**. Sağ üstte `Giriş Yap` bağlantısı görünür; hesap oluşturmadan oyun tam olarak çalışır.

Mevcut ürün modeli client-side Supabase Auth implicit flow'dur. Quadro şu anda server render sırasında kullanıcıya özel içerik üretmediği için auth session browser `localStorage` içinde tutulur. Supabase'in client-only uygulamalar için desteklediği bu modelde DB erişimi kullanıcı JWT'si + RLS ile kendi satırlarına sınırlandırılır.

İleride Server Component/Route Handler tarafında kullanıcı oturumu okunacaksa auth katmanı `@supabase/ssr` + PKCE + cookie modeline taşınmalıdır; implicit tokenları server auth için kullanmamak gerekir.

Session anahtarı:

`quadro:auth:v1`

Desteklenen girişler:

1. Google OAuth
2. E-posta magic link

Callback yolu:

`/auth/callback`

Callback access/refresh token çiftini URL fragment'ından alır, `/auth/v1/user` ile kullanıcıyı doğrular ve ardından URL'den token fragment'ını temizler.

Access token sona yaklaşınca refresh token ile `/auth/v1/token?grant_type=refresh_token` çağrısı yapılır. Çıkışta uzak Supabase oturumu kapatılmaya çalışılır ve yerel session her durumda temizlenir.

### Supabase URL Configuration

Supabase Dashboard → Authentication → URL Configuration:

- Site URL lokal geliştirmede `http://localhost:3000`
- Allowed Redirect URLs içine `http://localhost:3000/auth/callback`
- Production deploy sonrası `https://<production-domain>/auth/callback`
- Vercel preview ile auth test edilecekse gerekli preview pattern'i ayrıca allow-list'e eklenir.

### Google sağlayıcısı

Google login için Supabase Dashboard → Authentication → Providers → Google etkinleştirilir.

Google Cloud tarafında Web OAuth client oluşturulur ve Supabase'in Google provider ekranında gösterdiği callback URL Google `Authorized redirect URIs` listesine eklenir. Google Client ID ve Client Secret yalnız Supabase provider ayarına girilir; Quadro reposuna veya `NEXT_PUBLIC_*` değişkenlerine konmaz.

### E-posta magic link

Supabase Email Auth magic-link akışını destekler. Giriş ekranı `/auth/v1/otp` çağrısıyla tek kullanımlık bağlantı gönderir. Redirect URL'nin Supabase allow-list'inde bulunması gerekir.

## Hesaba sonuç taşıma — sonraki Q43 adımı

Login olduğunda cihazdaki mevcut local oyun geçmişi kullanıcı hesabına bir kez merge edilecek; aynı `puzzle_id + revision` ikinci kez yazılmayacak. Ayrıca mevcut anonim `visitor_id` authenticated kullanıcıyla ilişkilendirilecek.

Bu adım tamamlanmadan “cihazlar arası istatistik senkronu tamamlandı” kabul edilmez.

## Doğrulama kapısı

Production öncesi gerçek Supabase projesinde:

1. migration uygulanır,
2. security ve performance advisor çalıştırılır,
3. anonim analytics event'i yazılıp tekrar gönderimde duplicate oluşmadığı SQL ile doğrulanır,
4. Google ve e-posta login callback'i gerçek redirect URL ile test edilir,
5. login olmayan oyun akışının değişmediği tekrar kontrol edilir.

## Vercel

Production'a çıkmadan önce Vercel projesine üç Supabase değişkeni ve `NEXT_PUBLIC_SITE_URL` eklenir. Preview ve production farklı Supabase projeleri kullanabiliyorsa tercih edilir; tek proje kullanılacaksa preview test verileri analytics raporlarında ortam bilgisiyle ayrılmalıdır.
