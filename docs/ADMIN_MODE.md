# Admin modu

Admin yetkisi normal kullanıcı hesabına verilir; ayrı bir sabit şifre veya e-posta kod içine gömülmez.

- Yetkili kullanıcılar `private.admin_users` tablosunda tutulur.
- Tarayıcı yalnız `public.current_user_is_admin()` RPC'si ile kendi oturumunun admin olup olmadığını sorabilir.
- `private` şemasına `anon` ve `authenticated` rollerinin doğrudan erişimi yoktur.
- İlk admin, tek kullanımlık kodla `/admin` sayfasından `public.claim_admin()` çağrısı yaparak yetki alır.
- Kod tüketildikten sonra tekrar kullanılamaz.
- Admin modunda yanlış ve "bir kaldı" tahminleri geçmişe yazılır ancak hata hakkını azaltmaz ve oyunu `lost` durumuna götürmez.
- Normal kullanıcıların 4 hata hakkı davranışı değişmez.
