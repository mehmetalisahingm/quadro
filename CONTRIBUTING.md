# Quadro çalışma düzeni

## Görev ve sahiplik

Mehmet (B) görsel deneyim ve arayüzü, Utku (A) motor ve altyapıyı yürütür. Her issue tek bir ana sahibin hesabını ve `owner:mehmet` veya `owner:utku` etiketini taşır. Her geliştirici kendi issue'sunun tesliminden ve doğrulama kanıtından sorumludur. Diğer kişinin review'u zorunlu değildir; isterse katkı veya geri bildirim verebilir.

Başlamadan önce issue'nun bağımlılıklarını ve dosya sınırlarını kontrol edin. Başlanacağını issue üzerinde belirtin. Bağımlı bir işi öne çekmek gerekirse ortak sözleşmeyi önce netleştirin.

## Dallar ve PR

- Güncel `main` üzerinden `codex/<gorev>` dalı açın.
- Bir PR tek bir anlaşılır amacı tamamlasın; mümkün olduğunda issue'nun tamamını kapsasın.
- PR açıklamasında `Closes #<issue>` kullanın. Kısmi işse `Refs #<issue>` yazın ve kalan işi belirtin.
- Kabul ölçütleri ve ilgili kontroller tamamlanınca squash merge yapın. Review isteği zorunlu değildir.
- En geç her iş gününün sonunda birlikte çalışan ana akışı kontrol edin.

İlk depo içeriğinin yüklenmesi kuruluş işlemidir; sonraki ürün değişiklikleri bu PR akışını izler. GitHub tarafından teknik olarak uygulanabilen koruma ayarlarının durumu [Repo kurulumu](docs/REPO_KURULUMU.md) belgesinde kaydedilir.

## Ortak dosyalar

- `src/features/game/`, günlük yayın, kalıcılık, yapılandırma ve CI: Utku.
- `src/components/`, stiller, animasyonlar, sesler ve API dışındaki sayfalar: Mehmet.
- `src/app/api/puzzle/`: Utku.
- `package.json`, kilit dosyası ve derleme ayarları: Utku koordine eder; UI bağımlılıkları Mehmet'le birlikte belirlenir.
- Bulmacalar: yazan kişi düzenler; diğer kişi isterse cevapları görmeden bağımsız bir kör deneme yapabilir. Günlük yayın takvimini Utku koordine eder.

Ortak sözleşme değişikliğinde TypeScript tipleri, `docs/CONTRACTS.md`, örnek adaptör ve etkilenen tüketiciler birlikte güncellenir.

## Kanıt ve tamamlanma

- UI değişiklikleri mobil/masaüstü görüntüsü ve ilgili durumların denenmesiyle teslim edilir.
- Motor değişiklikleri davranışı doğrulayan testlerle teslim edilir.
- Bulmaca değişiklikleri editoryal kayıt ve yapısal doğrulama ile teslim edilir. İsteğe bağlı kör deneme notu eklenebilir.
- Yerel derleme, otomatik tarayıcı kontrolü, gerçek cihaz incelemesi ve canlı yayın kanıtı ayrı yazılır.
- Issue kabul ölçütleri tamamlandığında kapatılır; eksik iş açıkça yeni issue'ya bağlanır. Review yapılmadıysa bu tek başına eksik sayılmaz.

## Kapsam

İlk sürüm ürün planındaki günlük oyun akışıdır. Genişletme fikirleri önce ayrı bir issue olarak değerlendirilir. Günlük bulmacayı hazırlayan kişi kendi içeriğine tek başına yayın onayı vermez.
