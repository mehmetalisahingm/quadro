// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { ChallengeGame } from "./ChallengeGame";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

function choose(words: readonly { text: string }[]) {
  for (const word of words) fireEvent.click(screen.getByRole("button", { name: word.text }));
  fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
}

describe("özel oyun modları", () => {
  it("çarpanı artırır, kasaya alır ve yeniden yüklemede korur", async () => {
    const view = render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await screen.findByRole("button", { name: "Kasaya al" });
    choose(standardPuzzle.groups[0].words);
    expect(screen.getByText("2×")).toBeTruthy();
    choose(standardPuzzle.groups[1].words);
    expect(screen.getByText("300")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Kasaya al" }));
    expect(screen.getByText("1×")).toBeTruthy();
    view.unmount();
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await waitFor(() => expect(screen.getByText("300")).toBeTruthy());
    expect(screen.getByText("1×")).toBeTruthy();
  });

  it("yanlışta kasadaki puanı korur ve ortadakini siler", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await screen.findByRole("button", { name: "Kasaya al" });
    choose(standardPuzzle.groups[0].words);
    fireEvent.click(screen.getByRole("button", { name: "Kasaya al" }));
    choose(standardPuzzle.groups[1].words);
    choose([standardPuzzle.groups[2].words[0], standardPuzzle.groups[2].words[1], standardPuzzle.groups[3].words[0], standardPuzzle.groups[3].words[1]]);
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("1×")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kasaya al" }).hasAttribute("disabled")).toBe(true);
  });

  it("bombalı yanlış iki hak götürür ve yenilemede bombayı korur", async () => {
    const view = render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    const bombButton = await screen.findByRole("button", { name: /bombalı kart/i });
    const bombText = bombButton.textContent;
    const bombGroup = standardPuzzle.groups.find((group) => group.words.some((word) => word.text === bombText));
    if (!bombGroup) throw new Error("Bombalı grup bulunamadı");
    const otherWords = standardPuzzle.groups.filter((group) => group.id !== bombGroup.id).map((group) => group.words[0]);
    fireEvent.click(bombButton);
    for (const word of otherWords) fireEvent.click(screen.getByRole("button", { name: word.text }));
    fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
    expect(screen.getByText("2 / 4")).toBeTruthy();
    view.unmount();
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    await waitFor(() => expect(screen.getByText("2 / 4")).toBeTruthy());
    expect(screen.getByRole("button", { name: /bombalı kart/i }).textContent).toBe(bombText);
  });

  it("bombalı doğru gruba 200 puan verir", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    const bombButton = await screen.findByRole("button", { name: /bombalı kart/i });
    const bombText = bombButton.textContent;
    const group = standardPuzzle.groups.find((item) => item.words.some((word) => word.text === bombText));
    if (!group) throw new Error("Bombalı grup bulunamadı");
    fireEvent.click(bombButton);
    for (const word of group.words.filter((item) => item.text !== bombText)) fireEvent.click(screen.getByRole("button", { name: word.text }));
    fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
    expect(screen.getByText("200")).toBeTruthy();
  });

  it("son grupta birikmiş puanı otomatik kasaya alır", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await screen.findByRole("button", { name: "Kasaya al" });
    for (const group of standardPuzzle.groups) choose(group.words);
    expect(screen.getByText("Dört bağı da buldun!")).toBeTruthy();
    expect(screen.getAllByText("1000")).toHaveLength(2);
  });

  it("bitişte kazanma, yanlış tahmin sayısı ve mod bonusunu ayrı bildirir", async () => {
    const finish = vi.fn();
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" onFinish={finish} />);
    await screen.findByRole("button", { name: /bombalı kart/i });
    for (const group of standardPuzzle.groups) {
      for (const word of group.words) fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${word.text}(, bombalı kart)?$`) }));
      fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
    }
    await waitFor(() => expect(finish).toHaveBeenCalledWith({ won: true, mistakes: 0, bonus: 100 }));
  });

  it("kasaya alınmış çarpan bonusunu sonraki temel puanlarla karıştırmaz", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" onFinish={vi.fn()} />);
    await screen.findByRole("button", { name: "Kasaya al" });
    choose(standardPuzzle.groups[0].words);
    choose(standardPuzzle.groups[1].words);
    fireEvent.click(screen.getByRole("button", { name: "Kasaya al" }));
    choose(standardPuzzle.groups[2].words);
    expect(screen.getByText(/Mod bonusu:/).textContent).toContain("100");
  });
});

describe("özel mod bitiş sonucu", () => {
  it("yanlış tahminle kazanılan oyunda yanlışları sayar; Risk bakiyesi bonustur", async () => {
    const finish = vi.fn();
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" onFinish={finish} />);
    await screen.findByRole("button", { name: "Kasaya al" });
    choose([standardPuzzle.groups[0].words[0], standardPuzzle.groups[0].words[1], standardPuzzle.groups[1].words[0], standardPuzzle.groups[1].words[1]]);
    fireEvent.click(screen.getByRole("button", { name: "Temizle" }));
    for (const group of standardPuzzle.groups) choose(group.words);
    await waitFor(() => expect(finish).toHaveBeenCalledWith(expect.objectContaining({ won: true, mistakes: 1 })));
  });

  it("dört hatada kaybedilen oyun kazanılmamış olarak bildirilir", async () => {
    const finish = vi.fn();
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" onFinish={finish} />);
    await screen.findByRole("button", { name: "Kasaya al" });
    const [a, b, c, d] = standardPuzzle.groups;
    for (const [x, y] of [[a, b], [a, c], [a, d], [b, c]] as const) {
      const clear = screen.getByRole("button", { name: "Temizle" });
      if (!clear.hasAttribute("disabled")) fireEvent.click(clear);
      choose([x.words[0], x.words[1], y.words[2], y.words[3]]);
    }
    await waitFor(() => expect(finish).toHaveBeenCalledWith(expect.objectContaining({ won: false, mistakes: 4 })));
  });
});
