# Test içerik stoğu (Q19)

Günlük yayın katmanının testlerde okuduğu sahte içerik dizini. `QUADRO_CONTENT_DIR`
ortam değişkeni bu dizini gösterdiğinde `loadDailyPuzzle` gerçek yayın stoğu
(`src/content/puzzles/`) yerine buradan okur.

Buradaki dosyalar **yayın stoğu değildir**: `npm run validate:content` bu dizini
taramaz ve canlı günlerin cevaplarını içermez.

| Dosya | Amaç | Beklenen sonuç |
| --- | --- | --- |
| `puzzles/2026-09-20.json` | Yayına açık gün | `ok` |
| `puzzles/2026-09-21.json` | `status: "draft"` | `missing` · `not-published` |
| `puzzles/2026-09-22.json` | Üç gruplu, şemaya uymayan dosya | `missing` · `invalid-content` |
| `puzzles/2026-09-23.json` | Bozuk JSON | `missing` · `invalid-content` |
| `puzzles/2026-09-24.json` | Dosya adı ile `date` alanı farklı gün | `missing` · `invalid-content` |

`2026-09-20.json`, `src/features/game/fixtures/puzzles.ts` içindeki `standardPuzzle`
örneğinin içerik dosyası biçimindeki birebir karşılığıdır: editoryal alanlar
(`status`, `author`, `reviewer`) soyulduğunda aynı bulmaca çıkar. `/` ve `/play`
akış testleri (`tests/e2e/`) bu dosya üzerinden oynar, böylece gerçek yayın
kablolaması test edilirken tahtadaki kelimeler canlı günün cevaplarını ifşa etmez.
Aynılık `src/lib/daily/dailyPuzzle.test.ts` içinde denetlenir; ikisi ayrışırsa test
düşer.
