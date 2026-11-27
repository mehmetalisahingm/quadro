# Quadro — 11 Kasım 2026 yayın takvimi (Q38 / Q41)

**Karar:** Mehmet · 5 Kasım 2026. **Hedef resmî başlangıç:** 11 Kasım 2026 Çarşamba, Türkiye (Europe/Istanbul) 00.00. **Mehmet + Utku son sürüm/yayın onayları:** BEKLİYOR. Bu tarih hedefidir, GO kararı değildir.

## İlkeler

- 48 mevcut günlük bulmaca **52 gün ileri taşındı**. Kalıcı `q-001`…`q-048` kimlikleri ve çözüm grupları korunur. İlgili JSON, blind board ve var olan editoryal MD dosyalarının dosya/tarih eşleşmeleri birlikte taşınır.
- **Hepsi `draft` durumundadır.** Takvim hazırlamak editoryal kabul veya yayına alma değildir. İnsan kontrolünden geçmeden `published` yapılmaz. İlk 30 onaylı bulmaca ve ileri 14 onaylı gün hedefleri devam eder.
- **İlk 30 gün:** 11 Kasım–10 Aralık. **Tüm 48 aday:** 11 Kasım–28 Aralık. **İlk 14 ileri gün:** 11–24 Kasım; 0/14 onaylı. Gün Türkiye saatinde 00.00'da değişir.
- `/journey` ilk açılıştaki ~7 MB görsel yükü mevcut haliyle kalır. P0/P1 düzeyinde mobil hata doğarsa erteleme yeniden değerlendirilir; performans izleme görevi kapatılmaz.
- Mevcut `main` → Vercel production otomatik dağıtımı korunur. **Deploy ile resmî 11 Kasım yayın kabulü farklıdır.** Bu PR, CI, içerik onayları, pilot ve iki ayrı GO imzası olmadan birleştirilmez.
- 20 Aralık'ta rezerv havuzunun yeniden dönmesi bekleniyor. O tarihe kadar onaylı yeni içerik gerçekten `published` olmalı; bu sadece bir takvimle garanti edilmez.

## 48 günlük aday takvimi

| Gün | Yeni Türkiye tarihi | Puzzle ID | Eski tarih | Durum |
| ---: | --- | --- | --- | --- |
| 1 | 2026-11-11 | `q-001` | 2026-09-20 | TASLAK / yayın onayı bekliyor |
| 2 | 2026-11-12 | `q-002` | 2026-09-21 | TASLAK / yayın onayı bekliyor |
| 3 | 2026-11-13 | `q-003` | 2026-09-22 | TASLAK / yayın onayı bekliyor |
| 4 | 2026-11-14 | `q-004` | 2026-09-23 | TASLAK / yayın onayı bekliyor |
| 5 | 2026-11-15 | `q-005` | 2026-09-24 | TASLAK / yayın onayı bekliyor |
| 6 | 2026-11-16 | `q-006` | 2026-09-25 | TASLAK / yayın onayı bekliyor |
| 7 | 2026-11-17 | `q-007` | 2026-09-26 | TASLAK / yayın onayı bekliyor |
| 8 | 2026-11-18 | `q-008` | 2026-09-27 | TASLAK / yayın onayı bekliyor |
| 9 | 2026-11-19 | `q-009` | 2026-09-28 | TASLAK / yayın onayı bekliyor |
| 10 | 2026-11-20 | `q-010` | 2026-09-29 | TASLAK / yayın onayı bekliyor |
| 11 | 2026-11-21 | `q-011` | 2026-09-30 | TASLAK / yayın onayı bekliyor |
| 12 | 2026-11-22 | `q-012` | 2026-10-01 | TASLAK / yayın onayı bekliyor |
| 13 | 2026-11-23 | `q-013` | 2026-10-02 | TASLAK / yayın onayı bekliyor |
| 14 | 2026-11-24 | `q-014` | 2026-10-03 | TASLAK / yayın onayı bekliyor |
| 15 | 2026-11-25 | `q-015` | 2026-10-04 | TASLAK / yayın onayı bekliyor |
| 16 | 2026-11-26 | `q-016` | 2026-10-05 | TASLAK / yayın onayı bekliyor |
| 17 | 2026-11-27 | `q-017` | 2026-10-06 | TASLAK / yayın onayı bekliyor |
| 18 | 2026-11-28 | `q-018` | 2026-10-07 | TASLAK / yayın onayı bekliyor |
| 19 | 2026-11-29 | `q-019` | 2026-10-08 | TASLAK / yayın onayı bekliyor |
| 20 | 2026-11-30 | `q-020` | 2026-10-09 | TASLAK / yayın onayı bekliyor |
| 21 | 2026-12-01 | `q-021` | 2026-10-10 | TASLAK / yayın onayı bekliyor |
| 22 | 2026-12-02 | `q-022` | 2026-10-11 | TASLAK / yayın onayı bekliyor |
| 23 | 2026-12-03 | `q-023` | 2026-10-12 | TASLAK / yayın onayı bekliyor |
| 24 | 2026-12-04 | `q-024` | 2026-10-13 | TASLAK / yayın onayı bekliyor |
| 25 | 2026-12-05 | `q-025` | 2026-10-14 | TASLAK / yayın onayı bekliyor |
| 26 | 2026-12-06 | `q-026` | 2026-10-15 | TASLAK / yayın onayı bekliyor |
| 27 | 2026-12-07 | `q-027` | 2026-10-16 | TASLAK / yayın onayı bekliyor |
| 28 | 2026-12-08 | `q-028` | 2026-10-17 | TASLAK / yayın onayı bekliyor |
| 29 | 2026-12-09 | `q-029` | 2026-10-18 | TASLAK / yayın onayı bekliyor |
| 30 | 2026-12-10 | `q-030` | 2026-10-19 | TASLAK / yayın onayı bekliyor |
| 31 | 2026-12-11 | `q-031` | 2026-10-20 | TASLAK / yayın onayı bekliyor |
| 32 | 2026-12-12 | `q-032` | 2026-10-21 | TASLAK / yayın onayı bekliyor |
| 33 | 2026-12-13 | `q-033` | 2026-10-22 | TASLAK / yayın onayı bekliyor |
| 34 | 2026-12-14 | `q-034` | 2026-10-23 | TASLAK / yayın onayı bekliyor |
| 35 | 2026-12-15 | `q-035` | 2026-10-24 | TASLAK / yayın onayı bekliyor |
| 36 | 2026-12-16 | `q-036` | 2026-10-25 | TASLAK / yayın onayı bekliyor |
| 37 | 2026-12-17 | `q-037` | 2026-10-26 | TASLAK / yayın onayı bekliyor |
| 38 | 2026-12-18 | `q-038` | 2026-10-27 | TASLAK / yayın onayı bekliyor |
| 39 | 2026-12-19 | `q-039` | 2026-10-28 | TASLAK / yayın onayı bekliyor |
| 40 | 2026-12-20 | `q-040` | 2026-10-29 | TASLAK / yayın onayı bekliyor |
| 41 | 2026-12-21 | `q-041` | 2026-10-30 | TASLAK / yayın onayı bekliyor |
| 42 | 2026-12-22 | `q-042` | 2026-10-31 | TASLAK / yayın onayı bekliyor |
| 43 | 2026-12-23 | `q-043` | 2026-11-01 | TASLAK / yayın onayı bekliyor |
| 44 | 2026-12-24 | `q-044` | 2026-11-02 | TASLAK / yayın onayı bekliyor |
| 45 | 2026-12-25 | `q-045` | 2026-11-03 | TASLAK / yayın onayı bekliyor |
| 46 | 2026-12-26 | `q-046` | 2026-11-04 | TASLAK / yayın onayı bekliyor |
| 47 | 2026-12-27 | `q-047` | 2026-11-05 | TASLAK / yayın onayı bekliyor |
| 48 | 2026-12-28 | `q-048` | 2026-11-06 | TASLAK / yayın onayı bekliyor |

