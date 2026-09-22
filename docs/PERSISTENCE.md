# İlerleme kaydı ve güvenli devam

Quadro oyuncunun günlük oturumunu tarayıcıda saklar: sayfa yenilense, sekme
kapatılıp açılsa da oyun aynı durumdan ve **aynı kart sırasından** sürer. Kayıt
`localStorage` üzerindedir; hesap, sunucu veya çerez kullanılmaz.

Kod: `src/lib/persistence/` (saf kurallar), `src/features/game/state/`
(motor + React bağı) ve `src/features/game/scoring/` (kişisel istatistik hesabı).
Kaynak görevler: Q20 / #20, Q21 / #21 ve Q22 / #22.

## Ne kaydedilir

Kaydedilen şey `GameSnapshot`ın kendisidir (`src/features/game/contracts.ts`):
şema sürümü, bulmaca kimliği ve revizyonu, yayın günü, durum, seçim, kart
sırası, çözülen gruplar, kalan hak, tahmin geçmişi ve aktif süre. Kayıt bir
sarmalayıcı içinde tutulur:

```json
{ "savedAt": "2026-09-20T09:30:00.000Z", "snapshot": { "schemaVersion": 1, … } }
```

`savedAt` yalnız destek ve ayıklama içindir; hiçbir kurala girmez.

## Anahtar

```
quadro:save:v1:<dayKey>     → günün kaydı
quadro:save:v1:last-day     → en son yazılan gün
```

Anahtar güne özgüdür, şema sürümü anahtarın içindedir. Gün dönünce yeni gün
yazılırken `last-day` işaretçisiyle dünün kaydı silinir; depoda tek bir oyun
kaydı kalır.

Gün anahtarını **sunucu** söyler: istemci bulmacanın kendi tarihini kullanır,
cihaz saatine bakmaz (bkz. `docs/DAILY_PUBLISHING.md`). Saati ileri alınmış bir
cihaz böylece yarının kaydını bugüne yazamaz.

## Kayıt ne zaman uygulanmaz

Kayıt okunduğunda aşağıdaki denetimlerden geçer. Herhangi biri düşerse kayıt
**sessizce reddedilir, depodan silinir ve oyun taze başlar**; hiçbir durumda
hata fırlatılmaz.

| Gerekçe | Kural |
| --- | --- |
| `malformed-json` | Metin geçerli JSON değil. |
| `malformed-record` | Alan eksik ya da tipi yanlış. |
| `schema-mismatch` | `schemaVersion` bu sürümün beklediği değil. |
| `puzzle-mismatch` | Başka bulmacanın kaydı ya da bulmaca düzeltilmiş (revizyon farkı). |
| `day-mismatch` | Başka yayın gününün kaydı: dünün oyunu bugüne taşınmaz. |
| `group-mismatch` | Çözülmüş işaretli grup bulmacada yok. |
| `word-set-mismatch` | Kalan kartlar + çözülmüş grupların kelimeleri bulmacanın 16 kelimesini vermiyor. |
| `state-mismatch` | Alanlar motorun üretemeyeceği bir durumu anlatıyor (hak geri doldurulmuş, kazanılmadan `won` vb.). |

Kart **sırası** denetlenmez, yalnız kümesi denetlenir: oyuncu tahtayı
karıştırmış olabilir; korunan şey sıranın kendisidir.

## Bitmiş oyunun korunması

Depodaki kayıt `won`/`lost` ise, aynı bulmacanın aynı günü için taze bir
`playing` durumu **yazılmaz** (`kept-result`). Oyun bir nedenle sıfırdan
kurulsa bile bugünkü sonuç ve istatistik depoda olduğu gibi kalır; sonucun
ikinci kez işlenmesi engellenir. Motor tarafında terminal oyunda gönderim zaten
`invalid / game-ended` döner (Q10).

## Sunucu, SSR ve hidrasyon

- `localStorage`a yalnız `src/lib/persistence/storage.ts` dokunur. `window`
  yoksa, `localStorage` kapalıysa veya kota dolduysa depo sessizce no-op'a
  düşer; uygulama kayıtsız çalışmaya devam eder.
- Tahta her zaman motorun **tohumlu** taze durumuyla kurulur, bu yüzden
  sunucunun ve istemcinin ilk ağacı birebir aynıdır.
- Kayıt yalnız istemcide, bağlanmadan sonra bir etki içinde devralınır
  (`GameStore.hydrate`). Devralma öncesi hiçbir şey **yazılmaz**; yoksa taze
  tahta, henüz okunmamış kaydın üzerine yazılırdı.
- Durum React state'inde değil, `useSyncExternalStore` ile okunan mağazadadır;
  kayıt bir dış sistem olarak mağazanın yaşam döngüsüne bağlıdır.

## Aktif süre (Q21)

