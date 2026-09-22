# Repo kurulum kaydı

Tarih: 16 Eylül 2026 · Güncelleme: 22 Eylül 2026 (kod sahipliği ve zorunlu review kararı)

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
| Dosya sahipliği | [`.github/CODEOWNERS`](../.github/CODEOWNERS); kural metni `CONTRIBUTING.md` §"Kod sahipliği ve review" |
| İnceleme düzeni | Her PR, dokunduğu alanın kod sahibinden onay bekler (zorunlu review); GitHub tarafında dayatılması branch protection'a bağlı |

## Ana dal koruması

GitHub API ile koruma açılması denendi; mevcut hesap planı private repoda bu özelliği desteklemediği için HTTP 403 döndü. GitHub Pro veya public repo gerektiği bildirildi. Repo private olarak korundu; **main dalında zorunlu PR/onay koruması etkin değildir.**

PR ile çalışma ve squash birleştirme ayarları korunuyor. Teslim sahibi kendi kontrollerini ve bilinen eksiklerini PR'ye yazar. CI kurulumu sonrasında başarılı kontrollerin zorunlu hale getirilmesi hesap planının desteğine bağlıdır.

## Kod sahipliği (CODEOWNERS)

[`.github/CODEOWNERS`](../.github/CODEOWNERS) eklendi: hangi dosyanın kimin alanı olduğu artık makine tarafından okunabilir. Sahiplik `CONTRIBUTING.md` §"Ortak dosyalar" ve `docs/TASKS.json` `owner` + `files` alanlarından çıkarıldı.

CODEOWNERS'ın iki ayrı işi vardır ve **yalnız birincisi branch protection olmadan da çalışır:**

1. **Otomatik reviewer atama.** Bir PR bir kişinin alanına dokunduğunda GitHub o kişiyi reviewer olarak atar. Koruma ayarı gerekmez; bugün de çalışır.
2. **Zorunlu onay.** Ancak branch protection'da **"Require review from Code Owners"** açıkken merge koşulu olur.

Yukarıda kayıtlı olduğu üzere ana dal koruması bu hesap planında private repoda API ile açılamadı (HTTP 403; GitHub Pro veya public repo gerekiyor). Karar şudur: **kod sahibi onayı anlaşma gereği zorunludur** (`CONTRIBUTING.md` §"Kod sahipliği ve review"). Ayar açılamadığı sürece bu zorunluluğu GitHub dayatmaz; kural aramızda geçerlidir ve CODEOWNERS doğru kişiyi her PR'da otomatik çağırmaya devam eder.

Ayarın GitHub arayüzünden açılması denenecektir. Açılabilirse ana dal korumasında işaretlenecek maddeler:

- **Require a pull request before merging** (zaten uygulanan çalışma düzeni).
- **Require review from Code Owners** — bu maddeyi açmak kuralı GitHub tarafında da merge koşulu yapar.
- CI hazır olduğunda **Require status checks to pass** (`npm run check` iş akışı).

Açılırken bilinmesi gereken: **kimse kendi PR'ını onaylayamaz.** Tek sahipli bir alanda (ör. yalnız `src/features/` dosyaları) çalışan kişi, kod sahibi kendisi olsa bile kendi onayıyla bu koşulu karşılayamaz. Seçilen yol: **karşı tarafın onayı her PR'da beklenir** (en katı, çakışmayı en iyi önleyen). Yöneticiye atlama hakkı ("Do not allow bypassing the above settings" kapalı) yalnız acil düzeltmeler için kullanılır ve kullanıldığı PR'da belirtilir.

## CI ve uygulama

Bu yükleme planlama ve iş takibi teslimidir. Uygulama kodu, CI ve geliştirme komutları [Q01 / #1](https://github.com/mehmetalisahingm/quadro/issues/1) kapsamında kurulacaktır. Çalışmamış uygulama kontrolleri başarılı olarak raporlanmaz.

## Kaynaklar

- [Tüm görevler](GOREVLER.md)
- [Mehmet'in görevleri](MEHMET.md)
- [Utku'nun görevleri](UTKU.md)
- [Katkı ve PR düzeni](../CONTRIBUTING.md)
