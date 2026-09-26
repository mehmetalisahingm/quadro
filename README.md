# Quadro

Türkçe günlük gruplama bulmacası: **16 kelime, 4 gizli bağ, 4 hata hakkı.**

> `Quadro` mevcut proje adıdır; yayın öncesinde isim değişirse metadata ve kullanıcı yüzeyleri birlikte güncellenir.

## Nasıl oynanır?

Her gün ekranda 16 kelime görünür. Birbiriyle aynı gizli bağı paylaşan dört kelimeyi seçip **Grupla** düğmesine basarsın. Amaç dört grubun tamamını bulmaktır; toplam dört hata hakkın vardır.

- Kartları seçebilir, seçimi temizleyebilir ve kalan kartları karıştırabilirsin.
- Oyun ilerlemesi tarayıcıda saklanır; sayfayı yenilediğinde devam edebilirsin.
- Sonuç ekranı spoiler vermeyen renkli paylaşım metni üretir.
- Ses tercihi isteğe bağlıdır ve varsayılan olarak kapalıdır.

## Projenin durumu

Çekirdek ürün akışı tamamlandı:

`Ana sayfa → günlük bulmaca → kazanma/kaybetme → sonuç/paylaşım → istatistik`

Repo şu anda **yayın öncesi kalite ve kabul** aşamasındadır. Güncel görev durumu için GitHub issue'ları kaynak kabul edilir; README tek başına release onayı anlamına gelmez.

Yayın öncesi kalan ana kapılar:

- iki yazarın içeriklerinin karşılıklı kör kalite review'larının tamamlanması,
- 20–30 gerçek katılımcılı ürün pilotu,
- gerçek cihaz/Safari görsel kabulü,
- 30 onaylı günlük yayın takvimi,
- preview/production deployment ve rollback doğrulaması,
- ortak yayın kararı.

## Teknik durum

- **Next.js 16.3.5** (App Router)
- **React 19.1.1**
- **TypeScript 5.7.3**
- Node.js ≥ 20.9; repoda `.nvmrc` = 22
- npm + `package-lock.json`
- Vitest birim/jsdom testleri
- Playwright ile Chromium + WebKit tarayıcı regresyonu
- Günlük içerik şeması ve istemci bundle sızıntı denetimi

CI her PR'da lint, typecheck, test, içerik doğrulama, production build, bundle denetimi ve tarayıcı regresyonunu çalıştırır.

## Yerel geliştirme

```sh
git clone https://github.com/mehmetalisahingm/quadro.git
cd quadro
npm ci
npm run dev
```

Yerel uygulama varsayılan olarak `http://localhost:3000` adresinde açılır.

### Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production derlemesi |
| `npm run start` | Production sunucusu; önce build gerekir |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript tip denetimi |
| `npm run test` | Vitest testleri |
| `npm run validate:content` | Bulmaca içerik şeması doğrulaması |
| `npm run check:bundle` | Günlük/gelecek içerik istemci paketine sızıyor mu kontrolü |
| `npm run test:browser` | Playwright Chromium + WebKit regresyonu |
| `npm run check` | lint + typecheck + test + içerik + build + bundle |

## Ekip ve sorumluluk

| Kişi | Ana sorumluluk |
| --- | --- |
| Mehmet — [@mehmetalisahingm](https://github.com/mehmetalisahingm) | Ürün/tasarım, ana sayfa ve oyun arayüzü, mobil/görsel kabul, pilot |
| Utku — [@Utkuuzun14](https://github.com/Utkuuzun14) | Oyun motoru, günlük yayın, kalıcılık/istatistik, CI, performans ve deployment |

İçerik stoğu iki yazara bölünmüştür. Yayın stoğuna girecek her bulmaca diğer kişi tarafından bağımsız kalite kontrolünden geçer; yazar kendi içeriğini tek başına yayın için onaylamaz.

## Plan, kalite ve yayın belgeleri

- [Ana proje planı](PROJE_PLANI.md)
- [Tüm görevler ve bağımlılıklar](docs/GOREVLER.md)
- [GitHub issue'ları](https://github.com/mehmetalisahingm/quadro/issues)
- [Çalışma kuralları](CONTRIBUTING.md)
- [İçerik rezervasyonları](docs/CONTENT_RESERVATIONS.md)
- [Yayın kontrol listesi](docs/RELEASE_CHECKLIST.md)
- [Deployment runbook](docs/DEPLOYMENT.md) — Q40 hazırlık branch'i main'e alındığında aktif olur
- [Pilot planı](docs/research/Q35_PILOT_PLAN.md)

## Yayın ilkeleri

- Gelecek bulmaca cevapları istemci paketine sızdırılmaz.
- Paylaşım metni cevap/kelime spoiler'ı taşımaz.
- Kritik hata veya gerçek cihaz kabulü eksikken production release kararı verilmez.
- Gerçek pilot, gerçek cihaz testi ve iki kişilik yayın onayı otomasyonla taklit edilmez.

Güncel release kararı ve bilinen sınırlar `docs/RELEASE_CHECKLIST.md` dosyasında tutulur.
