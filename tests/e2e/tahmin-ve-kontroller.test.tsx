import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createInitialSnapshot, createSeededRandom, shuffleBoard } from "@/features/game/engine";
import { DEFAULT_ENGINE_SEED } from "@/features/game/react/engineController";

import {
  GEZEGENLER,
  MEYVELER,
  RENKLER,
  SEHIRLER,
  UC_GEZEGEN_BIR_SEHIR,
  YANLISLAR,
  buttonTexts,
  control,
  feedbackText,
  finishTransition,
  guess,
  hasBoard,
  isDisabled,
  leakedAnswers,
  openPlayPage,
  pressedTexts,
  puzzle,
  registerFlowHooks,
  remainingMistakes,
  resultRegion,
  selectWords,
  selectionLabel,
  sharePreview,
  statValue,
  submitButton,
  textsOf,
  tile,
  tileTexts,
} from "./helpers";

registerFlowHooks();

const sorted = (values: readonly string[]) => [...values].sort();

describe("tahmin geri bildirimleri", () => {
  it("çok yakın: tam üç doğru kelimede 'Bir kelime uzaktasın' der, bir hak düşer, seçim korunur", async () => {
    const user = await openPlayPage();
    await guess(user, UC_GEZEGEN_BIR_SEHIR);

    expect(feedbackText()).toBe("Bir kelime uzaktasın.");
    expect(remainingMistakes()).toBe(3);
    expect(selectionLabel()).toBe("4/4 seçili");
    expect(sorted(pressedTexts())).toEqual(sorted(UC_GEZEGEN_BIR_SEHIR));
    // Hangi kelimenin farklı olduğu söylenmez.
    expect(leakedAnswers(feedbackText())).toEqual([]);
    expect(screen.queryAllByRole("article", { name: /^Çözülen grup:/ })).toEqual([]);
  });

  it("tekrar: aynı dörtlü farklı sırayla gönderilince 'daha önce denedin' der, hak azalmaz", async () => {
    const user = await openPlayPage();
    const [ilk] = YANLISLAR;

    await guess(user, ilk);
    expect(remainingMistakes()).toBe(3);

    await guess(user, [...ilk].reverse());
    expect(feedbackText()).toBe("Bu dörtlüyü daha önce denedin.");
    expect(remainingMistakes()).toBe(3);

    // Tekrar, oyunu bitirecek hakkı da tüketmez; geçmişe girmediği için paylaşım satırı üretmez.
    for (const words of YANLISLAR.slice(1)) await guess(user, words);
    expect(statValue(resultRegion("Bugünlük bu kadar."), "Hata")).toBe("4");
    expect(sharePreview().split("\n")).toHaveLength(1 + 4);
  });

  it("hızlı çift gönderme hakkı iki kez düşürmez, doğru grubu bir kez açar", async () => {
    const user = await openPlayPage();
    const [ilk] = YANLISLAR;

    await selectWords(user, ilk);
    await user.dblClick(submitButton());
    expect(remainingMistakes()).toBe(3);
    // Geri bildirim geçişi boyunca Grupla kilitlidir.
    expect(submitButton().textContent).toBe("Kontrol ediliyor…");
    expect(isDisabled(submitButton())).toBe(true);
    expect(isDisabled(tile("ELMA"))).toBe(true);

    finishTransition();
    expect(submitButton().textContent).toBe("Grupla");
    // Kilit açıldıktan sonra aynı seçimle tekrar basmak motor tarafından tekrar sayılır.
    await user.click(submitButton());
    finishTransition();
    expect(feedbackText()).toBe("Bu dörtlüyü daha önce denedin.");
    expect(remainingMistakes()).toBe(3);

    await selectWords(user, MEYVELER);
    await user.dblClick(submitButton());
    finishTransition();
    expect(feedbackText()).toBe("MEYVELER grubunu buldun.");
    expect(screen.getAllByRole("article", { name: /^Çözülen grup:/ })).toHaveLength(1);
    expect(selectionLabel()).toBe("0/4 seçili");
    expect(isDisabled(submitButton())).toBe(true);
    expect(remainingMistakes()).toBe(3);
  });
});

