# @quadro/words-engine

Quadro Words'ün saf TypeScript oyun motoru (#205). Bağımlılığı yoktur; Node, DOM ya da React Native
API'si kullanmaz. Aynı motor mobilde, web'de ve sunucu tarafı skor doğrulamasında (#218) çalışır.

## Kurallar (motor sürümü 0.1.0)

1. **Tahta** 7×7. Hücre boş ya da tek harf.
2. **Tepsi** 3 parça. Parçalar 1–4 harflik, sabit yönlü şekillerdir (döndürme #215'te):
   tek, yatay/dikey 2–4, dört köşe (3 hücre), 2×2 kare.
3. **Yerleştirme** atomiktir: parçanın tüm hücreleri tahtada ve boş olmalı. Değilse hiçbir şey
   değişmez ve sebep döner (`out-of-bounds`, `occupied`, `bad-slot`, `game-over`).
4. **Kelime:** Yerleştirmeden sonra, yeni hücre içeren her satır ve sütunda dolu hücrelerin
   kesintisiz dizileri taranır. Sözlükte olan, en az 4 harfli ve en az bir yeni hücre içeren alt
   diziler aday olur.
5. **Seçim:** Aynı doğrultuda adaylar uzunluğa göre (büyükten küçüğe), eşitlikte başlangıç
   koordinatına göre (küçükten büyüğe) seçilir; seçilenle çakışan aday atlanır.
6. **Silme:** Seçilen tüm kelimelerin hücreleri silinir; kesişen hücre bir kez silinir.
   **Yerçekimi yok:** kalan harfler yerinde durur.
7. **Puan:** kelime başına 10 × uzunluk². Hamlede n kelime silinirse toplam × (1 + 0,5 × (n − 1)),
   aşağı yuvarlanır.
8. **Tepsi yenileme:** Kullanılan yuva aynı hamlede yeni parçayla dolar.
9. **Oyun sonu:** Tepsideki hiçbir parçanın yasal yerleşimi kalmayınca. Süre ya da enerji yok.

### Varsayımlar (sahip onayı bekliyor, #213 review)

Planın açık bıraktığı noktalar aşağıdaki gibi uygulandı. Hepsi `src/config.ts` içinde tek yerde;
cevap gelince yalnız orası ve ilgili test değişir.

| | Varsayım | Ayar |
|---|---|---|
| V1 | Yalnız soldan sağa ve yukarıdan aşağıya okunur; ters okuma yok. | `directions` |
| V2 | Aynı dizide çakışmayan iki kelime birlikte silinir; çakışanlardan uzun olan kazanır. | `findWords` |
| V3 | Çoklu kelime çarpanı 1 + 0,5 × (n − 1). | `comboStep` |
| — | En kısa kelime 4 harf (playtest 3'ü deneyebilir). | `minWordLength` |
| — | Puan katsayısı 10. | `lengthFactor` |

## Determinizm, replay ve kayıt

- `Math.random` yok. Parça üretimi tohumlu üreteçle yapılır ve üretecin durumu oyun durumunun
  içinde (`rng`) saklanır. Kayıttan devam eden oyun, kesintisiz oynanmış olanla aynı parçaları alır.
- `replay({ version, seed, config, moves }, dictionary)` oyunu baştan oynatır. Sürüm farklıysa ya da
  bir hamle yasadışıysa reddeder. Sunucu skor doğrulaması bunu kullanacak (#218).
- `serializeState` / `parseState`: durum düz JSON'dur. `parseState` sürümü, tahta boyutunu,
  harfleri, tepsi şekillerini ve sayaçları doğrular; kurcalanmış ya da bozuk kayıtta `null` döner.

## Genişleme noktaları

- **Sözlük** (`Dictionary`, #204): `has(word)` yeterli. Trie ve Türkçe normalizasyon #204'te.
- **Parça kaynağı** (`PieceSource`, #206): `(rng, { id, moveCount }) => { piece, rng }`, saf olmalı.
  `naivePieceSource` yalnız test ve ilk prototip içindir: şekil eşit olasılıkla, harfler yaklaşık
  Türkçe sıklığıyla. Gerçek denge ve ölü tahta önleme #206'da.

## Testler

```bash
npm ci
npm run typecheck
npm test
```

- `rules.test.ts`: her kural için elle kurulmuş tahtalar (yerleştirme, okuma yönü, en kısa
  kelime, en uzun seçim, eşitlik kuralı, kesişme, yerçekimi yok, oyun sonu, replay, kayıt).
- `invariants.test.ts`: 1200 tohumla rastgele bot oyunları. Her hamlede hücre muhasebesi, kelime
  geçerliliği, puan, tepsi ve oyun sonu kuralı denetlenir; her oyun replay ve kayıt geri yüklemesiyle
  birebir yeniden üretilir.
