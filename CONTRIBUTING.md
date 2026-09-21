# Quadro çalışma düzeni

## Görev ve sahiplik

Mehmet (B) görsel deneyim ve arayüzü, Utku (A) motor ve altyapıyı yürütür. Her issue tek bir ana sahibin hesabını ve `owner:mehmet` veya `owner:utku` etiketini taşır. Her geliştirici kendi issue'sunun tesliminden ve doğrulama kanıtından sorumludur. Kendi alanında çalışırken karşı tarafın review'u zorunlu değildir; karşı tarafın dosyasına dokunan PR o kişinin onayını bekler (bkz. [Kod sahipliği ve review](#kod-sahipliği-ve-review)).

Başlamadan önce issue'nun bağımlılıklarını ve dosya sınırlarını kontrol edin. Başlanacağını issue üzerinde belirtin. Bağımlı bir işi öne çekmek gerekirse ortak sözleşmeyi önce netleştirin.

## Dallar ve PR

- Güncel `main` üzerinden `codex/<gorev>` dalı açın.
- Bir PR tek bir anlaşılır amacı tamamlasın; mümkün olduğunda issue'nun tamamını kapsasın.
- PR açıklamasında `Closes #<issue>` kullanın. Kısmi işse `Refs #<issue>` yazın ve kalan işi belirtin.
- Kabul ölçütleri ve ilgili kontroller tamamlanınca squash merge yapın. Kendi alanınızdaki PR için review isteği zorunlu değildir; karşı tarafın alanına dokunan PR onayını bekler.
- En geç her iş gününün sonunda birlikte çalışan ana akışı kontrol edin.

İlk depo içeriğinin yüklenmesi kuruluş işlemidir; sonraki ürün değişiklikleri bu PR akışını izler. GitHub tarafından teknik olarak uygulanabilen koruma ayarlarının durumu [Repo kurulumu](docs/REPO_KURULUMU.md) belgesinde kaydedilir.

## Ortak dosyalar

- `src/features/game/`, günlük yayın, kalıcılık, yapılandırma ve CI: Utku.
- `src/components/`, stiller, animasyonlar, sesler ve API dışındaki sayfalar: Mehmet.
- `src/app/api/puzzle/`: Utku.
- `package.json`, kilit dosyası ve derleme ayarları: Utku koordine eder; UI bağımlılıkları Mehmet'le birlikte belirlenir.
- Bulmacalar: yazan kişi düzenler; diğer kişi isterse cevapları görmeden bağımsız bir kör deneme yapabilir. Günlük yayın takvimini Utku koordine eder.

Ortak sözleşme değişikliğinde TypeScript tipleri, `docs/CONTRACTS.md`, örnek adaptör ve etkilenen tüketiciler birlikte güncellenir.

## Kod sahipliği ve review

Yukarıdaki sahiplik paylaşımının makine tarafından okunabilir hali [`.github/CODEOWNERS`](.github/CODEOWNERS) dosyasıdır. Bir PR bir kişinin alanındaki dosyaya dokunduğunda GitHub o kişiyi otomatik olarak reviewer atar.

**Kural:** kendi alanında çalışırken karşı tarafın onayını beklemezsin. **Karşı tarafın dosyasına dokunan PR o kişinin onayını bekler.** Paralel çalışırken iki kez çakışma yaşadığımız için bu kural konuldu: aynı işin iki kez yapılması ve yanlış içeriğin merge olması böyle engellenir.

Ortak sahipli dosyalarda (`src/app/play/`, `src/content/`, `docs/`, `src/lib/config.ts`, kök dokümanlar) **önce haberleşin:** issue üzerinde ya da doğrudan, hangi dosyaya neden dokunacağınızı yazın. Bu dosyalarda iki kişinin aynı anda çalışması en pahalı çakışma türüdür.

Karşı tarafın alanına dokunman gerekiyorsa üç seçenek vardır, sırayla tercih edilir:

1. **Dokunmadan çöz.** Genelde mümkündür: kendi katmanına doğru değeri sağla, tüketici dosya olduğu gibi kalsın.
2. **Önce söyle, sonra yaz.** Neden gerektiğini issue'da netleştir, sonra değişikliği yap ve PR'da ayrıca belirt.
3. **Karşı tarafa bırak.** Değişiklik tasarım ya da mimari kararı içeriyorsa ayrı bir issue açılır.

CODEOWNERS'ın dosya eşleştirmesinde **son eşleşen satır kazanır.** Yeni kural eklerken daha genel bir kuralın altına yazın; üstüne yazılan kural sessizce etkisiz kalır. Sahipliği tek taraflı değişmesin diye `CODEOWNERS` dosyasının kendisi ortak sahiplidir.

Kuralın GitHub tarafında zorunlu hale gelmesi branch protection ayarına bağlıdır ("Require review from Code Owners"); ayarların güncel durumu [Repo kurulumu](docs/REPO_KURULUMU.md) belgesinde kaydedilir. Ayar açıkken kimse kendi PR'ını onaylayamaz, dolayısıyla tek sahipli bir alanda çalışıp merge edebilmek için ya karşı tarafın onayı ya da yönetici atlaması (admin bypass) gerekir; hangisinin kullanıldığı repo kurulumu belgesinde yazılıdır.

## Kanıt ve tamamlanma

- UI değişiklikleri mobil/masaüstü görüntüsü ve ilgili durumların denenmesiyle teslim edilir.
- Motor değişiklikleri davranışı doğrulayan testlerle teslim edilir.
- Bulmaca değişiklikleri editoryal kayıt ve yapısal doğrulama ile teslim edilir. İsteğe bağlı kör deneme notu eklenebilir.
- Yerel derleme, otomatik tarayıcı kontrolü, gerçek cihaz incelemesi ve canlı yayın kanıtı ayrı yazılır.
- Issue kabul ölçütleri tamamlandığında kapatılır; eksik iş açıkça yeni issue'ya bağlanır. Review yapılmadıysa bu tek başına eksik sayılmaz.

## Kapsam

İlk sürüm ürün planındaki günlük oyun akışıdır. Genişletme fikirleri önce ayrı bir issue olarak değerlendirilir. Günlük bulmacayı hazırlayan kişi kendi içeriğine tek başına yayın onayı vermez.
