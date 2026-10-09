import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeExperience } from "@/components/home/HomeExperience";
import { SiteEntrance } from "@/components/game/SiteEntrance";
import { registerFlowHooks } from "./helpers";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/" }));
registerFlowHooks();
beforeEach(() => router.refresh.mockClear());
const props = {
  today: { dayKey: "2026-09-19", puzzleId: null, puzzleRevision: null },
  puzzleNumber: null,
  dateLabel: "19 EYLÜL 2026",
  nextRolloverAt: "2026-09-19T21:00:00.000Z",
  initialCountdownLabel: "00 sa 00 dk",
};

describe("gün değişimi giriş animasyonunu yeniden başlatmaz", () => {
  it("eski sunucu cevabında yalnız bir yumuşak yenileme yapar ve plağı kapatır", () => {
    const tree = () => <SiteEntrance><HomeExperience {...props} /></SiteEntrance>;
    const view = render(tree());
    expect(router.refresh).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(3600));
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
    expect(screen.getByRole("link", { name: "Bugünün bulmacasını çöz" })).toBeTruthy();
    view.rerender(tree()); // Simulate a refresh returning the same stale boundary.
    act(() => vi.advanceTimersByTime(120_000));
    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("region", { name: "Oyun açılışı" })).toBeNull();
  });

  it("gece yarısında bir kez yeniler ve sonraki gün için tekrar çalışır", () => {
    const first = new Date(Date.now() + 30_000).toISOString();
    const view = render(<HomeExperience {...props} nextRolloverAt={first} />);
    expect(router.refresh).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(30_000));
    expect(router.refresh).toHaveBeenCalledTimes(1);
    const next = new Date(Date.now() + 86_400_000).toISOString();
    view.rerender(<HomeExperience {...props} nextRolloverAt={next} />);
    act(() => vi.advanceTimersByTime(86_400_000));
    expect(router.refresh).toHaveBeenCalledTimes(2);
  });
});
