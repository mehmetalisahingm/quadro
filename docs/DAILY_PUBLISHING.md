# Günlük yayın (Q19)

Quadro'nun günü **herkes için Türkiye gece yarısında** döner ve günün bulmacası
**sunucuda** seçilir. Bu belge o katmanın nasıl çalıştığını, hangi durumları ürettiğini
ve neyin denetlendiğini anlatır. Şema ve doğrulama kuralları
[`CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md), tipler [`CONTRACTS.md`](CONTRACTS.md) içindedir.

| Parça | Yol |
| --- | --- |
| Yayın günü hesabı | [`src/lib/daily/publicationDay.ts`](../src/lib/daily/publicationDay.ts) |
| İçerik yükleyici | [`src/lib/daily/dailyPuzzle.ts`](../src/lib/daily/dailyPuzzle.ts) |
| Sayfa bağlantısı | [`src/app/play/page.tsx`](../src/app/play/page.tsx) |
| Durum → ekran | [`src/components/game/DailyPuzzleSection.tsx`](../src/components/game/DailyPuzzleSection.tsx) |
| Paket denetimi | [`scripts/check-client-bundle.mjs`](../scripts/check-client-bundle.mjs) |
| Test içeriği | [`tests/fixtures/content/`](../tests/fixtures/content/README.md) |

## Yayın günü

Gün anahtarı (`YYYY-MM-DD`) `Intl.DateTimeFormat` ile **Europe/Istanbul** saat dilimi
verisinden hesaplanır; UTC+3 gibi sabit bir kaydırma varsayılmaz. Türkiye 2016'dan beri
yaz saati uygulamıyor, ama bu bir politika kararıdır ve geri alınabilir: kural değişirse
doğru davranış saat dilimi verisinden gelir, koddan değil. Testler hem bugünün sınırını
hem de Türkiye'nin yaz saati uyguladığı yılların sınırlarını kapsar.

Oyuncunun cihaz saati, sistem saat dilimi veya sunucunun bölgesi sonucu değiştirmez.
Aynı anda Los Angeles'taki ve Auckland'daki iki oyuncu aynı bulmacayı görür.

Hesap `Date.now()`'u kendi başına çağırmaz; değerlendirilecek an her zaman dışarıdan
verilebilir, gece yarısı sınırları böyle test edilir.

## İçerik okuma

Bir istek **yalnız o günün** dosyasını okur: `${QUADRO_CONTENT_DIR}/${gün}.json`. Dizin
listelenmez, komşu günler açılmaz, içerik statik olarak içe aktarılmaz.

Statik içe aktarım (`import ... from "@/content/puzzles/..."`) bilerek kullanılmaz:
tüm günleri modül grafiğine sokar ve yarının cevapları bugün istemciye sızabilir. Dosya
sistemi okuması bu sızıntıyı yapısal olarak imkânsız kılar — bir gün, bir dosya.

Şema denetimi ve tip daraltması Q18'in resmi doğrulayıcısından gelir; yükleyicinin
eklediği tek kural **yayın kapısıdır**: yalnız `status: "published"` içerik sunulur.
Tarihi gelmiş bir taslak da yayına çıkmaz.

## Durumlar

`loadDailyPuzzle` hata fırlatmaz; her zaman bir `DailyPuzzleState` döndürür.

| Durum | Anlamı |
| --- | --- |
| `ok` | Günün bulmacası hazır; editoryal alanlar soyulmuş `Puzzle` verisi taşır. |
| `missing` · `no-content` | O güne ait dosya yok. |
| `missing` · `not-published` | Dosya var ama `status` alanı `published` değil. |
| `missing` · `invalid-content` | Bozuk JSON, şemaya uymayan dosya ya da dosya adı ile `date` uyuşmazlığı. Doğrulayıcının sorunları `issues` içinde gelir. |
| `missing` · `unreadable` | Dosya okunamadı (izin, G/Ç hatası). |
| `loading` | Yükleyicinin üretmediği, arayüzün kullandığı bekleme durumu. |

`loading` birleşimde yer alır ki arayüz beklemeyi de aynı `switch` içinde ele alabilsin;
sunucu okuması her zaman sonuçlanır ve bu değeri hiç döndürmez.

`/play` içerik sunulamadığında **sade** bir bilgi kartı çizer: hangi güne bakıldığı,
tek cümlelik açıklama ve öğreticiye bir çıkış. Kart bilinçli olarak asgaridir —
yükleme, içerik hatası ve kayıt kurtarma ekranlarının asıl tasarımı **Q24**'ün
kapsamındadır. Gerekçe işaretlemede `data-reason` olarak taşınır; Q24 ekranı yazarken
hangi durumun çizildiğini buradan ayırt eder.

## Ortam değişkenleri

İkisi de yalnız sunucuda okunur ve üretimde tanımsız bırakılır.

| Değişken | Etkisi |
| --- | --- |
| `QUADRO_TODAY` | Gerçek saat yerine sabit bir yayın günü dayatır (`YYYY-MM-DD`). Geçersiz değer uyarıyla yok sayılır; site düşmez. |
| `QUADRO_CONTENT_DIR` | İçerik dizinini değiştirir. Göreli yol süreç çalışma dizinine göre çözülür. Varsayılan: `src/content/puzzles`. |

Testler bu ikisiyle `tests/fixtures/content/` altındaki sahte yayın stoğunu okur;
önizleme dağıtımlarında "yarının bulmacasını bugün gözden geçir" için de kullanılabilir.

## Denetimler

Kabul ölçütü "gelecek gün dosyaları ve editoryal kayıtlar istemci paketinde bulunmuyor"
iki katmanda korunur:

- **Kaynak düzeyi** — `src/lib/daily/clientBundle.test.ts` istemci bileşenlerinden
  (`"use client"`) başlayıp içe aktarım grafiğini yürür ve grafiğin içerik dosyalarına,
  günlük yayın katmanına veya Node yerleşiklerine uzanmadığını doğrular. Her `npm test`
  ile koşar, derleme beklemez.
- **Derleme çıktısı** — `npm run check:bundle` derlenmiş paketi tarar: `.next/static/**`
  içinde hiçbir günün içeriği bulunamaz, önceden çizilmiş sayfalarda yalnız derleme
  anındaki gün bulunabilir. `npm run check` sırasında `build`'den sonra çalışır.

## Dağıtım notu

Günlük içerik istek anında okunduğu için Next'in modül izlemesi dosyaları kendiliğinden
göremez. Yayın stoğu `next.config.mjs` içindeki `outputFileTracingIncludes` ile sunucu
çıktısına açıkça eklenir; yalnız `src/content/puzzles/*.json` eklenir, editoryal
kayıtlar ve kör tahtalar sunucuya da gitmez.
