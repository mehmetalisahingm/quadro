/**
 * `/play` geçici 30-bulmaca akışının sayfa düzeyi regresyonları.
 *
 * Normal günlük loader varsayılan olarak yalnız `published` içeriği açmaya devam eder;
 * bu dosya, canlı test dönemi için `/play` tarafından bilinçli olarak etkinleştirilen
 * `includeDrafts` arşiv akışını doğrular.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PlayPage from "@/app/play/page";

import { TEST_DAY_KEY, createUser, enterGame, puzzle, registerFlowHooks } from "./helpers";

registerFlowHooks();

async function openDay(dayKey: string, mode?: string): Promise<void> {
  render(
    await PlayPage({
      searchParams: Promise.resolve({
        day: dayKey,
        ...(mode === undefined ? {} : { mode }),
      }),
    }),
  );
  await enterGame(createUser());
}

const hasBoard = (): boolean =>
  screen.queryByLabelText(/çözülmemiş kelimelik oyun tahtası$/) !== null;

const notice = (): HTMLElement | null =>
  screen.queryByRole("region", { name: /Bugün için bulmaca yok|Bugünün bulmacası açılamadı/ });

describe("geçici 30-bulmaca akışı · sayfa davranışı", () => {
  it("ilk bulmacayı gerçek içerikle açar", async () => {
    await openDay(TEST_DAY_KEY);

    expect(hasBoard()).toBe(true);
    expect(notice()).toBeNull();
    expect(screen.getByText("#1 · 20 EYLÜL 2026")).toBeTruthy();

    for (const word of puzzle.groups.flatMap((group) => group.words)) {
      expect(screen.getByText(word.text, { selector: "button" })).toBeTruthy();
    }
  });

  it("aralık dışı day parametresini güvenli biçimde ilk bulmacaya düşürür", async () => {
    await openDay("2026-09-19");

    expect(hasBoard()).toBe(true);
    expect(screen.getByText("#1 · 20 EYLÜL 2026")).toBeTruthy();
    expect(screen.queryByText("19 EYLÜL 2026")).toBeNull();
  });

  it("geçici akışta taslak durumundaki doğrulanmış sonraki bulmacayı açar", async () => {
    await openDay("2026-09-21");

    expect(hasBoard()).toBe(true);
    expect(notice()).toBeNull();
    expect(screen.getByText(/21 EYLÜL 2026/)).toBeTruthy();
  });

  it("şeması bozuk içerik includeDrafts ile bile açılmaz", async () => {
    await openDay("2026-09-22");

    expect(hasBoard()).toBe(false);
    expect(notice()?.dataset.reason).toBe("invalid-content");
  });

  it("bir sonraki bulmacaya ilerleme bağlantısı verir", async () => {
    await openDay(TEST_DAY_KEY);

    const next = screen.getByRole("link", { name: "Sonraki bulmaca →" });
    expect(next.getAttribute("href")).toBe("/play?day=2026-09-21");
  });

  it("öğretici kipi arşiv içeriğinden bağımsızdır", async () => {
    await openDay("2026-09-19", "tutorial");

    expect(notice()).toBeNull();
    expect(screen.getByText("ÖĞRETİCİ · 2 GRUP")).toBeTruthy();
  });
});
