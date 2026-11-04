import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { buildShareText } from "@/components/game/ShareCard";
import { PictureLobby } from "@/components/pictures/PictureLobby";
import { PictureStage } from "@/components/pictures/PictureStage";
import { StatsExperience } from "@/components/stats/StatsExperience";
import type { Puzzle } from "@/features/game/contracts";
import { createGameStore } from "@/features/game/state/gameStore";
import { loadPicturePuzzle } from "@/lib/daily/picturePuzzle";
import { pictureStorage, readPictureProgress } from "@/lib/persistence/pictureProgress";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";
import { loadPersonalStats } from "@/lib/persistence/statsStore";

import { createUser, feedbackText, finishTransition, registerFlowHooks, remainingMistakes, sharePreview } from "./helpers";

registerFlowHooks();

const pictureBoard = () => screen.getByLabelText(/^\d+ çözülmemiş görselli oyun tahtası$/);
const card = (alt: string) => within(pictureBoard()).getByRole("button", { name: alt });
const altsOf = (puzzle: Puzzle, group: number) => puzzle.groups[group]!.words.map((word) => word.image!.alt);

async function submit(user: UserEvent, alts: readonly string[]) {
  const clear = screen.getByRole("button", { name: "Temizle" });
  if (!(clear as HTMLButtonElement).disabled) await user.click(clear);
  for (const alt of alts) await user.click(card(alt));
  await user.click(screen.getByRole("button", { name: "Grupla" }));
  finishTransition();
}

async function openBoard(board = 2) {
  const puzzle = (await loadPicturePuzzle(board))!;
  render(<PictureStage board={board} puzzle={puzzle} />);
  await act(async () => undefined);
  return { puzzle, user: createUser() };
}

