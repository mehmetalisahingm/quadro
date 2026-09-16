# Quadro — Türkçe Günlük Gruplama Bulmacası

Sürüm: 3 · Tarih: 16 Eylül 2026 · Ekip: Mehmet ve Utku

Bu belge ürünün tasarımını, oyun kurallarını, içerik kalitesini ve iş bölümünü tanımlar. **A = Utku (@Utkuuzun14), B = Mehmet (@mehmetalisahingm).** Utku motor/altyapı, Mehmet tasarım/arayüz sahibidir. İçerik üretimi ikisinin sorumluluğundadır; birbirlerinin review'u zorunlu değildir. Ayrıntılı iş listesi [Görevler](docs/GOREVLER.md), kişisel başlangıç sayfaları [Mehmet](docs/MEHMET.md) ve [Utku](docs/UTKU.md) belgelerindedir.

## 1. Ürün ve başarı hedefi

Her gün herkesin aynı 16 Türkçe kelime arasındaki dört gizli bağlantıyı bulduğu, mobil öncelikli bir web oyunu geliştirilecek. Her bağlantı dört kelimeden oluşur; oyuncunun dört hata hakkı vardır.

Ürünün üç temel vaadi:

1. İlk ekranda merak uyandıran, kolay anlaşılan ve özenli bir görsel deneyim.
2. Çözülünce anlamlı gelen, adil ve şaşırtıcı Türkçe bulmacalar.
3. Sonucu paylaşmak ve ertesi gün tekrar oynamak için anlaşılır bir neden.

İlk hedef gelir değil, oyuna başlama, ertesi gün geri dönme ve paylaşma davranışını doğrulamaktır. Marka adı ve görsel kimlik özgün tasarlanır. **Quadro geçici çalışma adıdır; nihai oyun adı henüz seçilmemiştir.**

## 2. İlk sürümün kapsamı

İlk sürümde ana sayfa, isteğe bağlı öğretici, günlük oyun, kazanma/kaybetme ekranları, açıklamalar, paylaşım, cihazda ilerleme kaydı, günlük seri ve temel kişisel istatistikler bulunur.

Hesap açmadan oynanır. İlerleme ve istatistikler kullanılan tarayıcıya aittir; cihazlar arasında otomatik taşınmaz. Sunucunun günlük bulmaca sunması, kullanıcı hesabı sistemi gerektirmez.

Arşiv, arkadaş hesapları, sıralama tablosu, multiplayer, ödeme, kapsamlı içerik editörü, özel gün etkinlikleri ve başka oyunlar sonraki sürümlere bırakılır.

## 3. Ana sayfa: ürünün vitrini

### İlk ziyaret

İlk ekran kullanıcıya oyunun ne olduğunu ve nasıl başlayacağını anlatır. Ana eylem mobilde kaydırmadan görülebilir olmalıdır.

Önerilen içerik sırası:

1. Marka işareti ve küçük “Nasıl oynanır?” bağlantısı.
2. Ana cümle: **“16 kelime. 4 gizli bağ. Hepsi göründüğü gibi değil.”**
3. Açıklama: “Ortak bir bağı olan dörder kelimeyi bul. Dört hata hakkın var.”
4. Tarih ve bulmaca numarasıyla **“Bugünün bulmacasını çöz”** butonu.
5. İkincil eylem: **“Kısa örneği dene.”**

Örnek, günlük bulmacadan bağımsız ve iki gruplu küçük bir alıştırmadır. Günlük hakları, süreyi ve istatistikleri etkilemez. İsteyen kullanıcı açıklamayı atlayıp hemen oyuna geçebilir.

Masaüstünde örnek kartlar ana metnin yanında kullanılabilir. Mobilde ana buton ve açıklama önceliklidir; örnek isteğe bağlı açılır. Sayfanın devamındaki kısa kural ve paylaşım anlatımı ilk ekranı kalabalıklaştırmaz.

### Tekrar ziyaret

Ana eylem kullanıcının bugünkü durumuna göre değişir:

