# Quadro — İçerik yayın ve stok operasyonu

Bu belge Q38 ve Q42 için operasyon sözleşmesidir. **Q28/Q29 kör review'ları ve Q35 pilotu tamamlanmadan hiçbir aday bu belge sayesinde otomatik olarak “onaylı” sayılmaz.**

## Yayın stoğu tanımı

Bir bulmaca ancak şu üç koşul birlikte sağlanırsa yayın stoğunda `ONAYLI` kabul edilir:

1. İçerik şeması doğrulamasından geçer.
2. Yazarı dışındaki ekip üyesi tarafından kör review ile onaylanmış revision'a sahiptir.
3. Q35 pilotunda veya sonraki testlerde yayını engelleyen içerik problemi açık değildir.

Yazar kendi içeriğini tek başına yayın için onaylayamaz.

## 30 günlük takvim

Q38 tamamlanırken tablo gerçek yayın tarihiyle doldurulur.

| Gün | Tarih | Puzzle ID | Revision | Yazar | Kör review | Durum |
| ---: | --- | --- | ---: | --- | --- | --- |
| 1 | — | — | — | — | — | BEKLİYOR |
| 2 | — | — | — | — | — | BEKLİYOR |
| … | … | … | … | … | … | … |
| 30 | — | — | — | — | — | BEKLİYOR |

Kurallar:

- 30 tarih benzersiz ve kesintisiz olmalı.
- Aynı puzzle ID aynı 30 günlük takvimde iki güne atanmaz.
- Takvime yalnız onaylı revision yazılır.
- İlk yayın günü Q41 release kararıyla uyumlu olmalı.
- Tarih veya revision değişirse tablo ve doğrulama kanıtı birlikte güncellenir.

## Hazır stok hedefi

Yayın başladıktan sonra hedef, her zaman **en az 14 günlük onaylı ileri stok** bulundurmaktır.

Her stok kontrolünde şu sayılar kaydedilir:

- Bugünden itibaren takvimlenmiş onaylı gün sayısı
- Review bekleyen aday sayısı
- Revizyon bekleyen aday sayısı
- Kullanılabilir yedek aday sayısı

14 günün altına düşülürse yeni içerik/review işi normal cilalama işlerinden önce gelir.

## Günlük yayın kontrolü

Yayın sorumlusu her gün veya otomatik kontrol sonrası şu dört noktayı doğrular:

1. Türkiye yayın gününün doğru puzzle'ı döndürdüğü.
2. Bulmacanın beklenen ID/revision olduğu.
3. İstemci bundle'ında gelecek gün cevaplarının bulunmadığı.
4. Kritik içerik veya teknik hata açılmadığı.

Sorun yoksa operasyon kaydına `OK` yazılır. Sorun varsa ilgili issue açılır ve önem seviyesi belirlenir.

## Revision politikası

Yayınlanmamış bir bulmaca değiştiğinde:

1. `revision` artırılır.
2. Editorial notta değişiklik gerekçesi yazılır.
3. Blind tahta yeni revision ile eşlenir.
4. Değişiklik çözüm/adillik etkiliyorsa diğer kişi yeniden kör review yapar.
5. Takvimde eski revision varsa yeni onaylı revision ile güncellenir.

Yalnız yazım/metadata düzeltmesi bile yayın kaydında izlenebilir olmalıdır; cevap/grup davranışını etkileyen değişiklik review atlayamaz.

## Acil içerik düzeltmesi

Yayındaki veya sıradaki bulmacada kritik problem bulunursa:

### P0 — cevap sızıntısı / oyun oynanamıyor

- Sorunlu içerik derhal yayından çıkarılır veya önceki sağlam revision/yedek aday kullanılır.
- Teknikse deployment rollback prosedürü uygulanır.
- Aynı gün issue açılır ve yayın sonrası kök neden kaydı tutulur.

### P1 — haksız/yanlış çözüm, ciddi dil veya ikinci tam çözüm

- Sıradaki yayınsa onaylı yedekle değiştirilir.
- Yayındaysa durum ve kullanıcı etkisi kaydedilir; düzeltme revision'ı diğer kişi tarafından yeniden kontrol edilir.

### P2/P3 — açıklama/cila

- Yayını zorunlu olarak durdurmaz; planlı revision'a alınabilir.

## Yedek içerik

Yedek aday:

- yapısal olarak geçerli,
- kör review onaylı,
- takvimde başka güne bağlı olmayan veya yeniden ataması açıkça kaydedilmiş

olmalıdır. `draft` veya review bekleyen bir aday acil durumda “onaylı yedek” sayılmaz.

## İlk hafta operasyonu — Q42 hazırlığı

Yayın sonrası ilk 7 gün için günlük kayıt:

| Tarih | Puzzle ID/rev | Yayın kontrolü | Teknik hata | İçerik sorunu | Kullanıcı kopuşu | Stok günü | Açılan issue |
| --- | --- | --- | --- | --- | --- | ---: | --- |
| — | — | — | — | — | — | — | — |

D1/D7 yorumu için Q34 verisi kullanılır; yeterli süre dolmadan D7 sonucu ilan edilmez. Telemetri tek başına kullanıcı niyetini kanıtlamaz; pilot/geri bildirim notlarıyla birlikte yorumlanır.

## Sorumluluk ve handoff

Q38 finalinde şu bilgiler açıkça doldurulur:

- Takvim sahibi: —
- Günlük yayın kontrolü sahibi: —
- İçerik acil durum yedeği/onayı: —
- İlk 14 günlük stok sayısı: —
- İlk yayın tarihi: —
- Son takvim tarihi: —

Q42'de ilk hafta sonunda stok durumu, hata listesi ve D1/D7 değerlendirme tarihi eklenir.

## Kapanış sınırı

Bu prosedürün hazırlanması Q38 veya Q42'yi tek başına kapatmaz. Q38 için gerçek 30 onaylı puzzle + tarih/revision matrisi; Q42 için gerçek yayın sonrası bir haftalık operasyon verisi gerekir.
