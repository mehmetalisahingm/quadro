import { act, cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "@/app/page";
import PlayPage from "@/app/play/page";
import type { GameSnapshot } from "@/features/game/contracts";
import {
  createInitialSnapshot,
  createSeededRandom,
  submitSelection,
} from "@/features/game/engine";
import { selectOnly } from "@/features/game/engine/testHelpers";
import { saveSnapshot } from "@/lib/persistence";

import {
  board,
  puzzle,
  registerFlowHooks,
} from "./helpers";

registerFlowHooks();

function freshGame(): GameSnapshot {
  return createInitialSnapshot(puzzle, { random: createSeededRandom(23) });
}

function solveGroup(snapshot: GameSnapshot, index: number): GameSnapshot {
  const group = puzzle.groups[index];
  if (group === undefined) throw new Error("Test grubu bulunamadı.");

  return submitSelection(
    puzzle,
    selectOnly(
      puzzle,
      snapshot,
      group.words.map((word) => word.id),
    ),
  ).snapshot;
}

function inProgressGame(): GameSnapshot {
  return solveGroup(freshGame(), 0);
}

function wonGame(): GameSnapshot {
  return [0, 1, 2, 3].reduce(
    (snapshot, index) => solveGroup(snapshot, index),
    freshGame(),
  );
}

async function openHome(): Promise<void> {
  render(await HomePage());
  await act(async () => undefined);
}

describe("ana sayfa · geri dönen kullanıcı", () => {
  it("ilk kullanıcı Başla durumunu ve Türkiye gece yarısı bilgisini görür", async () => {
    await openHome();

    expect(screen.getByRole("link", { name: "Bugünün bulmacasını çöz" }).getAttribute("href"))
      .toBe("/play");
    expect(screen.getByLabelText("Günün bulmacası").textContent).toContain("#1");
    expect(screen.getByLabelText("Yeni bulmaca zamanı").textContent).toContain(
      "Türkiye saatiyle 00.00",
    );
    expect(screen.getByLabelText("Yeni bulmaca zamanı").textContent).toContain("12 sa 00 dk");
  });

  it("yarım oyun varsa doğru günlük bulmacaya Devam et durumunu bağlar", async () => {
    saveSnapshot(inProgressGame(), { storage: window.localStorage });

    await openHome();

    const devam = screen.getByRole("link", { name: "Kaldığın yerden devam et" });
    expect(devam.getAttribute("href")).toBe("/play");
    expect(screen.getByText("1/4 grup bulundu · 4 hata hakkı")).toBeTruthy();
  });

  it("bitmiş oyun varsa Sonucu gör durumunu açar", async () => {
    saveSnapshot(wonGame(), { storage: window.localStorage });

    await openHome();

    const result = screen.getByRole("link", { name: "Sonucunu gör" });
    expect(result.getAttribute("href")).toBe("/play?view=result");
    expect(screen.getByText("4/4 grup bulundu · 0 hata")).toBeTruthy();
  });
});

describe("ana sayfa · Türkiye gece yarısı", () => {
  it("yeni gün geldiğinde dünkü açık oyunu kaldırmaz ve doğru bulmacaya döndürür", async () => {
    saveSnapshot(inProgressGame(), { storage: window.localStorage });

    // Sunucu artık 21 Eylül'ü yayın günü sayıyor; 20 Eylül oyunu localStorage'da açık kalıyor.
    vi.stubEnv("QUADRO_TODAY", "2026-09-21");

    await openHome();

    const oldGame = screen.getByRole("complementary", { name: "Yarım kalan önceki oyun" });
    expect(oldGame.textContent).toContain("20 EYLÜL 2026");
    expect(oldGame.textContent).toContain("1/4 grup bulundu · 4 hata hakkı");

    const resume = screen.getByRole("link", { name: "Önceki oyuna devam et" });
    expect(resume.getAttribute("href")).toBe("/play?day=2026-09-20");

    // Aynı bağlantının gerçek /play karşılığı dünkü içerik + dünkü snapshot'ı açar.
    cleanup();
    render(await PlayPage({ searchParams: Promise.resolve({ day: "2026-09-20" }) }));
    await act(async () => undefined);

    expect(screen.getByText("#1 · 20 EYLÜL 2026")).toBeTruthy();
    expect(screen.getByRole("article", { name: "Çözülen grup: RENKLER" })).toBeTruthy();
    expect(board().getAttribute("aria-label")).toBe("12 çözülmemiş kelimelik oyun tahtası");
  });

  it("day parametresi arşive dönüşmez; yalnız bir önceki yayın gününe izin verir", async () => {
    vi.stubEnv("QUADRO_TODAY", "2026-09-21");

    render(await PlayPage({ searchParams: Promise.resolve({ day: "2026-09-19" }) }));

    // 21 Eylül fixture'ı taslak olduğu için istek bugüne düşer ve oyun açılmaz;
    // 19 Eylül'e ait bir arşiv içeriği sunulmaz.
    expect(screen.getByText("21 EYLÜL 2026")).toBeTruthy();
    expect(screen.queryByText("19 EYLÜL 2026")).toBeNull();
  });
});
