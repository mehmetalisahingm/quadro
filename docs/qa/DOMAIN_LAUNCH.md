# Alan adı yayını

Hedef: `playquadro.com.tr`. Kullanıcı henüz satın almadı; sahiplik veya DNS tamamlanmış değildir.
Mevcut proje: Quadro, production `quadro-teal.vercel.app`. Aynı Vercel ve Supabase
projeleri kullanılır; oyuncu hesapları yeni veritabanına taşınmaz.

Satın alma sonrasında:

1. Alan adını aynı Vercel projesine ekle. Vercel'in o anda verdiği DNS/sahiplik
   kayıtlarını uygula; sabit IP tahmin etme. HTTPS ve domain doğrulaması tamamlanmalı.
2. Apex veya www için tek canonical adres seç. Diğerini canonical'a yönlendir.
3. Production `NEXT_PUBLIC_SITE_URL` değerini canonical HTTPS origin yap ve yeniden deploy et.
4. Supabase Authentication Site URL değerini canonical origin olarak güncelle.
   Redirect allowlist'e tam `https://playquadro.com.tr/auth/callback` adresini ekle.
   www canonical seçilirse tam www adresini kullan. Geçişte eski production callback'i koru;
   genel wildcard veya kullanıcının kontrol etmediği domain ekleme.
5. `Live release acceptance` workflow'unu canonical URL ile çalıştır. Bu işlem günlük
   oyunu, giriş yapılandırmasını, anonim admin erişim reddini ve analitik API hata davranışını
   gerçek internet üzerinden kontrol eder; e-posta göndermez ve oyuncu sonucu oluşturmaz.
6. Gerçek kullanıcı giriş bağlantısını kendi e-posta hesabında açıp yönlendirmeyi doğrulamalı.
   Yeni origin'in localStorage'ı eskisinden farklıdır: eski cihaz kayıtları otomatik taşınmış
   sayılmaz. Eski adresi hemen kapatma; mevcut hesaplar aynı Supabase projesinde kalır.
7. Fiziksel iPhone/Android kabulü ve bağımsız bulmaca değerlendirmesi ayrıca kaydedilir.

Geri dönüş: önceki READY production deployment'ını platformdan geri al; Site URL ve
allowlist'i çalışan origin ile eşleştir. Domaini başka projeye veya başka veritabanına taşıma.