describe("oyun kontrolleri", () => {
  it("karıştır yalnız kart sırasını değiştirir; seçimi ve hakları korur", async () => {
    const user = await openPlayPage();
    await guess(user, YANLISLAR[0]);
    await selectWords(user, ["ELMA", "SATÜRN"]);
    const before = tileTexts();

    await user.click(screen.getByText("Karıştır", { selector: "button" }));

    // Motorun aynı tohumla yaptığı ilk karıştırmanın sırası.
    const random = createSeededRandom(DEFAULT_ENGINE_SEED);
    const expected = textsOf(
      shuffleBoard(createInitialSnapshot(puzzle, { random }), random).remainingWordOrder,
    );
    expect(tileTexts()).toEqual(expected);
    expect(tileTexts()).not.toEqual(before);
    expect(sorted(tileTexts())).toEqual(sorted(before));
    expect(sorted(pressedTexts())).toEqual(["ELMA", "SATÜRN"]);
    expect(selectionLabel()).toBe("2/4 seçili");
    expect(remainingMistakes()).toBe(3);
  });

  it("temizle seçimi boşaltır; hak ve geri bildirim değişmez, boş seçimde kapalıdır", async () => {
    const user = await openPlayPage();
    const clear = () => screen.getByText("Temizle", { selector: "button" });
    expect(isDisabled(clear())).toBe(true);

    await selectWords(user, ["KIRMIZI", "MARS", "ADANA"]);
    expect(selectionLabel()).toBe("3/4 seçili");
    await user.click(tile("MARS"));
    expect(sorted(pressedTexts())).toEqual(["ADANA", "KIRMIZI"]);

    await user.click(clear());
    expect(selectionLabel()).toBe("0/4 seçili");
    expect(pressedTexts()).toEqual([]);
    expect(isDisabled(clear())).toBe(true);
    expect(isDisabled(submitButton())).toBe(true);
    expect(remainingMistakes()).toBe(4);
    expect(feedbackText()).toBe("");
  });

  it("bitmiş oyunda tahta etkileşimi kapalıdır: tahta ve oyun kontrolleri kalkar, yalnız paylaşım kalır", async () => {
    const user = await openPlayPage();
    for (const words of YANLISLAR.slice(0, 3)) await guess(user, words);
    expect(hasBoard()).toBe(true);
    expect(control("Karıştır")).not.toBeNull();

    const [, , , dorduncu] = YANLISLAR;
    await guess(user, dorduncu);
    resultRegion("Bugünlük bu kadar.");

    expect(hasBoard()).toBe(false);
    expect(screen.queryAllByText(/^(ELMA|MARS|ADANA|SARI)$/, { selector: "button" })).toEqual([]);
    expect(control("Karıştır")).toBeNull();
    expect(control("Temizle")).toBeNull();
    expect(screen.queryByText(/^(Grupla|Kontrol ediliyor…)$/, { selector: "button" })).toBeNull();
    expect(screen.queryByText(/seçili$/)).toBeNull();
    expect(feedbackText()).toBe("");
    expect(buttonTexts()).toEqual(["Paylaş", "Kopyala"]);
  });
});

describe("paylaşım", () => {
  it("hatalı tahminlerle kazanılan oyunun paylaşımı yalnız renk satırları taşır; kopyalanan metin aynıdır", async () => {
    const user = await openPlayPage();
    await guess(user, UC_GEZEGEN_BIR_SEHIR);
    await guess(user, YANLISLAR[0]);
    for (const words of [RENKLER, SEHIRLER, MEYVELER, GEZEGENLER]) await guess(user, words);

    const result = resultRegion("Dört bağı da buldun.");
    expect(statValue(result, "Bulunan")).toBe("4/4");
    expect(statValue(result, "Hata")).toBe("2");

    const preview = sharePreview();
    const [header, ...rows] = preview.split("\n");
    expect(header).toBe(`Quadro ${puzzle.date} 4/4 · ${statValue(result, "Süre")}`);
    expect(rows).toEqual(["🟦🟦🟦🟪", "🟦🟨🟪🟨", "🟨🟨🟨🟨", "🟪🟪🟪🟪", "🟩🟩🟩🟩", "🟦🟦🟦🟦"]);
    expect(leakedAnswers(preview)).toEqual([]);

    const shareCard = screen.getByRole("region", { name: "Sonucunu paylaş" });
    await user.click(within(shareCard).getByRole("button", { name: "Kopyala" }));
    expect(await within(shareCard).findByText("Sonuç panoya kopyalandı.")).toBeTruthy();
    const copied = await navigator.clipboard.readText();
    expect(copied).toBe(preview);
    expect(leakedAnswers(copied)).toEqual([]);
  });
});
