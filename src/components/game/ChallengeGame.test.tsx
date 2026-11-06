// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { standardPuzzle } from "@/features/game/fixtures";
import { bombFor } from "@/features/game/specialModes";
import { ChallengeGame } from "./ChallengeGame";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const key = (mode: string) => `quadro:${mode}:v1:${standardPuzzle.date}:${standardPuzzle.id}:${standardPuzzle.revision}`;
const scoreboard = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

function choose(words: readonly { text: string }[]) {
  for (const word of words) fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${word.text}(, bombalı kart)?$`) }));
  fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
}
function clear() {
  const button = screen.getByRole("button", { name: "Temizle" });
  if (!button.hasAttribute("disabled")) fireEvent.click(button);
}

describe("Çarpan Merdiveni", () => {
  it("basamak yükselir, kasaya alınır ve yeniden yüklemede korunur", async () => {
    const view = render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await screen.findByRole("button", { name: "Kasaya al" });
    choose(standardPuzzle.groups[0].words);
    expect(screen.getByRole("list", { name: "Çarpan 2×" })).toBeTruthy();
    choose(standardPuzzle.groups[1].words);
    expect(screen.getByText(/Sıradaki doğru grup: \+300/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Kasaya al" }));
    expect(scoreboard("KASADA")).toBe("300");
    expect(screen.getByRole("list", { name: "Çarpan 1×" })).toBeTruthy();
    view.unmount();
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await waitFor(() => expect(scoreboard("KASADA")).toBe("300"));
  });

  it("yanlış tahmin kasaya alınmamış puanı siler, kasadakini korur", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await screen.findByRole("button", { name: "Kasaya al" });
    choose(standardPuzzle.groups[0].words);
    fireEvent.click(screen.getByRole("button", { name: "Kasaya al" }));
    choose(standardPuzzle.groups[1].words);
    const [, , c, d] = standardPuzzle.groups;
    choose([c.words[0], c.words[1], d.words[0], d.words[1]]);
    expect(scoreboard("KASADA")).toBe("100");
    expect(screen.getByRole("button", { name: "Kasaya al" }).hasAttribute("disabled")).toBe(true);
  });

  it("kalkan bir yanlışta potu ve çarpanı korur, tek kullanımlıktır", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" />);
    await screen.findByRole("button", { name: "Kalkanı kur" });
    choose(standardPuzzle.groups[0].words);
    choose(standardPuzzle.groups[1].words);
    fireEvent.click(screen.getByRole("button", { name: "Kalkanı kur" }));
    const [, , c, d] = standardPuzzle.groups;
    choose([c.words[0], c.words[1], d.words[0], d.words[1]]);
    expect(screen.getByRole("status").textContent).toContain("Kalkan puanını ve çarpanını korudu");
    expect(screen.getByText(/Ortadaki puan/).textContent).toContain("300");
    expect(screen.getByRole("button", { name: "Kalkan kullanıldı" }).hasAttribute("disabled")).toBe(true);
  });

  it("son grupta biriken puan kasaya girer; karar dökümü gösterilir", async () => {
    const finish = vi.fn();
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" onFinish={finish} />);
    await screen.findByRole("button", { name: "Kasaya al" });
    for (const group of standardPuzzle.groups) choose(group.words);
    expect(screen.getByText("Dört bağı da buldun!")).toBeTruthy();
    expect(scoreboard("KASADA")).toBe("1000");
    expect(screen.getByRole("list", { name: "Kararların ve etkileri" }).children).toHaveLength(5);
    await waitFor(() => expect(finish).toHaveBeenCalledWith({ won: true, mistakes: 0, bonus: 600 }));
  });

  it("dört hatada kaybedilen oyun kazanılmamış bildirilir", async () => {
    const finish = vi.fn();
    render(<ChallengeGame puzzle={standardPuzzle} mode="ladder" onFinish={finish} />);
    await screen.findByRole("button", { name: "Kasaya al" });
    const [a, b, c, d] = standardPuzzle.groups;
    for (const [x, y] of [[a, b], [a, c], [a, d], [b, c]] as const) { clear(); choose([x.words[0], x.words[1], y.words[2], y.words[3]]); }
    await waitFor(() => expect(finish).toHaveBeenCalledWith(expect.objectContaining({ won: false, mistakes: 4 })));
  });
});

describe("Bomba Kart", () => {
  const bombId = bombFor(standardPuzzle);
  const bombGroup = standardPuzzle.groups.find((group) => group.words.some((word) => word.id === bombId))!;
  const others = standardPuzzle.groups.filter((group) => group.id !== bombGroup.id);

  it("bomba deterministik karttadır; ilk tahminde etkisiz kılmak en yüksek bonusu verir", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    const bomb = await screen.findByRole("button", { name: /bombalı kart/ });
    expect(bomb.textContent).toBe(bombGroup.words.find((word) => word.id === bombId)!.text);
    expect(screen.getByText(/şimdi etkisiz kılarsan \+250/)).toBeTruthy();
    choose(bombGroup.words);
    expect(scoreboard("BONUS")).toBe("250");
    expect(screen.queryByRole("button", { name: /bombalı kart/ })).toBeNull();
  });

  it("fitil biterse bomba patlar ve bir ek hata yazar", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    await screen.findByRole("button", { name: /bombalı kart/ });
    for (const group of others) choose(group.words);
    expect(screen.getByText("Bomba patladı.")).toBeTruthy();
    expect(scoreboard("KALAN HATA")).toBe("3 / 4");
  });

  it("soğutma fitile iki tur ekler ve tek kullanımlıktır", async () => {
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    fireEvent.click(await screen.findByRole("button", { name: "Soğut · +2 tur" }));
    expect(screen.getByText(/Fitil:/).textContent).toContain("5");
    expect(screen.getByRole("button", { name: "Soğutma kullanıldı" }).hasAttribute("disabled")).toBe(true);
  });

  it("bombalı yanlış tahmin bir ek hata yazar ve yenilemede korunur", async () => {
    const view = render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    fireEvent.click(await screen.findByRole("button", { name: /bombalı kart/ }));
    for (const group of others) fireEvent.click(screen.getByRole("button", { name: group.words[0].text }));
    fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
    expect(scoreboard("KALAN HATA")).toBe("2 / 4");
    view.unmount();
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    await waitFor(() => expect(scoreboard("KALAN HATA")).toBe("2 / 4"));
  });

  it("eski kayıttaki bomba yeri korunur", async () => {
    // Önce taze oyunun kaydını al, sonra bombası başka kartta olan eski bir kayıt gibi yaz.
    const legacyBomb = others[0]!.words[0].id;
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    await screen.findByRole("button", { name: /bombalı kart/ });
    const saved = JSON.parse(localStorage.getItem(key("bomb"))!);
    cleanup();
    localStorage.setItem(key("bomb"), JSON.stringify({ snapshot: saved.snapshot, bombId: legacyBomb, banks: [] }));
    render(<ChallengeGame puzzle={standardPuzzle} mode="bomb" />);
    const bomb = await screen.findByRole("button", { name: /bombalı kart/ });
    expect(bomb.textContent).toBe(others[0]!.words[0].text);
  });
});
