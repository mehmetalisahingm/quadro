# Bulmaca içerik şeması ve doğrulayıcı

Bu belge `src/content/` altındaki bulmaca verisinin şemasını ve Q18 ile gelen resmi
doğrulayıcının hangi kuralları denetlediğini anlatır. Yazım ve içerik ilkeleri
[`PUZZLE_GUIDE.md`](PUZZLE_GUIDE.md), tiplerin davranışı [`CONTRACTS.md`](CONTRACTS.md)
içindedir.

| Parça | Yol |
| --- | --- |
| Doğrulayıcı (tek kaynak) | [`src/features/game/validator/index.ts`](../src/features/game/validator/index.ts) |
| Doğrulayıcı testleri | [`src/features/game/validator/validator.test.ts`](../src/features/game/validator/validator.test.ts) |
| Komut | `npm run validate:content` → [`scripts/validate-content.mjs`](../scripts/validate-content.mjs) |
| Tip kaynağı | [`src/features/game/contracts.ts`](../src/features/game/contracts.ts) |

Kurallar yalnız doğrulayıcı modülünde tanımlıdır. Testler, komut ve ileride günlük
yayın (Q19) ile yayın stoğu görevleri (Q26/Q27) aynı fonksiyonları çağırır; kural
kopyası başka bir dosyada tutulmaz.

## Şema

### Günlük bulmaca dosyası — `src/content/puzzles/YYYY-MM-DD.json`

Dosya, `contracts.ts` içindeki `Puzzle` tipine üç editoryal alan ekler. Bu ayrım
bilinçlidir: editoryal alanlar oyuncuya gönderilmez, `toPuzzle()` ile soyulur.

| Alan | Tip | Açıklama |
| --- | --- | --- |
| `schemaVersion` | `1` | Veri şemasının sürümü. |
| `revision` | `number` (≥ 1, tam sayı) | İçerik revizyonu. |
| `id` | `string` | Bulmacanın kalıcı kimliği, ör. `q-005`. |
| `date` | `string` | `YYYY-MM-DD`, Europe/Istanbul yayın günü. Takvimde var olan bir gün olmalı. |
| `language` | `"tr"` | İçerik dili. |
| `status` | `string` | Yayın durumu. Bilinen değerler: `draft`, `published`. |
| `author` | `string` | Taslağı yazan kişinin kullanıcı adı. |
| `reviewer` | `string` | İsteğe bağlı kör denemeyi yapan kişinin kullanıcı adı. |
| `groups` | 4 × `PuzzleGroup` | Dört gizli grup. |

`PuzzleGroup`: `id`, `title`, `difficulty` (1–4), `explanation`, `words` (4 × `PuzzleWord`).
`PuzzleWord`: `id`, `text`.

### Kör tahta — `src/content/editorial/blind/YYYY-MM-DD.json`

Aynı 16 kelimeyi grup bilgisi olmadan, karıştırılmış sırayla taşır. İzin verilen
alanlar: `schemaVersion`, `id`, `date`, `language`, `purpose`, `words`. Her kelime
yalnız `id` ve `text` taşır.

## Denetlenen kurallar

Doğrulayıcı ilk hatada durmaz; yapı izin verdiği sürece tüm kuralları uygular ki bir
PR'daki sorunlar birlikte görülsün. Her sorun kararlı bir `code`, bir `severity`
(`error` / `warning`), alan yolu (`groups[2].words[1].text`) ve Türkçe bir mesaj taşır;
gruba veya kelimeye ait sorunlarda `groupIndex` ile `wordIndex` de doldurulur.

### Yapı ve üst düzey alanlar

| Kod | Ağırlık | Kural |
| --- | --- | --- |
| `puzzle-not-object` | error | Girdi bir nesne olmalı. |
| `schema-version` | error | `schemaVersion` 1 olmalı. |
| `revision` | error | `revision` 1 veya üstü tam sayı olmalı. |
| `puzzle-id` | error | `id` boş olamaz. |
| `date-format` | error | `date` `YYYY-MM-DD` biçiminde olmalı. |
| `date-invalid` | error | `date` takvimde var olan bir gün olmalı (ör. `2026-02-30` geçersiz). |
| `language` | error | `language` `"tr"` olmalı. |
| `status` / `author` / `reviewer` | error | İçerik dosyalarında bu alanlar boş olamaz. |
| `status-unknown` | warning | `status` bilinen değerlerden biri değil. Sözlük Q19 ile kesinleşecek. |

### Gruplar

| Kod | Ağırlık | Kural |
| --- | --- | --- |
| `group-count` | error | Tam dört grup olmalı. |
| `group-not-object` | error | Her grup bir nesne olmalı. |
| `group-id` / `group-id-duplicate` | error | Grup kimliği dolu ve bulmaca içinde benzersiz olmalı. |
| `group-title` | error | Kategori başlığı boş olamaz. |
| `group-explanation` | error | Çözüm açıklaması zorunludur. |
| `difficulty-value` | error | `difficulty` 1, 2, 3 veya 4 olmalı. |
| `difficulty-coverage` | error | Her zorluk katmanı tam bir kez kullanılmalı. |

