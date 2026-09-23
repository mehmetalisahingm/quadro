/**
 * İlerleme kaydı ve güvenli devam (Q20).
 *
 * Kalıcılık kuralları `src/lib/persistence/` altında bellekteki depoyla tek tek
 * test edilir; buradaki testler aynı kuralları **gerçek akışta** denetler:
 * `/play` sayfası çizilir, kullanıcı gibi oynanır, sayfa yenilenir ve tahtanın
 * ne durumda açıldığına bakılır. Depo jsdom'un gerçek `localStorage`ıdır.
 *
 * "Yenileme" burada ağacın sökülüp yeniden çizilmesidir (`cleanup` + yeniden
 * render): tarayıcıdaki yenilemede de React durumu gider, `localStorage` kalır.
 */

import { act, cleanup, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import PlayPage from "@/app/play/page";
import type { GameSnapshot } from "@/features/game/contracts";
import { snapshotStorageKey } from "@/lib/persistence";

import {
  RENKLER,
  YANLISLAR,
  board,
  control,
  guess,
  hasBoard,
  openPlayPage,
  pressedTexts,
  puzzle,
  registerFlowHooks,
  remainingMistakes,
  resultRegion,
  selectWords,
  selectionLabel,
  statValue,
  tile,
  tileTexts,
} from "./helpers";

registerFlowHooks();

/** Günün kayıt anahtarı; kayıt istemcide bulmacanın yayın gününe yazılır. */
const KAYIT_ANAHTARI = snapshotStorageKey(puzzle.date);

/** Depodaki kaydın durumu; kayıt yoksa `null`. */
function kayitliDurum(): GameSnapshot | null {
  const raw = window.localStorage.getItem(KAYIT_ANAHTARI);
  if (raw === null) return null;
  return (JSON.parse(raw) as { snapshot: GameSnapshot }).snapshot;
}

/** Depodaki kayıt; yoksa testi düşürür. */
function kayit(): GameSnapshot {
  const snapshot = kayitliDurum();
  if (snapshot === null) throw new Error("Bu adımda kayıt bekleniyordu.");
  return snapshot;
}

/** Sayfayı yeniler: React ağacı sökülür, depo olduğu gibi kalır. */
async function yenile(): Promise<UserEvent> {
  cleanup();
  return openPlayPage();
}

/** Bugünün anahtarına ham bir kayıt yazar. */
function kayitYaz(snapshot: unknown): void {
  window.localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify({ savedAt: "", snapshot }));
}

describe("ilerleme kaydı · devam", () => {
  it("oyun ilerledikçe durum kaydedilir", async () => {
    const user = await openPlayPage();
    expect(kayitliDurum()?.status).toBe("playing");

    await guess(user, RENKLER);

    expect(kayit().solvedGroupIds).toEqual(["renkler"]);
    expect(kayit().dayKey).toBe(puzzle.date);
    expect(kayit().puzzleRevision).toBe(puzzle.revision);
  });

  it("yenilemeden sonra aynı durumdan ve aynı kart sırasından devam edilir", async () => {
    const user = await openPlayPage();

    await guess(user, RENKLER);
    // Renkler çözüldü; yanlış dörtlü kalan kartlardan seçilir.
    await guess(user, ["MARS", "ELMA", "ADANA", "İNCİR"]);
    // Karıştırma sırayı taze tahtanınkinden ayırır: sıra kayıttan gelmezse test düşer.
    const karistir = control("Karıştır");
    expect(karistir).not.toBeNull();
    if (karistir !== null) await user.click(karistir);
    await selectWords(user, ["ELMA", "ARMUT"]);

    const sira = tileTexts();
    const secili = pressedTexts();

    await yenile();

    expect(tileTexts()).toEqual(sira);
    expect(pressedTexts()).toEqual(secili);
    expect(selectionLabel()).toBe("2/4 seçili");
    expect(remainingMistakes()).toBe(3);
    expect(screen.getByRole("article", { name: "Çözülen grup: RENKLER" })).toBeTruthy();
    expect(board().getAttribute("aria-label")).toBe("12 çözülmemiş kelimelik oyun tahtası");
  });

  it("devam eden oyunda aynı yanlış tekrar gönderilemez", async () => {
    const user = await openPlayPage();
    await guess(user, YANLISLAR[0]);

    const devam = await yenile();
    await guess(devam, YANLISLAR[0]);

    // Tahmin geçmişi de kayıttan geldi: tekrar hak yakmaz.
    expect(remainingMistakes()).toBe(3);
    expect(screen.getByText("Bu dörtlüyü daha önce denedin.")).toBeTruthy();
  });
});

