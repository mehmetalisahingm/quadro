# Quadro

Türkçe günlük gruplama bulmacası: **16 kelime, 4 gizli bağ, 4 hata hakkı.**

Quadro geçici proje adıdır. Nihai oyun adı henüz seçilmedi.

## Projenin durumu

Ürün planı ve geliştirme görevleri hazırlandı. Uygulama geliştirmesi Faz 0 ile başlayacak; bu ilk yükleme planlama, iş bölümü ve repo çalışma düzenini içerir.

## Nereden başlayacağız?

| Kişi | Ana sorumluluk | Başlangıç |
| --- | --- | --- |
| Mehmet — [@mehmetalisahingm](https://github.com/mehmetalisahingm) | Ana sayfa, tasarım sistemi, oyun/sonuç arayüzü, mobil deneyim | [Mehmet'in görevleri](docs/MEHMET.md) |
| Utku — [@Utkuuzun14](https://github.com/Utkuuzun14) | Oyun motoru, ortak sözleşme, günlük yayın, kayıt/istatistik, CI ve entegrasyon | [Utku'nun görevleri](docs/UTKU.md) |

İçerik üretimi iki kişiye bölünür. İsteyen kişi diğerinin yazdığı bulmacayı cevapları görmeden deneyebilir ve geri bildirim bırakabilir. İlk 30 günün 1–15 taslakları Mehmet'e, 16–30 taslakları Utku'ya aittir; bu sayı nihai günlük atamadır, ilk prototipler yazarın kalite kontrolünden geçerse stoğa dahil edilir.

## Plan ve takip

- [Ana proje planı](PROJE_PLANI.md)
- [Tüm görevler ve bağımlılıklar](docs/GOREVLER.md)
- [GitHub issue'ları](https://github.com/mehmetalisahingm/quadro/issues)
- [Fazlar / milestones](https://github.com/mehmetalisahingm/quadro/milestones)
- [Çalışma kuralları](CONTRIBUTING.md)
- [Görev tanımlarının kaynak verisi](docs/TASKS.json)

Görev ilerlemesinin güncel kaynağı GitHub issue durumudur. Belgelerdeki listeler başlangıç planını gösterir.

## İlk çalışan teslim

`Ana sayfa → bir gerçek bulmaca → kazanma/kaybetme → paylaşım`

Bu akış gerçek motorla birleşmeden kapsamlı son animasyonlara geçilmez. Günlük içerik üretimi ise geliştirmeyle aynı anda başlar.

## Çalışmaya katılma

1. Repo davetini kabul et ve depoyu klonla.
2. Kendi görev sayfandaki başlangıç issue'sunu aç; bağımlılıkları kontrol et.
3. `main` üzerinden kısa ömürlü bir `codex/...` dalı aç.
4. Issue kabul ölçütlerini karşılayıp PR aç; kendi doğrulama kanıtını ekle. Review zorunlu değildir.

```sh
git clone https://github.com/mehmetalisahingm/quadro.git
cd quadro
git switch -c codex/gorev-adi
```

## Geliştirme

### Gereksinimler

- **Node.js ≥ 20.9** (repoda `.nvmrc` = 22; `nvm use` ile eşitleyebilirsin)
- **npm** (tek paket yöneticisi; kilit dosyası `package-lock.json`)
- Stack: **Next.js 15 (App Router) + TypeScript**

### Kurulum ve çalıştırma

```sh
npm ci          # temiz kurulum (CI ile aynı)
npm run dev     # geliştirme sunucusu → http://localhost:3000
```

### Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run start` | Üretim sunucusu (önce `build`) |
| `npm run lint` | ESLint CLI (`eslint`, kurallar `.eslintrc.json`) |
| `npm run typecheck` | TypeScript tip denetimi (`tsc --noEmit`) |
| `npm run test` | Birim testleri (Vitest, `src/`) |
| `npm run test:e2e` | Tarayıcı regresyonları (Playwright + Chromium, `tests/e2e/`) |
| `npm run check` | lint + typecheck + birim testleri + build (CI'daki `verify` job'u ile aynı sıra) |

CI, her `push` ve `pull_request` üzerinde iki job'u paralel çalıştırır: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

| Job | Yaptığı |
| --- | --- |
| `Lint, typecheck, test, build` | `npm ci` → lint → typecheck → birim testleri → üretim derlemesi |
| `E2E (Playwright)` | `npm ci` → `npx playwright install --with-deps chromium` → `npm run test:e2e` |

Tarayıcı regresyonları ayrı job'da koşar; böylece Chromium indirmesi birim testlerini ve derlemeyi yavaşlatmaz. Başarısız koşuda Playwright raporu ve izleri `playwright-raporu` adlı artifact olarak yüklenir.

### Tarayıcı regresyonları

`npm run test:e2e` gerçek Chromium açar ve testleri **üretim derlemesine** karşı koşturur: `playwright.config.ts` içindeki `webServer`, `npm run build && npm run start` çalıştırır. Ayrıca elle derleme yapmak gerekmez; yerelde 3000 portunda açık bir sunucu varsa yeniden derlenmez (`reuseExistingServer`).

İlk kullanımda tarayıcıyı bir kez indirin:

```sh
npx playwright install chromium
```

Testler günün canlı bulmacasına bağımlı değildir: `/play` sabit tohumlu (`DEFAULT_ENGINE_SEED`) örnek bulmacayı açar, beklenen kart sırası testte sabit yazılmak yerine motordan hesaplanır ve kartlar erişilebilir isimleriyle tıklanır.

### Klasör sahipliği

Sahiplik [`.github/CODEOWNERS`](.github/CODEOWNERS) ve [`CONTRIBUTING.md`](CONTRIBUTING.md) ile aynıdır.

| Yol | Sahip |
| --- | --- |
| `src/app/` | Mehmet |
| `src/components/`, `src/styles/`, `src/animations/`, `public/` | Mehmet |
| `src/features/game/`, `src/app/api/puzzle/` | Utku |
| `src/lib/persistence/`, `src/lib/daily/`, `src/lib/analytics/`, `src/lib/monitoring/` | Utku |
| `package.json`, `package-lock.json`, `.github/workflows/` | Utku |
| `src/content/`, `docs/` | Mehmet + Utku |

> Q01 yalnızca temel iskeleti kurar. `src/app/` içindeki başlangıç kabuğu Mehmet'in ana sayfa görevlerinde (Q05, Q11) geliştirilecektir.
