# Repo kurulum kaydı

Tarih: 16 Eylül 2026

| Ayar | Durum |
| --- | --- |
| Repo | [mehmetalisahingm/quadro](https://github.com/mehmetalisahingm/quadro) |
| Görünürlük | Private |
| Mehmet | @mehmetalisahingm — repo sahibi |
| Utku | @Utkuuzun14 — davet kabul edildi, write erişimi doğrulandı |
| Ana dal | main |
| İş takibi | 42 görev, beş milestone, gerçek hesap atamaları |
| Birleştirme | Squash açık; merge commit ve rebase merge kapalı |
| Birleşen görev dalı | Otomatik silinir |
| Dosya sahipliği | [`.github/CODEOWNERS`](../.github/CODEOWNERS); sözlü karşılığı `CONTRIBUTING.md` içinde |
| İnceleme düzeni | Kendi alanında review zorunlu değil; karşı tarafın dosyasına dokunan PR o kişinin onayını bekler |

## Ana dal koruması

GitHub API ile koruma açılması denendi; mevcut hesap planı private repoda bu özelliği desteklemediği için HTTP 403 döndü. GitHub Pro veya public repo gerektiği bildirildi. Repo private olarak korundu; **main dalında zorunlu PR/onay koruması etkin değildir.**

PR ile çalışma ve squash birleştirme ayarları korunuyor. Teslim sahibi kendi kontrollerini ve bilinen eksiklerini PR'ye yazar. CI kurulumu sonrasında başarılı kontrollerin zorunlu hale getirilmesi hesap planının desteğine bağlıdır.

## Kod sahipliği (CODEOWNERS)

[`.github/CODEOWNERS`](../.github/CODEOWNERS) eklendi: hangi dosyanın kimin alanı olduğu artık makine tarafından okunabilir. Sahiplik `CONTRIBUTING.md` §"Ortak dosyalar" ve `docs/TASKS.json` `owner` + `files` alanlarından çıkarıldı.

CODEOWNERS iki ayrı işi vardır ve **yalnız birincisi branch protection olmadan da çalışır:**

1. **Otomatik reviewer atama.** Bir PR bir kişinin alanına dokunduğunda GitHub o kişiyi reviewer olarak atar. Koruma ayarı gerekmez; bugün de çalışır.
2. **Zorunlu onay.** Ancak branch protection'da **"Require review from Code Owners"** açıkken merge koşulu olur.

Yukarıda kayıtlı olduğu üzere ana dal koruması bu hesap planında private repoda açılamadı (HTTP 403; GitHub Pro veya public repo gerekiyor). Dolayısıyla **kod sahibi onayı şu an teknik olarak zorunlu değildir;** kural sosyal olarak işler ve CODEOWNERS doğru kişiyi otomatik çağırır.

Plan yükseltilir ya da repo public yapılırsa ana dal korumasında açılacak ayarlar:

- **Require a pull request before merging** (zaten uygulanan çalışma düzeni).
- **Require review from Code Owners** — bu maddeyi açmak kuralı zorunlu hale getirir.
- CI hazır olduğunda **Require status checks to pass** (`npm run check` iş akışı).

Açılırken bilinmesi gereken: **kimse kendi PR'ını onaylayamaz.** Tek sahipli bir alanda (ör. yalnız `src/features/` dosyaları) çalışan kişi, kod sahibi kendisi olsa bile kendi onayıyla bu koşulu karşılayamaz. İki kişilik ekipte bunun iki çıkışı vardır ve seçilen yol buraya yazılır:

- Karşı tarafın onayı her PR'da beklenir (en katı, çakışmayı en iyi önleyen).
- Ya da yöneticiye atlama hakkı bırakılır ("Do not allow bypassing the above settings" kapalı kalır) ve kendi alanındaki PR'lar onaysız merge edilebilir.

## CI ve uygulama

Bu yükleme planlama ve iş takibi teslimidir. Uygulama kodu, CI ve geliştirme komutları [Q01 / #1](https://github.com/mehmetalisahingm/quadro/issues/1) kapsamında kurulacaktır. Çalışmamış uygulama kontrolleri başarılı olarak raporlanmaz.

## Kaynaklar

- [Tüm görevler](GOREVLER.md)
- [Mehmet'in görevleri](MEHMET.md)
- [Utku'nun görevleri](UTKU.md)
- [Katkı ve PR düzeni](../CONTRIBUTING.md)
