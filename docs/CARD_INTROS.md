# Kart girişleri

Aktif havuz: Four Corners, Deck Burst, Orbit, Cascade, Cross Shuffle ve Magnet Snap.
`src/animations/cardIntros.ts` yalnız ekran ölçüleri, kart indeksi ve hedef hücreyi alır;
cevap grupları veya zorluk bilgisi animasyon seçimine/hareketine girmez.

Yayın gününün UTC sıra numarası altı giriş arasında döner. Aynı gün her cihazda aynı
girişi seçer; ardışık günler tekrarlamaz. Gün anahtarı yoksa bulmaca kimliğinin sabit
hash'i kullanılır. Animasyon süresi, kart gecikmeleri dahil en fazla 2.84 saniyedir.
Kartlar tam ekran sahneden canlı tahtadaki kendi hücrelerine geçer.

`CardShuffleIntro` ortak atlama, azaltılmış hareket, yeniden boyutlandırma ve unmount
temizliğini yönetir. Azaltılmış harekette oyun hemen açılır. Devam edilen kayıt tekrar
giriş oynatmaz. Eski deniz/araba sahneleri korunur, bu havuzda aktif değildir.

## Kontrol

- `npm run check`: seçim, süre, geometri, zorluk/oyun regresyonları ve üretim derlemesi.
- Temiz tarayıcı oturumunda `/play?day=2026-09-20` ile `2026-09-25` arası altı gün
  havuzun tamamını gösterir. Karşılama ekranından bir mod seçip oyunu başlat.
- Masaüstü ve mobilde doğal bitişi, Oyuna geç düğmesini, kart sırasını ve geçiş sonrası
  kart seçimini kontrol et. `prefers-reduced-motion: reduce` ile doğrudan tahtaya geç.

Temalı sahneler (#116–#129) ayrı işlerdir; bu değişiklik #115'in kart havuzunu sağlar.