| Durum | Ana eylem |
| --- | --- |
| Başlamadı | Bugünün bulmacasını çöz |
| Yarım bıraktı | Kaldığın yerden devam et |
| Kazandı veya kaybetti | Bugünkü sonucunu gör |

Tamamlayan oyuncu sonucunu paylaşabilir ve yeni bulmacanın Türkiye saatiyle ne zaman açılacağını görebilir. Doğrudan `/play` bağlantısı da kullanılabilir.

### Görsel yön

Başlangıç tasarım yönü: sıcak kırık beyaz zemin, koyu mürekkep metin, dört ayırt edilebilir vurgu rengi, güçlü başlık tipografisi ve dokunma hissi veren kartlar.

Kalite; tipografi, boşluk, kart oranları, okunabilirlik ve hareketin zamanlamasıyla oluşturulur. Oyun alanında kelimeler en güçlü görsel öğe olarak kalır. Türkçe karakterleri eksiksiz destekleyen fontlar seçilir.

Girişteki kartlar, “Oyna” eylemiyle kısa bir geçiş üzerinden oyun tahtasına dönüşebilir. Oyun butonu animasyon beklemez. Tam ekran zorunlu intro bulunmaz; tekrar ziyaretler doğrudan ve hızlıdır.

**Tasarım kabulü:** 320 px mobil, yaygın telefon ve masaüstü ölçülerinde; ilk ziyaret, yarım oyun ve tamamlanmış oyun durumlarının tamamı tasarlanır. Ana sayfa yalnızca masaüstü görseliyle tamamlanmış sayılmaz.

## 4. Oyun kuralları ve uç durumlar

| Durum | Kesin davranış |
| --- | --- |
| Seçim | Çözülmemiş kelimelerden en fazla dört farklı kart seçilir. Seçili karta tekrar basmak seçimi kaldırır. |
| Grupla | Tam dört kart seçildiğinde etkinleşir. |
| Doğru | Grup açılır, açıklaması erişilebilir olur, kelimeler tahtadan çıkar ve seçim temizlenir. Hak azalmaz. |
| Çok yakın | Seçilenlerin tam üçü aynı çözülmemiş gruptandır. “Bir kelime uzaktasın” gösterilir; bir hak azalır. Hangi kelimenin farklı olduğu söylenmez. |
| Yanlış | Bir hak azalır. Seçim ekranda kalır; oyuncu kelimelerini değiştirebilir. |
| Tekrarlanan tahmin | Daha önce gönderilen aynı dörtlü, sırası farklı olsa da tekrar sayılır. Mesaj gösterilir; hak ve tahmin geçmişi değişmez. |
| Geçersiz gönderim | Eksik, tekrar eden, bilinmeyen veya çözülmüş kelime kimlikleri reddedilir. Hak azalmaz. |
| Kazanma | Dördüncü doğru grup bulunduğunda durum `won` olur. |
| Kaybetme | Dördüncü yanlışta durum `lost` olur. Kalan cevaplar ve açıklamalar gösterilir; açılan cevaplar çözülmüş sayılmaz. |
| Bitmiş oyun | Yeni tahmin kabul edilmez. Sonuç yeniden açılabilir. |
| Karıştır | Yalnızca çözülmemiş kartların yerlerini değiştirir; seçim ve haklar korunur. |
| Seçimi temizle | Seçili kartları bırakır; hak azalmaz. |

Motor her gönderimi bir kez işler. Geçiş sırasında tekrar gönderme arayüzde kilitlenir; motorun kuralları da geçersiz tekrarları engeller.

Süre, yalnızca görünür ve aktif oyun ekranında ilerler. Ana sayfa, öğretici ve arka plandaki sekme süreye eklenmez. Süre baskın bir yarış unsuru değildir; sonuçta ikincil bilgi olarak gösterilir.

## 5. Şaşırtma ve içerik kalitesi

### Temel ilke

İyi bulmaca, çözüm açıklanınca “Bunu nasıl göremedim?” dedirtir. Bağlantının geçerliliğini savunmak için zorlama açıklama gerektirmemelidir.

