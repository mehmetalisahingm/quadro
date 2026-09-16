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

Uygulamayı çalıştırma komutları, temel kurulum görevi tamamlandığında bu README'ye eklenecek.
