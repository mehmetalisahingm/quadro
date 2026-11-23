# Play Quadro — Organik büyüme planı (10 Kasım 2026)

## Amaç ve sınırlar

**30 günlük deney hedefi:** En az 1.000 gerçek ziyaret, en az 200 ilk oyun başlangıcı; kaynak bazında paylaşım ve D1 geri dönüşünü ölç. Bunlar gerçekleşmiş metrikler **değil**, test hedefleridir. Başlangıç ölçümü erişilebilir değil: Vercel Web Analytics bu proje için 404 döndürüyor; uygulamanın kendi analitik uç noktasının Supabase yapılandırması ayrıca doğrulanmalı.

**Bütçe:** 0 TL reklam; satın alınmış trafik, bot, sahte yorum, toplu DM ve izinsiz e-posta yok.

**Oyun kalitesi yayına çıkış kapısı:** GitHub #175 (Keşif Yolu'nda tekrar), #176 (günlük dörtlü çakışmaları) çözülmeden agresif tanıtım yapılmaz. Önce küçük, dürüst bir beta kitle.

## Teknik kazanım halkası

1. Oyuncu dört grubu çözer.
2. Sonuç kartı spoiler içermeyen renkli kareleri ve **tıklanabilir Quadro bağlantısını** paylaşır.
3. Yeni oyuncu ücretsiz, giriş yapmadan oynayabilir.
4. Paylaşım bağlantısı `utm_source=player_share&utm_medium=referral&utm_campaign=result_card` taşır.
5. İlk günlük `retention_visit` olayı kısa, anonim UTM etiketleriyle kaynak ölçümü yapabilir (yalnız merkezi analytics gerçekten yapılandırılmışsa).

## Kanal linkleri

- Instagram Reels: https://playquadro.com.tr/?utm_source=instagram&utm_medium=social&utm_campaign=launch_nov2026
- TikTok: https://playquadro.com.tr/?utm_source=tiktok&utm_medium=social&utm_campaign=launch_nov2026
- YouTube Shorts: https://playquadro.com.tr/?utm_source=youtube&utm_medium=social&utm_campaign=launch_nov2026
- LinkedIn: https://playquadro.com.tr/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_nov2026
- Reddit / organik topluluk: https://playquadro.com.tr/?utm_source=reddit&utm_medium=community&utm_campaign=launch_nov2026
- Öğrenci toplulukları: https://playquadro.com.tr/?utm_source=campus&utm_medium=community&utm_campaign=launch_nov2026

## İlk 14 gün yürütme

| Gün | İş | Kontrol |
| --- | --- | --- |
| 1 | PR #189 testten geçir / yayınla; kopyalanan sonuçla gerçek mobil tarayıcı testi | Link açılıyor, cevap sızmıyor |
| 1 | Google Search Console URL denetimi ve `sitemap.xml` gönderimi | Sayfa indeks durumu kayda alındı |
| 2 | Gerçek oyun ekranıyla 15–20 sn video (dört kelimelik sorun, cevap spoiler'sız) | Paylaşım bağlantısıyla oyun açılıyor |
| 3 | LinkedIn kurucu hikâyesi; Türkçe ve İngilizce (gerekirse ayrı) | Kaynak etiketli bağlantı |
| 4–5 | Reddit r/TurkDev veya uygun yerel toplulukta kurallara uygun samimi geri bildirim isteği | Mod onayı gerekiyorsa onay alınmış |
| 6 | Reels/TikTok/Shorts için ikinci gerçek çözüm videosu | İlk üç saniyede bulmaca |
| 7 | Kaynak bazında ziyaret/oyuna başlama/paylaşım/D1 analizi | En iyi kanal seçimi |
| 8–10 | Okul/öğrenci topluluklarında gönüllü beta daveti | Onaylı kanaldan, spam yok |
| 11 | Farklı görsel formatla üçüncü video | İki format karşılaştırması |
| 12–14 | Uygun bağımsız günlük oyun kurucularına karşılıklı tanıtım önerisi; gerçek ilgi varsa | Onaylı iş birliği, manipülasyon yok |

## Hazır tanıtım metinleri

**Kısa video ilk 3 saniye:** “Bu dört kelimenin ortak bağını 10 saniyede bulabilecek misin?” Sonraki görüntü, gerçek Quadro oynanışı; kapanış “16 kelime · 4 gizli bağ · 4 hata hakkı · Ücretsiz oyna.” Cevapları gösterme, uydurma oyun videosu kullanma.

**Reddit topluluk geri bildirimi (izinli başlık):**
“Merhaba! Bir arkadaşım ile Quadro adında Türkçe, tarayıcıdan oynanabilen günlük bir bağlantı bulmacası yaptık. 16 kelimeyi dörderli dört gruba ayırıyorsunuz. Ücretsiz, indirme gerekmiyor. Henüz ilk sürümlerdeyiz; özellikle ilk dakikadaki anlaşılabilirlik ve mobil deneyim hakkında gerçek eleştiri arıyoruz. Denemek isterseniz: [link]. Sizce kurallar ilk bakışta anlaşılır mı?”  (Her topluluğun kendi kurallarını kontrol et; r/Turkey ön mod onayı isteyebilir.)

**LinkedIn:** “Utku ile üzerinde çalıştığımız Quadro artık tarayıcıda oynanabiliyor. 16 kelime, dört gizli bağ, dört hata hakkı. Kısa bir günlük bulmaca olarak başladık; şimdi oynanışı, içerik kalitesini ve mobil deneyimi gerçek geri bildirimlerle iyileştiriyoruz. Ücretsiz deneyip en çok nerede zorlandığınızı yazarsanız seviniriz: [link].”

**Öğrenci topluluğuna izinli davet:** “Kısa bir günlük kelime gruplama oyunu geliştiriyoruz. 3 dakikada deneyip ‘zor muydu/kolay mıydı?’ geri bildirim vermek isteyenler için ücretsiz link: [link].”

## Ölçüm ve kararlar

- Kaynak: her postta farklı UTM, kişiye özel tanımlayıcı yok.
- Funnel: `retention_visit` (kaynak), `home_view`, `game_start`, `game_finish`, `share_attempt`, D1/D7.
- Haftalık karar: ilk ziyaret başına oyun başlangıcı ve oyun başına paylaşım incelenir. 200 ziyaret altında kesin genelleme yapma.
- SEO: Search Console'da **gerçek** gösterim, tıklama, dizin, ortalama konum takip; `site:` sorgusunu tek kanıt sayma.
- Kısıt: Meta/TikTok/Reddit/LinkedIn hesaplarına erişim olmadan otomatik paylaşım yapılmaz; kullanıcı veya yetkili sosyal hesap üzerinden yayınlanır.
