# Quadro çalışma düzeni

## Görev ve sahiplik

Mehmet (B) görsel deneyim ve arayüzü, Utku (A) motor ve altyapıyı yürütür. Her issue tek bir ana sahibin hesabını ve `owner:mehmet` veya `owner:utku` etiketini taşır. Her geliştirici kendi issue'sunun tesliminden ve doğrulama kanıtından sorumludur. Her PR, dokunduğu alanın kod sahibinden onay bekler; review zorunludur (bkz. [Kod sahipliği ve review](#kod-sahipliği-ve-review)).

Başlamadan önce issue'nun bağımlılıklarını ve dosya sınırlarını kontrol edin. Başlanacağını issue üzerinde belirtin. Bağımlı bir işi öne çekmek gerekirse ortak sözleşmeyi önce netleştirin.

## Dallar ve PR

- Güncel `main` üzerinden `codex/<gorev>` dalı açın.
- Bir PR tek bir anlaşılır amacı tamamlasın; mümkün olduğunda issue'nun tamamını kapsasın.
- PR açıklamasında `Closes #<issue>` kullanın. Kısmi işse `Refs #<issue>` yazın ve kalan işi belirtin.
- Kabul ölçütleri, ilgili kontroller ve dokunulan alanın kod sahibi onayı tamamlanınca squash merge yapın.
- En geç her iş gününün sonunda birlikte çalışan ana akışı kontrol edin.

İlk depo içeriğinin yüklenmesi kuruluş işlemidir; sonraki ürün değişiklikleri bu PR akışını izler. GitHub tarafından teknik olarak uygulanabilen koruma ayarlarının durumu [Repo kurulumu](docs/REPO_KURULUMU.md) belgesinde kaydedilir.

## Ortak dosyalar

- Motor, kurallar ve altyapı: `src/features/` (motor, durum, doğrulayıcı, sözleşme, fixtures ve react bağlayıcıları), `src/lib/` (günlük yayın, kalıcılık), `src/app/api/`, `scripts/`, `tests/`: Utku.
- Arayüz, tasarım ve görsel kimlik: `src/components/`, `src/styles/`, API dışındaki `src/app/` sayfaları ve `layout.tsx`, `README.md`: Mehmet.
- Ortak alanlar: `src/app/play/`, `src/content/`, `docs/`, `src/lib/config.ts`, `.github/` ve kök yapılandırma (`package.json`, kilit dosyası, `tsconfig*.json`, `eslint.config.mjs`, `vitest.config.mts`, `playwright.config.mjs`, `next.config.mjs`). Paket ekleme ve çıkarmayı Utku koordine eder; UI bağımlılıkları Mehmet'le birlikte belirlenir.
- Bulmacalar: yazan kişi düzenler; diğer kişi isterse cevapları görmeden bağımsız bir kör deneme yapabilir. Günlük yayın takvimini Utku koordine eder.

Ortak sözleşme değişikliğinde TypeScript tipleri, `docs/CONTRACTS.md`, örnek adaptör ve etkilenen tüketiciler birlikte güncellenir.

## Kod sahipliği ve review

**Kod sahipliği ve review kuralları bu dosya (`CONTRIBUTING.md`) ve [`.github/CODEOWNERS`](.github/CODEOWNERS) dosyasında tanımlıdır.** Yukarıdaki "Ortak dosyalar" paylaşımının makine tarafından okunabilir hali CODEOWNERS'tır; bir PR bir kişinin alanındaki dosyaya dokunduğunda GitHub o kişiyi otomatik olarak reviewer atar.

**Kural: her PR, dokunduğu alanın kod sahibinden onay bekler (zorunlu review).** Ortak sahipli bir dosyada iki isim birden yazılıysa GitHub ikisinden birinin onayını yeterli sayar. Paralel çalışırken iki kez çakışma yaşadığımız için bu kural konuldu: aynı işin iki kez yapılması ve yanlış içeriğin merge olması böyle engellenir.

`docs/UTKU.md` ve `docs/MEHMET.md` dosyalarındaki eski "review zorunlu değildir" ifadeleri güncelliğini yitirmiştir. **Çelişki halinde `CONTRIBUTING.md` ve `.github/CODEOWNERS` esastır.**

Ortak sahipli dosyalarda (`src/app/play/`, `src/content/`, `docs/`, `src/lib/config.ts`, kök yapılandırma ve kök dokümanlar) **önce haberleşin:** issue üzerinde ya da doğrudan, hangi dosyaya neden dokunacağınızı yazın. Bu dosyalarda iki kişinin aynı anda çalışması en pahalı çakışma türüdür.

Karşı tarafın alanına dokunman gerekiyorsa üç seçenek vardır, sırayla tercih edilir:

1. **Dokunmadan çöz.** Genelde mümkündür: kendi katmanına doğru değeri sağla, tüketici dosya olduğu gibi kalsın.
2. **Önce söyle, sonra yaz.** Neden gerektiğini issue'da netleştir, sonra değişikliği yap ve PR'da ayrıca belirt.
3. **Karşı tarafa bırak.** Değişiklik tasarım ya da mimari kararı içeriyorsa ayrı bir issue açılır.

CODEOWNERS'ın dosya eşleştirmesinde **son eşleşen satır kazanır.** Yeni kural eklerken daha genel bir kuralın altına yazın; üstüne yazılan kural sessizce etkisiz kalır. Sahipliği kimse tek taraflı değiştirmesin diye `CODEOWNERS` dosyasının kendisi ortak sahiplidir.

Kuralın GitHub tarafında merge koşulu hâline gelmesi branch protection ayarına bağlıdır ("Require review from Code Owners"); ayarların güncel durumu [Repo kurulumu](docs/REPO_KURULUMU.md) belgesinde kaydedilir. Ayar kapalıyken de CODEOWNERS doğru kişiyi otomatik reviewer atar ve kural bu dosya gereği geçerlidir. Ayar açıkken kimse kendi PR'ını onaylayamaz; tek sahipli bir alanda çalışan kişi kod sahibi kendisi olsa bile kendi onayıyla bu koşulu karşılayamaz, dolayısıyla ya karşı tarafın onayı ya da yönetici atlaması (admin bypass) gerekir. Hangisinin kullanıldığı repo kurulumu belgesinde yazılıdır.

## Kanıt ve tamamlanma

- UI değişiklikleri mobil/masaüstü görüntüsü ve ilgili durumların denenmesiyle teslim edilir.
- Motor değişiklikleri davranışı doğrulayan testlerle teslim edilir.
- Bulmaca değişiklikleri editoryal kayıt ve yapısal doğrulama ile teslim edilir. İsteğe bağlı kör deneme notu eklenebilir.
- Yerel derleme, otomatik tarayıcı kontrolü, gerçek cihaz incelemesi ve canlı yayın kanıtı ayrı yazılır.
- Issue kabul ölçütleri tamamlandığında kapatılır; eksik iş açıkça yeni issue'ya bağlanır.

## Kapsam

İlk sürüm ürün planındaki günlük oyun akışıdır. Genişletme fikirleri önce ayrı bir issue olarak değerlendirilir. Günlük bulmacayı hazırlayan kişi kendi içeriğine tek başına yayın onayı vermez.