## Yayın hazırlık ve ilk hafta takvimi

| Tarih | Sorumlu | İş / kabul şartı |
| --- | --- | --- |
| 5–6 Kasım | Mehmet + Utku | 52 günlük tarih taşıma ve 48 benzersiz aday doğrulaması; blind-board/date/ID testleri; PR incelemesi ve CI |
| 6–8 Kasım | Mehmet + Utku | İlk 30 adayın içerik değerlendirmesi; 11–24 Kasım için en az 14 günlük onaylı ileri stok; yayına alınacakların `published` durumu yalnız gerçek onay sonrası |
| 8–9 Kasım | Mehmet + Utku | 20–30 kişilik pilot, gerçek iPhone Safari/Android/masaüstü kontrolleri; Q35/Q39, açık P0/P1 kalmaması |
| 9–10 Kasım | Utku + Mehmet | Canlı smoke, env/production kontrolü, iki kişinin ön onayı ile düşük trafikte rollback tatbikatı |
| 10 Kasım | Mehmet + Utku | Son release commit SHA + URL + pilot + stok + cihaz + rollback kanıtlarıyla iki ayrı açık GO/NO-GO imzası (#41) |
| 11 Kasım 00.00 TR | Utku | Hedef resmî başlangıç; gerçek yayımlanmış günlük bulmaca, sağlık endpointi, hata kaydı |
| 11–17 Kasım | Utku + Mehmet | Günlük stok, görüntüleme/başlama/bitiş, teknik/ürün hatası ve kullanıcı geri dönüş kayıtları (#42) |
| 18 Kasım ve sonrası | Utku + Mehmet | D1/D7 analizi, gerçek kullanıcı veri süresi uygunsa; uydurulmuş sonuç yok |

## Bağımlılıklar ve engel listesi

- **#38 / #159:** Tarih/kimlik matrisi değiştiği için stok raporu yeni dal üzerinde yeniden üretilecek. Yapısal validasyon, kör içerik/review ve en az 14 ileri gün şartı ayrı kontrol edilir.
- **#33 / #158:** Keşif Yolu görsel optimizasyonu ertelendi; ölçüm ve gerçek cihaz gözlemi açık.
- **#36 / #162:** Gerçek iPhone Safari regresyonu açık, otomatik WebKit yeterli sayılmaz.
- **#40 / #160:** Üretim smoke ve rollback tatbikatı yapılmadan kapanmaz.
- **#41:** Sürüm bazlı Mehmet+Utku iki ayrı imzalı son onay yoksa GO değildir.
- **#42 / #161:** İlk hafta metriklerini yalnız üretimden gelen gerçek verilerle doldur.
