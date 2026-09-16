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

- `snapshot` her zaman güncel durumdur. Eylemden sonra yeni durum buradan okunur; React kancası yeniden çizimi sağlar (bkz. [Örnek adaptör ve senaryolar](#örnek-adaptör-ve-senaryolar-q03)).
- `toggleWord`, `clearSelection` ve `shuffle` `void` döner. Kurala aykırı çağrılar hata fırlatmaz, durumu değiştirmez.
- `submitSelection` senkron çalışır ve `SubmitResult` döner; dönen `snapshot`, `controller.snapshot`'ın yeni değeridir.

## Örnek bulmaca

Aşağıdaki bulmaca yalnız belge ve test örneğidir; yayın stoğunda yer almaz. Zorluk değerleri temsilîdir. Kimlikler `slugifyTr` ile üretilmiştir. Bulmaca [`fixtures/puzzles.ts`](../src/features/game/fixtures/puzzles.ts) içinde `standardPuzzle` olarak tanımlıdır; testler ve örnek adaptör senaryoları aynı veriyi kullanır.

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

## Örnek adaptör ve senaryolar (Q03)

Gerçek motor (Q09, Q10) hazır olmadan arayüz geliştirebilmek için `GameController` sözleşmesine uyan bellek içi örnek adaptör. [GAME_RULES.md](GAME_RULES.md) kurallarına uyar ve testlerle doğrulanır; ancak kayıt yapmaz, süre ölçmez ve gün değişimini bilmez. Q16'da gerçek motorla değiştirilir. Bileşenler yalnız `GameController` kullandığı sürece kodları değişmez.

| Dosya | İçerik |
| --- | --- |
| [`sampleController.ts`](../src/features/game/sampleController.ts) | `createSampleController`, `createInitialSampleSnapshot`, `createSeededRandom` |
| [`fixtures/puzzles.ts`](../src/features/game/fixtures/puzzles.ts) | `standardPuzzle`, `longWordsPuzzle`, `tutorialPuzzle` ve `TutorialPuzzle` tipi |
| [`fixtures/scenarios.ts`](../src/features/game/fixtures/scenarios.ts) | `SAMPLE_SCENARIO_IDS`, `createSampleScenario` |
| [`react/useSampleGame.ts`](../src/features/game/react/useSampleGame.ts) | `useSampleGame` React kancası |

### React bileşeninde kullanım

```tsx
"use client";

import { useState } from "react";

import { GAME_CONSTANTS, type SubmitOutcome } from "@/features/game/contracts";
import { useSampleGame } from "@/features/game/react/useSampleGame";

export function BoardPreview() {
  const { puzzle, controller, initialResult } = useSampleGame("one-away");
  const { snapshot } = controller;
  // Geri bildirim arayüzün durumudur; motor yalnız sonucu verir.
  const [feedback, setFeedback] = useState<SubmitOutcome | null>(initialResult?.outcome ?? null);

  // Kimlikten metne dönüşüm sunumdur, iş kuralı değildir.
  const words = new Map(puzzle.groups.flatMap((group) => group.words).map((word) => [word.id, word]));

  return (
    <>
      {snapshot.remainingWordOrder.map((id) => (
        <button
          key={id}
          aria-pressed={snapshot.selectedWordIds.includes(id)}
          onClick={() => controller.toggleWord(id)}
        >
          {words.get(id)?.text}
        </button>
      ))}
      <button
        disabled={snapshot.selectedWordIds.length !== GAME_CONSTANTS.groupSize}
        onClick={() => setFeedback(controller.submitSelection().outcome)}
      >
        Grupla
      </button>
      <button onClick={controller.shuffle}>Karıştır</button>
      <button onClick={controller.clearSelection}>Seçimi temizle</button>
      <p>Kalan hak: {snapshot.mistakesRemaining}</p>
      {feedback?.verdict === "one-away" ? <p role="status">Bir kelime uzaktasın</p> : null}
    </>
  );
}
```

- `controller.snapshot` her çizimde günceldir; eylemden sonra ayrıca durum kopyası tutulmaz.
- Mesaj ve animasyon durumu `submitSelection()` dönüşündeki `outcome` ile güncellenir. `initialResult` yalnız senaryo açılışındaki geri bildirimi göstermek içindir.
- `reset()` senaryoyu başlangıcına döndürür. Senaryo kimliği değişirse senaryo yeniden açılır.
- Başlangıç kart sırası tohumludur; sunucu ve istemci aynı tahtayı çizer. `Karıştır` sonrası sıra değişir.

### Senaryolar

`status · bulunan grup · kalan hak · seçili kart` sütunu senaryonun açılış durumudur. Senaryodan oynamaya devam edilebilir.

| Kimlik | Durum | Açılış durumu | Açılış sonucu | İlgili ekran |
| --- | --- | --- | --- | --- |
| `empty` | Boş oyun | `playing` · 0/4 · 4 · 0 | yok | Q13 tahta; ana sayfa `new` |
| `in-progress` | Yarım kalmış, yenileme sonrası | `playing` · 2/4 · 3 · 2 | yok | Q13; ana sayfa `in-progress` (“2/4 grup bulundu · 3 hata hakkı kaldı”) |
| `correct` | İlk doğru grup açıldı | `playing` · 1/4 · 4 · 0 | `correct` | Q14 grup satırı |
| `one-away` | Çok yakın | `playing` · 0/4 · 3 · 4 | `one-away` | Q14 mesaj |
| `wrong` | Yanlış | `playing` · 0/4 · 3 · 4 | `wrong` | Q14 hata geri bildirimi |
| `repeated` | Tekrarlanan tahmin | `playing` · 0/4 · 3 · 4 | `repeated` | Q14 mesaj |
| `last-chance` | Son hak | `playing` · 1/4 · 1 · 4 | `one-away` | Q14 hak göstergesi |
| `won` | Kazanılmış | `won` · 4/4 · 3 · 0 | `correct` | Q15 sonuç; ana sayfa `completed` (“4/4 grup · 1 hata · 02:18”) |
| `lost` | Kaybedilmiş | `lost` · 1/4 · 0 · 0 | `wrong` | Q15 sonuç; kalan üç grup gösterilir, çözülmüş sayılmaz |
| `long-words` | Uzun kelimeli boş tahta | `playing` · 0/4 · 4 · 0 | yok | Q13 320 px denemesi |

Ana sayfa eşlemeleri yalnız tasarım denemesi içindir. Gerçek verinin `HomePlayerState`'e dönüşümü Q23'te tek kaynaktan hesaplanır.

### React dışında kullanım

```ts
import { createSampleScenario, longWordsPuzzle } from "@/features/game/fixtures";
import { createSampleController } from "@/features/game/sampleController";

const { controller, lastResult } = createSampleScenario("last-chance");
controller.snapshot.mistakesRemaining; // 1
lastResult?.outcome.verdict; // "one-away"

const longBoard = createSampleController({ puzzle: longWordsPuzzle }); // boş, uzun kelimeli tahta
```

### Sınırlar

- Örnek bulmacalar yayın stoğunda değildir ve `src/content/puzzles/` altındaki günlük bulmacaların kelimelerini kullanmaz; bunu bir test denetler. Günlük bulmacalar fixture olarak kullanılmaz: istemci paketine girmemeleri gerekir (plan §7) ve kör denemeleri bozarlar.
- `tutorialPuzzle` iki gruplu ayrı bir veri türüdür, `Puzzle` değildir ve `GameController` ile oynatılmaz. Hak, süre ve istatistiği etkilemeyen öğretici davranışı Q12'de belirlenir.
- Örnek adaptör kayıt yapmaz ve süre ölçmez; `activeSeconds` senaryonun temsilî değerinde sabit kalır.
