# Quadro oyun sözleşmesi

Durum: Q02 (#2) · Sahip: Utku · Tek doğruluk kaynağı: [`src/features/game/contracts.ts`](../src/features/game/contracts.ts)

Bu belge motor, örnek adaptör ve arayüz arasındaki ortak tiplerin ne işe yaradığını ve nasıl davrandığını örneklerle açıklar. Tipler [PROJE_PLANI.md §6](../PROJE_PLANI.md#6-ortak-teknik-sözleşme) sözleşmesinin birebir karşılığıdır. Kesin kurallar ve uç durumlar [GAME_RULES.md](GAME_RULES.md) içindedir.

## Değişiklik kuralı

- **`contracts.ts` tek doğruluk kaynağıdır.** Bu belge ile kod çelişirse kod esastır ve belge düzeltilir.
- `src/features/game/contracts.ts`, `docs/GAME_RULES.md` ve `docs/CONTRACTS.md` **aynı PR içinde** güncellenir.
- Sözleşme değişirse örnek adaptör (Q03), gerçek motor ve arayüz tüketicileri aynı değişiklik zincirinde uyarlanır ([CONTRIBUTING.md](../CONTRIBUTING.md)).

## Tipler bir bakışta

| Tip | Rolü | Üreten | Tüketen |
| --- | --- | --- | --- |
| `Four<T>` | Tam dört elemanlı demet; dört grup, dört kelime, dört kimlikli tahmin | — | Tümü |
| `WordId` | Kelimenin kararlı kimliği; seçim metinle değil bununla yapılır | İçerik | Motor, arayüz, kayıt |
| `GameStatus` | `playing`, `won`, `lost` | Motor | Arayüz, kayıt, seri |
| `PuzzleWord`, `PuzzleGroup`, `Puzzle` | Kanonik bulmaca verisi | İçerik ve günlük yayın (Q18, Q19) | Motor, sonuç ekranı |
| `Attempt` | Tahmin geçmişinin bir kaydı | Motor | Paylaşım (Q15), istatistik |
| `GameSnapshot` | Oyunun kalıcı, geri yüklenebilir durumu | Motor | Arayüz, kayıt (Q20) |
| `SubmitOutcome` | Tek gönderimin geçici sonucu | Motor | Arayüz mesajı ve animasyonu |
| `SubmitResult` | `outcome` + gönderim sonrası `snapshot` | Motor | Adaptör, arayüz |
| `GameController` | Arayüzün oyunla konuştuğu tek arayüz | Örnek adaptör (Q03), gerçek motor (Q09, Q10, Q16) | Arayüz |

Yardımcılar: `GAME_CONSTANTS`, `normalizeTr`, `slugifyTr`, `attemptKey` (bkz. [Yardımcılar](#yardımcılar)).

## Sonuç ≠ durum

`SubmitResult` iki ayrı soruyu yanıtlar:

| | `outcome: SubmitOutcome` | `snapshot: GameSnapshot` |
| --- | --- | --- |
| Soru | Bu gönderimde ne oldu? | Oyun şimdi ne durumda? |
| Ömür | Geçici; kaydedilmez, yenilemede kaybolur | Kalıcı; kaydedilir ve geri yüklenir |
| Arayüzde | Mesaj, grup açılma veya hata animasyonu | Tahta, haklar, çözülen gruplar, sonuç ekranı |
| Kazanma/kaybetme | **Taşımaz** | `status = "won" \| "lost"` |

Bu ayrım sayesinde:

- **Son doğru gönderim** `outcome = { verdict: "correct", solvedGroup }` ve `snapshot.status = "won"` döndürür. Son grup animasyonu ile sonuç ekranı aynı yanıttan beslenir; ayrı bir “won” sonucu yoktur.
- **Dördüncü hata** kendi değerlendirmesini (`wrong` veya `one-away`) korur ve `snapshot.status = "lost"` taşır.
- **Tahmin geçmişi** yalnız `correct`, `one-away` ve `wrong` içerir (`Attempt["verdict"]`). `repeated` ve `invalid` geçmişe girmez, paylaşım satırı üretmez.
- **Yenileme sonrası** `outcome` yoktur; arayüz yalnız `snapshot` ile çizer.

Arayüzün kullanım kalıbı:

```ts
const { outcome, snapshot } = controller.submitSelection();

// 1) Bu gönderimin geri bildirimi (geçici)
switch (outcome.verdict) {
  case "correct":
    // outcome.solvedGroup: başlık, dört kelime ve açıklama ile grup satırını aç
    break;
  case "one-away":
    // "Bir kelime uzaktasın" — hangi kelimenin farklı olduğu bilinmez
    break;
  case "wrong":
    // seçili kartlarda kısa hata geri bildirimi
    break;
  case "repeated":
    // tekrar mesajı; hak düşmedi
    break;
  case "invalid":
    // outcome.reason: "selection-count" | "invalid-words" | "game-ended"; hak düşmedi
    break;
}

// 2) Oyunun vardığı durum (kalıcı)
if (snapshot.status !== "playing") {
  // geri bildirim animasyonu bitince sonuç görünümünü aç
}
```

## `GameSnapshot` alanları

| Alan | Anlamı |
| --- | --- |
| `schemaVersion` | Kayıt şemasının sürümü (`1`). |
| `puzzleId`, `puzzleRevision` | Durumun ait olduğu bulmaca ve revizyon; uyumsuz kayıt tespiti için. |
| `dayKey` | Oyunun ait olduğu `Europe/Istanbul` yayın günü (`YYYY-MM-DD`). |
| `status` | `playing`, `won` veya `lost`. |
| `selectedWordIds` | Seçili, çözülmemiş 0–4 kimlik. Terminal durumda boş. |
| `remainingWordOrder` | Çözülmemiş kelimelerin tahtadaki gösterim sırası. `won` durumunda boş. |
| `solvedGroupIds` | Oyuncunun gerçekten bulduğu gruplar, bulunma sırasıyla. Kaybedince açılan cevaplar eklenmez. |
| `mistakesRemaining` | Kalan hata hakkı; `GAME_CONSTANTS.maxMistakes` ile başlar. |
| `attempts` | `correct`, `one-away` ve `wrong` tahminlerin kronolojik geçmişi. |
| `activeSeconds` | Yalnız görünür ve aktif oyun ekranında geçen süre (saniye). |

## `GameController`

- `snapshot` her zaman güncel durumdur. Eylemden sonra yeni durum buradan okunur; React adaptörü (Q03) yeniden çizimi sağlar.
- `toggleWord`, `clearSelection` ve `shuffle` `void` döner. Kurala aykırı çağrılar hata fırlatmaz, durumu değiştirmez.
- `submitSelection` senkron çalışır ve `SubmitResult` döner; dönen `snapshot`, `controller.snapshot`'ın yeni değeridir.

## Örnek bulmaca

Aşağıdaki bulmaca yalnız belge ve test örneğidir; yayın stoğunda yer almaz. Zorluk değerleri temsilîdir. Kimlikler `slugifyTr` ile üretilmiştir ve [`contracts.test.ts`](../src/features/game/contracts.test.ts) aynı veriyi kullanır.

| Grup kimliği | Başlık | Zorluk | Kelime kimlikleri |
| --- | --- | --- | --- |
| `renkler` | RENKLER | 1 | `kirmizi`, `mavi`, `yesil`, `sari` |
| `meyveler` | MEYVELER | 2 | `elma`, `armut`, `kiraz`, `incir` |
| `gezegenler` | GEZEGENLER | 3 | `mars`, `venus`, `saturn`, `merkur` |
| `sehirler` | ŞEHİRLER | 4 | `adana`, `bursa`, `izmir`, `mugla` |

Başlangıç durumu:

```ts
const s0: GameSnapshot = {
  schemaVersion: 1,
  puzzleId: "ornek-001",
  puzzleRevision: 1,
  dayKey: "2026-09-20",
  status: "playing",
  selectedWordIds: [],
  remainingWordOrder: [/* 16 kimlik, tahtadaki sırayla */],
  solvedGroupIds: [],
  mistakesRemaining: 4,
  attempts: [],
  activeSeconds: 0,
};
```

## Örnek akışlar

Akışlarda `snapshot` altında yalnız değişen veya dikkat edilmesi gereken alanlar gösterilir. `a1` gibi tahmin kimliklerinin biçimi örnektir; üretimi motorun işidir.

### 1. Doğru — son grup değil

Seçim: `["kiraz", "elma", "incir", "armut"]`

```ts
controller.submitSelection();
// outcome
{ verdict: "correct", solvedGroup: /* meyveler: başlık, 4 kelime, açıklama */ }
// snapshot
{
  status: "playing",
  selectedWordIds: [],                         // seçim temizlendi
  remainingWordOrder: [/* 12 kimlik; meyveler çıktı */],
  solvedGroupIds: ["meyveler"],
  mistakesRemaining: 4,                        // hak azalmadı
  attempts: [{ id: "a1", wordIds: ["kiraz", "elma", "incir", "armut"], verdict: "correct" }],
}
```

### 2. Doğru — dördüncü grup, `won`

Önce: `solvedGroupIds = ["meyveler", "renkler", "gezegenler"]`, tahtada yalnız şehirler, `mistakesRemaining = 3`. Seçim: `["adana", "bursa", "izmir", "mugla"]`

```ts
controller.submitSelection();
// outcome — son grup animasyonu bunu kullanır
{ verdict: "correct", solvedGroup: /* sehirler */ }
// snapshot — sonuç ekranı bunu kullanır
{
  status: "won",
  selectedWordIds: [],
  remainingWordOrder: [],
  solvedGroupIds: ["meyveler", "renkler", "gezegenler", "sehirler"],
  mistakesRemaining: 3,
  attempts: [/* önceki kayıtlar */, { id: "a6", wordIds: ["adana", "bursa", "izmir", "mugla"], verdict: "correct" }],
}
```

### 3. Çok yakın

Önce: 1. akışın sonu, `mistakesRemaining = 4`. Seçim: `["mars", "venus", "saturn", "adana"]` (üç gezegen, bir şehir)

```ts
controller.submitSelection();
// outcome — hangi kelimenin farklı olduğu bilgisi yok
{ verdict: "one-away" }
// snapshot
{
  status: "playing",
  selectedWordIds: ["mars", "venus", "saturn", "adana"], // seçim korunur
  mistakesRemaining: 3,
  attempts: [/* a1 */, { id: "a2", wordIds: ["mars", "venus", "saturn", "adana"], verdict: "one-away" }],
}
```

Arayüz “Bir kelime uzaktasın” mesajını gösterir.

### 4. Yanlış

Önce: `mistakesRemaining = 3`. Seçim: `["mars", "kirmizi", "adana", "mavi"]` (her gruptan en fazla iki kelime)

```ts
controller.submitSelection();
// outcome
{ verdict: "wrong" }
// snapshot
{
  status: "playing",
  selectedWordIds: ["mars", "kirmizi", "adana", "mavi"], // oyuncu kelimeleri değiştirebilir
  mistakesRemaining: 2,
  attempts: [/* ... */, { id: "a3", wordIds: ["mars", "kirmizi", "adana", "mavi"], verdict: "wrong" }],
}
```

### 5. Yanlış — dördüncü hata, `lost`

Önce: `mistakesRemaining = 1`, `solvedGroupIds = ["meyveler"]`. Seçim: `["bursa", "kirmizi", "venus", "izmir"]`

```ts
controller.submitSelection();
// outcome — tahminin kendi sonucu korunur
{ verdict: "wrong" }
// snapshot
{
  status: "lost",
  selectedWordIds: [],                          // terminal durumda boş
  remainingWordOrder: [/* 12 kimlik; son tahta sırası korunur */],
  solvedGroupIds: ["meyveler"],                 // açılan cevaplar çözülmüş sayılmaz
  mistakesRemaining: 0,
  attempts: [/* ... */, { id: "a5", wordIds: ["bursa", "kirmizi", "venus", "izmir"], verdict: "wrong" }],
}
```

Arayüz kalan üç grubu başlık ve açıklamasıyla gösterir; “bulunan grup” 1/4'tür. Son hak çok yakın tahminle giderse `outcome = { verdict: "one-away" }`, durum yine `lost` olur.

### 6. Tekrarlanan tahmin

Önce: `attempts` içinde `["mars", "venus", "saturn", "adana"]` (`one-away`) var, `mistakesRemaining = 3`. Seçim: `["adana", "saturn", "venus", "mars"]`

```ts
attemptKey(["adana", "saturn", "venus", "mars"]) ===
  attemptKey(["mars", "venus", "saturn", "adana"]); // true

controller.submitSelection();
// outcome
{ verdict: "repeated" }
// snapshot — hiçbir alan değişmez: hak 3, geçmiş aynı, seçim aynı
```

### 7. Geçersiz gönderim

Her üç durumda da `snapshot` değişmez ve hak azalmaz.

| Önce | `outcome` |
| --- | --- |
| Seçimde üç kimlik var: `["mars", "venus", "saturn"]` | `{ verdict: "invalid", reason: "selection-count" }` |
| Kayıttan gelen seçimde tekrar eden (`["mars", "mars", ...]`), bilinmeyen (`"yok"`) veya çözülmüş (`"elma"`) kimlik var | `{ verdict: "invalid", reason: "invalid-words" }` |
| `status` `won` veya `lost` | `{ verdict: "invalid", reason: "game-ended" }` |

### 8. Bitmiş oyun

Önce: `status = "won"` veya `"lost"`.

```ts
controller.submitSelection(); // { verdict: "invalid", reason: "game-ended" }, snapshot aynı
controller.toggleWord("mars"); // etkisiz
controller.shuffle();          // etkisiz
controller.clearSelection();   // etkisiz
```

Sayfa yenilendiğinde `outcome` yoktur; arayüz `snapshot.status` terminal olduğu için doğrudan sonuç görünümünü açar.

### 9. Karıştır

Önce: `remainingWordOrder = ["mars", "kirmizi", "adana", "venus", /* 8 kimlik daha */]`, `selectedWordIds = ["mars", "venus"]`, `mistakesRemaining = 3`.

```ts
controller.shuffle();
// snapshot
{
  remainingWordOrder: ["venus", "sari", "mars", /* aynı 12 kimliğin yeni sırası */],
  selectedWordIds: ["mars", "venus"],           // seçim korunur
  mistakesRemaining: 3,                         // haklar korunur
  // solvedGroupIds ve attempts değişmez
}
```

### 10. Seçimi temizle

Önce: `selectedWordIds = ["mars", "venus", "saturn"]`, `mistakesRemaining = 3`.

```ts
controller.clearSelection();
// snapshot
{
  selectedWordIds: [],
  mistakesRemaining: 3,                         // hak azalmaz
  // diğer alanlar değişmez
}
```

## Yardımcılar

| Ad | Ne yapar | Örnek | Kullanım yeri |
| --- | --- | --- | --- |
| `GAME_CONSTANTS` | 16 kelime, 4 grup, 4 kelime/grup, 4 hata hakkı | `GAME_CONSTANTS.maxMistakes // 4` | Motor, doğrulayıcı, arayüz metinleri |
| `normalizeTr(text)` | NFC + Türkçe küçültme (`I`→`ı`, `İ`→`i`) + boşluk sadeleştirme | `normalizeTr("  İSTANBUL ") // "istanbul"` | İçerik karşılaştırması, yinelenen kelime denetimi |
| `slugifyTr(text)` | Kararlı ASCII `WordId` üretimi | `slugifyTr("GÜNEŞ") // "gunes"`, `slugifyTr("Kara Deniz!") // "kara-deniz"` | İçerik araçları, örnek veriler |
| `attemptKey(wordIds)` | Dörtlüyü sıralayıp birleştirerek sıradan bağımsız anahtar | `attemptKey(["b", "a", "d", "c"]) === attemptKey(["a", "b", "c", "d"])` | Tekrarlanan tahmin denetimi |

Hepsi saf fonksiyondur ve yerel ayar verisine bağlı değildir. Kimlik ve normalizasyon kuralları için [GAME_RULES.md §7](GAME_RULES.md#7-kimlikler-ve-türkçe-normalizasyon).
