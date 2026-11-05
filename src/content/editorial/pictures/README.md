# Resimli Quadro editoryal kaydı

Üç örnek tahta (#152). Yazar: Claude, Utku'nun görevi kapsamında. Yalnız öz denetim yapıldı; **bağımsız insan kör denemesi ve gerçek cihaz kabulü henüz yapılmadı.**

## İçerik çakışma taraması

İçerik yazılmadan önce `normalizeTr` ile tüm `src/content/` bulmacaları ve `fixtures/puzzles.ts` tarandı (1363 kelime, 461 başlık). İlk aday listede günlük bulmacalarla 13 kelime ve iki başlık çakıştığı için tahtalar yeniden kuruldu.

| Kontrol | Sonuç |
| --- | --- |
| Günlük bulmacalarla kelime | Çakışma yok |
| Fixture'larla kelime | Çakışma yok |
| Günlük, mod, Keşif Yolu ve fixture başlıkları | Çakışma yok |
| Fiil kalıbı | Kullanılmadı |
| Kaçınılan temalar (yiyecek, coğrafya, hayvan/bitki) | Grup olarak kullanılmadı |
| Keşif Yolu ve zorluk modlarıyla tekil kelime | GİTAR, TROMPET, FLÜT, AKORDEON, UÇAK, KRONOMETRE, BIÇAK, PİYANO, TARAK, TESTERE, FERMUAR, ÇARK ortak |

Günlük ve fixture koşulu `src/lib/daily/picturePuzzle.test.ts` ile kalıcı olarak denetlenir. Son satırdaki kelimeler herkese açık alıştırma modlarındadır; farklı gruplarda ve görsel olarak kullanıldıkları için bırakıldı.

## Alternatif çözüm kontrolü

Her satır, ikinci bir tam gruplamayı neden oluşturmadığını açıklar.

| Tahta | Yakın aday | Neden tek çözüm kalıyor |
| --- | --- | --- |
| 1 | BİSİKLET spor malzemesi sanılabilir | TAŞITLAR'da yalnız dört aday var; bisiklet çıkarsa üçe düşer. |
| 1 | BALON ve UÇURTMA uçar, UÇAK da uçar | Uçanlar dörde tamamlanmaz; GEMİ, KAMYON ve BİSİKLET'in tek ortak yeri taşıtlardır. |
| 1 | FUTBOL TOPU oyuncak sanılabilir | Oyuncaklara girerse spor grubu üçe düşer. MADALYA yalnız sporda yer alır. |
| 2 | AMPUL elektrikle ilgilidir | Elektrik harcar, sağlamaz; açıklama bu ayrımı söyler. Işık grubu onsuz üçe düşer. |
| 2 | EL FENERİ'nde pil vardır | Çizim ışık saçan feneri gösterir; PİL ayrı karttır. |
| 2 | MEŞALE ve KILIÇ eski dönem eşyası sanılabilir | Böyle bir dörtlü tamamlanmaz; ikisi ışık ve kesici gruplarında gereklidir. |
| 3 | KUMANDA'nın tuşları vardır | KUM grubu onsuz üçe düşer; TUŞLU grubu onsuz dört karttır. Tasarlanmış tuzaktır. |
| 3 | ÇARK ve TESTERE alet sanılabilir | Ortak aletler grubu dörde tamamlanmaz; dişleri olanlar dört kartla kapanır. |
| 3 | BEBEK ARABASI ve EL ARABASI adı "araba" içerir | Ortak grup tekerlekli eşyalardır; PATEN ve KAYKAY aynı gruptadır. |

Zorluk: tahta 1 açık kategoriler, tahta 2 kullanım amacı, tahta 3 ortak özellik ve ad oyunu.

## Görseller

48 kart ve mod girişi çizimi bu proje için elle yazılmış SVG'dir (`public/images/pictures/`), üçüncü taraf varlık içermez; kayıt `assets.json` içindedir. Tüm kartlar aynı kare ölçü, çizgi kalınlığı ve açık zemini kullanır; kategoriye özel arka plan, çerçeve veya renk yoktur. Dosya adı nesneyi söyler, grubu söylemez. Kart kimlikleri (`picture-00N-wM`) nesneyi de söylemez.
