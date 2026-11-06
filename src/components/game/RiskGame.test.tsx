// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { createInitialSnapshot, createSeededRandom } from "@/features/game/engine";
import { RiskGame } from "./RiskGame";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const [first, second] = standardPuzzle.groups;
const potValue = () => screen.getByText("POT").nextElementSibling?.textContent;

function guess(words: readonly { text: string }[]) {
  for (const word of words) fireEvent.click(screen.getByRole("button", { name: word.text }));
  fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
}

describe("RiskGame", () => {
  it("Cesur duruşla doğru grup +75 getirir; yenilemede geri yüklenir", async () => {
    const view = render(<RiskGame puzzle={standardPuzzle} />);
    fireEvent.click(await screen.findByRole("radio", { name: /Cesur/ }));
    guess(first.words);
    expect(potValue()).toBe("175");
    view.unmount();
    render(<RiskGame puzzle={standardPuzzle} />);
    await waitFor(() => expect(potValue()).toBe("175"));
    expect(screen.getByText(first.title)).toBeTruthy();
  });

  it("Efsane yalnız doğru tahminden sonra açılır; renk de tutarsa +150", async () => {
    render(<RiskGame puzzle={standardPuzzle} />);
    const legend = await screen.findByRole("radio", { name: /Efsane/ });
    expect((legend as HTMLInputElement).disabled).toBe(true);
    guess(first.words);
    expect((screen.getByRole("radio", { name: /Efsane/ }) as HTMLInputElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole("radio", { name: /Efsane/ }));
    fireEvent.change(screen.getByRole("combobox", { name: /zorluk rengi/ }), { target: { value: String(second.difficulty) } });
    guess(second.words);
    expect(potValue()).toBe(String(100 + 25 + 150));
    expect(screen.getByRole("status").textContent).toContain("Renk de doğru!");
  });

  it("pot sıfırlanınca oyun biter ve karar dökümü gösterilir", async () => {
    const finish = vi.fn();
    render(<RiskGame puzzle={standardPuzzle} onFinish={finish} />);
    fireEvent.click(await screen.findByRole("radio", { name: /Cesur/ }));
    const [a, b, c, d] = standardPuzzle.groups;
    guess([a.words[0], a.words[1], b.words[0], b.words[1]]);
    fireEvent.click(screen.getByRole("button", { name: "Temizle" }));
    guess([c.words[0], c.words[1], d.words[0], d.words[1]]);
    expect(screen.getByText("Oyun bitti")).toBeTruthy();
    expect(potValue()).toBe("0");
    expect(screen.getByRole("list", { name: "Kararların ve etkileri" }).children).toHaveLength(2);
    await waitFor(() => expect(finish).toHaveBeenCalledWith({ won: false, mistakes: 2, bonus: 0 }));
  });

  it("eski puan yatırma kaydı ilerlemesiyle açılır", async () => {
    const snapshot = createInitialSnapshot(standardPuzzle, { random: createSeededRandom(20260920) });
    const solved = { ...snapshot, solvedGroupIds: [first.id], remainingWordOrder: snapshot.remainingWordOrder.filter((id) => !first.words.some((w) => w.id === id)), attempts: [{ id: "a1", wordIds: first.words.map((w) => w.id) as [string, string, string, string], verdict: "correct" as const }] };
    localStorage.setItem(`quadro:risk:v1:${standardPuzzle.date}:${standardPuzzle.id}:${standardPuzzle.revision}`, JSON.stringify({ snapshot: solved, wagers: [50] }));
    render(<RiskGame puzzle={standardPuzzle} />);
    await screen.findByText(first.title);
    expect(potValue()).toBe("175");
  });
});
