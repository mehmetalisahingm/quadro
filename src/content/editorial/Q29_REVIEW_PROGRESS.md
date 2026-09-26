# Q29 — kör review ilerleme kaydı

İnceleme tarihi: **2026-09-26**

Bu kayıt Q29'un tamamı değildir. `q-024`…`q-032` adayları önce yalnız `src/content/editorial/blind/` altındaki cevapsız tahta üzerinden çözüldü; kanonik puzzle dosyaları ancak dört grup çıkarıldıktan sonra açıldı. Kör çözümle kanonik gruplar dokuz adayın dokuzunda da birebir eşleşti.

`q-018`…`q-023` için önceki PR yapısal kontrolleri sırasında çözüm metadata'sı görülmüş olduğundan bu oturum gerçek kör review iddiasında bulunmaz. Bu altı aday temiz bir reviewer/oturum tarafından yeniden kör denenmeden Q29 kapatılamaz.

## Durum tablosu

| Aday | Revision | Kör durum | İlk güçlü tutamak | Alternatif / tuzak notu | Adillik | Dil | Karar |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| q-018 | 1 | Körlük bozuldu | — | Önceki PR incelemesinde çözüm metadata'sı görüldü | — | — | Temiz review gerekli |
| q-019 | 1 | Körlük bozuldu | — | Önceki PR incelemesinde çözüm metadata'sı görüldü | — | — | Temiz review gerekli |
| q-020 | 1 | Körlük bozuldu | — | Önceki PR incelemesinde çözüm metadata'sı görüldü | — | — | Temiz review gerekli |
| q-021 | 1 | Körlük bozuldu | — | Önceki PR incelemesinde çözüm metadata'sı görüldü | — | — | Temiz review gerekli |
| q-022 | 2 | Körlük bozuldu | — | Önceki PR incelemesinde çözüm metadata'sı görüldü | — | — | Temiz review gerekli |
| q-023 | 1 | Körlük bozuldu | — | Önceki PR incelemesinde çözüm metadata'sı görüldü | — | — | Temiz review gerekli |
| q-024 | 1 | 4/4 çözüldü | Tamir aletleri | ANAHTAR farklı anlamlara çekebilir; ikinci tam çözüm yok | Adil | Doğal | ONAY |
| q-025 | 1 | 4/4 çözüldü | Yatak takımı | KALE↔DUVAR çağrışımı var; son-harf mekanizması çözümü tekilleştiriyor | Adil | Doğal | ONAY |
| q-026 | 1 | 4/4 çözüldü | Banyo eşyaları | Komutlar ve fotoğraf terimleri erken ayrışıyor; ikinci tam çözüm yok | Adil | Doğal | ONAY |
| q-027 | 1 | 4/4 çözüldü | Dikiş kutusu | TIRNAK/KESME günlük anlamlarıyla yanıltıyor ama noktalama grubu netleşiyor | Adil | Doğal | ONAY |
| q-028 | 1 | 4/4 çözüldü | İş makineleri | KEPÇE/SİLİNDİR çok anlamlı; `___ ÇEKİMİ` grubu en son açıldı | Adil | Doğal | ONAY |
| q-029 | 1 | 4/4 çözüldü | Gazete öğeleri | PORTFÖY'ün çanta anlamı daha az yaygın; kanonik açıklama yeterli | Adil | Kabul edilebilir | ONAY |
| q-030 | 1 | 4/4 çözüldü | Masaüstü bilgisayar | KASA çok anlamlı ama alternatif tam gruplama üretmiyor | Adil | Doğal | ONAY |
| q-031 | 1 | 4/4 çözüldü | Bağlantı elemanları | Kalan `___ PAYI` grubu doğal dört tamlamayla tekilleşiyor | Adil | Doğal | ONAY |
| q-032 | 1 | 4/4 çözüldü | Oyun kâğıdı sembolleri | Trafik talimatları güçlü; tekrar-hece grubu temiz son katman | Adil | Doğal | ONAY |

## Ayrıntılı kör çözüm notları