Yanıltma; gerçek çift anlamlardan, deyimlerden, ortak kullanılan sözcüklerden, ses veya yazı oyunlarından doğar. Örneğin “YÜZ”ün sayı ve surat anlamları farklı bağlantılar düşündürebilir. Bu örnek tek başına yayımlanmaya hazır bir kategori değildir.

Yanıltıcı bir dörtlünün kendi içinde anlamlı olması mümkündür. Ancak 16 kelimenin tamamını aynı derecede güçlü biçimde açıklayan ikinci bir tam gruplama, editoryal incelemede elenme nedenidir.

### Dört zorluk katmanı

1. **Kolay:** Oyuncunun oyuna girmesini sağlayan, geniş kitlece bilinen bağlantı.
2. **Orta:** Dikkat veya yaygın kültürel bilgi isteyen bağlantı.
3. **Zor:** Çok anlamlılık, ifade tamamlama ya da daha dolaylı ilişki.
4. **Çetin:** Tutarlı bir dil oyunu veya güçlü fakat adil şaşırtma.

Zorluk yalnızca kategori konusundan çıkarılmaz; kör çözüm denemeleriyle ayarlanır. “Şehirler” her zaman kolay, “kelime oyunu” her zaman zor değildir. Başlangıçta kategoriler ve zorlukları gizlidir.

### Her bulmacanın editoryal kaydı

- Dört grubun başlığı, kelimeleri ve kısa çözüm açıklaması.
- Zorluk gerekçeleri ve hedeflenen yanıltıcı bağlantılar.
- Özellikle karışabilecek kelimeler ve denenmiş alternatif gruplamalar.
- Yazım, anlam veya kültürel bilgi için gerektiğinde doğrulama kaynağı.
- Hazırlayan, isteğe bağlı kör deneme, revizyon ve yayın kararı.

Grup açıklamaları zorunludur. Ortak kelimeyle tamamlanan bir kategoride dört ifadenin de doğal Türkçe kullanımı doğrulanır. Dört kelime aynı kurala uyar; gizli ve tutarsız istisnalar kullanılmaz. Büyük/küçük harfe dayalı bir oyun varsa görsel gösterimi de kurala uygundur.

### Üretim akışı

`Taslak → yapısal kontrol → isteğe bağlı kör deneme → alternatif bağlantı taraması → revizyon → yayın kararı`

İlk aşamada 5 örnek bulmaca, farklı kelime oyunu deneyimine sahip toplam 5–10 dış oyuncuyla denenir. Takıldıkları kelimeler, kurdukları yanlış bağlar ve açıklamalara itirazları kaydedilir. Dış oyuncu denemesi önerilir; teslim ve yayın kararı için zorunlu reviewer atanmaz.

İçerik çalışması Faz 0'da başlar ve geliştirme boyunca sürer. Yayına kadar en az 30 onaylı günlük bulmaca hazırlanır; yayın sonrasında en az 14 günlük onaylı stok hedeflenir.

Otomatik doğrulayıcı yapısal hataları bulur. Anlamsal adalet, özgünlük ve eğlence yazarın editoryal kontrolüyle değerlendirilir; ikinci kişinin kör denemesi isteğe bağlı bir kalite sinyalidir. Yapay zekâ önerileri taslak olarak kullanılabilir; yayın kararı insana aittir.

## 6. Ortak teknik sözleşme

Ortak TypeScript tipleri `src/features/game/contracts.ts` içinde bulunur. `docs/CONTRACTS.md`, bu tiplerin davranışlarını ve örneklerini açıklar. İkisi aynı PR içinde güncellenir.

