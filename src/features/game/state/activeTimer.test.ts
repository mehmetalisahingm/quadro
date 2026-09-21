/**
 * Aktif süre sayacının saf çekirdeğinin testleri (Q21).
 *
 * Saat tamamen elde: her fonksiyona "şu an" parametre olarak verilir, dolayısıyla
 * burada tek bir gerçek bekleme yoktur ve saatler sayılarla geçirilir. Aynı
 * kuralların oyun akışındaki karşılığı `gameStore.test.ts`, gerçek sayfadaki
 * karşılığı `tests/e2e/aktif-sure.test.tsx` içindedir.
 */

import { describe, expect, it } from "vitest";

import {
  MAX_ACTIVE_SECONDS,
  createActiveTimer,
  isTimerRunning,
  pauseTimer,
  resumeTimer,
  timerSeconds,
} from "./activeTimer";

/** Testlerin başlangıç anı; gerçek saatle ilgisi yoktur. */
const T0 = 1_000_000;

describe("aktif süre sayacı · kurulum", () => {
  it("durmuş başlar ve kurulduğu süreyi korur", () => {
    const timer = createActiveTimer(42);

    expect(isTimerRunning(timer)).toBe(false);
    // Saat ilerlese de durmuş sayaç süre üretmez.
    expect(timerSeconds(timer, T0)).toBe(42);
    expect(timerSeconds(timer, T0 + 10_000)).toBe(42);
  });

  it("kayıtlı süreden devam eder, sıfırlanmaz", () => {
    const timer = resumeTimer(createActiveTimer(90), T0);

    expect(timerSeconds(timer, T0 + 5_000)).toBe(95);
  });

  it("makul olmayan kayıtlı değeri kırpar", () => {
    expect(timerSeconds(createActiveTimer(-5), T0)).toBe(0);
    expect(timerSeconds(createActiveTimer(Number.NaN), T0)).toBe(0);
    expect(timerSeconds(createActiveTimer(Number.POSITIVE_INFINITY), T0)).toBe(0);
    expect(timerSeconds(createActiveTimer(MAX_ACTIVE_SECONDS * 10), T0)).toBe(MAX_ACTIVE_SECONDS);
    // Kesirli kayıt tam saniyeye indirilir.
    expect(timerSeconds(createActiveTimer(12.9), T0)).toBe(12);
  });
});

describe("aktif süre sayacı · işleyiş", () => {
  it("çalışırken geçen süre tam saniyeye yuvarlanır", () => {
    const timer = resumeTimer(createActiveTimer(0), T0);

    expect(timerSeconds(timer, T0)).toBe(0);
    expect(timerSeconds(timer, T0 + 999)).toBe(0);
    expect(timerSeconds(timer, T0 + 1_000)).toBe(1);
    expect(timerSeconds(timer, T0 + 1_999)).toBe(1);
    expect(timerSeconds(timer, T0 + 7_500)).toBe(7);
  });

  it("duraklama açık oturumu birikime ekler", () => {
    const running = resumeTimer(createActiveTimer(0), T0);
    const paused = pauseTimer(running, T0 + 4_000);

    expect(isTimerRunning(paused)).toBe(false);
    // Duraklamadan sonra saat ilerlese de süre sabittir.
    expect(timerSeconds(paused, T0 + 60_000)).toBe(4);
  });

  it("aynı an için kaç kez okunursa okunsun aynı değeri verir", () => {
    const timer = resumeTimer(createActiveTimer(3), T0);
    const okumalar = [0, 1, 2, 3, 4].map(() => timerSeconds(timer, T0 + 2_500));

    // Süre duruma eklenmez, üzerine yazılır: akıtma sıklığı sonucu değiştirmez.
    expect(okumalar).toEqual([5, 5, 5, 5, 5]);
  });

  it("saat geri alınsa bile süre azalmaz", () => {
    const timer = resumeTimer(createActiveTimer(30), T0);

    // NTP düzeltmesi, uykudan dönüş ya da kullanıcının saati değiştirmesi.
    expect(timerSeconds(timer, T0 - 60_000)).toBe(30);
    expect(timerSeconds(pauseTimer(timer, T0 - 60_000), T0)).toBe(30);
  });
});

describe("aktif süre sayacı · iki kez sayma koruması", () => {
  it("çalışan sayacı yeniden başlatmak süreyi etkilemez", () => {
    const running = resumeTimer(createActiveTimer(0), T0);

    // Yeniden odaklanma: `focus` ve `visibilitychange` birlikte gelebilir.
    const yine = resumeTimer(resumeTimer(running, T0 + 3_000), T0 + 3_000);

    // Aynı nesne döner: oturum yeniden başlamaz, süre ikiye katlanmaz.
    expect(yine).toBe(running);
    expect(timerSeconds(yine, T0 + 5_000)).toBe(5);
  });

  it("durmuş sayacı yeniden duraklatmak süre eklemez", () => {
    const paused = pauseTimer(resumeTimer(createActiveTimer(0), T0), T0 + 6_000);

    // Üst üste gelen `blur` + `pagehide` + gizlenme olayları.
    const yine = pauseTimer(pauseTimer(paused, T0 + 20_000), T0 + 40_000);

    expect(yine).toBe(paused);
    expect(timerSeconds(yine, T0 + 60_000)).toBe(6);
  });

  it("duraklamada geçen görünmez süre eklenmez", () => {
    const running = resumeTimer(createActiveTimer(0), T0);
    const paused = pauseTimer(running, T0 + 10_000);

    // Sekme bir saat gizli kalıyor, sonra geri dönülüyor.
    const birSaatSonra = T0 + 10_000 + 3_600_000;
    const tekrar = resumeTimer(paused, birSaatSonra);

    // Yalnız görünür geçen 10 + 5 saniye sayılır; aradaki saat hiç ölçülmez.
    expect(timerSeconds(tekrar, birSaatSonra + 5_000)).toBe(15);
  });

  it("saniyeden kısa oturumların toplamı kaybolmaz", () => {
    // Her biri 900 ms süren altı oturum: gerçek toplam 5,4 saniye. Birikim
    // saniye olarak tutulsaydı her duraklamada aşağı yuvarlanıp 0 kalırdı.
    let timer = createActiveTimer(0);
    let now = T0;

    for (let i = 0; i < 6; i += 1) {
      timer = resumeTimer(timer, now);
      now += 900;
      timer = pauseTimer(timer, now);
      // Aradaki gizli süre sayılmaz.
      now += 5_000;
    }

    expect(timerSeconds(timer, now)).toBe(5);
  });
});
