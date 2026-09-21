/**
 * Aktif oyun süresi ve sekme yaşam döngüsü (Q21).
 *
 * Sayacın aritmetiği `src/features/game/state/activeTimer.test.ts`, koşulları
 * `gameStore.test.ts` içinde tek tek denenir. Buradaki testler aynı kuralları
 * **gerçek akışta** denetler: sayfa çizilir, sekme gizlenip gösterilir, sayfa
 * yenilenir ve hem ekrandaki hem depodaki değere bakılır.
 *
 * Zaman tamamen sahte saatle geçer (bkz. `helpers.ts`): `setInterval`, `Date` ve
 * `setTimeout` taklit edilir, dolayısıyla tek bir gerçek bekleme yoktur.
 * "Yenileme" ağacın sökülüp yeniden çizilmesidir: React durumu gider,
 * `localStorage` kalır.
 */

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";
import PlayPage from "@/app/play/page";
import type { GameSnapshot } from "@/features/game/contracts";
import { snapshotStorageKey } from "@/lib/persistence";

import {
  RENKLER,
  guess,
  openPlayPage,
  puzzle,
  registerFlowHooks,
  resultRegion,
  sharePreview,
  statValue,
} from "./helpers";

registerFlowHooks();

/** Görünürlük bu dosyada elle değiştirilir; her testten sonra jsdom'un varsayılanına döner. */
afterEach(() => {
  Reflect.deleteProperty(document, "visibilityState");
});

/** Günün kayıt anahtarı. */
const KAYIT_ANAHTARI = snapshotStorageKey(puzzle.date);

/** Depodaki aktif süre; kayıt yoksa `null`. */
function kayitliSure(): number | null {
  const raw = window.localStorage.getItem(KAYIT_ANAHTARI);
  if (raw === null) return null;
  return (JSON.parse(raw) as { snapshot: GameSnapshot }).snapshot.activeSeconds;
}

/** Depodaki aktif süre; kayıt yoksa testi düşürür. */
function sure(): number {
  const value = kayitliSure();
  if (value === null) throw new Error("Bu adımda kayıt bekleniyordu.");
  return value;
}

/** Sahte saati ilerletir; sayacın vuruşları böylece React'e işlenir. */
function saatIlerlet(saniye: number): void {
  act(() => {
    vi.advanceTimersByTime(saniye * 1000);
  });
}

/** Sekmenin görünürlüğünü değiştirir ve tarayıcının yaptığı gibi olayı yayar. */
function gorunurluk(durum: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => durum,
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("aktif süre · görünür oyun ekranı", () => {
  it("oyun ekranı önündeyken süre işler", async () => {
    await openPlayPage();

    expect(sure()).toBe(0);

    saatIlerlet(30);

    expect(sure()).toBe(30);
  });

  it("süre kayda saniye saniye yazılır", async () => {
    await openPlayPage();

    saatIlerlet(1);
    expect(sure()).toBe(1);
    saatIlerlet(1);
    expect(sure()).toBe(2);
  });
});

describe("aktif süre · sekme yaşam döngüsü", () => {
  it("sekme gizliyken süre işlemez", async () => {
    await openPlayPage();

    saatIlerlet(5);
    expect(sure()).toBe(5);

    gorunurluk("hidden");
    // Sekme on dakika arka planda kalıyor.
    saatIlerlet(600);

    expect(sure()).toBe(5);
  });

  it("yeniden görünür olunca süre kaldığı yerden sürer ve iki kez sayılmaz", async () => {
    await openPlayPage();

    saatIlerlet(5);
    gorunurluk("hidden");
    saatIlerlet(600);
    gorunurluk("visible");

    // Geri dönüşte gizli geçen on dakika eklenmez.
    expect(sure()).toBe(5);

    saatIlerlet(4);
    expect(sure()).toBe(9);
  });

  it("üst üste gelen odak olayları süreyi bozmaz", async () => {
    await openPlayPage();

    saatIlerlet(7);

    // Tarayıcılar geri dönüşte `visibilitychange` ile `focus`u birlikte yayabilir.
    gorunurluk("visible");
    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
    });

    expect(sure()).toBe(7);

    saatIlerlet(3);
    expect(sure()).toBe(10);
  });

  it("sayfa terk edilirken süre kayda geçer", async () => {
    await openPlayPage();

    saatIlerlet(12);
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    // Sayfa arka plana alındı: sayaç durur, son değer depoda kalır.
    saatIlerlet(300);
    expect(sure()).toBe(12);
  });
});

