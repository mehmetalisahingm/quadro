import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminGameNavigation } from "@/components/game/AdminGameNavigation";
import { GameBoard } from "@/components/game/GameBoard";
import { currentUserIsAdmin } from "@/lib/auth/admin";
import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/client";
import { GAME_ARCHIVE_DAYS, GAME_ARCHIVE_END } from "@/lib/gameArchive";
import { createUser, guess, puzzle, registerFlowHooks, YANLISLAR } from "./helpers";

vi.mock("@/lib/auth/admin", () => ({ currentUserIsAdmin: vi.fn() }));
registerFlowHooks();

function signedIn(admin: boolean) {
  vi.mocked(currentUserIsAdmin).mockResolvedValue(admin);
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
    accessToken: "test-access", refreshToken: "test-refresh", expiresAt: 2000000000,
    user: { id: "test-user" },
  }));
}

describe("admin chapter navigation", () => {
  it("links to any of the 30 playable chapters without solving the current board", async () => {
    render(<AdminGameNavigation currentDay={GAME_ARCHIVE_DAYS[1]} />);
    expect(screen.getAllByRole("option")).toHaveLength(30);
    expect(screen.getByRole("link", { name: "← Önceki bölüm" }).getAttribute("href")).toBe("/play?day=2026-09-20");
    expect(screen.getByRole("link", { name: "Bölümü atla →" }).getAttribute("href")).toBe("/play?day=2026-09-22");
    await createUser().selectOptions(screen.getByRole("combobox", { name: "Bölüm seç" }), GAME_ARCHIVE_END);
    expect(screen.getByRole("link", { name: "Bölüme git ↗" }).getAttribute("href")).toBe(`/play?day=${GAME_ARCHIVE_END}`);
  });

  it("does not link past the archive boundaries", () => {
    const view = render(<AdminGameNavigation currentDay={GAME_ARCHIVE_DAYS[0]} />);
    expect(screen.queryByRole("link", { name: "← Önceki bölüm" })).toBeNull();
    view.rerender(<AdminGameNavigation key="last" currentDay={GAME_ARCHIVE_END} />);
    expect(screen.queryByRole("link", { name: "Bölümü atla →" })).toBeNull();
  });

  it("shows verified admin controls and keeps playing after five wrong guesses", async () => {
    signedIn(true);
    render(<GameBoard puzzle={puzzle} playIntro={false} />);
    await act(async () => {});
    expect(screen.getByRole("region", { name: "Admin oyun kontrolleri" })).toBeTruthy();
    const user = createUser();
    for (const words of [...YANLISLAR, ["ELMA", "KIRMIZI", "MARS", "BURSA"]]) {
      await guess(user, words);
    }
    expect(screen.getByText("Admin modu: hata hakkı sınırsız")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Karıştır" }).hasAttribute("disabled")).toBe(false);
    expect(document.querySelectorAll(".q-game-board .q-word-tile")).toHaveLength(16);
  });

  it("does not give a signed-in non-admin unlimited rights or admin controls", async () => {
    signedIn(false);
    render(<GameBoard puzzle={puzzle} playIntro={false} />);
    await act(async () => {});
    expect(screen.queryByRole("region", { name: "Admin oyun kontrolleri" })).toBeNull();
    expect(screen.queryByText("Admin modu: hata hakkı sınırsız")).toBeNull();
    expect(screen.getByText("4 hata hakkı kaldı")).toBeTruthy();
  });
});