```ts
type Four<T> = [T, T, T, T];
type WordId = string;
type GameStatus = "playing" | "won" | "lost";

type PuzzleWord = {
  id: WordId;
  text: string;
};

type PuzzleGroup = {
  id: string;
  title: string;
  words: Four<PuzzleWord>;
  difficulty: 1 | 2 | 3 | 4;
  explanation: string;
};

type Puzzle = {
  schemaVersion: 1;
  revision: number;
  id: string;
  date: string; // YYYY-MM-DD; Europe/Istanbul yayın günü
  language: "tr";
  groups: Four<PuzzleGroup>;
};

type Attempt = {
  id: string;
  wordIds: Four<WordId>;
  verdict: "correct" | "one-away" | "wrong";
};

type GameSnapshot = {
  schemaVersion: 1;
  puzzleId: string;
  puzzleRevision: number;
  dayKey: string;
  status: GameStatus;
  selectedWordIds: WordId[];
  remainingWordOrder: WordId[];
  solvedGroupIds: string[];
  mistakesRemaining: number;
  attempts: Attempt[];
  activeSeconds: number;
};

type SubmitOutcome =
  | { verdict: "correct"; solvedGroup: PuzzleGroup }
  | { verdict: "one-away" }
  | { verdict: "wrong" }
  | { verdict: "repeated" }
  | {
      verdict: "invalid";
      reason: "selection-count" | "invalid-words" | "game-ended";
    };

type SubmitResult = {
  outcome: SubmitOutcome;
  snapshot: GameSnapshot;
};

type GameController = {
  snapshot: GameSnapshot;
  toggleWord: (wordId: WordId) => void;
  clearSelection: () => void;
  shuffle: () => void;
  submitSelection: () => SubmitResult;
};
```

Son doğru tahmin, `outcome.verdict = "correct"` ve `snapshot.status = "won"` döndürür. Böylece hem son grup animasyonu hem sonuç ekranı doğru veriyi alır. Dördüncü yanlış da kendi tahmin sonucuyla birlikte `lost` durumunu taşır.

UI, motorun ürettiği durumu gösterir; hak, doğruluk, seri veya kazanma hesabını yeniden yapmaz. Seçim kelime metniyle değil kimlikle yapılır. Görsel animasyon durumu B'nin arayüz katmanına aittir.

Motor saf ve test edilebilir fonksiyonlardan oluşur; React adaptörü aynı sözleşmeyi UI'ya sunar. A, başlangıçta bu sözleşmeye uyan örnek adaptörü sağlar. B, gerçek motor bitmeden ekranları geliştirebilir.

Standart oyun örneği dört grup ve 16 kelime içermelidir. İki gruplu ana sayfa öğreticisi ayrı bir örnek veri türüdür. Boş, yarım kalmış, doğru, çok yakın, son hak, kazanılmış, kaybedilmiş ve uzun kelimeli durumlar için arayüz örnekleri hazırlanır.

## 7. Günlük yayın, kayıt ve seri

- Yayın günü herkes için `Europe/Istanbul` saat diliminde 00.00'da değişir. Bulmaca kimliği ve tarihi sunucunun günlük seçimiyle belirlenir.
- Gelecek günlerin bulmacaları ve editoryal notlar istemci paketine girmez. Sunucu yalnızca o gün yayımlanmış bulmacayı sunar.
- MVP'de doğruluk kontrolü tarayıcıda yapılabilir; bugünkü cevaplar teknik olarak istemcide bulunur. Gelecekte ödüllü veya rekabetçi sistem eklenirse sunucu doğrulaması ayrıca tasarlanır.
- Kayıt bulmaca kimliği, revizyonu ve şema sürümüyle saklanır. Seçim, kart sırası, tahmin geçmişi, haklar ve süre yenilemede geri yüklenir.
- Bozuk kayıt uygulamayı çökertmez. Uyumsuz kayıt için açık bir kurtarma davranışı uygulanır; geçmiş tamamlanmış sonuçlar ayrı korunur.
- Yayımlanan bulmacalar normal akışta değiştirilmez. Zorunlu düzeltme revizyon ve kayıt uyumluluğu incelemesi gerektirir.
- Gece yarısında açık oyun kullanıcının önünden kaldırılmaz; başladığı bulmacayı bitirebilir. Yeni gün bilgisi ve yeni bulmacaya geçiş gösterilir.
- Seri, günlük bulmacanın kendi yayın gününde kazanılmasıyla ilerler. Gece yarısından sonra tamamlanan önceki günün oyunu seriye eklenmez.
- Kaybetme veya günü kazanamadan geçirme kazanma serisini keser. Tamamlama ve istatistik kaydı her bulmaca için yalnızca bir kez işlenir.
- Günlük içerik yüklenemezse açık hata durumu ve yeniden deneme seçeneği gösterilir.

