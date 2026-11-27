# İlk hafta işletim kaydı (Q42)

Bu belge doldurulmayı bekleyen kayıttır. **Henüz resmî yayın günü yok, aşağıdaki hiçbir satır sonuç değildir.** Süreç ve önem seviyeleri [içerik operasyonu](../CONTENT_OPERATIONS.md) ile [dağıtım](../DEPLOYMENT.md) belgelerindedir.

## Başlamadan önce

| Alan | Değer |
| --- | --- |
| Resmî yayın günü (D0, Q41 kararı) | — |
| Günlük yayın kontrolü sahibi | — |
| İçerik stoğu sahibi | — |
| Teknik hata ve geri alma sahibi | — |
| D0 anındaki onaylı ileri stok | — / 14 |

Sahipler Utku ve Mehmet tarafından birlikte yazılır.

## Günlük kontrol

Her gün İstanbul saatiyle gece yarısından sonra:

1. GitHub Actions → `Daily publication health` yeşil mi? Özetteki `source` değerini yaz: `scheduled` planlı dosya, `reserve` yedek havuz demektir.
2. `npm run release:stock -- --start <D0>` onaylı ileri stok kaç gün?
3. `/admin` panelinde oyun başlama, bitirme ve hata sayıları.
4. Yeni içerik veya teknik hata varsa sahipli issue aç ve numarasını yaz.

14 günün altına düşen stok, normal cilalama işlerinden önce gelir.

| Tarih | Kaynak ve kimlik | Sağlık | Oyun başlama | Bitirme | Hata | Stok günü | Açılan issue | Kontrol eden |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| D0 — | — | — | — | — | — | — | — | — |
| D1 — | — | — | — | — | — | — | — | — |
| D2 — | — | — | — | — | — | — | — | — |
| D3 — | — | — | — | — | — | — | — | — |
| D4 — | — | — | — | — | — | — | — | — |
| D5 — | — | — | — | — | — | — | — | — |
| D6 — | — | — | — | — | — | — | — | — |
| D7 — | — | — | — | — | — | — | — | — |

## Kopuşlar

Bitirmeyen oyuncu oranı veya tek bir bulmacada belirgin düşüş, tahmin edilmeden issue'ya dönüştürülür.

| Gözlem | Veri ve aralık | Olası neden (doğrulanmadı) | Issue | Sahip |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## D1 ve D7 değerlendirmesi

Tanımlar [analitik belgesindedir](../ANALYTICS.md): D1 ve D7, tarayıcı bazlı dönüştür; kullanıcı bazlı değildir. Site verisini silmek, gizli sekme ve farklı cihaz yeni kohort sayılır. Raporda bu sınır yazılır.

| Metrik | En erken hesap günü | Kohort büyüklüğü | Sonuç |
| --- | --- | --- | --- |
| D1 | D0 + 1 gün sonu | — | Bekliyor |
| D7 | D0 + 7 gün sonu | — | Bekliyor |

**Kurallar:**

- D7 süresi dolmadan D7 sonucu yazılmaz, tahmin edilmez.
- Küçük kohort "yetersiz veri" olarak yazılır, oran yorumlanmaz.
- Telemetri tek başına kullanıcı niyetini kanıtlamaz; pilot notlarıyla birlikte okunur.

## İlk hafta raporu

D7 sonunda birlikte doldurulur.

| Başlık | İçerik |
| --- | --- |
| Ölçüm aralığı | — |
| Stok durumu | — |
| Kapanan ve açık hatalar | — |
| D1 ve D7 | — |
| Birlikte seçilen sonraki iyileştirmeler | — |

## Kapanış

Q42 yalnız gerçek ilk hafta verisi girildikten sonra kapanır.
