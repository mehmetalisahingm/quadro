import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SpecialModeGate } from "@/components/game/SpecialModeGate";
import { standardPuzzle } from "@/features/game/fixtures";
import { LEGACY_STORAGE_KEY, readSpecialState, REFILL_MS, STORAGE_KEY } from "@/features/game/specialEnergy";

const day = "2026-11-06";
const NOW = Date.UTC(2026, 10, 6, 12);
let fetches = 0;

beforeEach(() => {
  localStorage.clear();
  fetches = 0;
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.stubGlobal("fetch", vi.fn(async () => {
    fetches += 1;
    return new Response(JSON.stringify({ ...standardPuzzle, id: `special-${fetches}`, date: day }), { status: 200 });
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const energy = () => readSpecialState(Date.now()).energy;
const save = (value: object) => localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, sequence: 0, active: null, lastAward: null, ...value }));

function playLadderToWin() {
  for (const group of standardPuzzle.groups) {
    for (const word of group.words) fireEvent.click(screen.getByRole("button", { name: word.text }));
    fireEvent.click(screen.getByRole("button", { name: "Grupla" }));
  }
}

describe("özel mod enerji kapısı", () => {
  it("30 enerjiyle başlar; çift tıklama yalnız bir kez 10 enerji harcar", async () => {
    render(<SpecialModeGate mode="ladder" day={day} />);
    const start = await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" });
    expect(screen.getByText("30 / 30 enerji", { exact: false })).toBeTruthy();
    fireEvent.click(start);
    fireEvent.click(start);
    await screen.findByRole("button", { name: "Kasaya al" });
    expect(energy()).toBe(20);
    expect(readSpecialState(Date.now()).sequence).toBe(1);
  });

  it("yenileme yarım oyunu geri getirir, ikinci kez enerji harcamaz", async () => {
    const view = render(<SpecialModeGate mode="ladder" day={day} />);
    fireEvent.click(await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" }));
    await screen.findByRole("button", { name: "Kasaya al" });
    view.unmount();
    render(<SpecialModeGate mode="ladder" day={day} />);
    await screen.findByRole("button", { name: "Kasaya al" });
    expect(energy()).toBe(20);
    expect(screen.queryByRole("button", { name: /Oyuna başla/ })).toBeNull();
  });

  it("17 enerjide başlatılamaz; kalan süre ve sonraki +1 görünür", async () => {
    save({ energy: 17, updatedAt: NOW });
    render(<SpecialModeGate mode="risk" day={day} />);
    const start = await screen.findByRole("button", { name: "Yeni oyun için 20 enerji gerekir · 3:00" });
    expect(start.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Sonraki +1 enerji: 1:00")).toBeTruthy();
    expect(screen.getByText("Yeni oyuna kalan süre: 3:00")).toBeTruthy();
  });

  it("20 enerjide başlar ve 10 kalır", async () => {
    save({ energy: 17, updatedAt: NOW - 3 * REFILL_MS });
    render(<SpecialModeGate mode="ladder" day={day} />);
    fireEvent.click(await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" }));
    await screen.findByRole("button", { name: "Kasaya al" });
    expect(energy()).toBe(10);
  });

  it("kazanılan oyun 400 skor, +4 enerji; yenileme ödülü tekrarlamaz", async () => {
    const view = render(<SpecialModeGate mode="ladder" day={day} />);
    fireEvent.click(await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" }));
    await screen.findByRole("button", { name: "Kasaya al" });
    playLadderToWin();
    await screen.findByText("400 skor");
    expect(screen.getByText("+4 enerji")).toBeTruthy();
    expect(screen.getByText(/mod bonusu \d+ \(enerji vermez\)/)).toBeTruthy();
    expect(energy()).toBe(24);
    view.unmount();
    render(<SpecialModeGate mode="ladder" day={day} />);
    await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" });
    expect(energy()).toBe(24);
  });

  it("iki sekme aynı anda başlatınca yalnız bir oyun ücretlendirilir", async () => {
    render(<><SpecialModeGate mode="ladder" day={day} /><SpecialModeGate mode="bomb" day={day} /></>);
    const [first, second] = await screen.findAllByRole("button", { name: "Oyuna başla · 10 enerji" });
    await act(async () => { fireEvent.click(first!); fireEvent.click(second!); });
    await waitFor(() => expect(readSpecialState(Date.now()).active).not.toBeNull());
    expect(energy()).toBe(20);
    expect(readSpecialState(Date.now()).sequence).toBe(1);
  });

  it("eski 17 enerjili kayıt sıfırlanmadan taşınır", async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ energy: 17, updatedAt: NOW, sequence: 2, active: null, results: [300], lastAward: null }));
    render(<SpecialModeGate mode="risk" day={day} />);
    await screen.findByText("17 / 30 enerji", { exact: false });
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(readSpecialState(Date.now()).sequence).toBe(2);
  });
});

describe("özel mod tahta seçimi (#171)", () => {
  it("parkurda oynanmış tahtayı atlar", async () => {
    // Slot 0 Orta parkurun 1. bölümü; oyuncu onu parkurda oynamış.
    localStorage.setItem("quadro:tracks:v1:track-medium-001:quadro:save:v1:2026-10-05", "{}");
    render(<SpecialModeGate mode="ladder" day={day} />);
    fireEvent.click(await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" }));
    await screen.findByRole("button", { name: "Kasaya al" });
    expect(readSpecialState(Date.now()).active?.slot).toBe(1);
    expect(vi.mocked(fetch).mock.calls.at(-1)?.[0]).toContain("slot=1");
  });

  it("hiç görülmemişse sıradaki slotu kullanır", async () => {
    render(<SpecialModeGate mode="ladder" day={day} />);
    fireEvent.click(await screen.findByRole("button", { name: "Oyuna başla · 10 enerji" }));
    await screen.findByRole("button", { name: "Kasaya al" });
    expect(readSpecialState(Date.now()).active?.slot).toBe(0);
  });
});
