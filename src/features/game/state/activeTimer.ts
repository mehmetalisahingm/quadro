/**
 * Aktif oyun süresinin saf çekirdeği (Q21).
 *
 * `GameSnapshot.activeSeconds` bir **duvar saati farkı değildir**: oyunun
 * açıldığı an ile bitiş anı arasındaki süre değil, oyun ekranı gerçekten
 * oyuncunun önünde ve oyun sürerken geçen sürelerin toplamıdır. Arada geçen
 * "görünmez" süre (başka sekme, kapalı tarayıcı, sonuç ekranı) hiç ölçülmez.
 *
 * Model iki parçadır:
 *
 * 1. **Birikmiş süre.** Kayıttan gelen ve her duraklamada üstüne eklenen toplam.
 * 2. **Oturum.** Sayaç çalışıyorsa başladığı an; durmuşsa yok.
 *
 * Birikim milisaniye tutulur ve saniyeye yalnız okuma sınırında çevrilir
 * ({@link timerSeconds}). Neden: saniyeden kısa duraklat/sürdür döngülerinde
 * (sekme değiştirme, pencere odağı) her duraklamada aşağı yuvarlanırsa süre
 * kaybolur — art arda 0,9 saniyelik altı oturum 5 saniye yerine 0 gösterirdi.
 *
 * Zaman dışarıdan verilir: buradaki hiçbir fonksiyon saate, `setInterval`e ya da
 * tarayıcıya dokunmaz. Görünürlük olaylarının bu modele bağlanması
 * `useActiveTimer.ts`, koşulların tek yerde toplanması `gameStore.ts` içindedir.
 */

/**
 * Kabul edilen en uzun aktif süre (saniye): 24 saat.
 *
 * Makuliyet sınırıdır, oyun kuralı değil. Kayıt katmanı `activeSeconds` için
 * yalnız "sonlu ve negatif olmayan sayı" ister (bkz. `src/lib/persistence/record.ts`);
 * bu gevşeklik bilinçlidir ve Q20 kuralları burada değiştirilmez. Ama elle
 * kurcalanmış ya da bozuk bir saatin ürettiği uçuk bir değerin sonuç ekranında
 * "9999:59" olarak görünmesinin de anlamı yok: sınır yalnız sayacın kendi
 * ürettiği ve devraldığı değere uygulanır.
 */
export const MAX_ACTIVE_SECONDS = 24 * 60 * 60;

/** Aktif süre sayacının durumu. Değiştirilmez; her işlem yeni bir değer döndürür. */
export type ActiveTimer = {
  /** Kayıttan devralınan ve duraklamalarda biriken süre (milisaniye). */
  readonly accumulatedMs: number;
  /** Oturum çalışıyorsa başladığı an (milisaniye); sayaç durmuşsa `null`. */
  readonly startedAt: number | null;
};

/** Değeri makul bir tam saniyeye indirger; bozuk veya uçuk girdi sıfırlanır/kırpılır. */
function sanitizeSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), MAX_ACTIVE_SECONDS);
}

/**
 * Verilen süreden **durmuş** bir sayaç kurar.
 *
 * Yenilemede sürenin sıfırlanmamasının ve iki kez sayılmamasının dayanağı budur:
 * taban kayıttaki değerdir ve oturum ancak {@link resumeTimer} ile, o andan
 * itibaren başlar. Oyunun kapalı geçtiği süre hiçbir zaman ölçülmez.
 */
export function createActiveTimer(activeSeconds: number): ActiveTimer {
  return { accumulatedMs: sanitizeSeconds(activeSeconds) * 1000, startedAt: null };
}

/** Sayaç şu an işliyor mu? */
export function isTimerRunning(timer: ActiveTimer): boolean {
  return timer.startedAt !== null;
}

/**
 * Açık oturumda geçen süre (milisaniye); sayaç durmuşsa sıfır.
 *
 * Negatif sonuç sıfıra çekilir: cihaz saati geri alınabilir (NTP düzeltmesi,
 * uykudan dönüş, kullanıcının saati değiştirmesi). Süre böyle bir durumda
 * duraklar ama asla geri gitmez.
 */
function elapsedMs(timer: ActiveTimer, now: number): number {
  if (timer.startedAt === null || !Number.isFinite(now)) return 0;
  return Math.max(0, now - timer.startedAt);
}

/**
 * Sayacı çalıştırır. **Zaten çalışıyorsa aynı sayacı döndürür.**
 *
 * İki kez saymayı önleyen kural budur: yeniden odaklanma, `focus` ile
 * `visibilitychange`in birlikte gelmesi ya da aynı koşulun tekrar bildirilmesi
 * oturumu yeniden başlatmaz ve süreye bir şey eklemez.
 */
export function resumeTimer(timer: ActiveTimer, now: number): ActiveTimer {
  if (timer.startedAt !== null) return timer;
  if (!Number.isFinite(now)) return timer;
  return { accumulatedMs: timer.accumulatedMs, startedAt: now };
}

/**
 * Sayacı durdurur ve açık oturumu birikime ekler. **Zaten durmuşsa aynı sayacı
 * döndürür**, dolayısıyla üst üste gelen `blur`/`pagehide`/gizlenme olayları
 * süreyi iki kez eklemez.
 */
export function pauseTimer(timer: ActiveTimer, now: number): ActiveTimer {
  if (timer.startedAt === null) return timer;
  return { accumulatedMs: timer.accumulatedMs + elapsedMs(timer, now), startedAt: null };
}

/**
 * Sayacın o andaki değeri: `GameSnapshot.activeSeconds`a yazılacak tam saniye.
 *
 * Her çağrıda baştan hesaplanır ve duruma **eklenmez, üzerine yazılır**. Bu
 * yüzden aynı an için kaç kez çağrıldığının önemi yoktur: saniyede bir akıtmak
 * da, her duraklamada akıtmak da aynı değeri verir.
 */
export function timerSeconds(timer: ActiveTimer, now: number): number {
  const totalMs = timer.accumulatedMs + elapsedMs(timer, now);
  return Math.min(Math.floor(totalMs / 1000), MAX_ACTIVE_SECONDS);
}