describe("Resimli Quadro akışı", () => {
  it("16 görsel kart açar; kelime göstermez, ekran okuyucu adı nesneyi söyler, seçim düğme durumudur", async () => {
    const { puzzle, user } = await openBoard();
    const tiles = within(pictureBoard()).getAllByRole("button");
    expect(tiles).toHaveLength(16);
    expect(pictureBoard().textContent).toBe("");
    for (const group of puzzle.groups) expect(pictureBoard().textContent).not.toContain(group.title);

    const [first] = altsOf(puzzle, 0);
    await user.click(card(first!));
    expect(card(first!).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("1/4 seçili")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Temizle" }));
    expect(card(first!).getAttribute("aria-pressed")).toBe("false");

    const before = within(pictureBoard()).getAllByRole("button").map((tile) => tile.getAttribute("aria-label"));
    await user.click(screen.getByRole("button", { name: "Karıştır" }));
    const after = within(pictureBoard()).getAllByRole("button").map((tile) => tile.getAttribute("aria-label"));
    expect(after).not.toEqual(before);
    expect([...after].sort()).toEqual([...before].sort());
  });

  it("doğru, çok yakın, yanlış ve yinelenen tahmini aynı kurallarla değerlendirir", async () => {
    const { puzzle, user } = await openBoard();
    const [a, b, c, d] = [altsOf(puzzle, 0), altsOf(puzzle, 1), altsOf(puzzle, 2), altsOf(puzzle, 3)];

    await submit(user, [a[0]!, a[1]!, a[2]!, b[0]!]);
    expect(feedbackText()).toBe("Bir görsel uzaktasın.");
    expect(remainingMistakes()).toBe(3);

    await submit(user, [b[0]!, a[2]!, a[1]!, a[0]!]);
    expect(feedbackText()).toBe("Bu dörtlüyü daha önce denedin.");
    expect(remainingMistakes()).toBe(3);

    await submit(user, [a[0]!, a[1]!, b[0]!, b[1]!]);
    expect(feedbackText()).toBe("Bu dört görsel aynı grupta değil.");
    expect(remainingMistakes()).toBe(2);

    await submit(user, a);
    expect(feedbackText()).toContain(puzzle.groups[0].title);
    const solved = screen.getByRole("article", { name: `Çözülen grup: ${puzzle.groups[0].title}` });
    expect(solved.textContent).toContain(puzzle.groups[0].words[0].text);
    expect(solved.querySelectorAll("img")).toHaveLength(4);
    expect(within(pictureBoard()).getAllByRole("button")).toHaveLength(12);

    expect(c).toHaveLength(4);
    expect(d).toHaveLength(4);
  });

  it("kazanınca modlu, spoilersız sonuç gösterir ve sonraki tahtayı önerir", async () => {
    const { puzzle, user } = await openBoard();
    for (let group = 0; group < 4; group++) await submit(user, altsOf(puzzle, group));
    await act(async () => undefined);

    expect(screen.getByRole("region", { name: "Dört bağı da buldun." }).textContent).toContain("RESİMLİ QUADRO");
    const share = sharePreview();
    expect(share.split("\n")[0]).toMatch(/^Resimli Quadro · Tahta 2 4\/4 · /);
    for (const group of puzzle.groups) {
      expect(share).not.toContain(group.title);
      for (const word of group.words) {
        expect(share).not.toContain(word.text);
        expect(share).not.toContain(word.image!.alt);
      }
    }
    expect(screen.getByRole("link", { name: "Sonraki tahtaya geç →" }).getAttribute("href")).toBe("/pictures/board?board=3");
  });

  it("dört hatada kaybeder, cevapları açar ve tahtayı yeniden oynatır", async () => {
    const { puzzle, user } = await openBoard();
    const [a, b, c, d] = [altsOf(puzzle, 0), altsOf(puzzle, 1), altsOf(puzzle, 2), altsOf(puzzle, 3)];
    const wrong = [
      [a[0]!, a[1]!, b[0]!, b[1]!],
      [a[0]!, a[2]!, c[0]!, c[1]!],
      [a[0]!, a[3]!, d[0]!, d[1]!],
      [b[0]!, b[2]!, c[0]!, c[2]!],
    ];
    for (const guess of wrong) await submit(user, guess);
    await act(async () => undefined);

    const result = screen.getByRole("region", { name: "Bu tahta burada bitti." });
    expect(result.textContent).toContain(puzzle.groups[3].title);
    expect(readPictureProgress()[1]).toMatchObject({ status: "lost", solvedGroups: 0, mistakesUsed: 4 });

    await user.click(screen.getByRole("button", { name: "Bu tahtayı yeniden oyna ↻" }));
    await act(async () => undefined);
    expect(within(pictureBoard()).getAllByRole("button")).toHaveLength(16);
    expect(readPictureProgress()[1]).toMatchObject({ status: "playing", solvedGroups: 0, mistakesUsed: 0 });
  });

  it("yenilemede seçim, çözülen grup ve hata sayısını geri getirir", async () => {
    const { puzzle, user } = await openBoard();
    const [a, b] = [altsOf(puzzle, 0), altsOf(puzzle, 1)];
    await submit(user, a);
    await submit(user, [b[0]!, b[1]!, b[2]!, puzzle.groups[2].words[0].image!.alt]);
    await user.click(screen.getByRole("button", { name: "Temizle" }));
    await user.click(card(b[0]!));

    cleanup();
    render(<PictureStage board={2} puzzle={puzzle} />);
    await act(async () => undefined);

    expect(screen.getByRole("article", { name: `Çözülen grup: ${puzzle.groups[0].title}` })).toBeTruthy();
    expect(remainingMistakes()).toBe(3);
    expect(card(b[0]!).getAttribute("aria-pressed")).toBe("true");
    expect(within(pictureBoard()).getAllByRole("button")).toHaveLength(12);
  });

  it("görsel yüklenmezse açıklamayı gösterir, kart oynanır ve yeniden deneme hak harcamaz", async () => {
    const { puzzle, user } = await openBoard();
    const [first] = altsOf(puzzle, 0);
    const image = card(first!).querySelector("img")!;
    fireEvent.error(image);

    expect(card(first!).textContent).toBe(first);
    expect(remainingMistakes()).toBe(4);
    await user.click(card(first!));
    expect(card(first!).getAttribute("aria-pressed")).toBe("true");

    await user.click(screen.getByRole("button", { name: `${first} görselini yeniden yükle` }));
    expect(card(first!).querySelector("img")?.getAttribute("src")).toContain("?deneme=1");
    expect(card(first!).getAttribute("aria-pressed")).toBe("true");
    expect(remainingMistakes()).toBe(4);
    // next/image onLoad çağrısını decode sonrasına ertelediği için mikro görevler boşaltılır.
    await act(async () => { fireEvent.load(card(first!).querySelector("img")!); });
    expect(card(first!).getAttribute("data-image-status")).toBe("loaded");
  });
});

describe("mod ayrımı", () => {
  const win = (puzzle: Puzzle) => {
    const store = createGameStore({ puzzle, storage: pictureStorage(puzzle.id, puzzle.revision) });
    store.hydrate();
    for (const group of puzzle.groups) {
      group.words.forEach((word) => store.toggleWord(word.id));
      store.submitSelection();
    }
  };

  it("resimli kazanım günlük kaydı ve istatistiği değiştirmez; istatistik sayfası modu ayırır", async () => {
    window.localStorage.setItem(snapshotStorageKey("2026-09-20"), "gunluk-kaydi");
    const statsBefore = loadPersonalStats().stats;
    win((await loadPicturePuzzle(1))!);

    expect(window.localStorage.getItem(snapshotStorageKey("2026-09-20"))).toBe("gunluk-kaydi");
    expect(loadPersonalStats().stats).toEqual(statsBefore);
    expect(readPictureProgress().map((board) => board.status)).toEqual(["won", "new", "new"]);
    expect(Object.keys(window.localStorage).filter((key) => key.includes("picture-001"))
      .every((key) => key.startsWith("quadro:modes:v1:picture:picture-001:r1:"))).toBe(true);

    render(<StatsExperience />);
    const panel = await screen.findByRole("region", { name: "Resimli Quadro" });
    expect(panel.textContent).toContain("1/3");
    expect(panel.textContent).toContain("yalnız günlük oyuna aittir");
  });

  it("tahtalar birbirinin kaydına ve başka revizyona karışmaz", async () => {
    const puzzle = (await loadPicturePuzzle(1))!;
    win(puzzle);
    expect(readPictureProgress()[1]?.status).toBe("new");
    expect(pictureStorage(puzzle.id, 2).getItem(snapshotStorageKey(puzzle.date))).toBeNull();
  });

  it("lobi üç tahtayı ve durumlarını listeler", async () => {
    win((await loadPicturePuzzle(3))!);
    render(<PictureLobby />);
    await act(async () => undefined);
    const links = screen.getAllByRole("link").filter((link) => link.getAttribute("href")?.startsWith("/pictures/board"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/pictures/board?board=1",
      "/pictures/board?board=2",
      "/pictures/board?board=3",
    ]);
    expect(links[0]?.textContent).toContain("Yeni");
    expect(links[2]?.textContent).toContain("Tamamlandı");
  });

  it("paylaşım metni başka modda değişmez", async () => {
    const puzzle = (await loadPicturePuzzle(1))!;
    const store = createGameStore({ puzzle, storage: pictureStorage(puzzle.id, puzzle.revision) });
    store.hydrate();
    expect(buildShareText(puzzle, store.getState().snapshot).split("\n")[0]).toMatch(/^Resimli Quadro · Tahta 1 0\/4 · /);
    expect(buildShareText({ ...puzzle, id: "q-001" }, { ...store.getState().snapshot, puzzleId: "q-001" }).split("\n")[0])
      .toMatch(new RegExp(`^Quadro ${puzzle.date} 0/4 · `));
  });
});
