// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { RiskGame } from "./RiskGame";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("RiskGame", () => {
  it("ödülü hesaplar ve yenilemede geri yükler", async () => {
    const view = render(<RiskGame puzzle={standardPuzzle} />);
    await screen.findByRole("slider");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "30" } });
    for (const word of standardPuzzle.groups[0].words) fireEvent.click(screen.getByRole("button", { name: word.text }));
    fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
    expect(screen.getByText("130")).toBeTruthy();
    view.unmount();
    render(<RiskGame puzzle={standardPuzzle} />);
    await waitFor(() => expect(screen.getByText("130")).toBeTruthy());
    expect(screen.getByText(standardPuzzle.groups[0].title)).toBeTruthy();
  });

  it("yanlış tahminde yatırılan puanı düşürür ve sıfırda bitirir", async () => {
    render(<RiskGame puzzle={standardPuzzle} />);
    await screen.findByRole("slider");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "100" } });
    for (const group of standardPuzzle.groups) fireEvent.click(screen.getByRole("button", { name: group.words[0].text }));
    fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
    expect(screen.getByText("Oyun bitti")).toBeTruthy();
    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});
