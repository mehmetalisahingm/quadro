import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeHero } from "@/components/home/HomeHero";

const base = { puzzleNumber: 1, dateLabel: "16 EKİM 2026", nextPuzzleLabel: "1 saat" };

describe("first-visit gameplay video", () => {
  it("offers a native, accessible gameplay clip and keeps the play button available", () => {
    const { container } = render(<HomeHero {...base} state="new" />);
    const video = screen.getByLabelText(/Quadro öğreticisinde dört kelime seçilerek/) as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video.getAttribute("controls")).not.toBeNull();
    expect(video.getAttribute("autoplay")).toBeNull();
    expect(video.querySelector("source")?.getAttribute("src")).toBe("/videos/quadro-oynanis.mp4");
    expect(screen.getByRole("link", { name: "Bugünün bulmacasını çöz" })).toBeTruthy();
    expect(container.textContent).toContain("Videodan sonra kendin dene");
  });
  it("does not force the tutorial clip on a returning player", () => {
    render(<HomeHero {...base} state="in-progress" />);
    expect(screen.queryByLabelText(/Quadro öğreticisinde dört kelime seçilerek/)).toBeNull();
  });
});
