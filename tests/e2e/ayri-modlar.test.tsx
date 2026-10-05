import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PlayPage from "@/app/play/page";
import { loadModePuzzle } from "@/lib/daily/modePuzzle";
import { AdminGameNavigation } from "@/components/game/AdminGameNavigation";
import { createUser, enterGame, guess, registerFlowHooks } from "./helpers";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), notFound: () => { throw new Error("404"); } }));
registerFlowHooks();

describe("farklı zorluk parkurları", () => {
  it("üç mod ve 18 bölüm sunar, seçilen moda gider", async () => {
    render(await PlayPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getAllByRole("link", { name: /bölüm \d/i })).toHaveLength(18);
    const user = createUser();
    await user.click(screen.getByRole("radio", { name: /Zor/ }));
    await user.click(screen.getByRole("button", { name: "Bağlantıları bul" }));
    expect(push).toHaveBeenLastCalledWith("/play?difficulty=hard&level=1");
  });

  it("farklı tahtalar yükler ve başka moddan dönünce çözümü korur", async () => {
    const user = createUser();
    const easy = (await loadModePuzzle("easy", 1))!;
    render(await PlayPage({ searchParams: Promise.resolve({ difficulty: "easy", level: "1" }) }));
    await enterGame(user);
    await guess(user, easy.groups[0].words.map(w => w.text));
    expect(screen.getByText(easy.groups[0].title)).toBeTruthy();
    cleanup();
    render(await PlayPage({ searchParams: Promise.resolve({ difficulty: "hard", level: "1" }) }));
    await enterGame(user);
    expect(screen.getByText("Zor mod")).toBeTruthy();
    expect(screen.queryByText(easy.groups[0].words[0].text)).toBeNull();
    expect(screen.getByRole("link", { name: "Sonraki bulmaca →" }).getAttribute("href")).toBe("/play?difficulty=hard&level=2");
    cleanup();
    render(await PlayPage({ searchParams: Promise.resolve({ difficulty: "easy", level: "1" }) }));
    await enterGame(user);
    expect(screen.getByText(easy.groups[0].title)).toBeTruthy();
  });

  it("geçersiz modu/bölümü reddeder ve altıncı bölümde modu bitirir", async () => {
    for (const query of [{ difficulty: "oops" }, { difficulty: "easy", level: "7" }]) {
      await expect(PlayPage({ searchParams: Promise.resolve(query) })).rejects.toThrow("404");
    }
    render(await PlayPage({ searchParams: Promise.resolve({ difficulty: "medium", level: "6" }) }));
    expect(screen.queryByRole("link", { name: "Sonraki bulmaca →" })).toBeNull();
    expect(screen.getByRole("link", { name: /Bu modun son/ }).getAttribute("href")).toBe("/play");
  });

  it("admin bölüm atlama bağlantısını seçilen modda tutar", () => {
    render(<AdminGameNavigation currentDay="2026-10-06" trackDifficulty="hard" />);
    expect(screen.getAllByRole("option")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Bölümü atla →" }).getAttribute("href")).toBe("/play?difficulty=hard&level=3");
  });
});
