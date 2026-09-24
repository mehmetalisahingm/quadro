# Quadro bulmaca yazım rehberi

Sürüm: 0.1 · Durum: Faz 0 prototip rehberi · Yazar: Mehmet · İsteğe bağlı kör deneme: Utku

Quadro'nun günlük bulmacası 16 Türkçe kelimeyi dört adet dörtlü gruba ayırır. Oyuncu çözümü gördüğünde bağlantıyı savunmak için uzun bir açıklamaya ihtiyaç duymamalı; doğru cevap “bunu nasıl göremedim?” hissi vermeli. Bulmaca, bilmediği bir özel bilgi yüzünden değil, kelimeleri farklı açılardan düşündüğü için zorlaşır.

> **Yeni bulmaca üretmeden önce [`CONTENT_RESERVATIONS.md`](CONTENT_RESERVATIONS.md)'ye bakın.** Numara/tarih aralıkları, ayrılan fiil kalıpları ve doygun temalar orada tutulur.

## İçerik dosyaları

| Yol | İçerik | Oyuncuya gönderilir mi? |
| --- | --- | --- |
| `src/content/puzzles/YYYY-MM-DD.json` | Çalışma zamanı için cevaplı, kanonik puzzle verisi | Sunucu/derleme katmanı kullanır; ham dosya istemciye kopyalanmaz. |
| `src/content/editorial/blind/YYYY-MM-DD.json` | Aynı 16 kelimenin karıştırılmış, grup bilgisi olmayan kör deneme tahtası | İsteyen deneme yapana verilir. |
| `src/content/editorial/YYYY-MM-DD.md` | Cevap anahtarı, açıklama, hedeflenen şaşırtma ve kalite notu | Yalnız içerik ekibine aittir. |

Bu dosyaların şeması ve makine ile denetlenen kuralları [`CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md) içindedir; `npm run validate:content` komutu tüm içeriği bu kurallara göre denetler ve CI'da hatada durur.

Repo public olduğundan bu ayrım bir güvenlik sınırı değildir. Amaç, isteyen kişinin denemeden önce cevap anahtarını açmamasını sağlayan net bir iş akışıdır. Kör deneme için yalnız `blind` dosyası paylaşılır; deneme notu tutulursa cevap anahtarı sonrasında açılır.

Kanonik JSON, `docs/CONTRACTS.md` içindeki `Puzzle` tipine uyar: dört grup, her grupta dört `PuzzleWord`, benzersiz kelime kimlikleri, dil, tarih, şema ve revizyon bilgisi bulunur. `date`, `Europe/Istanbul` günlük yayın günüdür.

## Yazım ilkeleri

1. Her grup dört kelimeyi aynı ilişkiyle açıklar. Bir kelimeyi kurtarmak için özel telaffuz, argo veya tek seferlik istisna icat edilmez.
2. Dört grup birlikte tek bir çözüm vermelidir. İkinci bir tam gruplama gerçekçi görünüyorsa bulmaca yayınlanmaz.
3. Yanıltıcı kelime güçlü bir alternatif çağrışım kurabilir; ancak doğru gruba yerleştirildiğinde diğer üç kelimeyle aynı derecede doğal olmalıdır.
4. Türkçe yazım, ekler, birleşik kelimeler, büyük/küçük harf ve anlam ayrımları bir editör tarafından kontrol edilir.
5. Özel isim veya güncel kültür bilgisi kullanılıyorsa oyuncunun makul bir ipucu olmadan bilmesi beklenmez. Gerekli bağ açıklamada kaynaklandırılır.
6. Aynı sözcük farklı anlamlarda kullanılabilir; bu durumda başlık ve çözüm açıklaması hangi anlamın hedeflendiğini açıklar.
7. Bir bağlantı yalnızca çok dar bir yöresel kullanımda geçerliyse geniş kitle bulmacasının ana grubu yapılmaz.
8. Kelime uzunluğu ve Türkçe karakterler 320 px ekranda okunur kalmalıdır. Sırf kısa görünsün diye anlamı bozan kısaltma kullanılmaz.

### Adil zorluk

Her prototipte dört grup, hedeflenen çözüm sırasını gösteren 1–4 zorluk değeri taşır. Bu değer oyuncuya başlangıçta gösterilmez ve yalnızca editoryal ayar içindir.

| Değer | Hedef deneyim | Uygun bağlantı örnekleri |
| --- | --- | --- |
| 1 | Isınma; geniş kitle ilk grubu fark eder | Kahvaltılıklar, geometrik şekiller, bilinen oyunlar |
| 2 | Dikkat ve yaygın kültür bilgisi | Geleneksel çalgılar, hayvanlar, ortak fiil |
| 3 | Yüzeydeki anlamdan ayrılmayı gerektirir | `___ atmak`, `___ çekmek`, `___ vermek` |
| 4 | Dil oyunu veya güçlü sahte bağ; çözüm sonradan adil | İlk harfi silme, `kara ___`, çift anlam |

Zorluk etiketleri kategori açıklamasının yerine geçmez. İsteğe bağlı kör denemede oyuncuların hangi gruba ilk gittiği, nerede yanıldığı ve açıklamayı adil bulup bulmadığı kaydedilebilir.

## Üretim akışı

`Fikir havuzu → grup adayları → 16 kelimelik tahta → yapısal kontrol → isteğe bağlı kör deneme → alternatif çözüm taraması → revizyon → yazarın yayın kararı`

Her dosyanın metadata'sında yazar, isteğe bağlı deneme yapan kişi, durum, revizyon ve tarih bulunur. Hazırlayan kişi kendi editoryal kontrolünü kaydeder; ikinci kişinin onayı zorunlu değildir.

### İsteğe bağlı kör deneme formu

İsteyen deneme yapan kişi yalnız `blind/YYYY-MM-DD.json` dosyasını açar ve cevap anahtarına bakmadan şunları kaydedebilir:

- İlk tahmin ve tahmin sırası.
- Her tahminde hangi dört kelimenin seçildiği.
- Takılma veya “one-away” hissi oluşan nokta.
- Kategorinin açıklanınca doğal gelip gelmediği.
- İkinci bir tam gruplamanın mümkün görünüp görünmediği.
- Türkçe yazım, anlam veya kültür bilgisi itirazı.

Bir bulmaca kör denemede açılamazsa bu tek başına kalite sorunu değildir; ancak neden açılamadığı açıklanmalıdır. “Bunu bilmem mümkün değildi” gerekçesi varsa grup yeniden yazılır veya çıkarılır.

### Manuel adalet kontrolü

- [ ] Dört grubun her biri kendi içinde aynı kurala uyuyor.
- [ ] Her kelime için hedeflenen bağlantı doğal Türkçe kullanım.
- [ ] Aynı kelime iki gruba aynı güçte ait görünmüyor.
- [ ] Yanıltıcı bağlantılar var ama ikinci tam çözüm yok.
- [ ] Açıklama, oyuncunun görmediği bir özel bilgiyi sonradan zorla dayatmıyor.
- [ ] Kategori başlığı cevapları açıklarken kelimelerle aynı anlamı taşıyor.
- [ ] Tüm kelimeler 320 px kartta okunabilir.
- [ ] Şema ve yapısal validator kontrolleri geçiyor (`npm run validate:content` temiz).
- [ ] Alternatif tam çözüm taraması elle yapıldı; doğrulayıcı bu kuralı denetlemez, bkz. [`CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md).