### Kelimeler

| Kod | Ağırlık | Kural |
| --- | --- | --- |
| `word-count` | error | Her grup tam dört kelime içermeli (toplam 16). |
| `word-not-object` | error | Her kelime bir nesne olmalı. |
| `word-id` | error | Kelime kimliği boş olamaz. |
| `word-id-format` | error | Kimlik yalnız ASCII küçük harf, rakam ve tek tire içerebilir (`slugifyTr` kalıbı). |
| `word-id-duplicate` | error | Kelime kimlikleri bulmaca içinde benzersiz olmalı. |
| `word-text` | error | Kelime metni boş olamaz. |
| `word-duplicate` | error | `normalizeTr` ile aynı olan iki kelime bulunamaz; büyük/küçük harf, Türkçe `I`/`İ` ve boşluk farkları eritilir. |
| `word-length` | warning | 18 karakterden uzun kelimede 320 px okunurluğu kontrol edilmeli. |

### Dosyalar arası kurallar

`validatePuzzleSet` tüm içerik dosyalarını birlikte inceler:

| Kod | Ağırlık | Kural |
| --- | --- | --- |
| `file-date-mismatch` | error | Dosya adı ile `date` alanı aynı günü göstermeli. |
| `date-duplicate` | error | Aynı güne iki bulmaca atanamaz. |
| `puzzle-id-duplicate` | error | Bulmaca kimliği tekrar edemez. |

### Kör tahta

| Kod | Ağırlık | Kural |
| --- | --- | --- |
| `blind-id` / `blind-date` | error | Kör tahta kimliği ve tarihi kanonik bulmacayla aynı olmalı. |
| `blind-words` | error | Tam 16 kelime, kanonik bulmacayla birebir aynı küme. |
| `blind-word-shape` | error | Her kelime yalnız `id` ve `text` taşımalı. |
| `blind-reveals-answers` | error | `groups`, `difficulty`, `title`, `explanation`, `status` alanları bulunamaz. Bilinmeyen alanlar uyarı üretir. |
| `blind-order` | error | Sıra karıştırılmış olmalı; kanonik sırayla birebir aynı olamaz. |

## Doğrulayıcının denetlemediği şey

**İkinci tam gruplama (alternatif çözüm) makine ile denetlenmez.** 16 kelimeyi eşit
açıklayan ikinci bir gruplama olup olmadığı anlamsal bir yargıdır: kelimeler arasındaki
çağrışımların gücünü ölçmeyi gerektirir ve bu depoda böyle bir anlam modeli yoktur.
Doğrulayıcının temiz çıktısı "bu bulmacanın tek çözümü vardır" anlamına **gelmez**;
yalnız yapının, kimliklerin ve Türkçe tekrar denetiminin doğru olduğunu söyler.

Alternatif tam çözüm taraması editoryal bir adım olarak kalır: her bulmacanın
`src/content/editorial/YYYY-MM-DD.md` dosyasında "Alternatif tam çözüm taraması"
başlığı altında yazılır ve isteğe bağlı kör denemeyle sınanır. Aynı şekilde bağın
doğallığı, kategori başlığının kelimelerle örtüşmesi ve kültür bilgisinin adilliği de
insan kararıdır.

Bir gün mekanik bir ön tarama eklenecekse (ör. aday dörtlüleri listeleyip editöre
sunmak), bunun yeri yine bu modüldür; o zamana kadar doğrulayıcı bu konuda sessiz
kalır ve yanlış bir güvence vermez.

## Kullanım

```bash
npm run validate:content
```

Komut `src/content/puzzles/*.json` altındaki tüm dosyaları, varsa kör tahtalarını ve
dosyalar arası kuralları denetler; her dosya için sorunları listeler ve en az bir
`error` varsa 1 koduyla çıkar. Uyarılar çıkış kodunu etkilemez. Eksik kör tahta veya
eksik editoryal `.md` kaydı uyarı olarak bildirilir.

Komut CI'da `Lint, typecheck, test, build` işinin bir adımı olarak koşar; içerik hatası
derlemeyi durdurur.

Koddan çağırmak için:

```ts
import { parseDailyPuzzleFile, toPuzzle, validatePuzzle } from "@/features/game/validator";

const sorunlar = validatePuzzle(hamJson, { requireEditorialFields: true });

const sonuc = parseDailyPuzzleFile(hamJson);
if (sonuc.ok) {
  const oyuncuVerisi = toPuzzle(sonuc.file); // editoryal alanlar soyulur
}
```

`parseDailyPuzzleFile` ham JSON'u önce doğrular, sonra tip zorlaması kullanmadan
`DailyPuzzleFile` tipine daraltır; JSON'da düz dizi olan `groups` ve `words` alanlarının
dört elemanlı demet (`Four<T>`) olduğu da burada kontrol edilir.