describe("ilerleme kaydı · bitmiş oyun", () => {
  it("kaybedilen oyun yenilemeden sonra sonuç ekranıyla açılır, tahta geri gelmez", async () => {
    const user = await openPlayPage();
    for (const words of YANLISLAR) await guess(user, words);
    expect(statValue(resultRegion("Bugünlük bu kadar."), "Hata")).toBe("4");

    await yenile();

    const sonuc = resultRegion("Bugünlük bu kadar.");
    expect(hasBoard()).toBe(false);
    expect(statValue(sonuc, "Bulunan")).toBe("0/4");
    expect(statValue(sonuc, "Hata")).toBe("4");
    // Sonuç ikinci kez işlenmedi: kayıt hâlâ aynı bitmiş oyunu gösteriyor.
    expect(kayitliDurum()?.status).toBe("lost");
    expect(kayitliDurum()?.mistakesRemaining).toBe(0);
  });

  it("kazanılan oyunun sonucu yenilemeden sonra korunur", async () => {
    const user = await openPlayPage();
    for (const group of puzzle.groups) {
      await guess(user, group.words.map((word) => word.text));
    }
    expect(resultRegion("Dört bağı da buldun.")).toBeTruthy();

    await yenile();

    expect(statValue(resultRegion("Dört bağı da buldun."), "Bulunan")).toBe("4/4");
    expect(hasBoard()).toBe(false);
    expect(kayitliDurum()?.status).toBe("won");
  });
});

describe("ilerleme kaydı · bozuk ve uyumsuz kayıt", () => {
  it("bozuk kayıt uygulamayı çökertmez; tahta taze açılır ve kayıt temizlenir", async () => {
    window.localStorage.setItem(KAYIT_ANAHTARI, "{yarım kalmış");

    const user = await openPlayPage();

    expect(tileTexts()).toHaveLength(16);
    expect(remainingMistakes()).toBe(4);
    // Bozuk kayıt silindi, yerine geçerli bir kayıt yazıldı.
    expect(kayitliDurum()?.status).toBe("playing");

    await user.click(tile("ELMA"));
    expect(selectionLabel()).toBe("1/4 seçili");
  });

  it("başka bir bulmacanın kaydı bugünkü tahtaya uygulanmaz", async () => {
    const user = await openPlayPage();
    await guess(user, RENKLER);
    const baskaBulmaca = { ...kayit(), puzzleId: "ornek-999" };

    cleanup();
    window.localStorage.clear();
    kayitYaz(baskaBulmaca);
    await openPlayPage();

    expect(tileTexts()).toHaveLength(16);
    expect(screen.queryAllByRole("article", { name: /^Çözülen grup:/ })).toEqual([]);
    expect(kayitliDurum()?.puzzleId).toBe(puzzle.id);
  });

  it("dünün kaydı bugünkü tahtaya uygulanmaz", async () => {
    const user = await openPlayPage();
    await guess(user, RENKLER);
    const dun = { ...kayit(), dayKey: "2026-09-19" };

    cleanup();
    window.localStorage.clear();
    kayitYaz(dun);
    await openPlayPage();

    expect(tileTexts()).toHaveLength(16);
    expect(remainingMistakes()).toBe(4);
  });
});

describe("ilerleme kaydı · sunucu ve hidrasyon", () => {
  it("kayıt okunana kadar yükleme görünür ve hidrasyon uyuşmazlığı olmaz", async () => {
    // Önce bir oyun oynanıp kaydedilir, sonra sayfa sıfırdan "sunucuda" çizilir.
    const user = await openPlayPage();
    await guess(user, RENKLER);
    const kaydedilen = kayit();
    cleanup();

    const page = await PlayPage({ searchParams: Promise.resolve({}) });
    const sunucuHtml = renderToString(page);
    // Sunucu kaydı göremez: okunana kadar etkin bir taze tahta gösterilmez.
    expect(sunucuHtml).toContain('aria-label="Bulmaca yükleniyor"');
    expect(sunucuHtml).not.toContain("16 çözülmemiş kelimelik oyun tahtası");

    const container = document.createElement("div");
    container.innerHTML = sunucuHtml;
    document.body.appendChild(container);

    const hatalar: string[] = [];
    const konsol = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      hatalar.push(args.map(String).join(" "));
    });

    await act(async () => {
      hydrateRoot(container, page);
    });
    konsol.mockRestore();

    // Uyuşmazlık uyarısı yok; kayıt hidrasyondan sonra devralındı.
    expect(hatalar).toEqual([]);
    expect(container.textContent).toContain("RENKLER");
    expect(kayitliDurum()).toEqual(kaydedilen);
  });
});
