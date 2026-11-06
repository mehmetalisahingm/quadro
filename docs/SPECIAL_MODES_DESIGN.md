# Özel modların tasarımı (#173)

Kurallar `src/features/game/specialModes.ts` içinde saf fonksiyonlardır. Hiçbir modda sonucu rastgelelik belirlemez; aynı tahta ve aynı kararlar aynı sonucu verir. Gerçek para, bahis veya satın alma yoktur.

Her modda ortak olanlar:

- Dört hata hakkı ve aynı motor (seçim, karıştırma, çok yakın, yinelenen tahmin).
- **Temel skor** yalnız kazanılan oyunda 400 − 100 × yanlış tahmin; enerji ödülü bundan hesaplanır (bkz. [enerji](SPECIAL_MODES_ENERGY.md)).
- **Mod bonusu** ayrıdır, ayrı gösterilir ve enerji vermez.
- İlk girişte kısa kural anlatımı açık gelir; kapatılınca o tarayıcıda kapalı kalır, istenince yeniden açılır.
- Sonuç ekranı her turun kararını ve etkisini listeler.

## Risk: güven ve karar

**Hedef:** potu büyütmek. 100 ile başlar; pot sıfırlanırsa oyun biter.

**Döngü:** kartları seç → duruşu seç → Grupla → pot güncellenir → sonraki turun seçenekleri değişir.

| Karar | Seçenekler | Etkisi |
| --- | --- | --- |
| Duruş | Güvenli, Cesur, Efsane | Kazanç ve kayıp büyüklüğü |
| Zorluk rengi (yalnız Efsane) | Sarı, Yeşil, Mavi, Mor | Renk tutarsa tam kazanç, tutmazsa kısmi |

| Duruş | Doğru | Yanlış |
| --- | ---: | ---: |
| Güvenli | +25 | −25 |
| Cesur | +75 | −50 |
| Efsane, renk doğru | +150 | −100 |
| Efsane, renk yanlış | +50 | −100 |

**Turlar arası bağ:** Efsane yalnız bir önceki tahmin doğruysa açılır. Yanlış bir tahmin zinciri koparır ve sonraki turda Efsane kapanır. İlk tahminde Efsane yoktur.

**Bonus:** potun 100'ü aşan kısmı. Eski puan yatırma kayıtları açılır; yatırılan miktar duruşa çevrilir (≤ 25 Güvenli, ≤ 75 Cesur, üstü Efsane) ve tahmin geçmişi korunur.

## Çarpan Merdiveni: yükselme ve kasa

**Hedef:** kasayı doldurmak.

**Döngü:** doğru grup → basamak yükselir → ilerle, kasaya al ya da kalkan kur.

| Karar | Seçenekler | Etkisi |
| --- | --- | --- |
| Kasaya almak | Şimdi / daha sonra | Ortadaki puan güvene girer, çarpan 1×'e döner |
| Kalkan (tek kullanım) | Kur / kurma | Kurulduktan sonraki ilk yanlışta pot ve çarpan korunur |

| Olay | Sonuç |
| --- | --- |
| Doğru grup | +100 × çarpan; çarpan bir basamak yükselir (1× → 2× → 3× → 4×, en fazla 4×) |
| Yanlış, kalkan yok | Ortadaki pot ve çarpan sıfırlanır; kasa korunur |
| Yanlış, kalkan kurulu | Pot ve çarpan korunur; kalkan tükenir |
| Son grup | Ortadaki pot kendiliğinden kasaya girer |

Hep kasaya almak çarpanı hiç yükseltmez, hiç almamak tek yanlışta potu kaybettirir; kalkanın zamanlaması bu dengeyi değiştirir.

**Bonus:** kasadaki puanın, içindeki doğru grupların 100'er temel puanını aşan kısmı.

## Bomba Kart: fitil ve zamanlama

**Hedef:** bombanın grubunu fitil bitmeden çözmek.

**Döngü:** bombalı kart görünür → her tahmin fitili azaltır → bomba grubunu çöz ya da soğut.

| Karar | Seçenekler | Etkisi |
| --- | --- | --- |
| Bomba grubunu ne zaman hedeflemek | Hemen / önce emin olduğun gruplar | Erken çözüm daha çok bonus; emin olmadan denemek ek hata riski |
| Soğutmak (tek kullanım) | Şimdi / sonra / hiç | Fitile 2 tur ekler |

| Olay | Sonuç |
| --- | --- |
| Bomba grubu çözüldü | +100 ve kalan her tur için +50 (ilk tahminde +250) |
| Bomba grubunu çözmeyen kabul edilen tahmin | Fitil −1 |
| Fitil 0 | Bomba patlar: bir ek hata, bonus yok |
| Bombalı kartı içeren yanlış tahmin | Bir ek hata |

Bombalı kart artık rastgele değil, tahtadan deterministik seçilir. Eski kayıtlarda bombanın yeri korunur.

**Bonus:** etkisiz kılma bonusu. Ek hatalar hata hakkından düşer ama "yanlış tahmin" sayılmaz; temel skoru yalnız gerçek yanlış tahminler belirler.
