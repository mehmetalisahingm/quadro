# Q43 — Supabase hardening kabul notu

Bu kayıt production Supabase projesi oluşturulmadan önce repo tarafında kapatılan güvenlik ve ürün kalite kontrollerini özetler.

## Kapatılan riskler

- Exposed `public` şemada `SECURITY DEFINER` analytics fonksiyonu bırakılmadı.
- Auth user trigger helper'ı `private` şemaya taşındı.
- Analytics RPC `SECURITY INVOKER`; yalnız `service_role` çalıştırabilir.
- `visitors` ve `analytics_events` browser rollerine kapalıdır.
- Remote event için `client_event_id` zorunlu ve `(visitor_id, client_event_id)` benzersizdir.
- Merkezi `occurred_at` zamanı tarayıcıdan değil Postgres'ten gelir.
- Analytics endpoint event adı, event kimliği, visitor UUID'si ve payload boyutunu doğrular.
- Supabase ayarlı değilken analytics endpoint 204 döner ve oyun akışını engellemez.
- Mobil hesap aksiyonları 44 px touch target kullanır; çıkış mobilde erişilebilir kalır.

## Gerçek proje oluşturulduğunda zorunlu doğrulamalar

- Migration başarıyla uygulanmalı.
- Supabase security advisor kritik bulgu vermemeli.
- Supabase performance advisor gözden geçirilmeli.
- Aynı `client_event_id` iki kez gönderildiğinde yalnız tek event satırı bulunmalı.
- Guest kullanıcı login olmadan oyunu baştan sona oynayabilmeli.
- Google OAuth ve e-posta magic-link gerçek redirect URL ile denenmeli.
- Login kullanıcısı yalnız kendi `profiles` / `game_results` satırlarına erişebilmeli.

Bu maddeler gerçek proje üzerinde doğrulanmadan Q43 tamamen kapanmış sayılmaz.

## 12 Ekim 2026 — Remote analytics input hardening

- API artık yalnız tanımlanmış analytics olaylarının **tam ve doğru alan kümesini** kabul eder. İstenmeyen `wordIds`, e-posta, cevap veya diğer özel alanlar 400 ile reddedilir; sunucu secret'ı browser'a gitmez.
- Eksik `content-length` durumunda bile 8 KiB üzerindeki JSON body akışta reddedilir. Null JSON da 400 döndürür.
- Network RPC koparsa kontrollü 502 döner; uygulamada ölçüm çağrıları oyun akışını durdurmaz.
- Tarayıcıda bozulmuş `visitor_id` yerine UUID v4 yeniden üretilir.
- Bu çalışma canlı production ortamında OAuth/magic link veya 20 kişilik pilot onayı **değildir**. Değişiklikler PR CI ve gerçek ortam smoke ile ayrıca doğrulanmalıdır.
