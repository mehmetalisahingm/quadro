# İçerik rezervasyonları

Bu dosya, Utku ve Mehmet'in paralel bulmaca üretirken aynı numarayı, tarihi, fiil kalıbını veya temayı iki kez kullanmasını önlemek için tutulan ortak kayıttır. İki kişi aynı tema, aynı fiil kalıbı ve aynı numara/tarih üzerinde defalarca çakıştı; aşağıdaki bölüşüm iki tarafın anlaştığı kuraldır.

**Yeni bir bulmacaya başlamadan önce herkes bu dosyaya bakar.** Bulmaca yazım kuralları [`PUZZLE_GUIDE.md`](PUZZLE_GUIDE.md), şema kuralları [`CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md) içindedir; numara, tarih, kalıp ve tema sahipliğinde esas olan bu dosyadır.

Havuzun bugünkü durumu: `main` üzerinde 17 günlük bulmaca (`q-001`…`q-017`) ve motor testleri için 3 örnek fixture (`ornek-001`, `ornek-uzun-001`, `ogretici-001`) var. 18 fiil kalıbı ve "başına ___ gelenler" mekaniği kullanıldı.

## Numara/tarih aralığı

| Kişi | Numara aralığı | Tarih aralığı | Kapsam |
| --- | --- | --- | --- |
| Mehmet | `q-001`…`q-017` | 2026-09-20 → 2026-10-06 | Q26 (`q-001`…`q-015`) ve ek/yedek içerik olarak `q-016`/`q-017` |
| Utku | `q-018`…`q-032` | 2026-10-07 → 2026-10-21 | Q27, 15 aday |

**Kural: numara ile tarih birebir kilitlidir.** `q-001` = 2026-09-20 ve her numara bir sonraki güne düşer (`q-N` = 2026-09-20 + (N − 1) gün). Bir numara başka bir tarihe taşınmaz ve bir tarih başka bir numarayla doldurulmaz. `q-032` sonrasındaki numaralar henüz kimseye ayrılmadı; almak isteyen önce bu tabloya işler.

Not: `PUZZLE_GUIDE.md` içindeki "Mehmet 1–15, Utku 16–30" ilk plandır. `q-016`/`q-017` Mehmet tarafından üretildiği için Utku'nun aralığı `q-018`…`q-032` olarak kaydırıldı.

## Ayrılan fiil kalıpları

`___ FİİL` biçimindeki kalıp grupları (ör. "ÇEKMEKLE KURULAN İFADELER") aşağıdaki gibi bölüşülür. Bir kalıp yalnız sahibinin bulmacalarında kullanılır.

| Durum | Fiiller |
| --- | --- |
| Utku'ya ayrıldı (Q27) | DÖKMEK (kullanıldı: `q-018`), BASMAK (kullanıldı: `q-019`), SÜRMEK, GEÇMEK, VURMAK, ÇALMAK, SİLMEK |
| Mehmet'e ayrıldı | SAYMAK, SARMAK, DÖNMEK, ARAMAK, BULMAK, DÜŞMEK, SOKMAK, YIKMAK, ÇEVİRMEK ve bu listede adı geçmeyen diğer boş kalıplar |
| Kullanıldı, ikisi de yeniden kullanmaz | ATMAK, BIRAKMAK, BOZMAK, ÇEKMEK, ÇIKMAK, ÇÖZMEK, KAÇIRMAK, KALMAK, KAPATMAK, KAYBETMEK, KESMEK, KIRMAK, KOYMAK, KURMAK, TAKMAK, TUTMAK, VERMEK, YAKMAK |

Kullanılan 18 kalıbın bulmacalardaki yeri:

| Fiil | Bulmaca | Fiil | Bulmaca |
| --- | --- | --- | --- |
| ÇEKMEK | `q-001` | KIRMAK | `q-008` |
| ATMAK | `q-002` | KAYBETMEK | `q-009` |
| KESMEK | `q-002` | TAKMAK | `q-010` |
| VERMEK | `q-003` | KAÇIRMAK | `q-011` |
| ÇÖZMEK | `q-004` | BOZMAK | `q-012` |
| TUTMAK | `q-005` | ÇIKMAK | `q-013` |
| YAKMAK | `q-006` | KURMAK | `q-014` |
| KAPATMAK | `q-007` | BIRAKMAK | `q-015` |
| KOYMAK | `q-016` | KALMAK | `q-017` |

Dikkat: `q-001` içindeki "SÜRÜLEBİLENLER" grubu (KREM, OJE, PARFÜM, SALÇA) SÜRMEK fiilinin nesne anlamını kullandı. Utku'nun SÜRMEK kalıbı deyim anlamına dayanmalı (ör. `___ sürmek` ifadeleri) ve bu dört kelimeyi tekrar etmemeli.

## Kaçınılacak/doygun temalar

Aşağıdaki alanları ikisi de yeni bulmacalarda kullanmaz.

| Alan | Kullanım | Durum |
| --- | --- | --- |
| Yiyecek/mutfak | 11 grup | Tükendi |
| Coğrafya/yer adı | 4 günlük bulmaca grubu (`q-004` semtler, `q-005` akarsular, `q-009` denizler, `q-012` iller) + 2 fixture grubu (şehirler, il adları) | Doygun |
| Hayvan/bitki | 6 grup | Doygun |
| Dil oyunu: "başına ___ gelenler" | 7 kez (KARA, AK, ÖN, GÖK, BAŞ, ANA, GÜN) | Tükendi |

Az kullanılmış ve tercih edilebilir alanlar: organ, para birimi, dans, burç, metal, spor dalı, meslek, müzik kavramı, giyim, ölçü birimi vb. Bunlardan spor (`q-008`), müzik kavramı (`q-014`), giyim (`q-010`, `q-013`) ve ölçü birimi (`q-016`) birer kez kullanıldı. Aynı alana dönülürse önceki grubun kelimeleri tekrar edilmez. Tercih edilebilir bir alan bir kişinin bulmacasına girdiğinde aşağıdaki durum tablosunda o kişinin satırına işlenir.

## Durum tablosu

| Kişi | Numara/tarih aralığı | Ayrılan fiil kalıpları | Kaçınılacak temalar | Durum |
| --- | --- | --- | --- | --- |
| Mehmet | `q-001`…`q-017` (2026-09-20 → 2026-10-06) | SAYMAK, SARMAK, DÖNMEK, ARAMAK, BULMAK, DÜŞMEK, SOKMAK, YIKMAK, ÇEVİRMEK + diğer boş kalıplar | Yiyecek/mutfak, coğrafya/yer adı, hayvan/bitki, "başına ___ gelenler" | Tamamlandı (`q-001`…`q-017` `main`'de) |
| Utku | `q-018`…`q-032` (2026-10-07 → 2026-10-21) | DÖKMEK (kullanıldı: `q-018`), BASMAK (kullanıldı: `q-019`), SÜRMEK, GEÇMEK, VURMAK, ÇALMAK, SİLMEK | Yiyecek/mutfak, coğrafya/yer adı, hayvan/bitki, "başına ___ gelenler" | Üretiliyor (`q-018`: organ, para birimi, dans; `q-019`: burç, metal, müzik türü; 2/15) |

Durum değerleri: **rezerve** (ayrıldı, üretim başlamadı) · **üretiliyor** (taslak dalda) · **tamamlandı** (`main`'e merge edildi).

## Kullanım kuralı

1. Üretime başlamadan herkes bu dosyaya bakar.
2. Yeni bir numara, fiil kalıbı veya tema alan kişi bunu önce bu dosyaya işler, sonra üretir. Durum sütunu iş ilerledikçe güncellenir.
3. Çakışma şüphesinde önce bu dosya güncellenir ve iki taraf anlaşır; üretim ondan sonra başlar.
4. Bu dosyadaki değişiklikler normal PR akışını izler ve diğer kişinin onayını bekler (bkz. [`CONTRIBUTING.md`](../CONTRIBUTING.md)).
