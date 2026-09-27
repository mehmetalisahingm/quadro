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

## Veritabanı

İlk migration:

`supabase/migrations/202609270001_q43_foundation.sql`

Oluşturduğu ana nesneler:

- `profiles` — Supabase Auth kullanıcısının uygulama profili.
- `visitors` — login gerektirmeyen anonim cihaz/ziyaretçi kimliği.
- `analytics_events` — merkezi ürün olayları.
- `game_results` — login olmuş kullanıcıların oyun sonuçları.
- `record_analytics_event(...)` — visitor upsert + analytics insert işlemini atomik yapan server-only RPC.

## RLS / güvenlik

- `visitors` ve `analytics_events` browser'dan doğrudan okunamaz/yazılamaz.
- Bu iki tabloya yalnız server-side secret key ile çalışan `/api/analytics` yazar.
- `profiles` yalnız authenticated kullanıcının kendi kaydını okumasına/güncellemesine izin verir.
- `game_results` yalnız authenticated kullanıcının kendi sonuçlarını okumasına/yazmasına izin verir.
- Secret key RLS'i bypass ettiği için yalnız server ortamında tutulur.

## Analytics akışı

1. Mevcut local analytics event'i üretilir.
2. Event localStorage'da tutulmaya devam eder.
3. Browser `quadro:visitor:v1` anahtarında UUID visitor kimliği oluşturur.
4. Event `POST /api/analytics` ile aynı origin'e gönderilir.
5. Next.js server route secret key ile Supabase RPC çağrısı yapar.
6. DB visitor'ın `last_seen_at` değerini günceller ve event'i kaydeder.

Merkezi analytics erişilemezse oyun akışı hata vermez.

## Toplanmayan veriler

Q43 temel analytics katmanı bilerek şunları toplamaz:

- isim/e-posta (login analytics tablosunda),
- IP adresini uygulama DB'sine kopyalama,
- cevap kelimeleri,
- seçilen kelimelerin ham listesi,
- cihaz fingerprint'i.

Auth kullanıcısının e-postası Supabase Auth içinde kalır; `analytics_events` içine kopyalanmaz.

## Auth — sonraki adım

Auth katmanı için Next.js SSR cookie akışı kullanılacak. Sağ üstte `Giriş Yap` bağlantısı bulunacak; oyun login olmadan tam çalışacak.

İlk sağlayıcılar:

1. Google OAuth
2. E-posta magic-link / OTP

Login olduğunda cihazdaki mevcut local oyun geçmişi kullanıcı hesabına bir kez merge edilecek; aynı `puzzle_id + revision` ikinci kez yazılmayacak.

## Vercel

Production'a çıkmadan önce Vercel projesine üç Supabase değişkeni ve `NEXT_PUBLIC_SITE_URL` eklenir. Preview ve production farklı Supabase projeleri kullanabiliyorsa tercih edilir; tek proje kullanılacaksa preview test verileri analytics raporlarında ortam bilgisiyle ayrılmalıdır.
