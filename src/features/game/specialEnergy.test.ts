import { describe, expect, it } from "vitest";
import { beginRun, finishRun, initialSpecialState, parseSpecialState, REFILL_MS, replenish } from "./specialEnergy";

const day = "2026-11-06";
describe("özel mod canları", () => {
  it("her yeni oyunda 10 can harcar, devam eden oyunu ikinci kez ücretlendirmez", () => {
    const one = beginRun(initialSpecialState(0), "bomb", 0, day)!;
    expect(one.energy).toBe(20);
    expect(beginRun(one, "risk", 1, day)).toBeNull();
    expect(parseSpecialState(JSON.stringify(one), 1).active).toEqual(one.active);
  });
  it("10 dakikada bir 10 can yeniler ve 30 üstüne çıkmaz", () => {
    const empty = { ...initialSpecialState(0), energy: 0 };
    expect(replenish(empty, REFILL_MS - 1).energy).toBe(0);
    expect(replenish(empty, REFILL_MS).energy).toBe(10);
    expect(replenish(empty, REFILL_MS * 2).energy).toBe(20);
    expect(replenish(empty, REFILL_MS * 3).energy).toBe(30);
    expect(replenish(empty, REFILL_MS * 9).energy).toBe(30);
  });
  it("üç sonuç 1500 ise canı doldurur, ödül tekrarlanmaz ve yeni seri başlar", () => {
    let state = initialSpecialState(0);
    for (let i = 0; i < 3; i++) {
      state = beginRun(state, "bomb", i, day)!;
      const id = state.active!.id;
      state = finishRun(state, id, 500, i);
      expect(finishRun(state, id, 500, i)).toEqual(state);
    }
    expect(state).toMatchObject({ energy: 30, results: [], lastAward: 1500, active: null });
  });
  it("üç sonuç hedefe ulaşmazsa can doldurmaz ve seri sıfırlanır", () => {
    let state = initialSpecialState(0);
    for (let i = 0; i < 3; i++) {
      state = beginRun(state, "ladder", i, day)!;
      state = finishRun(state, state.active!.id, 400, i);
    }
    expect(state).toMatchObject({ energy: 0, results: [], lastAward: 1200 });
  });
});