## 8. Görsel hareket, ses ve erişilebilirlik

İlk tercih CSS ve Motion'dır. GSAP ancak mevcut araçların karşılamadığı somut bir sekans ihtiyacı çıkarsa eklenir. Three.js ilk sürüm kapsamına girmez.

Hareket hedefleri:

- Kart seçimi: kısa yükselme ve belirgin seçili durum; yaklaşık 100–150 ms.
- Yanlış tahmin: yalnızca ilgili kartlarda kısa geri bildirim; yaklaşık 150–250 ms.
- Doğru grup: dört kartın birleşip kategori satırına yerleşmesi; yaklaşık 300–450 ms.
- Final: son grup tamamlandıktan sonra mevcut ekran içinde sonucun açılması.

Bu süreler başlangıç tasarım hedefleridir; gerçek cihazda ayarlanır. Hareket okuma ve seçimi geciktirmez. Hata mesajı yalnızca kısa animasyon süresince görünmez; okunabilecek kadar kalır.

Ses varsayılan olarak kapalıdır. Kullanıcı açtığında kısa ve tutarlı sesler kullanılır; tercih kaydedilir. Azaltılmış hareket tercihi desteklenir. Renklerin yanında başlık, metin ve anlaşılır durum işaretleri bulunur.

Klavye kullanımı, görünür odak, seçili kartın erişilebilir durumu ve durum mesajlarının ekran okuyucuya iletilmesi sağlanır. Kartların dokunma alanı en az 44×44 CSS piksel hedefler.

320 px ekranda 4×4 düzen ve uzun Türkçe kelimeler denenir. Kelimeler anlamını kaybettirecek biçimde kesilmez; okunabilirlik korunamıyorsa düzen veya içerik yeniden ele alınır.

## 9. Sonuç ve paylaşım

Kazanma ve kaybetme aynı özenle tasarlanır. Sonuç ekranında dört kategori, açıklamaları, oyuncunun gerçekten bulduğu grup sayısı, hata sayısı, süre ve seri yer alır.

Paylaşım cevabı içermez. Her geçerli tahmin bir satırdır; karelerin renkleri o tahminde seçilen kelimelerin gerçek gruplarını temsil eder. Yanlış tahminler de görünür. Tekrarlanan veya geçersiz gönderimler eklenmez.

Örnek şablon:

```text
QUADRO #43 · 20.09.2026
[Tahmin geçmişinden üretilen renkli kare satırları]
Bulunan grup: 4/4 · Hata: 1
Seri: 12
Bugünün bağlantılarını sen de bul:
https://<alan-adı>/play
```

Öncelik metin paylaşımıdır. Desteklenen cihazlarda yerel paylaşım, diğerlerinde kopyalama kullanılır. Pano erişimi çalışmazsa seçilebilir metin gösterilir. Görsel sonuç kartı, temel akış doğrulandıktan sonra eklenebilir.

## 10. İki kişilik sahiplik

| Alan | Ana sahip | Diğer kişinin katkısı |
| --- | --- | --- |
| Oyun motoru, ortak tipler, React adaptörü | A | B, UI ihtiyaç notları |
| Günlük yayın, kayıt, seri ve istatistik | A | B, durumların gösterimi |
| Yapısal içerik doğrulayıcı ve otomatik kontroller | A | B, zor kelime ve ekran senaryoları |
| Ana sayfa, öğretici, oyun ve sonuç ekranları | B | A, isteğe bağlı entegrasyon geri bildirimi |
| Tasarım sistemi, responsive, erişilebilirlik, hareket ve ses | B | A, işlevsel kontrol |
| Bulmaca hazırlama | Haftalık dönüşümlü | İsterse kör deneme ve geri bildirim |
| Motor–UI entegrasyonunun takibi | A | B ile ortak çalışma |
| Yayın hazırlığı ve teknik dağıtım | A | B, görsel kabul |
| Yayın kararı | Teslim sahibi | İsteğe bağlı geri bildirim |

