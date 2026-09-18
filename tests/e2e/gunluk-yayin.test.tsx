/**
 * Günlük yayının sayfa düzeyindeki regresyonları (Q19).
 *
 * `helpers.ts` içindeki akış testleri yayına açık günü oynar; buradaki testler günün
 * içeriği sunulamadığında `/play`'in ne yaptığına bakar. Eksik içerik bir kaza değil,
 * beklenen bir durumdur: sayfa boş kalmaz, tahta çizilmez ve hangi güne bakıldığı
 * yazar. Bilgi kartının kendisi bilinçli olarak sadedir; asıl yükleme ve hata ekranı
 * tasarımı Q24'ün kapsamındadır.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PlayPage from "@/app/play/page";

import { TEST_DAY_KEY, puzzle, registerFlowHooks } from "./helpers";

registerFlowHooks();

/** `/play`'i verilen yayın gününde çizer. */
async function openDay(dayKey: string, mode?: string): Promise<void> {
  vi.stubEnv("QUADRO_TODAY", dayKey);
  render(await PlayPage({ searchParams: Promise.resolve(mode === undefined ? {} : { mode }) }));
}

/** Tahta çiziliyor mu? */
const hasBoard = (): boolean =>
  screen.queryByLabelText(/çözülmemiş kelimelik oyun tahtası$/) !== null;

/** Bilgi kartı; yoksa `null`. */
const notice = (): HTMLElement | null =>
  screen.queryByRole("region", { name: /Bugün için bulmaca yok|Bugünün bulmacası açılamadı/ });

describe("günlük yayın · sayfa davranışı", () => {
  it("yayına açık günde gerçek içerik tahtaya düşer", async () => {
    await openDay(TEST_DAY_KEY);

    expect(hasBoard()).toBe(true);
    expect(notice()).toBeNull();
    expect(screen.getByText("#1 · 20 EYLÜL 2026")).toBeTruthy();

    // Tahtadaki kartlar günün içeriğinden gelir.
    for (const word of puzzle.groups.flatMap((group) => group.words)) {
      expect(screen.getByText(word.text, { selector: "button" })).toBeTruthy();
    }
  });

  it("içerik olmayan günde tahta yerine sade bilgi kartı çizilir", async () => {
    await openDay("2026-09-19");

    expect(hasBoard()).toBe(false);

    const kart = notice();
    expect(kart).toBeTruthy();
    expect(kart?.dataset.status).toBe("missing");
    expect(kart?.dataset.reason).toBe("no-content");
    expect(screen.getByRole("heading", { name: "Bugün için bulmaca yok" })).toBeTruthy();
  });

  it("içerik olmasa da hangi güne bakıldığı yazar", async () => {
    await openDay("2026-09-19");

    expect(screen.getByText("19 EYLÜL 2026")).toBeTruthy();
  });

  it("bilgi kartı öğreticiye çıkış verir", async () => {
    await openDay("2026-09-19");

    const baglanti = screen.getByRole("link", { name: "kısa öğreticiyi" });
    expect(baglanti.getAttribute("href")).toBe("/play?mode=tutorial");
  });

  it("taslak içerik oyuncuya gösterilmez", async () => {
    await openDay("2026-09-21");

    expect(hasBoard()).toBe(false);
    expect(notice()?.dataset.reason).toBe("not-published");
  });

  it("bozuk içerik tahtayı açmaz ve cevapları sızdırmaz", async () => {
    await openDay("2026-09-22");

    expect(hasBoard()).toBe(false);
    expect(notice()?.dataset.reason).toBe("invalid-content");
    // Doğrulayıcının sorun listesi sunucuda kalır; sayfaya hiçbir kelime düşmez.
    for (const word of puzzle.groups.flatMap((group) => group.words)) {
      expect(screen.queryByText(word.text)).toBeNull();
    }
  });

  it("öğretici kipi günlük içerikten bağımsızdır", async () => {
    // İçerik olmayan bir günde bile öğretici açılır.
    await openDay("2026-09-19", "tutorial");

    expect(notice()).toBeNull();
    expect(screen.getByText("ÖĞRETİCİ · 2 GRUP")).toBeTruthy();
  });
});
