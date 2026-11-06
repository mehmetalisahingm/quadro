# #171 — Tekrar eden bulmaca ve uçtan uca kalite denetimi

Ölçüm: 6 Kasım 2026, `npm run audit:content`. Bu belge cevap kelimesi içermez; dörtlüler tahta kimlikleriyle anılır.

## İçerik envanteri

| Havuz | Tahta | Oyuncuya nereden gelir |
| --- | ---: | --- |
| Günlük (`q-001`…`q-048`) | 48 | Henüz yok; hepsi `draft` (#38) |
| Mod parkurları (Kolay, Orta, Zor, Ultra) | 48 | `/play` parkurları, **günlük yedek havuzu** ve **özel modlar** |
| Keşif Yolu | 200 | `/journey` |
| Resimli Quadro | 3 | `/pictures` |
| **Toplam** | **299** | 1196 grup |

## Tekrar sonuçları

| Ölçüt | Sayı | Not |
| --- | ---: | --- |
| Birebir aynı tahta | 0 | Sıra farkı dahil |
| Birden fazla tahtada geçen dörtlü | 119 | 90'ı yalnız Keşif Yolu içinde, 25'i Keşif Yolu + mod, 4'ü günlük + Keşif Yolu |
| Dörtte üçü aynı dörtlü çifti | 66 | 24 günlük + mod, 19 Keşif Yolu + mod, 14 günlük + Keşif Yolu, 9 mod + mod |
| Aynı başlıklı, en az iki ortak kelimeli dörtlü | 33 | 28 farklı başlık |

Tek bir kelimenin başka tahtada geçmesi tekrar sayılmadı.

### Kök neden 1: Keşif Yolu 51–200

51–200. adımlardaki 600 grup yuvasının **tamamı** 1–50. adımlardan veya mod parkurlarından gelen dörtlülerdir; tek bir yeni dörtlü yok. 600 yuvada 118 farklı dörtlü dönüyor. En sık kullanılan dörtlü 15 tahtada, ilk sekizi 10–15 tahtada geçiyor. Oyuncu ilerledikçe aynı dörtlüleri birkaç adımda bir yeniden görüyor.

Kodla düzeltilemez: yeni dörtlüler yazılmalı ve gözden geçirilmeli ya da adım sayısı benzersiz içeriğe göre yeniden belirlenmeli. Bu ürün kararı Keşif Yolu sahibine (Mehmet) ait; ayrı issue açıldı.

### Kök neden 2: aynı 48 mod tahtası üç yerden geliyor

Mod parkuru, günlük yedek havuzu (`daily-reserve.json`) ve özel modlar aynı 48 tahtayı kullanıyor.

- **Özel modlar düzeltildi** (aşağıda).
- **Günlük yedek** sunucuda seçildiği için oyuncunun geçmişini bilemez. Kalıcı çözüm, onaylı günlük stok (#38): 11 Kasım'dan sonra `published` günlük dosya varsa yedek devreye girmez.

### Günlük taslaklar: yayından önce bakılmalı

Birebir aynı dörtlüyü başka havuzla paylaşan günlük taslaklar: **`q-002`, `q-016`, `q-025`, `q-031`**. `q-002` 12 Kasım'da yayında olacak.

Dörtte üçü aynı dörtlüsü olan günlük taslaklar (27): `q-003`, `q-006`, `q-010`, `q-012`, `q-013`, `q-014`, `q-015`, `q-016`, `q-017`, `q-020`, `q-024`, `q-026`, `q-027`, `q-028`, `q-030`, `q-031`, `q-032`, `q-033`, `q-034`, `q-035`, `q-036`, `q-037`, `q-038`, `q-043`, `q-044`, `q-045`, `q-046`.

**İlk 14 günde etkilenen:** `q-002` (birebir), `q-003`, `q-006`, `q-010`, `q-012`, `q-013`, `q-014` (dörtte üç). Kör denemede bu kimlikler için "yayındaki başka tahtaya fazla benziyor mu" sorusu da yanıtlanmalı. Dörtte üç benzerlik tek başına ret nedeni değildir (yaygın kategoriler); karar gözden geçirenindir.

## Düzeltilen akış: özel mod tahta seçimi

Önce: özel oyun, oyun sırasına göre 48 mod tahtasından birini döngüyle seçiyordu. Parkurda çözülmüş veya günlük yedek olarak görülmüş tahta tekrar geliyordu.

Sonra (`src/features/game/challengeSlots.ts`): oyuncunun tarayıcısında parkur kaydı, günlük yedek kaydı veya önceki özel oyun kaydı bulunan tahtalar atlanır, sıradaki görülmemiş tahta seçilir. Seçim deterministiktir; iki sekme aynı tahtayı seçer. 48'in hepsi görülmüşse eski döngü sırası kullanılır. Sunucu ile istemci aynı slot eşlemesini kullanır.

## Tekrar koruması

`src/lib/daily/contentAudit.test.ts`:

- Birebir aynı tahta eklenemez.
- Tekrar eden dörtlü (119) ve dörtte üç benzer çift (66) sayıları artamaz; içerik düzeltildikçe düşürülür.
- Yukarıdaki dört kimlik dışında hiçbir günlük taslak başka havuzla birebir aynı dörtlü taşıyamaz.

## Mod senaryoları

| Senaryo | Günlük | Parkur | Keşif Yolu | Resimli | Özel modlar |
| --- | --- | --- | --- | --- | --- |
| Kazanma | `tahmin-ve-kontroller`, `akis.spec` | aynı motor ve bileşen | `kesif-yolu` | `resimli-quadro`, `resimli.spec` | `ChallengeGame.test`, `ozel-mod-enerji` |
| Kaybetme ve hata sınırı | `tahmin-ve-kontroller`, `gonderim.spec` | aynı motor | aynı motor | `resimli-quadro` | `ChallengeGame.test`, `RiskGame.test` |
| Sonraki oyun | — | `ayri-modlar` | `kesif-yolu` | `resimli-quadro` | `ozel-mod-enerji` |
| Yenileme ve geri dönüş | `kayit-devam`, `kayit.spec` (#162) | `ayri-modlar` | `kesif-yolu` | `resimli-quadro`, `resimli.spec` | `ozel-mod-enerji` |
| Bozuk kayıt | `kayit-devam`, `kayit.spec` (#162) | aynı depo katmanı | **`mod-dayaniklilik`** | **`mod-dayaniklilik`** | **`mod-dayaniklilik`** |
| Gün değişimi | `gun-degisimi`, `kayit-devam` | — | sabit kampanya günü | sabit tahta günü | **`mod-dayaniklilik`** |
| İki sekme | — | — | — | — | `ozel-mod-enerji` |
| Depo engelli | `kurtarma-istatistik` | — | `kesif-yolu` | — | hata mesajı |
| Mobil 320–390 px | `mobil.spec` | — | — | `resimli.spec` | `ozel-mod-enerji.spec` |

Kalın satırlar bu PR'da eklendi. Tarayıcı testleri CI'da Chromium ve WebKit ile koşar.

## Yapılmayanlar

- **Gerçek iPhone/Safari ve canlı smoke:** bu ortamdan yapılamadı; #36 ve #40 tablolarında bekliyor.
- **Ekran videosu:** yok; ekran görüntüleri #154 ve #174'te.
- **Keşif Yolu ve günlük taslak içeriği** değiştirilmedi: kullanıcı ilerlemesi ve içerik sahipliği nedeniyle karar gerekiyor.

## Ayrı issue'lara taşınan kusurlar

- Keşif Yolu 51–200'ün yalnız tekrar eden dörtlülerden oluşması
- Günlük taslaklardaki birebir ve dörtte üç benzer dörtlüler
- `/play` başlığındaki mod etiketinin mobilde "Giriş Yap" düğmesinin altında kalması