### q-024 · revision 1
- Kör tahta: `blind/2026-10-13.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: tamir aletleri.
- Zor katman: `___ KODU` ve `___ TAŞI` bağlantılarını ayırmak.
- Alternatif bağlantı: ANAHTAR'ın “key” anlamı kısa bir sahte bağ oluşturabilir; ikinci tam dörtlü üretmiyor.
- Aşırı özel bilgi: yok.
- Karar: **ONAY**.

### q-025 · revision 1
- Kör tahta: `blind/2026-10-14.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: yatak takımı.
- Zor katman: son harfi silince sayı adı mekanizması.
- Alternatif bağlantı: KALE ve DUVAR doğal çağrışım yapıyor; diğer kartlarla ikinci tam grup oluşmuyor.
- Dil: son-harf mekanizması açık ve deterministik.
- Karar: **ONAY**.

### q-026 · revision 1
- Kör tahta: `blind/2026-10-15.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: banyo eşyaları.
- Zor katman: `___ HAKKI`.
- Alternatif bağlantı: KAYDET/KOPYALA gibi komutlar çok belirgin olduğu için sahte tam çözüm oluşmadı.
- Dil: doğal.
- Karar: **ONAY**.

### q-027 · revision 1
- Kör tahta: `blind/2026-10-16.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: dikiş kutusu.
- Zor katman: `___ DIŞI`.
- Alternatif bağlantı: TIRNAK ve KESME sözcüklerinin günlük isim/fiil anlamları kısa süreli yanıltıyor; noktalama grubu tamamlanınca belirsizlik kalmıyor.
- Dil: doğal.
- Karar: **ONAY**.

### q-028 · revision 1
- Kör tahta: `blind/2026-10-17.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: iş makineleri.
- Zor katman: `___ ÇEKİMİ`.
- Alternatif bağlantı: KEPÇE ve SİLİNDİR gündelik nesne anlamlarına da sahip; bu polisemik tuzak ikinci çözüm üretmiyor.
- Dil: diş/film/kura/yer çekimi tamlamalarının dördü de yerleşik.
- Karar: **ONAY**.

### q-029 · revision 1
- Kör tahta: `blind/2026-10-18.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: gazete sayfası öğeleri.
- Zor katman: aynı beş harfin farklı dizilişleri.
- Alternatif bağlantı: PORTFÖY ilk anlamıyla “koleksiyon” çağrışımı yapıyor; belge taşıyan çanta anlamı daha az yaygın fakat sözlük düzeyinde doğal ve açıklama bunu netleştiriyor.
- Dil/adillik: küçük bir anlam genişliği dışında sorun yok.
- Karar: **ONAY**.

### q-030 · revision 1
- Kör tahta: `blind/2026-10-19.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: masaüstü bilgisayar parçaları.
- Zor katman: `___ GÖREVLİSİ`.
- Alternatif bağlantı: KASA farklı bağlamlara açık ancak başka üç kartla ikinci tam grup vermiyor.
- Dil: doğal.
- Karar: **ONAY**.

### q-031 · revision 1
- Kör tahta: `blind/2026-10-20.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: parçaları birleştiren elemanlar.
- Zor katman: `___ PAYI`.
- Alternatif bağlantı: belirgin ikinci tam gruplama bulunmadı.
- Dil: dört “payı” tamlaması da yerleşik.
- Karar: **ONAY**.

### q-032 · revision 1
- Kör tahta: `blind/2026-10-21.json`
- Çözüm: 4/4; kanonik cevapla birebir eşleşti.
- İlk tutamak: oyun kâğıdı sembolleri.
- Zor katman: aynı hecenin iki kez yazılması.
- Alternatif bağlantı: trafik komutları güçlü bir erken grup; kalan kartlarda ikinci tam çözüm oluşmuyor.
- Dil: doğal.
- Karar: **ONAY**.

## Q29 kalan iş

- `q-024`…`q-032`: **9/9 kör review tamamlandı ve revision 1 onaylandı.**
- `q-018`…`q-023`: **6 aday için temiz kör reviewer/oturum gerekiyor.** Bu altı aday tamamlanmadan issue #29 kapatılmamalı.