describe("aktif süre · yenileme", () => {
  it("yenilemede kayıtlı süreden devam eder, sıfırlanmaz", async () => {
    await openPlayPage();
    saatIlerlet(40);
    expect(sure()).toBe(40);

    // Yenileme: ağaç sökülür, depo kalır.
    cleanup();
    saatIlerlet(120);

    // Sayfa kapalıyken geçen iki dakika süreye eklenmez.
    expect(sure()).toBe(40);

    await openPlayPage();
    expect(sure()).toBe(40);

    saatIlerlet(10);
    expect(sure()).toBe(50);
  });
});

describe("aktif süre · oyun bittiğinde", () => {
  it("süre donar ve sonuç ekranı gerçek değeri gösterir", async () => {
    const user = await openPlayPage();

    saatIlerlet(95);
    await guess(user, RENKLER);
    // Üç yanlış daha yapmak yerine kazanma yolunu kısaltmak için kalan üç grup.
    for (const grup of [1, 2, 3] as const) {
      await guess(
        user,
        puzzle.groups[grup].words.map((word) => word.text),
      );
    }

    const bolge = resultRegion("Dört bağı da buldun.");
    const gosterilen = statValue(bolge, "Süre");

    // Gerçek değer: "Süre 0:00" değil, işleyen sayacın sonucu.
    expect(gosterilen).not.toBe("0:00");
    expect(sure()).toBeGreaterThanOrEqual(95);

    // Sonuç ekranı açıkken saat işlemeye devam etse de süre sabittir.
    const donmus = sure();
    saatIlerlet(600);
    gorunurluk("hidden");
    gorunurluk("visible");
    saatIlerlet(600);

    expect(sure()).toBe(donmus);
    expect(statValue(bolge, "Süre")).toBe(gosterilen);
  });

  it("arayüzdeki süre ile kaydedilen süre aynı kaynaktan gelir", async () => {
    const user = await openPlayPage();

    saatIlerlet(125);
    await guess(user, RENKLER);
    for (const grup of [1, 2, 3] as const) {
      await guess(
        user,
        puzzle.groups[grup].words.map((word) => word.text),
      );
    }

    const bolge = resultRegion("Dört bağı da buldun.");
    const saniye = sure();
    const dakika = Math.floor(saniye / 60);
    const kalan = (saniye % 60).toString().padStart(2, "0");

    // Sonuç ekranı ayrı bir hesap yapmaz; kaydedilen `activeSeconds`ı biçimler.
    expect(statValue(bolge, "Süre")).toBe(`${dakika}:${kalan}`);

    // Paylaşım metni de aynı durumdan, aynı biçimlendiriciden geçer: başlık
    // satırının süresi sonuç ekranında yazanla birebir aynıdır.
    const [baslik = ""] = sharePreview().split("\n");
    expect(baslik).toBe(`Quadro ${puzzle.date} 4/4 · ${dakika}:${kalan}`);
    expect(baslik).toContain(statValue(bolge, "Süre"));
  });
});

describe("aktif süre · süre işlemeyen ekranlar", () => {
  it("ana sayfa süre işletmez", () => {
    render(<HomePage />);

    saatIlerlet(300);

    // Ana sayfa oyun durumunu hiç kurmaz: kayıt da süre de yok.
    expect(kayitliSure()).toBeNull();
  });

  it("öğretici süre işletmez", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({ mode: "tutorial" }) }));

    // Öğreticinin açıldığından emin ol; günlük tahta çizilmemeli.
    expect(screen.queryByLabelText(/çözülmemiş kelimelik oyun tahtası$/)).toBeNull();

    saatIlerlet(300);

    expect(kayitliSure()).toBeNull();
  });
});
