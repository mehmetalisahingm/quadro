# Quadro — Yayın kontrol listesi

Bu dosya Q41 için yayın kararı iskeletidir. Bağımlılıklar tamamlanmadan yayın onayı verilmez.

## Yayın adayı

- Sürüm/etiket: —
- Commit SHA: —
- Preview URL: —
- Production URL: —
- Planlanan yayın tarihi: —
- Karar tarihi: —

## Zorunlu bağımlılıklar

- [ ] Q35 — 20–30 kişilik ürün pilotu tamamlandı; yayın engelleri kapatıldı.
- [ ] Q38 — 30 onaylı bulmacanın yayın takvimi ve stok kontrolü tamamlandı.
- [ ] Q39 — gerçek cihaz ve son görsel yayın kabulü tamamlandı.
- [ ] Q40 — preview/production dağıtımı ve rollback prosedürü tamamlandı.

## İçerik kabulü

- [ ] Yayın takviminde 30 benzersiz gün var.
- [ ] Her bulmaca diğer kişi tarafından review edilmiş doğru revision ile kayıtlı.
- [ ] İçerik doğrulayıcı tüm yayın stoğunda yeşil.
- [ ] İlk 14 günlük hazır stok doğrulandı.
- [ ] Gelecek bulmaca cevapları istemci paketine sızmıyor.
- [ ] Acil içerik düzeltme/revision prosedürü belgeli.

## Teknik kabul

- [ ] CI son yayın commit'inde tamamen yeşil.
- [ ] Production build başarılı.
- [ ] İstemci bundle denetimi başarılı.
- [ ] Tam regresyon paketi başarılı.
- [ ] Preview smoke testi başarılı.
- [ ] Production smoke testi başarılı.
- [ ] Ortam değişkenleri belgeli; gizli değer repoda yok.
- [ ] Rollback hedefi ve adımları test edilmiş/belgelenmiş.
- [ ] Açık P0/P1 teknik hata yok.

## Görsel ve kullanım kabulü

- [ ] iPhone Safari gerçek cihaz kabulü tamamlandı.
- [ ] Android Chrome gerçek cihaz kabulü tamamlandı.
- [ ] Masaüstü Chrome/Edge kabulü tamamlandı.
- [ ] 320 px/uzun kelime kontrolü geçti.
- [ ] `prefers-reduced-motion` kontrolü geçti.
- [ ] Klavye/odak akışı geçti.
- [ ] Sonuç ve paylaşım alternatifleri gerçek cihazda çalıştı.
- [ ] Açık kritik görsel/erişilebilirlik sorunu yok.

## Ürün/pilot kabulü

- [ ] En az 20 gerçek pilot katılımcısının kaydı var.
- [ ] Başlama, bırakma, bitiş ve paylaşım girişimi gözlemleri raporlandı.
- [ ] Pilot P0/P1 bulguları kapatıldı ve tekrar test edildi.
- [ ] Bilinen P2/P3 sınırlar aşağıda açıklandı.

## Kullanıcıya görünen metinler

Yayın öncesinde aşağıdaki yüzeylerin son metni birlikte kontrol edilir:

- Ana sayfa kısa ürün açıklaması
- İlk kez oynayan kullanıcı CTA/metni
- Öğreticiye yönlendirme
- Sonuç/kazanma/kaybetme metinleri
- Paylaşım metni ve kopyalama alternatifi
- Hata/geri dönüş metinleri
- Geri bildirim yolu

Metin ilkeleri:

- Oyunun cevabını/spoilerı açıklamaz.
- Dört grup / 16 kelime / hata hakkı gibi kurallarla uygulamanın gerçek davranışı çelişmez.
- Paylaşım girişimi “gerçek paylaşım gerçekleşti” gibi sunulmaz.
- Teknik hata kullanıcıya gereksiz iç ayrıntı vermez.

## Bilinen sınırlar

| Konu | Etki | Geçici çözüm | Takip issue'su | Yayını engelliyor mu? |
| --- | --- | --- | --- | --- |
| — | — | — | — | — |

## Geri bildirim yolu

- Kanal/URL: —
- Sorumlu: —
- İlk hafta hata triage düzeni: —

## Ortak yayın kararı

Aşağıdaki iki onay gerçek kişiler tarafından verilmeden Q41 kapatılmaz.

- Mehmet — görsel/ürün kabulü: `BEKLİYOR`
- Utku — teknik/operasyon kabulü: `BEKLİYOR`

**Karar:** `BEKLİYOR` / `YAYINLA` / `YAYINI ERTELE`

Karar gerekçesi: —

## Q41 kapanış koşulu

Q41, 30 onaylı içerik + başarılı teknik dağıtım + gerçek cihaz görsel kabulü birlikte doğrulandığında; kritik açık hata kalmadığında; bilinen sınırlar/geri bildirim yolu yazıldığında ve hem Mehmet hem Utku sürüm+tarih belirterek yayın kararını onayladığında tamamlanır.