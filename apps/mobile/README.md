# Quadro Words — Android uygulaması

Epic #202 · iskelet #203. Expo SDK 58 (React Native 0.88) + TypeScript. Oyun kuralları
`packages/words-engine` içindeki platformdan bağımsız motorda; bu klasör yalnız mobil arayüzdür.

Oyun ekranı (#207): 7×7 tahta, 3 parçalık tepsi, sürükle-bırak ve dokunarak yerleştirme. Tam
tasarım sistemi ve diğer ekranlar #214'te gelir.

> **Geçici sözlük:** `src/game/devDictionary.ts` yalnız ekranı denemek için elle yazılmış 248
> kelimedir. Lisanslı sözlük #204'te gelir ve bunun yerini alır; bu liste yayına çıkmaz.

## Kurulum

Kök web projesinden bağımsızdır; kendi `package.json` ve kilit dosyası vardır.

```bash
cd apps/mobile
npm ci
npm run typecheck
npm run lint
npm run doctor
```

Motor testleri:

```bash
cd packages/words-engine
npm ci
npm test
```

## Kayıt (#208)

- Her hamle anında cihaza yazılır; uygulama arka plana geçince bir kez daha yazılır. Süreç
  öldürülse ya da telefon yeniden başlasa bile açılışta son hamleden devam edilir.
- Depo: `expo-sqlite` anahtar-değer tablosu. Her yazma kendi SQLite işleminde yapılır, yarım
  değer kalmaz. Web önizlemesinde localStorage.
- Kayıtlar ayrı tutulur ve her okumada doğrulanır:
  - `quadro-words:game:v1`: motorun sürümlü snapshot'ı (`parseState` ile doğrulanır),
  - `…:game:v1:backup`: bir önceki iyi kayıt; ana kayıt bozulursa oradan devam edilir,
  - `quadro-words:game-meta:v1`: oyunun en uzun kelimesi ve kurtarma kullanıldı mı,
  - `quadro-words:records:v1`: desteksiz ve destekli rekor ayrı, oyun ve kelime sayısı,
  - `quadro-words:settings:v1`: titreşim ve öğretici.
- Motor sürümü değişirse eski oyun devam ettirilmez (rekorlar korunur).
- Ayarlar → "Kayıtlı verileri sil" (onay adımlı) bu cihazdaki tüm Quadro Words verisini siler.
- Kayıt mantığı `src/persistence/persistence.ts` içinde ve platformdan bağımsız;
  `npm test` bellek içi depoyla test eder (yazma sırasında süreç öldürülmesi dahil).

## Web önizlemesi (yalnız geliştirme)

Cihaz olmadan arayüzü görmek için: `npm run web`. Gesture Handler ve Reanimated web'de de çalışır,
ama dokunma hissi, titreşim ve performans yalnız gerçek Android cihazda doğrulanır.

## Cihazda çalıştırma

Uygulama ileride reklam (AdMob, #209) ve Play Billing (#220) gibi yerel modüller kullanacağı için
Expo Go yerine **development build** ile çalışır.

- **Yerel derleme** (Android Studio ve SDK kurulu olmalı): `npm run android`. `android/` klasörü
  üretilen çıktıdır ve git'e girmez (Continuous Native Generation).
- **EAS derlemesi:** `eas build --profile development --platform android`. Çıkan APK cihaza
  kurulur, ardından `npm start` ile geliştirme sunucusuna bağlanır.

## Derleme profilleri (`eas.json`)

| Profil | Çıktı | Amaç |
|---|---|---|
| `development` | APK, dev client | Geliştirme ve cihaz testi |
| `preview` | APK | İç test dağıtımı |
| `production` | AAB | Google Play (yalnız kabul kapılarından sonra, #212) |

## Android hedefi

- `targetSdkVersion` ve `compileSdkVersion` 36 (Android 16). Google Play, 31 Ağustos 2026'dan
  itibaren yeni uygulama ve güncellemelerde API 36 istiyor:
  [Google Play hedef API şartı](https://support.google.com/googleplay/android-developer/answer/11926878).
- Uygulama kimliği önerisi `tr.com.playquadro.words`. Mağazaya kaydetmeden önce sahip onayı
  gerekir; Play Console'a bir kez kaydedilen kimlik değiştirilemez.

## İmzalama ve gizli bilgiler

- Keystore, servis hesabı JSON'u ve Play/EAS kimlik bilgileri **asla** repoya girmez; kökteki
  `.gitignore` bu dosya türlerini dışarıda bırakır.
- Üretim imzası için EAS'ın yönettiği kimlik bilgileri ya da repo dışında saklanan bir keystore
  kullanılır. Karar ve erişim sahibe aittir (#211, #222).

## Sürüm notları

- `expo` 58.0.25, `expo-dev-client` 58.0.20 ve `expo-sqlite` 58.0.17 sabit: projede iki haftadan yeni paket
  sürümü kullanılmaz. `expo install --check` daha yeni bir yama önerirse bu kural gereği
  `package.json` içindeki `expo.install.exclude` ile atlanır; yükseltme ayrı bir PR'da yapılır.
- `@expo/fingerprint`'in kullandığı minimatch için `overrides` ile 11.0.1 (kök projeyle aynı
  güvenlik düzeltmesi).
