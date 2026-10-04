import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteEntrance } from "@/components/game/SiteEntrance";
import { createUser, registerFlowHooks } from "./helpers";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
registerFlowHooks();

describe("site entry plaque", () => {
  it.each(["/", "/play"])("starts on %s even with a saved game and replays after reload", async (pathname) => {
    route.pathname = pathname;
    localStorage.setItem("quadro:play-mode:v1:existing", "easy");
    localStorage.setItem("quadro:auth:v1", "existing-session");
    const first = render(<SiteEntrance><h1>Oyun</h1></SiteEntrance>);
    expect(screen.getByRole("region", { name: "Oyun açılışı" }).getAttribute("data-opening")).toBe("board-prelude");
    expect(screen.queryByRole("heading", { name: "Oyun" })).toBeNull();
    await createUser().click(screen.getByRole("button", { name: "Oyuna geç" }));
    expect(screen.getByRole("heading", { name: "Oyun" })).toBeTruthy();
    expect(localStorage.getItem("quadro:play-mode:v1:existing")).toBe("easy");
    expect(localStorage.getItem("quadro:auth:v1")).toBe("existing-session");
    first.unmount();
    render(<SiteEntrance><h1>Oyun</h1></SiteEntrance>);
    expect(screen.getByRole("region", { name: "Oyun açılışı" })).toBeTruthy();
  });

  it("finishes naturally and does not repeat when moving from home to play", () => {
    route.pathname = "/";
    const view = render(<SiteEntrance><h1>Ana sayfa</h1></SiteEntrance>);
    act(() => vi.advanceTimersByTime(3600));
    expect(screen.getByRole("heading", { name: "Ana sayfa" })).toBeTruthy();
    route.pathname = "/play";
    view.rerender(<SiteEntrance><h1>Oyun</h1></SiteEntrance>);
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Oyun" })).toBeTruthy();
  });

  it.each(["/login", "/auth/callback", "/admin", "/animations"])("does not obstruct %s", (pathname) => {
    route.pathname = pathname;
    render(<SiteEntrance><h1>Sayfa</h1></SiteEntrance>);
    expect(screen.getByRole("heading", { name: "Sayfa" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
  });

  it("respects reduced motion", () => {
    route.pathname = "/play";
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    render(<SiteEntrance><h1>Oyun</h1></SiteEntrance>);
    act(() => vi.advanceTimersByTime(0));
    expect(screen.getByRole("heading", { name: "Oyun" })).toBeTruthy();
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});
