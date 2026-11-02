# Günlük yayın sürekliliği

Ana sayfanın günlük başla/devam/sonuç düğmeleri `/play?mode=daily` kullanır.
`/play` dört zorluk parkurunun seçimidir. Önceki günlük oyun tarih bağlantısı ile açılır.

1. İstanbul yayın günündeki geçerli `published` günlük dosya önceliklidir.
2. Dosya yoksa, taslaksa veya bozuksa `daily-reserve.json` sabit listesinden seçim yapılır.
3. Seçki bölüm arşivinden geldiğini oyuncuya bildirir. Taslak içerik yayınlanmış sayılmaz.
4. Mevcut havuz 48 farklı tahtadır; 48 gün sonra içerik tekrar eder. Sonsuz yeni içerik üretilmez.
5. Günlük seçim kimliği tarihe özeldir; parkur kaydıyla çakışmaz. Normal dosya eklemek
   reserve listesinin sırasını değiştirmez. Aktif günün içeriği sonradan değiştirilmemelidir.
6. Seçilen reserve dosyası bozuksa sıradaki geçerli yayımlanmış kaynağa geçilir.
7. `GET /api/health` cevap veya kelime göstermeden günlük erişimi ve ileri 14 günlük
   yayımlanmış dosya sayısını raporlar; yanıt önbelleğe alınmaz.
8. GitHub `Daily publication health` her Türkiye gece yarısından 10 dakika sonra çalışır.
   Oyun açılamazsa veya tarih eskiyse başarısız olur. Onaylı stok 14 günün altındaysa
   iş özeti ve uyarı üretir. Bildirim tercihi GitHub hesabının workflow ayarına bağlıdır.
9. Yönetim panelinde günlük seçim kaynağı ve 14 günlük stok uyarısı gösterilir.
   Gelecek tarihli oyunlar açılmaz; önceden yayımlanmış stok cevapları tarihten önce sunulmaz.

## Sürdürülmesi gereken işler

- Şu anda günlük dosyalar taslak durumundadır. Bağımsız insan çözümü yapılmadan
  editoryal onay tamamlanmış sayılmaz. Yeni günlük içerik için düzenli editör gerekir.
- Sağlık kontrolü bir kullanılabilirlik kontrolüdür; giriş yapan gerçek kişinin
  e-postasındaki bağlantının teslimini veya fiziksel iPhone/Android kabulünü kanıtlamaz.
- Kalıcı arka planlar ve dört parkur korunur. Mobil motor testleri fiziksel cihaz kanıtı değildir.
