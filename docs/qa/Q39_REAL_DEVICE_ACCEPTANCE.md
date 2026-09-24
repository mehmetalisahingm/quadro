# Q39 — Gerçek cihaz ve son görsel yayın kabulü

Bu belge Q39 için gerçek cihaz test matrisi ve yayın kabul kaydıdır. Q35 ve Q38 tamamlanmadan final kabul verilmez.

## Önkoşullar

- Q32 mobil/klavye/erişilebilirlik kabulü tamamlandı.
- Q35 pilot tamamlandı ve kritik bulgular kapatıldı.
- Q37 metadata/favicon/önizleme kabulü tamamlandı.
- Q38 30 onaylı bulmacanın yayın takvimini tamamladı.
- Test edilen URL, yayın adayı commit'e ait preview/production URL'dir.

## Test ortamları

Aşağıdaki minimum matris gerçek cihaz/tarayıcı üzerinde doldurulur.

| Ortam | Gerçek cihaz | Tarayıcı/sürüm | Ekran | Sonuç | Kanıt |
| --- | --- | --- | --- | --- | --- |
| iPhone | Evet | Safari | telefon | Bekliyor | — |
| Android telefon | Evet | Chrome | telefon | Bekliyor | — |
| Windows masaüstü | Evet | Chrome | masaüstü | Bekliyor | — |
| Windows masaüstü | Evet | Edge | masaüstü | Bekliyor | — |

Safari/iOS için otomatik WebKit testi gerçek cihaz kanıtının yerine geçmez; yalnız ek regresyon kanıtıdır.

## Zorunlu akışlar

Her desteklenen ortamda mümkün olduğunca aşağıdakiler kontrol edilir:

| Akış | iPhone Safari | Android Chrome | Desktop Chrome | Desktop Edge |
| --- | --- | --- | --- | --- |
| İlk giriş ve ana CTA | ☐ | ☐ | ☐ | ☐ |
| Öğretici | ☐ | ☐ | ☐ | ☐ |
| Günlük oyunu başlatma | ☐ | ☐ | ☐ | ☐ |
| Kart seçme / seçimi kaldırma | ☐ | ☐ | ☐ | ☐ |
| Karıştır | ☐ | ☐ | ☐ | ☐ |
| Yanlış tahmin / hak göstergesi | ☐ | ☐ | ☐ | ☐ |
| Doğru grup birleşimi | ☐ | ☐ | ☐ | ☐ |
| Sayfa yenileme sonrası devam | ☐ | ☐ | ☐ | ☐ |
| Kazanma sonucu | ☐ | ☐ | ☐ | ☐ |
| Kaybetme sonucu | ☐ | ☐ | ☐ | ☐ |
| Paylaş/kopyala alternatifi | ☐ | ☐ | ☐ | ☐ |
| İstatistik/seri görünümü | ☐ | ☐ | ☐ | ☐ |

## Görsel ve erişilebilirlik kabulü

### 320 px / dar ekran

- Yatay scroll yok.
- 16 kart okunabilir ve üst üste binmiyor.
- Uzun kelime kart sınırını taşırmıyor.
- Birincil eylemler görünür ve dokunulabilir.
- Sonuç/paylaşım ekranı dar ekranda kırılmıyor.

### Dokunma hedefleri

- Ana eylemler ve ayarlar en az yaklaşık 44×44 CSS px dokunma alanına sahip.
- Kart seçimi yanlış elemana tetiklenmiyor.
- Hızlı çift dokunma istenmeyen zoom/çift işlem üretmiyor.

### Klavye

Masaüstünde:

- Tab sırası mantıklı.
- Kartlar klavyeyle seçilebilir.
- Odak görünür.
- Ana eylemler Enter/Space ile çalışır.

### Azaltılmış hareket

İşletim sistemi/tarayıcı `prefers-reduced-motion: reduce` ile:

- Animasyonlar zorunlu bilgi taşımaz.
- Grup çözümü/final durumu anlaşılır kalır.
- Rahatsız edici uzun hareket yoktur.

## Pilot düzeltmeleri yeniden test

Q35'te P0/P1/P2 olarak açılan her görsel/akış bulgusu aşağıda tekrar test edilir.

| Issue | Önceki bulgu | Düzeltme commit/PR | Ortam | Tekrar test | Sonuç |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

## Ekran görüntüsü kanıtları

Final PR'da en az:

- iPhone Safari ana sayfa
- iPhone Safari oyun tahtası
- iPhone Safari sonuç
- 320 px dar ekran
- masaüstü Chrome oyun
- azaltılmış hareket açıkken ilgili durum

kanıtları `docs/qa/q39/` altında veya PR eklerinde belirtilir.

## Açık sorunlar

| Önem | Ortam | Sorun | Issue | Yayın engeli mi? |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Final kabul

- Test edilen commit: —
- Preview/production URL: —
- Test tarihleri: —
- Açık kritik görsel/erişilebilirlik sorunu: —
- Mehmet görsel kabulü: `BEKLİYOR`

## Q39 kapanış koşulu

Q39 yalnız gerçek cihaz matrisi doldurulduğunda, pilot düzeltmeleri tekrar test edildiğinde ve açık kritik görsel/erişilebilirlik problemi kalmadığında kapatılır. Bu şablon tek başına kabul değildir.