import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JourneyStage } from "@/components/journey/JourneyStage";
import { PictureStage } from "@/components/pictures/PictureStage";
import { SpecialModeGate } from "@/components/game/SpecialModeGate";
import { standardPuzzle } from "@/features/game/fixtures";
import { journeyDay, journeyId } from "@/features/game/journey";
import { modeStorageKey } from "@/features/game/modes";
import { readSpecialState, STORAGE_KEY } from "@/features/game/specialEnergy";
import { loadJourneyPuzzle } from "@/lib/daily/journeyPuzzle";
import { loadPicturePuzzle } from "@/lib/daily/picturePuzzle";
import { trackStorageKey } from "@/lib/persistence/trackStorage";
import { snapshotStorageKey } from "@/lib/persistence/snapshotStore";

import { enterGame, createUser, registerFlowHooks } from "./helpers";

registerFlowHooks();

/** Bozuk kayıt ve gün değişimi her modda oyunu çökertmemeli, kullanıcıyı ücretlendirmemeli (#171). */
describe("modların bozuk kayıt ve gün değişimi dayanıklılığı", () => {
  it("Resimli Quadro: bozuk kayıt taze tahta açar", async () => {
    const puzzle = (await loadPicturePuzzle(1))!;
    window.localStorage.setItem(modeStorageKey("picture", puzzle.id, puzzle.revision, snapshotStorageKey(puzzle.date)), "{yarım");
    render(<PictureStage board={1} puzzle={puzzle} />);
    await act(async () => undefined);
    const board = screen.getByLabelText(/^16 çözülmemiş görselli oyun tahtası$/);
    expect(within(board).getAllByRole("button")).toHaveLength(16);
    expect(screen.getByText("4 hata hakkı kaldı")).toBeTruthy();
  });

  it("Keşif Yolu: bozuk kayıt adımı taze açar, ilerleme kilidi bozulmaz", async () => {
    const puzzle = (await loadJourneyPuzzle(1))!;
    window.localStorage.setItem(trackStorageKey(journeyId(1), snapshotStorageKey(journeyDay(1))), "{yarım");
    render(<JourneyStage step={1} puzzle={puzzle} />);
    await enterGame(createUser());
    expect(screen.getByText("4 hata hakkı kaldı")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Sonraki adımı keşfet →" })).toBeNull();
  });

  it("özel mod: dünden kalan yarım oyun bugün de açılır, yeniden enerji harcanmaz", async () => {
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () => new Response(JSON.stringify({ ...standardPuzzle, id: "special-1-x", date: "2026-09-19" })));
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2, energy: 20, updatedAt: Date.now(), sequence: 1,
      active: { id: 1, mode: "ladder", slot: 0, day: "2026-09-19" }, lastAward: null,
    }));
    render(<SpecialModeGate mode="ladder" day="2026-09-20" />);
    await act(async () => { vi.advanceTimersByTime(10); });
    await act(async () => { vi.advanceTimersByTime(10); });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("day=2026-09-19");
    expect(readSpecialState(Date.now()).energy).toBe(20);
    expect(screen.queryByRole("button", { name: /Oyuna başla/ })).toBeNull();
  });

  it("özel mod: bozuk oyun kaydı taze tahta açar, enerji değişmez", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ...standardPuzzle, id: "special-1-x", date: "2026-09-20" }))));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2, energy: 20, updatedAt: Date.now(), sequence: 1,
      active: { id: 1, mode: "ladder", slot: 0, day: "2026-09-20" }, lastAward: null,
    }));
    window.localStorage.setItem(`quadro:ladder:v1:2026-09-20:special-1-x:${standardPuzzle.revision}`, "{yarım");
    render(<SpecialModeGate mode="ladder" day="2026-09-20" />);
    for (let i = 0; i < 5; i++) await act(async () => { vi.advanceTimersByTime(10); });
    expect(screen.getByRole("button", { name: "Kasaya al" })).toBeTruthy();
    expect(screen.getByText("4 / 4")).toBeTruthy();
    expect(readSpecialState(Date.now()).energy).toBe(20);
  });
});
