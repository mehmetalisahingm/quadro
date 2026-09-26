# Quadro analytics ve hata takibi

Bu belge Q34 kapsamındaki ilk ölçüm sözleşmesini tanımlar. İlk sürüm harici/ücretli bir analytics sağlayıcısına bağlı değildir: tarayıcı olayları sınırlı bir `localStorage` kuyruğuna yazılır ve aynı anda `quadro:analytics` / `quadro:monitoring` DOM olayları yayımlanır. Böylece pilotta geliştirici araçlarıyla doğrulanabilir, ileride bir taşıyıcı eklenirken ürün kodunun olay sözleşmesi değişmez.

## Ürün olayları

| Olay | Ne zaman | Alanlar |
| --- | --- | --- |
| `home_view` | Ana sayfa istemci durumu çözüldüğünde | `state`, `dayKey`, `puzzleAvailable` |
| `game_start` | Oynanabilir günlük oyun ilk kez ekrana geldiğinde | `puzzleId`, `revision`, `dayKey`, `resumed` |
| `first_attempt` | O oyundaki ilk kabul edilen grup gönderiminde | `puzzleId`, `revision`, `verdict`, `mistakesRemaining` |
| `game_finish` | Oyun `won` veya `lost` olduğunda | `puzzleId`, `revision`, `dayKey`, `status`, `attemptCount`, `mistakesUsed`, `activeSeconds` |
| `share_attempt` | Kullanıcı paylaş/kopyala eylemini başlattığında | `puzzleId`, `revision`, `method` |
| `retention_visit` | Bir tarayıcıda o yayın gününün ilk ziyareti | `cohortDay`, `activeDay`, `dayOffset`, `milestone` |

### Tekilleştirme

`game_finish`, `finish:<puzzleId>:<revision>` anahtarıyla kalıcı olarak tekilleştirilir. Sonuç ekranının yeniden açılması, sayfanın yenilenmesi veya React yeniden mount işlemi aynı bitişi ikinci kez saymaz.

`retention_visit` de yayın günü başına bir kez yazılır. Olay kuyruğu son 250, dedupe anahtarları son 500 kayıtla sınırlıdır.

## D1 / D7 tanımı

- **D0:** Aynı tarayıcıda ilk görülen Europe/Istanbul takvim günü.
- **D1:** Aynı tarayıcı D0'dan tam 1 takvim günü sonra tekrar aktif oldu.
- **D7:** Aynı tarayıcı D0'dan tam 7 takvim günü sonra tekrar aktif oldu.
- Takvim günü hesabı `Europe/Istanbul` gün sınırına göre yapılır; 24 saatlik kayan pencere değildir.

Bu metrik **tarayıcı bazlıdır, kullanıcı bazlı değildir**. Site verisini silmek, gizli sekme, farklı tarayıcı veya farklı cihaz yeni bir cohort yaratabilir. Giriş hesabı olmadığı için cihazlar birleştirilmez. Bu kısıt D1/D7 raporlanırken açıkça belirtilmelidir.

## Gizlilik ve spoiler sınırı

Analytics olaylarına şu veriler **girmez**:

- seçilen `wordId` listeleri,
- kelime metinleri,
- grup/kategori başlıkları ve açıklamaları,
- cevap anahtarı,
- paylaşım metninin kendisi,
- clipboard içeriği,
- stack trace.

`puzzleId`, revision, sonuç, sayaç ve süre gibi cevap vermeyen operasyonel alanlar kullanılabilir.

## Paylaşım metriğinin anlamı

`share_attempt` yalnızca kullanıcının paylaşma niyetiyle düğmeye bastığını gösterir. `navigator.share()` başarıyla dönse bile bunun başka bir kişiye gerçekten gönderildiği iddia edilmez.

- `native-share`: cihazın native paylaşım penceresi açılmaya çalışıldı.
- `clipboard`: kullanıcı doğrudan Kopyala'ya bastı.
- `share-fallback`: Paylaş'a basıldı ancak native API yoktu; clipboard fallback denendi.

Bu nedenle raporda metrik adı **paylaşım girişimi** olmalıdır; “gönderildi/paylaşıldı” şeklinde yorumlanmamalıdır.

## Teknik hata kaydı

`src/lib/monitoring` global `window.error` ve `unhandledrejection` olaylarını dinler. Kayıtlar son 50 olayla sınırlıdır:

```json
{
  "at": "2026-09-26T20:00:00.000Z",
  "source": "window-error",
  "name": "TypeError",
  "message": "Örnek hata mesajı",
  "path": "/play"
}
```

Mesaj 240, path 160 karakterle sınırlandırılır; stack kaydedilmez.

## Örnek test oturumu

Yeni bir oyuncunun beklenen olay sırası:

1. `retention_visit` (`D0`)
2. `home_view` (`state=new`)
3. `game_start` (`resumed=false`)
4. `first_attempt`
5. `game_finish` (yalnız bir kez)
6. `share_attempt` (kullanıcı eylem yaparsa)

Tarayıcı konsolunda canlı doğrulama için:

```js
window.addEventListener("quadro:analytics", (event) => console.log(event.detail));
window.addEventListener("quadro:monitoring", (event) => console.log(event.detail));
```

Kalıcı pilot kaydı için `localStorage["quadro:analytics:v1"]` ve `localStorage["quadro:monitoring:v1"]` incelenebilir. Bu yerel taşıma ilk yayın öncesi sözleşme doğrulaması içindir; merkezi ürün analitiği istenirse aynı olayları tüketen ayrı bir adapter eklenmelidir.

## Doğrulama

Birim testleri şu kritik davranışları sabitler:

- bitişin aynı puzzle/revision için iki kez sayılmaması,
- event payload'ında cevap/kelime alanlarının bulunmaması,
- İstanbul gün sınırı ve D1/D7 gün farkı,
- hata mesajının sınırlandırılması ve stack'in kaydedilmemesi,
- hata kuyruğunun son 50 kayıtla sınırlı kalması.
