# Özel mod enerjisi ve skor (#172)

Risk, Çarpan Merdiveni ve Bomba Kart için oynama hakkı ve skor kuralları. Kaynak: `src/features/game/specialEnergy.ts`. Gerçek para, ücretli puan veya satın alma yoktur.

## Enerji

| Kural | Değer |
| --- | --- |
| Başlangıç ve üst sınır | 30 |
| Yeni oyun için gereken | 20 |
| Yeni oyunda harcanan | 10 |
| Yenilenme | Her 60 saniyede +1, tek tek |
| Doluyken | Zaman birikmez; harcama anında sayaç yeniden başlar |

Örnek: 17 enerji → 1 dk sonra 18 → 2 dk sonra 19 → 3 dk sonra 20. 20'de oyun başlar ve 10 kalır.

Ekranda enerji (x / 30), sonraki +1'e kalan süre, yeni oyuna kalan süre ve düğmenin durumu görünür.

## Skor ve ödül

Yalnız **kazanılan** oyun skor alır. Geçerli yanlış tahmin `wrong` ve `one-away` sonuçlarıdır; yinelenen veya geçersiz gönderim sayılmaz.

| Yanlış tahmin | Sonuç | Skor | Enerji ödülü |
| ---: | --- | ---: | ---: |
| 0 | Kazandı | 400 | +4 |
| 1 | Kazandı | 300 | +2 |
| 2 | Kazandı | 200 | +2 |
| 3 | Kazandı | 100 | 0 |
| 4 | Kaybetti | 0 | 0 |
| — | Yarım kaldı | 0 | 0 |

Ödül: `2 × floor(skor / 200)`, 30 üst sınırına tabidir. Mod bonusları (Risk bakiyesi, Merdiven kasası, Bomba bonusu) ayrı gösterilir ve **enerji vermez**.

Eski "üç oyunda 1.500 puan, 30 enerjiye tam dolum" kuralı kaldırıldı.

## Bir kez ücretlendirme ve bir kez ödül

- Başlatma: tahta sunucudan gelmeden enerji düşmez; tahta gelince en güncel kayıt yeniden okunup harcanır. Çift tıklama ve iki sekme aynı anda yalnız bir oyun açar.
- Yenileme veya geri dönme yarım oyunu açar, yeniden ücretlendirmez.
- Ödül yalnız etkin oyunun kimliğiyle verilir; ikinci bitiş, yenileme veya başka sekme ikinci ödül üretmez.

## Kayıt ve göç

Durum `localStorage` içindeki `quadro:special-energy:v2` anahtarındadır. Eski `v1` kaydı ilk okumada taşınır: enerji, oyun sırası ve yarım kalan oyun korunur; kaldırılan hedefin sonuçları düşer, eski anahtar silinir. Eski kayıttaki "enerji 10'un katı olmalı" denetimi yeni kayıtta yok; 17, 18, 19 sıfırlanmaz.

## Bilinen sınırlar ve kötüye kullanım riski

| Risk | Durum |
| --- | --- |
| Çoklu cihaz ve hesap | Enerji tarayıcıya özeldir; cihazlar ve hesaplar arasında eşitlenmez. |
| Site verisini silme veya gizli sekme | Enerji 30'a döner. Ödül gerçek para olmadığı için kabul edildi; sunucu tarafı enerji gerekirse ayrı iş. |
| Cihaz saatini ileri alma | En fazla 30'a kadar doldurur, üstüne çıkamaz. |
| Cihaz saatini geri alma | Enerji artmaz ve sayaç başlangıcı ileri kaymaz; saat düzelince sayım kaldığı yerden sürer. |
| Kayıt dosyasını elle düzenleme | Sınır dışı değerler başlangıç durumuna döner. Tarayıcıda tutulan değer güvenilir sayılmaz. |