## Prototipler

| ID / tarih | Taslak sahibi | İsteğe bağlı deneme yapan | Hedef zorluk profili | Ana fikir |
| --- | --- | --- | --- | --- |
| `q-001` / 20 Eylül 2026 | Mehmet | Utku (yapıldı) | 1–4 | Fiil kalıpları, `KARA` birleşikleri ve masa oyunları |
| `q-002` / 21 Eylül 2026 | Mehmet | Utku (henüz yapılmadı) | 1–4 | Kahvaltı, hayvanlar ve `ATMAK`/`KESMEK` kalıpları |
| `q-003` / 22 Eylül 2026 | Mehmet | Utku (henüz yapılmadı) | 1–4 | Şekiller, çalgılar, `VERMEK` kalıbı ve ilk harf oyunu |
| `q-004` / 23 Eylül 2026 | Utku | Mehmet (henüz yapılmadı) | 1–4 | Yaz meyveleri, Anadolu yakası semtleri, ses aygıtları ve `ÇÖZMEK` kalıbı |
| `q-005` / 24 Eylül 2026 | Utku | Mehmet (henüz yapılmadı) | 1–4 | Deniz canlıları, akarsular, `TUTMAK` kalıbı ve baharatlar |
| `q-018` / 7 Ekim 2026 | Utku | Mehmet (henüz yapılmadı) | 1–4 | Vücut organları, `DÖKMEK` kalıbı, para birimleri ve danslar (Q27 ilk aday) |

Hepsi taslaktır. Yazarın kendi kalite kontrolü tamamlanmadan günlük stoğa alınmaz; diğer kişinin kör deneme ve itiraz kaydı isteğe bağlıdır. İlk üç prototipin yazarı Mehmet, kör deneyeni Utku'dur; `q-004` ile `q-005` Utku'nun ilk iki prototipidir; `q-018` Utku'nun Q27 aralığındaki ilk adayıdır. Bu üçünün kör denemesi Mehmet'e açıktır.

Tamamlanan kör denemeler ilgili editorial dosyasında "Bağımsız kör deneme" başlığı altında kayıtlıdır. `q-001` denendi ve notlar [`../src/content/editorial/2026-09-20.md`](../src/content/editorial/2026-09-20.md) içindedir; `q-002` ile `q-003` için kör deneme henüz yapılmamıştır.

## Revizyon ve yayın kaydı

Bir kelime değiştiğinde `revision` artırılır ve kör deneme önerilir. Yayımlanmış bir puzzle normal akışta değiştirilmez; zorunlu düzeltmede yeni revizyon, gerekçe ve kayıt uyumluluğu yazılır.

İlk 30 günlük stoğun taslakları iki kişiye bölünür. Mehmet 1–15, Utku 16–30 aralığının yazarıdır (güncel aralıklar için [`CONTENT_RESERVATIONS.md`](CONTENT_RESERVATIONS.md) esastır); diğer kişi isterse yazarın içeriğini kör dener. Bu dosyadaki ilk üç prototip, üretim sürecinin ve veri biçiminin örneğidir.

## Kaynak ve yapay zekâ kullanımı

Yaygın Türkçe kullanım, sözlük anlamı veya güncel bir isim tartışmalıysa kaynak notu editorial dosyasına eklenir. Yapay zekâ yalnız aday üretimi ve alternatif bağlantı taramasında yardımcı olabilir; son anlam, adalet ve yayın kararı yazarın editoryal kontrolünden geçer. Kaynakta olmayan bir bilgi “bilinen gerçek” diye oyuna konmaz.

## Teslim ölçütü

Q06 tamamlanmış sayılması için `src/content/puzzles/` altında üç cevaplı prototip, `src/content/editorial/` altında üç açıklamalı editorial dosyası, `src/content/editorial/blind/` altında üç cevapsız tahta ve bu rehber bulunur. Utku'ya kör deneme sunulabilir, ancak bu PR veya merge ön koşulu değildir; revizyonlar yazarın kalite kontrolüyle takip edilir.
