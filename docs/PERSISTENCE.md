# İlerleme kaydı ve güvenli devam

Quadro oyuncunun günlük oturumunu tarayıcıda saklar: sayfa yenilense, sekme
kapatılıp açılsa da oyun aynı durumdan ve **aynı kart sırasından** sürer. Kayıt
`localStorage` üzerindedir; hesap, sunucu veya çerez kullanılmaz.

Kod: `src/lib/persistence/` (saf kurallar) ve `src/features/game/state/`
(motor + React bağı). Kaynak görev: Q20 / #20.

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

## Testler

- `src/lib/persistence/*.test.ts` — depo, biçim ve uyumluluk kuralları,
  bellekteki sahte depoyla.
- `src/features/game/state/*.test.ts` — devralma sırası, kaydetme ve bitmiş
  oyunun korunması; React'siz.
- `tests/e2e/kayit-devam.test.tsx` — gerçek `/play` akışı: yenileme sonrası
  devam, bozuk kayıt, başka bulmacanın kaydı ve bitmiş oyun.
