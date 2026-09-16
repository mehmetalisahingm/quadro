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
| Dosya sahipliği | .github/CODEOWNERS |
| İnceleme düzeni | Diğer geliştiricinin review'u; PR ve issue şablonları hazır |

## Ana dal koruması

GitHub API ile koruma açılması denendi; mevcut hesap planı private repoda bu özelliği desteklemediği için HTTP 403 döndü. GitHub Pro veya public repo gerektiği bildirildi. Repo private olarak korundu; **main dalında zorunlu PR/onay koruması etkin değildir.**

Bu nedenle diğer kişinin review'u ve PR üzerinden çalışma şu anda ekip kuralıdır; GitHub tarafından zorlanmaz. Squash birleştirme ayarları, görev atamaları, CODEOWNERS ve şablonlar etkindir. CI kurulumu sonrasında başarılı kontrollerin zorunlu hale getirilmesi de hesap planının desteğine bağlıdır.

## CI ve uygulama

Bu yükleme planlama ve iş takibi teslimidir. Uygulama kodu, CI ve geliştirme komutları [Q01 / #1](https://github.com/mehmetalisahingm/quadro/issues/1) kapsamında kurulacaktır. Çalışmamış uygulama kontrolleri başarılı olarak raporlanmaz.

## Kaynaklar

- [Tüm görevler](GOREVLER.md)
- [Mehmet'in görevleri](MEHMET.md)
- [Utku'nun görevleri](UTKU.md)
- [Katkı ve PR düzeni](../CONTRIBUTING.md)
