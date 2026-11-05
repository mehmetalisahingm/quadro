# Q38 — Yayın stoğu durumu

Ölçüm: 5 Kasım 2026, commit `af6a5f0`. Yenilemek için: `npm run release:stock -- --start <gün> --as-of <bugün>`.

**Sonuç: Q38 kapanamaz. Onaylı gün sayısı 0/30, ileri stok 0/14.** Aşağıdaki ilk tablo taşımadan önceki durumdur.

| Ölçüm | Değer |
| --- | --- |
| `src/content/puzzles` toplam dosya | 48 (`q-001`…`q-048`) |
| `published` | 0 |
| `draft` | 48 |
| Tarihi geçmiş onaysız aday | 46 |
| Bugün ve sonrası için aday | 2 (`q-047` 5 Kasım, `q-048` 6 Kasım) |
| 7 Kasım'dan sonraki günlük dosya | Yok |

## Oyuncu şu an ne görüyor

Geçerli `published` dosya olmadığı için günlük oyun `daily-reserve.json` havuzundan seçiliyor ([süreklilik kaydı](DAILY_CONTINUITY_RELEASE.md)). Oyun kesilmiyor. Sınırlar:

- Havuzdaki 48 tahta aynı zamanda herkese açık zorluk modlarındaki tahtalardır.
- Havuzun başlangıcı 2 Kasım; **20 Aralık 2026'dan itibaren içerik tekrar eder.**
- `q-` bulmacalarının hiçbiri oyuncuya gitmiyor.

## Karar: takvim taşındı

Mehmet [#41'de](https://github.com/mehmetalisahingm/quadro/issues/41) resmî yayın gününü **11 Kasım 2026** olarak belirledi ve tarih kaydırmayı onayladı: `q-001` 2026-11-11, her `q-N` bir sonraki gün. Taşıma #163 PR'ında; kimlikler, çözümler ve `draft` durumları korunuyor.

Taşıma merge edildikten sonra aynı araçla ölçüm:

| Ölçüm | Değer |
| --- | --- |
| 11 Kasım–10 Aralık takviminde aday | 30/30 |
| Onaylı gün | 0/30 |
| 11 Kasım itibarıyla ileri stok | 14 aday, 0 onaylı |
| Tarihi geçmiş aday | 0 |

Kalan iş yalnız onay: en az ilk 14 günün yazar dışından gözden geçirilip `published` yapılması.

## Kapanış için gerekenler

- [x] İlk yayın günü: 11 Kasım 2026 (#41, hedef)
- [x] Takvim kararı: tarih kaydırma (#41)
- [ ] Takvim taşıma PR'ının (#163) merge edilmesi
- [ ] Her gün için yazar dışından gözden geçirme ve `published` durumu
- [ ] `npm run release:stock -- --start <gün> --strict` başarılı
- [ ] `CONTENT_OPERATIONS.md` içindeki takvim ve sorumluluk tablosu dolu