Klasör sahipliği:

```text
src/features/game/             A — contracts, engine, state, React adaptörü
src/app/api/puzzle/             A — günlük içerik sunumu
src/lib/persistence/            A — kayıt ve sürümleme
src/lib/daily/                  A — yayın günü ve tarih işlemleri
src/components/                 B — ortak ve oyun bileşenleri
src/app/                        B — API klasörü dışındaki sayfalar/layout
src/styles/                     B — tasarım tokenları ve stiller
src/animations/                 B — hareketler
public/sounds/                  B — ses varlıkları
src/content/puzzles/            Dönüşümlü yazar + kendi editoryal kontrolü
src/content/editorial/          Dönüşümlü yazar + kendi editoryal kontrolü
```

`package.json`, kilit dosyası, derleme ayarları ve CI değişikliklerini A koordine eder. B ihtiyaç duyduğu bağımlılıkları aynı görev içinde A ile netleştirir. Ortak alan değişikliklerinin sahibi PR açılmadan belirlenir.

## 11. Repo ve çalışma düzeni

Küçük, tek amaçlı PR'lar ve kısa ömürlü görev dalları kullanılır. Örnek dallar: `codex/game-contracts`, `codex/homepage`, `codex/game-engine`, `codex/result-share`.

Akış: `Issue → görev dalı → geliştirme → gerekli kontroller → squash merge`.

Her issue; amaç, dosya sahipliği, bağımlılık, kabul ölçütü ve doğrulama yöntemini içerir. Arayüz PR'larında mobil ve masaüstü görüntüleri, motor PR'larında ilgili kural testleri bulunur.

`main` için PR ve başarılı kontrol gereksinimi ayarlanır. İki geliştirici en geç her iş gününün sonunda birlikte çalışan sürümü kontrol eder. Sözleşme değişirse örnek adaptör, gerçek motor ve UI tüketicileri aynı değişiklik zincirinde güncellenir.

Faz 0'da bu plandan türetilecek kısa belgeler:

- `docs/CONTRACTS.md`
- `docs/GAME_RULES.md`
- `docs/PUZZLE_GUIDE.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/GIT_WORKFLOW.md`

## 12. Geliştirme fazları ve bitiş koşulları

### Faz 0 — Ürün, sözleşme ve ilk içerik

Birlikte kapsamı, adı, kuralları ve sahipliği kesinleştirin. A proje temelini, ortak tipleri ve geçerli örnek adaptörü hazırlar. B ana sayfa ve oyun alanının mobil/masaüstü tasarımını çıkarır. Aynı anda ilk 5 bulmaca hazırlanıp kör çözüm başlatılır.

**Bitiş koşulu:** Ortak tipler, gerçekçi arayüz durumları, seçilmiş görsel yön ve dış oyuncularda denenmiş ilk içerik örnekleri hazırdır.

### Faz 1 — Paralel ilk çalışan akış

A; seçimi, doğrulamayı, hakları, tekrar kontrolünü ve kazanma/kaybetmeyi geliştirir. B; ana sayfayı, öğreticiyi, tahtayı ve sonuç ekranını sözleşmeye uyan örnek adaptörle geliştirir.

**Bitiş koşulu:** `Ana sayfa → bir gerçek bulmaca → kazanma veya kaybetme → paylaşım` akışı gerçek motorla çalışır. Entegrasyon görsel son rötuşlardan önce tamamlanır.

### Faz 2 — Günlük kullanım ve geri dönüş

A günlük yayın, kayıt, devam etme, seri, istatistik ve doğrulayıcıyı tamamlar. B geri dönen kullanıcı durumlarını, sonuç açıklamalarını, hata ekranlarını ve paylaşım alternatiflerini tamamlar.

**Bitiş koşulu:** Yenileme, gün değişimi, son hak, tekrar tahmin, bozuk kayıt ve paylaşım başarısızlığı kontrollü çalışır. Aynı oyun istatistikleri iki kez artırmaz.

### Faz 3 — Görsel kalite ve pilot

