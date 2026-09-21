# Quadro oyun kuralları

Durum: Q02 (#2) · Sahip: Utku · Kaynak: [PROJE_PLANI.md §4](../PROJE_PLANI.md#4-oyun-kuralları-ve-uç-durumlar) (ayrıca §1, §5, §6, §7)

Bu belge oyunun kesin kurallarını ve uç durumlarını motorun diliyle yazar. **Kuralların kaynağı PROJE_PLANI.md §4'tür;** bu belge planla çelişirse plan esastır ve belge düzeltilir. Tipler [`src/features/game/contracts.ts`](../src/features/game/contracts.ts), tiplerin davranışı ve örnek akışlar [CONTRACTS.md](CONTRACTS.md) içindedir. Bu üç dosya aynı PR içinde birlikte güncellenir.

Planda doğrudan yazmayan ama motorun kesin davranması gereken noktalar §11'de ayrıca listelenmiştir.

## 1. Temel yapı

| Kural | Değer (`GAME_CONSTANTS`) |
| --- | --- |
| Toplam kelime | 16 (`wordCount`) |
| Grup sayısı | 4 (`groupCount`) |
| Gruptaki ve tahmindeki kelime | 4 (`groupSize`) |
| Hata hakkı | 4 (`maxMistakes`) |

- Her kelime tam olarak bir gruba aittir.
- Oyun `playing` durumunda başlar: seçim boş, 16 kelime tahtada, `mistakesRemaining = 4`, tahmin geçmişi boş.
- `won` ve `lost` terminal durumlardır.

## 2. Oyuncu eylemleri

### Seçim — `toggleWord(wordId)`

- Yalnız çözülmemiş kelimeler (`remainingWordOrder` içindekiler) seçilebilir.
- Seçili karta tekrar basmak seçimi kaldırır.
- En fazla dört farklı kart seçilir. Dört kart seçiliyken seçili olmayan bir karta basmak durumu değiştirmez.
- Bilinmeyen veya çözülmüş kimlik ya da terminal oyun: durum değişmez.
- Seçim hak veya tahmin geçmişini etkilemez.

### Grupla — `submitSelection()`

- Arayüzde yalnız tam dört kart seçildiğinde etkinleşir.
- Motor her çağrıyı yine de §3'teki sırayla denetler; arayüz kilidi tek güvence değildir.
- Motor her gönderimi bir kez işler. Sonuç (`outcome`) ve yeni durum (`snapshot`) birlikte döner.

### Karıştır — `shuffle()`

- Yalnız çözülmemiş kartların yerlerini (`remainingWordOrder`) değiştirir. Çözülmüş gruplar yerinde kalır.
- Seçim, haklar, tahmin geçmişi ve çözülen gruplar korunur. Seçili kartlar yeni yerlerinde seçili kalır, çünkü seçim kimlikle tutulur.
- Kart sırasını motor/adaptör üretir; arayüz kendi sırasını üretmez, `remainingWordOrder` sırasını gösterir.

### Seçimi temizle — `clearSelection()`

- Seçili kartları bırakır: `selectedWordIds = []`.
- Hak azalmaz; başka hiçbir alan değişmez. Boş seçimde etkisizdir.

## 3. Gönderim sonuçları

### Denetim sırası

Bir gönderim aşağıdaki sırayla değerlendirilir; ilk eşleşen sonuç döner:

1. Oyun `playing` değil → `invalid` / `game-ended`
2. Seçim tam dört kimlik değil → `invalid` / `selection-count`
3. Tekrar eden, bilinmeyen veya çözülmüş kimlik var → `invalid` / `invalid-words`
4. Aynı dörtlü daha önce gönderilmiş (sıra önemsiz) → `repeated`
5. Dörtlü değerlendirilir → `correct`, `one-away` veya `wrong`

### Sonuç tablosu

| Sonuç | Koşul | Hak | Tahmin geçmişi | Seçim | Tahta ve durum |
| --- | --- | --- | --- | --- | --- |
| `correct` | Dört kelime aynı gruptan | Değişmez | `correct` eklenir | Temizlenir | Grup `solvedGroupIds` sonuna eklenir, kelimeleri tahtadan çıkar, açıklaması `outcome.solvedGroup` ile erişilebilir olur |
| `one-away` | Seçilenlerin **tam üçü** aynı çözülmemiş gruptan | −1 | `one-away` eklenir | Korunur | Değişmez |
| `wrong` | Her gruptan en fazla iki kelime | −1 | `wrong` eklenir | Korunur | Değişmez |
| `repeated` | Aynı dörtlü daha önce gönderilmiş | Değişmez | Değişmez | Korunur | Değişmez |
| `invalid` | Denetim sırasındaki 1–3. adımlar | Değişmez | Değişmez | Korunur | Değişmez |

Hak düşüren gönderim hakkı sıfıra indirirse durum `lost` olur; dördüncü grup bulunursa `won` olur (§4).

### Çok yakın (NYT tarzı)

- Dörtlünün tam üçü aynı çözülmemiş gruptansa oyuncuya **“Bir kelime uzaktasın”** gösterilir ve bir hak azalır.
- **Hangi kelimenin farklı olduğu söylenmez.** `{ verdict: "one-away" }` sonucu kelime veya grup bilgisi taşımaz.
- Seçim yalnız çözülmemiş kelimelerden oluşabildiği için üç kelimesi seçimde olan grup zaten çözülmemiştir.
- `one-away` tahmin geçmişine yazılır ve paylaşımda satır üretir; tekrar denetimine dahildir.

## 4. Kazanma ve kaybetme

### Kazanma

- Dördüncü doğru grup bulunduğunda durum `won` olur.
- Son doğru gönderim **iki bilgiyi birlikte** döndürür: `outcome = { verdict: "correct", solvedGroup }` ve `snapshot.status = "won"`. Böylece hem son grup animasyonu hem sonuç ekranı aynı yanıttan beslenir.
- `won` durumunda `remainingWordOrder` ve `selectedWordIds` boştur, `solvedGroupIds` dört gruptur.

### Kaybetme

- Hakkı sıfıra indiren gönderim (`wrong` **veya** `one-away`) oyunu `lost` yapar. Sonuç kendi değerlendirmesini korur: `outcome.verdict` `wrong` ya da `one-away`, `snapshot.status = "lost"`, `mistakesRemaining = 0`.
- Kalan cevaplar ve açıklamalar gösterilir. **Açılan cevaplar çözülmüş sayılmaz:** `solvedGroupIds` yalnız oyuncunun gerçekten bulduğu grupları içerir, sonuç ekranındaki “bulunan grup” sayısı buna göre gösterilir.
- Doğru tahmin hak düşürmediği için kazanma ve kaybetme aynı gönderimde oluşamaz.

## 5. Uç durumlar

| Durum | Kesin davranış |
| --- | --- |
| Son hak (`mistakesRemaining = 1`) | `wrong` veya `one-away` → `lost`. `correct` → oyun sürer (son grupsa `won`). `repeated` ve `invalid` hak düşürmez, oyun sürer. |
| Tekrarlanan tahmin | Karşılaştırma `attemptKey` ile sıradan bağımsız yapılır. `one-away` ve `wrong` tahminler tekrar sayılır. Mesaj gösterilir; hak, geçmiş ve seçim değişmez. |
| Doğru çıkmış dörtlünün yeniden gönderimi | Kelimeleri çözülmüş olduğundan seçilemez; kayıttan gelirse `invalid-words` döner (`repeated` değil). |
| Çözülen kelimenin yeniden kullanımı | `toggleWord` etkisizdir; gönderimde `invalid-words`. |
| Eksik, fazla veya tekrar eden seçim | `selection-count` veya `invalid-words`; hak azalmaz. |
| Çift gönderim / geçiş sırasında tekrar | Arayüz geçiş boyunca Grupla'yı kilitler. Motor da ikinci çağrıyı saymaz: doğru sonrası seçim boş olduğundan `selection-count`, yanlış veya çok yakın sonrası aynı seçim `repeated` döner. Hak iki kez düşmez. |
| Bitmiş oyun | Yeni tahmin kabul edilmez: `submitSelection` her zaman `invalid` / `game-ended` döner. `toggleWord`, `shuffle` ve `clearSelection` etkisizdir. Sonuç kalıcı durumdan yeniden açılabilir. |
| Sayfa yenileme | `outcome` geçicidir ve kaydedilmez. Arayüz yalnız geri yüklenen `snapshot` ile çizer; terminal durumdaysa sonuç görünümünü açar. |

## 6. Süre

- `activeSeconds` yalnız görünür ve aktif oyun ekranında ilerler. Ana sayfa, öğretici ve arka plandaki sekme süreye eklenmez.
- Süre baskın bir yarış unsuru değildir; sonuçta ikincil bilgi olarak gösterilir.
- Gönderimler süreyi değiştirmez.
- Süre **duvar saati farkı değildir**: oyunun açılışı ile bitişi arasındaki süre değil, ekranın önde ve oyunun sürdüğü anların toplamıdır. Sayaç üç koşul birlikte sağlanınca işler: kayıt devralındı, oyun ekranı görünür ve `status` `playing`.
- Sekme gizlenince, sayfa terk edilince veya oyun ekranı kapanınca oturum kapanır ve o ana kadar geçen süre toplama eklenir. Arada geçen "görünmez" süre hiç ölçülmez.
- Yenilemede süre kayıttaki değerden sürer: ne sıfırlanır ne de iki kez sayılır. Yeniden odaklanma sayacı yeniden başlatmaz.
- `won`/`lost` olunca sayaç durur ve süre sabitlenir. Arayüz ve paylaşım tek kaynağı okur: `snapshot.activeSeconds`. Ayrı bir sayaç ya da ikinci bir hesap yoktur.
- Cihaz saati geri alınırsa (NTP düzeltmesi, uykudan dönüş) süre duraklar ama geri gitmez. Devralınan süre 24 saatle sınırlıdır.
- Uygulaması: `src/features/game/state/` (sayaç `activeTimer.ts`, koşullar `gameStore.ts`, sekme yaşam döngüsü `useActiveTimer.ts`). Kayıtla etkileşimi `docs/PERSISTENCE.md` içinde.

## 7. Kimlikler ve Türkçe normalizasyon

### Kimlikler

- Seçim, tahmin geçmişi, tekrar denetimi ve kayıt **kelime metniyle değil `WordId` ile** yapılır.
- `WordId` bulmaca içinde benzersiz ve boş olmayan bir dizedir. Grup kimlikleri de bulmaca içinde benzersizdir.
- İçerik açık kimlik kullanabilir (ör. `q001-w01`). Araçlar ve örnek veriler `slugifyTr` ile kararlı ASCII kimlik üretebilir (`GÜNEŞ` → `gunes`).
- `slugifyTr` bilgi kaybettirir: `ÇAM` ve `CAM` aynı kimliği (`cam`) verir. Çakışmayı içerik doğrulayıcısı (Q18) yakalar; çakışmada açık kimlik kullanılır.
- Yayımlanmış bulmacada kimlikler değişmez; kayıt ve tahmin geçmişi kimliklere dayanır (plan §7).

### Normalizasyon

- `normalizeTr` karşılaştırma içindir (ör. yinelenen kelime denetimi): Unicode NFC, Türkçe küçültme (`I` → `ı`, `İ` → `i`) ve boşluk sadeleştirme. Yerel ayar verisine bağlı değildir.
- Normalizasyon görüntülenen metni değiştirmez; kelime içerikteki haliyle gösterilir.
- Metin büyük harfe çevrilecekse `toLocaleUpperCase("tr-TR")` kullanılır. Varsayılan `toUpperCase()` `i` harfini `I` yapar ve Türkçe kelimeyi bozar.
- Tekrar denetimi metinle değil `attemptKey(wordIds)` ile yapılır: dörtlü sıralanıp birleştirilir, sıra önemsizdir.

## 8. Arayüz sınırı: UI iş kuralı hesaplamaz

Arayüz motorun ürettiği durumu gösterir; hak, doğruluk, seri veya kazanma hesabını yeniden yapmaz (plan §6).

| Motor ve adaptör (Utku) | Arayüz (Mehmet) |
| --- | --- |
| Seçimin geçerliliği, dörtlünün değerlendirilmesi (`correct`, `one-away`, `wrong`, `repeated`, `invalid`) | `outcome`'a göre mesaj ve animasyon seçer |
| Hak, çözülen gruplar, kart sırası, tahmin geçmişi | `snapshot` alanlarını olduğu gibi gösterir |
| `won` / `lost` kararı | `snapshot.status` terminal olduğunda sonuç görünümünü açar |
| Seri ve istatistik (Q22) | Hazır değerleri gösterir |
| Kurallara aykırı çağrıları etkisiz bırakma | Geçiş sırasında Grupla'yı kilitler; animasyon durumunu yönetir |

Arayüz şunları **yapmaz:** kelime metniyle doğruluk denetlemek, `puzzle.groups` üzerinden çok yakın hesaplamak, hak düşürmek, kazanmayı `solvedGroupIds.length` ile çıkarmak, tekrar tahmini kendisi aramak. Grupla düğmesinin `selectedWordIds.length === GAME_CONSTANTS.groupSize` iken etkin gösterilmesi ve kaybedince `solvedGroupIds` içinde olmayan grupların listelenmesi sunum kararıdır; asıl denetim ve çözülmüş sayma kararı motordadır.

## 9. Dört zorluk katmanı

Kaynak: plan §5. Her bulmacada dört katmanın her biri tam bir kez kullanılır (`PuzzleGroup.difficulty`).

| Değer | Katman | Hedef |
| --- | --- | --- |
| 1 | Kolay | Oyuncunun oyuna girmesini sağlayan, geniş kitlece bilinen bağlantı |
| 2 | Orta | Dikkat veya yaygın kültürel bilgi isteyen bağlantı |
| 3 | Zor | Çok anlamlılık, ifade tamamlama ya da daha dolaylı ilişki |
| 4 | Çetin | Tutarlı bir dil oyunu veya güçlü fakat adil şaşırtma |

- Zorluk yalnız kategori konusundan çıkarılmaz; kör çözüm denemeleriyle ayarlanır.
- Kategoriler ve zorluklar başlangıçta oyuncuya gizlidir. Zorluk oyun kurallarını (hak, değerlendirme) etkilemez.

## 10. Adalet ilkeleri

Kaynak: plan §5; uygulama ayrıntısı [PUZZLE_GUIDE.md](PUZZLE_GUIDE.md).

- **Tek çözüm:** 16 kelimenin tamamını aynı güçte açıklayan ikinci bir tam gruplama elenme nedenidir. Yanıltıcı bir dörtlü kendi içinde anlamlı olabilir.
- **Tek kural:** Grubun dört kelimesi aynı kurala uyar; gizli ve tutarsız istisna kullanılmaz.
- **Savunulabilir açıklama:** Her grubun kısa açıklaması zorunludur; bağ zorlama açıklama gerektirmemelidir.
- **Dürüst yanıltma:** Şaşırtma gerçek çift anlamlardan, deyimlerden, ortak kullanılan sözcüklerden, ses veya yazı oyunlarından doğar.
- **Görsel tutarlılık:** Büyük/küçük harfe dayalı bir oyun varsa görsel gösterim de kurala uygundur.
- **Sabit ipucu düzeyi:** Çok yakın geri bildirimi hangi kelimenin farklı olduğunu söylemez.
- **Cezasız hatalı giriş:** Tekrarlanan ve geçersiz gönderimler hak düşürmez, geçmişe ve paylaşıma girmez.

## 11. Planda açık bırakılan ve burada netleştirilen noktalar

Plan §4 aşağıdakileri doğrudan yazmaz. Örnek adaptör (Q03) ve motor (Q09, Q10) bu kararlara göre yazılır; Mehmet'in arayüz ihtiyaç kontrolünde değişirse `contracts.ts`, bu belge ve CONTRACTS.md birlikte güncellenir.

1. `one-away` sonrası seçim korunur (yanlış tahminle aynı).
2. `repeated` ve `invalid` gönderimlerde `snapshot` hiç değişmez; seçim dahil.
3. Gönderim denetim sırası §3'teki gibidir; örneğin terminal oyunda eksik seçim `game-ended` döner.
4. Hakkı sıfıra indiren çok yakın tahminin sonucu `one-away` kalır; durum `lost` olur.
5. Terminal durumda `selectedWordIds` boştur; son tahminin kelimeleri `attempts` dizisinin son kaydındadır.
6. Kaybedince `remainingWordOrder` son tahta sırasıyla korunur, `solvedGroupIds` değişmez.
7. Dört kart seçiliyken beşinci karta basmak ve kurala aykırı diğer çağrılar hata fırlatmaz, durumu değiştirmez.
8. Terminal oyunda `toggleWord`, `shuffle` ve `clearSelection` etkisizdir; süre ilerlemez.
9. `solvedGroupIds` grupların bulunma sırasını korur.
10. Doğru çıkmış dörtlünün yeniden gönderimi `repeated` değil `invalid-words` döner, çünkü kelimeleri çözülmüştür.
