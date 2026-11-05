# Q38 — Yayın stoğu durumu

Ölçüm: 5 Kasım 2026, commit `af6a5f0`. Yenilemek için: `npm run release:stock -- --start <gün> --as-of <bugün>`.

**Sonuç: Q38 kapanamaz. Onaylı gün sayısı 0/30, ileri stok 0/14.**

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

## Karar gerektiren sorun

`CONTENT_RESERVATIONS.md` numarayı tarihe kilitliyor (`q-N` = 2026-09-20 + N − 1 gün). Bu yüzden 46 taslağı bugün onaylamak ileri stok **üretmez**: dosya geçmiş bir güne ait olduğu için hiçbir zaman seçilmez. İlk yayın gününden önce şu seçeneklerden biri gerekir.

| Seçenek | Ne olur | Bedel |
| --- | --- | --- |
| Tarihleri kaydırmak | Mevcut 48 taslak yayın takvimine taşınır | Numara-tarih kilidi kuralı değişir; dosya adı, kör tahta ve editoryal kayıt birlikte taşınır |
| Yeni içerik yazmak | Kural korunur | En az 30 yeni bulmaca ve gözden geçirme; mevcut taslaklar kullanılmaz |
| Rezervi kabul etmek | İş çıkmaz | 20 Aralık'ta tekrar başlar; Q38 ölçütü karşılanmaz |

Tarih kaydırma yapılmadı: kural iki kişinin anlaşmasıyla konmuş, kararı da ikisine ait.

## Kapanış için gerekenler

- [ ] İlk yayın günü (Q41)
- [ ] Yukarıdaki karar
- [ ] Her gün için yazar dışından gözden geçirme ve `published` durumu
- [ ] `npm run release:stock -- --start <gün> --strict` başarılı
- [ ] `CONTENT_OPERATIONS.md` içindeki takvim ve sorumluluk tablosu dolu
