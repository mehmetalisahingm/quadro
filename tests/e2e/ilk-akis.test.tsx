import { cleanup, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";
import gunlukBulmaca20 from "@/content/puzzles/2026-09-20.json";
import gunlukBulmaca21 from "@/content/puzzles/2026-09-21.json";
import gunlukBulmaca22 from "@/content/puzzles/2026-09-22.json";
import { normalizeTr } from "@/features/game/contracts";
import { createInitialSnapshot, createSeededRandom } from "@/features/game/engine";
import { DEFAULT_ENGINE_SEED } from "@/features/game/react/engineController";

import {
  GEZEGENLER,
  MEYVELER,
  RENKLER,
  SEHIRLER,
  YANLISLAR,
  board,
  control,
  feedbackText,
  guess,
  isDisabled,
  leakedAnswers,
  openPlayPage,
  puzzle,
  registerFlowHooks,
  remainingMistakes,
  resultRegion,
  selectionLabel,
  sharePreview,
  statValue,
  submitButton,
  textsOf,
  tileTexts,
} from "./helpers";

registerFlowHooks();

/** Motorun sabit tohumla ürettiği başlangıç tahtası (kelime metinleri). */
function engineStartOrder(): string[] {
  const random = createSeededRandom(DEFAULT_ENGINE_SEED);
  return textsOf(createInitialSnapshot(puzzle, { random }).remainingWordOrder);
}

describe("ana sayfa → /play", () => {
  it("yeni kullanıcı ana sayfadan bugünün bulmacasına gider; /play gerçek motorun tahtasını açar", async () => {
    render(<HomePage />);
    const start = screen.getByRole("link", { name: "Bugünün bulmacasını çöz" });
    expect(start.getAttribute("href")).toBe("/play");
    cleanup();

    await openPlayPage();
    expect(screen.getByText("#1 · 20 EYLÜL 2026")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Gizli bağları bul" })).toBeTruthy();
    expect(tileTexts()).toEqual(engineStartOrder());
    expect(selectionLabel()).toBe("0/4 seçili");
    expect(remainingMistakes()).toBe(4);
    expect(isDisabled(submitButton())).toBe(true);
    expect(screen.queryByRole("region", { name: /Dört bağı|Bugünlük/ })).toBeNull();
  });

  it("tahta deterministiktir ve test içeriğinden gelir; canlı günün cevaplarına bağlı değildir", async () => {
    await openPlayPage();
    const first = tileTexts();
    cleanup();
    await openPlayPage();
    expect(tileTexts()).toEqual(first);

    const testWords = puzzle.groups.flatMap((group) => group.words.map((word) => word.text));
    expect([...first].sort()).toEqual([...testWords].sort());

    const dailyWords = new Set(
      [gunlukBulmaca20, gunlukBulmaca21, gunlukBulmaca22].flatMap((daily) =>
        daily.groups.flatMap((group) => group.words.map((word) => normalizeTr(word.text))),
      ),
    );
    expect(dailyWords.size).toBeGreaterThan(0);
    expect(first.filter((text) => dailyWords.has(normalizeTr(text)))).toEqual([]);
  });
});

describe("kazanma", () => {
  it("dört grubu bulan oyuncu sonuç ekranını görür ve spoilersız sonucunu paylaşır", async () => {
    const user = await openPlayPage();

    for (const [index, words] of [MEYVELER, RENKLER, GEZEGENLER, SEHIRLER].entries()) {
      const group = puzzle.groups.find((candidate) =>
        candidate.words.some((word) => word.text === words[0]),
      );
      if (!group) throw new Error("Test dörtlüsü bulmacada yok.");

      await guess(user, words);

      expect(feedbackText()).toBe(`${group.title} grubunu buldun.`);
      expect(screen.getByRole("article", { name: `Çözülen grup: ${group.title}` })).toBeTruthy();
      for (const text of words) {
        expect(within(board()).queryByText(text, { selector: "button" })).toBeNull();
      }
      expect(tileTexts()).toHaveLength(16 - 4 * (index + 1));
      expect(remainingMistakes()).toBe(4);
    }

    // Son doğru grubun geri bildirimi ile kazanma ekranı aynı gönderimden gelir.
    const result = resultRegion("Dört bağı da buldun.");
    expect(feedbackText()).toBe("ŞEHİRLER grubunu buldun.");
    expect(statValue(result, "Bulunan")).toBe("4/4");
    expect(statValue(result, "Hata")).toBe("0");
    expect(within(result).getAllByText("Bulundu")).toHaveLength(4);
    expect(within(result).queryByText("Cevap")).toBeNull();
    expect(screen.getByText("Tahtadaki dört grup tamamlandı.")).toBeTruthy();
    expect(screen.queryByText("Grupla", { selector: "button" })).toBeNull();
    expect(control("Karıştır")).toBeNull();

    const preview = sharePreview();
    const [header, ...rows] = preview.split("\n");
    expect(header).toBe(`Quadro ${puzzle.date} 4/4`);
    expect(rows).toHaveLength(4);
    for (const row of rows) expect(row).toMatch(/^(🟨{4}|🟩{4}|🟦{4}|🟪{4})$/u);
    expect(leakedAnswers(preview)).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Paylaş" }));
    expect(await screen.findByText("Sonuç panoya kopyalandı.")).toBeTruthy();
    expect(await navigator.clipboard.readText()).toBe(preview);
  });
});

describe("kaybetme", () => {
  it("dördüncü yanlışla oyun biter: 0/4, 4 hata, kalan cevaplar açıklanır, paylaşım 0/4", async () => {
    const user = await openPlayPage();

    for (const [index, words] of YANLISLAR.entries()) {
      await guess(user, words);
      expect(feedbackText()).toBe("Bu dört kelime aynı grupta değil.");
      expect(remainingMistakes()).toBe(3 - index);
    }

    const result = resultRegion("Bugünlük bu kadar.");
    expect(statValue(result, "Bulunan")).toBe("0/4");
    expect(statValue(result, "Hata")).toBe("4");
    expect(within(result).getAllByText("Cevap")).toHaveLength(4);
    expect(within(result).queryByText("Bulundu")).toBeNull();
    for (const group of puzzle.groups) {
      expect(within(result).getByText(group.title)).toBeTruthy();
      expect(within(result).getByText(group.explanation)).toBeTruthy();
    }

    // Açılan cevaplar çözülmüş sayılmaz: çözülen grup satırı yok, kartlar tahtada ve kapalı.
    expect(screen.queryAllByRole("article", { name: /^Çözülen grup:/ })).toEqual([]);
    expect(tileTexts()).toHaveLength(16);
    expect(selectionLabel()).toBe("0/4 seçili");
    expect(screen.queryByText("Grupla", { selector: "button" })).toBeNull();

    const preview = sharePreview();
    const [header, ...rows] = preview.split("\n");
    expect(header).toBe(`Quadro ${puzzle.date} 0/4`);
    expect(rows).toHaveLength(4);
    expect(leakedAnswers(preview)).toEqual([]);
  });
});
