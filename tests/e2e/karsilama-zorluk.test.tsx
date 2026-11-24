import { act, cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PlayPage from "@/app/play/page";
import { PlayExperience, playModeKey } from "@/components/game/PlayExperience";
import { GameBoard } from "@/components/game/GameBoard";
import { gameOpeningFor, openingWords } from "@/animations/openingScenes";
import { createEngineController } from "@/features/game/react/engineController";
import { parseStoredRecord, serializeRecord } from "@/lib/persistence/record";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";

import {
  UC_GEZEGEN_BIR_SEHIR,
  YANLISLAR,
  createUser,
  enterGame,
  feedbackText,
  guess,
  hasBoard,
  openPlayPage,
  puzzle,
  registerFlowHooks,
  remainingMistakes,
  selectWords,
  submitButton,
} from "./helpers";

registerFlowHooks();

describe("karşılama → açılış → zorluk modu", () => {
  it("kısmen çözülmüş oyun açılışında kartları grup düzeninde göstermez", () => {
    const resumed = { ...puzzle, id: "q-002" };
    const controller = createEngineController({ puzzle: resumed });
    for (const word of resumed.groups[0].words) controller.toggleWord(word.id);
    const result = controller.submitSelection();
    expect(result.outcome.verdict).toBe("correct");
    localStorage.setItem(snapshotStorageKey(resumed.date), serializeRecord(result.snapshot, new Date().toISOString()));

    const { container } = render(<GameBoard puzzle={resumed} />);
    const cards = Array.from(container.querySelectorAll("[data-opening-card] span"), (card) => card.textContent);
    expect(cards).toEqual(openingWords(resumed));
    expect(cards).toHaveLength(16);
  });

  it("yanlış tahminlerde iki hakem tepkisini sırayla gösterir", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({ day: "2026-09-20" }) }));
    const user = createUser();
    await enterGame(user);
    await selectWords(user, YANLISLAR[0]);
    await user.click(submitButton());
    expect(document.querySelector('[data-football-reaction="flag"]')).toBeTruthy();
    expect(feedbackText()).toContain("aynı grupta değil");
    act(() => vi.advanceTimersByTime(400));
    await selectWords(user, YANLISLAR[1]);
    await user.click(submitButton());
    expect(document.querySelector('[data-football-reaction="whistle"]')).toBeTruthy();
    expect(feedbackText()).toContain("aynı grupta değil");
  });

  it("kayıtlı mod sonraki bulmacanın açılış animasyonunu atlatmaz", () => {
    const nextPuzzle = { ...puzzle, id: "saved-opening", date: "2026-09-21" };
    localStorage.setItem(playModeKey(nextPuzzle), "easy");
    render(<PlayExperience puzzle={nextPuzzle} />);
    expect(screen.getByRole("region", { name: "Oyun açılışı" }).getAttribute("data-opening")).toBe(gameOpeningFor(nextPuzzle.id, nextPuzzle.date));
    expect(screen.queryByRole("button", { name: "Bağlantıları bul" })).toBeNull();
    expect(screen.getByRole("button", { name: "Karıştır" }).hasAttribute("disabled")).toBe(true);
    act(() => vi.advanceTimersByTime(3300));
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
    expect(screen.getByRole("button", { name: "Karıştır" }).hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("Kolay mod")).toBeTruthy();
    expect(localStorage.getItem(playModeKey(nextPuzzle))).toBe("easy");
  });

  it("kitapçığı önce gösterir ve okuma süresini oyun süresine eklemez", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({ day: "2026-09-20" }) }));
    const user = createUser();
    const key = snapshotStorageKey(puzzle.date);

    expect(hasBoard()).toBe(false);
    expect(screen.getByText("Karadeniz · kara kedi · karabiber · kara kutu")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: /Orta/ }).getAttribute("checked")).not.toBeNull();
    act(() => vi.advanceTimersByTime(12_000));
    expect(localStorage.getItem(key)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Bağlantıları bul" }));
    // Gerçek sinematik geçiş tarayıcıda doğrulanır; NODE_ENV=test bu süreyi atlar.
    expect(hasBoard()).toBe(true);
    expect(screen.getByText("Orta mod")).toBeTruthy();
    const record = parseStoredRecord(localStorage.getItem(key) ?? "");
    expect(record.ok && record.record.snapshot.activeSeconds).toBe(0);
    expect(remainingMistakes()).toBe(4);
  });

  it("Kolay seçimini ve kullanılan ipucunu yenilemede korur", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({ day: "2026-09-20" }) }));
    const user = createUser();
    await user.click(screen.getByRole("radio", { name: /Kolay/ }));
    await enterGame(user);

    expect(screen.getByText("Kolay mod")).toBeTruthy();
    expect(screen.getByText("4/4 ipucu kaldı")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Kategori ipucu" }));
    expect(screen.getByText("3/4 ipucu kaldı")).toBeTruthy();
    expect(screen.getByText("RENKLER", { selector: "li" })).toBeTruthy();
    expect(localStorage.getItem(playModeKey(puzzle))).toBe("easy");
    expect(screen.queryAllByRole("radio")).toHaveLength(0);

    cleanup();
    await openPlayPage();
    expect(screen.getByText("Kolay mod")).toBeTruthy();
    expect(screen.getByText("3/4 ipucu kaldı")).toBeTruthy();
    expect(screen.getByText("RENKLER", { selector: "li" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Bağlantıları bul" })).toBeNull();
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
  });

  it("Zor modda kategori ve yakınlık yardımı göstermez; hata kuralı aynı kalır", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({ day: "2026-09-20" }) }));
    const user = createUser();
    await user.click(screen.getByRole("radio", { name: /^Zor/ }));
    await enterGame(user);

    expect(screen.getByText("Zor mod")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Kategori ipucu" })).toBeNull();
    await guess(user, UC_GEZEGEN_BIR_SEHIR);
    expect(remainingMistakes()).toBe(3);
    expect(feedbackText()).not.toContain("uzaktasın");
    expect(document.querySelector(".q-game-feedback")?.getAttribute("data-verdict")).toBe("wrong");
  });
});
