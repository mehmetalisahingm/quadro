import { act, cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PlayPage from "@/app/play/page";
import { playModeKey } from "@/components/game/PlayExperience";
import { parseStoredRecord } from "@/lib/persistence/record";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";

import {
  UC_GEZEGEN_BIR_SEHIR,
  createUser,
  enterGame,
  feedbackText,
  guess,
  hasBoard,
  openPlayPage,
  puzzle,
  registerFlowHooks,
  remainingMistakes,
} from "./helpers";

registerFlowHooks();

describe("karşılama → açılış → zorluk modu", () => {
  it("kitapçığı önce gösterir ve okuma süresini oyun süresine eklemez", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({}) }));
    const user = createUser();
    const key = snapshotStorageKey(puzzle.date);

    expect(hasBoard()).toBe(false);
    expect(screen.getByText("Karadeniz · kara kedi · karabiber · kara kutu")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
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
    render(await PlayPage({ searchParams: Promise.resolve({}) }));
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
    render(await PlayPage({ searchParams: Promise.resolve({}) }));
    const user = createUser();
    await user.click(screen.getByRole("radio", { name: /Zor/ }));
    await enterGame(user);

    expect(screen.getByText("Zor mod")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Kategori ipucu" })).toBeNull();
    await guess(user, UC_GEZEGEN_BIR_SEHIR);
    expect(remainingMistakes()).toBe(3);
    expect(feedbackText()).not.toContain("uzaktasın");
    expect(document.querySelector(".q-game-feedback")?.getAttribute("data-verdict")).toBe("wrong");
  });
});