`activeSeconds` kaydın sıradan bir alanıdır ama yazma sıklığını o belirler:
oyun sürerken sayaç **saniyede bir** güncel değeri duruma yazar, dolayısıyla
kayıt da saniyede bir tazelenir. Sekme beklenmedik biçimde kapanırsa en çok bir
saniye kaybedilir.

Süre bir duvar saati farkı değildir; kuralları `docs/GAME_RULES.md` §3'te. Kayıt
açısından önemli olan iki nokta:

- **Devralma sayacın tabanını belirler.** `GameStore.hydrate` kaydı uyguladıktan
  sonra sayaç kayıttaki süreden yeniden kurulur ve oturum ancak o andan itibaren
  işler. Yenilemede süre ne sıfırlanır ne de oyunun kapalı geçtiği zaman eklenir.
- **Süre duruma eklenmez, üzerine yazılır.** Sayaç her akıtmada toplamı baştan
  hesaplar, bu yüzden akıtma sıklığı sonucu değiştirmez ve üst üste gelen
  görünürlük olayları süreyi iki kez saymaz.

Makuliyet sınırı sayaç tarafındadır (`MAX_ACTIVE_SECONDS`, 24 saat): elle
kurcalanmış uçuk bir değer devralınırken kırpılır. Kayıt katmanının kuralı
değişmedi — `record.ts` `activeSeconds` için yalnız "sonlu ve negatif olmayan
sayı" ister.

## Kişisel istatistikler (Q22)

İstatistikler de hesap gerektirmeden **bu tarayıcıya / bu cihaza** aittir.
Sunucuya gönderilmez ve başka cihazla otomatik birleşmez. Terminal günlük
sonuçlar ayrı bir küçük defterde tutulur:

```
quadro:stats:v2
```

Defter hesaplanmış toplamları değil, her yayın günü için tek terminal sonucu
saklar. `played`, `won`, `lost`, kazanma oranı, güncel seri, en uzun seri ve
ortalama hata her okumada `src/features/game/scoring/` içindeki saf hesaptan
yeniden üretilir. Aynı `dayKey` ikinci kez yazılmaz; bitmiş oyun yeniden açılsa,
snapshot yeniden kaydedilse veya aynı bitiş tekrar işlense istatistik **bir kez**
değişir.

Seri kuralı yayın gününe göredir:

- Kazanılan ardışık Türkiye yayın günleri seriyi büyütür.
- Kayıp güncel seriyi sıfırlar.
- İki kaydedilmiş sonuç arasında bir yayın günü atlanmışsa sonraki kazanç yeni
  seri başlatır.
- Bugünün henüz oynanmamış olması seriyi erkenden sıfırlamaz; boşluk ancak daha
  sonraki bir sonuç kaydedildiğinde kesinleşir.
- Terminal sonuç her zaman snapshot'ın kendi `dayKey` gününe yazılır; böylece
  oynanan/kazanılan toplamları doğru bulmacaya aittir.
- **Seri yalnız kazanma kendi Türkiye yayın günü içinde tamamlandıysa ilerler.**
  Örneğin 20 Eylül bulmacası 21 Eylül 00:30'da kazanılırsa oyun kazanılmış
  sayılır fakat 20 Eylül seriye eklenmez; sonraki zamanında kazanılan gün yeni
  seriyi 1'den başlatır.

Ortalama hata, tamamlanan oyunlarda kullanılan hata hakkıdır:
`4 - mistakesRemaining`. Kaybedilen oyun motor gereği dört hata olarak girer.
Oynanmamış veya yarım bırakılmış oyunlar kişisel istatistiğe girmez.

İstatistik defteri bozuk JSON, yanlış şema, geçersiz tarih veya yinelenen gün
içerirse yalnız `quadro:stats:v2` silinir ve boş istatistikle güvenli biçimde
devam edilir. Günlük oyun snapshot'ına dokunulmaz. Aynı terminal snapshot daha
sonra yeniden kaydedilirse o günün sonucu temiz deftere tekrar eklenebilir.

## Testler

- `src/lib/persistence/*.test.ts` — depo, biçim, uyumluluk ve istatistik
  kuralları; bellekteki sahte depoyla.
- `src/features/game/scoring/*.test.ts` — seri, gün atlama, kayıp ve ortalama
  hata hesabı.
- `src/features/game/state/*.test.ts` — devralma sırası, kaydetme, bitmiş
  oyunun korunması ve aktif süre sayacı; React'siz, kontrollü saatle.
- `tests/e2e/kayit-devam.test.tsx` — gerçek `/play` akışı: yenileme sonrası
  devam, bozuk kayıt, başka bulmacanın kaydı ve bitmiş oyun.
- `tests/e2e/aktif-sure.test.tsx` — gerçek `/play` akışında görünürlük, odak,
  yenileme ve terminal durumların süreye etkisi.