B hareketleri, ses tercihini, mobil ayrıntıları ve erişilebilirliği tamamlar. A performansı, hata takibini ve ölçüm olaylarını kurar. İçerik üretimi ve isteğe bağlı kalite denemeleri devam eder.

**Bitiş koşulu:** 20–30 kişilik önerilen pilotta ilk kullanım ve bulmaca adaleti gözlenmiştir. Ana sayfadan başlama, bırakma ve paylaşma sorunlarına göre düzeltme yapılmıştır. Pilot büyüklüğü bir çalışma hedefidir; başarı garantisi değildir.

### Faz 4 — Yayın

En az 30 onaylı bulmaca takvime atanır. Üretim derlemesi, içerik doğrulaması, temel tarayıcı akışları, metadata, favicon, OG görseli ve dağıtım kontrol edilir.

**Bitiş koşulu:** A işlevsel ve yayın kontrollerini, B görsel ve kullanılabilirlik kontrollerini tamamlar. Açık kritik hata bulunmaz; onaylı günlük içerik stoğu hazırdır.

## 13. Test ve yayın ölçütleri

Otomatik kontroller; TypeScript, lint, üretim derlemesi ve davranışı doğrulayan testleri kapsar.

Öncelikli motor testleri: dört farklı seçim, doğru grup, üç doğru kelime, dördüncü yanlışta kayıp, son grupta kazanma, tekrar tahmin, bitmiş oyuna gönderim ve çözülen kelimenin yeniden kullanımı.

Öncelikli kayıt/tarih testleri: yenilemeden devam, tek kez sonuç kaydı, Türkiye gece yarısı, gün atlama, arka plan süresi ve uyumsuz kayıt kurtarma.

İçerik doğrulayıcı; tam dört grup, her grupta dört kelime, benzersiz kimlikler, yinelenmeyen kelimeler, dolu başlık/açıklama, geçerli tarih, benzersiz günlük atama ve 1–4 zorluklarının birer kez kullanıldığını kontrol eder. Metin karşılaştırması boşluk ve Unicode normalizasyonunu, Türkçe büyük/küçük harf dönüşümünü kapsar.

Tarayıcıda ilk ziyaret, öğretici, kazanma, kaybetme, yeniden açma, klavye kullanımı, ses tercihi, azaltılmış hareket ve paylaşım denenir. Chrome, Edge ve gerçek Safari/iOS kontrolü yapılır; WebKit otomasyonu ayrıca destekleyici kanıttır.

Performans hedefleri: ana eylemin gecikmeden kullanılabilmesi, girişte düzen sıçramaması ve hedef mobil cihazda akıcı kart hareketleri. Laboratuvar ölçümleri ve gerçek cihaz gözlemleri ayrı kaydedilir.

## 14. Ölçüm ve devam kararı

İlk yayınla birlikte şu akış ölçülür:

`Ana sayfa görüntüleme → oynamaya başlama → ilk tahmin → kazanma/kaybetme → paylaşım girişimi → sonraki gün dönüş`

Öncelikli metrikler:

- İlk ziyaretçilerin oyuna başlama oranı.
- İlk tahmine ulaşmadan ayrılma oranı.
- Kazanma, kaybetme ve yarım bırakma oranları.
- Bulmaca bazında ortalama hata, çözülme sırası ve aktif süre.
- Ertesi gün dönüşü ve yedinci gün dönüşü.
- Paylaşım veya kopyalama girişimi oranı.
- Aktif oyuncu ve kazanma serisi dağılımı.

Paylaş butonuna basılması, mesajın gerçekten gönderildiğini kanıtlamaz; ölçüm adı bunu yansıtır. Hesapsız kullanımda tekrar ziyaret ölçümleri tarayıcı bazlıdır ve depolama silinmesinden etkilenebilir. D7, başlangıç gününden tam yedi gün sonraki dönüş olarak tanımlanır.

İlk pilotta en çok oyuncu kaybedilen adım ve en çok itiraz alan bulmacalar iyileştirilir. Arşiv veya ikinci oyun kararı, ana günlük oyunun geri dönüş davranışı gözlendikten sonra alınır.
