import { describe, expect, it } from "vitest";

import {
  baseScore,
  beginRun,
  canStart,
  ENERGY_MAX,
  energyReward,
  finishRun,
  formatCountdown,
  initialSpecialState,
  migrateLegacyState,
  msUntilNextEnergy,
  msUntilStart,
  parseSpecialState,
  REFILL_MS,
  replenish,
  type SpecialState,
} from "./specialEnergy";

const day = "2026-11-06";
const MIN = REFILL_MS;
const withEnergy = (energy: number, updatedAt = 0): SpecialState => ({ ...initialSpecialState(0), energy, updatedAt });

describe("enerji: kapasite, harcama ve giriş eşiği", () => {
  it("30 ile başlar, yeni oyun 10 düşer", () => {
    const state = initialSpecialState(0);
    expect(state.energy).toBe(30);
    expect(beginRun(state, "bomb", 0, day)!.energy).toBe(20);
  });

  it("20 enerjide başlanır ve 10 kalır; 19'da başlanmaz", () => {
    expect(beginRun(withEnergy(20), "risk", 0, day)!.energy).toBe(10);
    expect(beginRun(withEnergy(19), "risk", 0, day)).toBeNull();
    expect(canStart(withEnergy(17))).toBe(false);
    expect(canStart(withEnergy(20))).toBe(true);
  });

  it("devam eden oyun varken ikinci kez başlatılmaz ve ücretlendirilmez", () => {
    const one = beginRun(initialSpecialState(0), "bomb", 0, day)!;
    expect(beginRun(one, "risk", 1, day)).toBeNull();
    expect(parseSpecialState(JSON.stringify(one), 1).active).toEqual(one.active);
  });
});

describe("enerji: dakikada +1", () => {
  it("17 → 18 → 19 → 20; 20'de başlanıp 10 kalır", () => {
    const state = withEnergy(17, 0);
    expect(replenish(state, MIN - 1).energy).toBe(17);
    expect(replenish(state, MIN).energy).toBe(18);
    expect(replenish(state, 2 * MIN).energy).toBe(19);
    expect(replenish(state, 3 * MIN).energy).toBe(20);
    expect(beginRun(state, "ladder", 3 * MIN - 1, day)).toBeNull();
    expect(beginRun(state, "ladder", 3 * MIN, day)!.energy).toBe(10);
  });

  it("10 dakikada toplam +10, tek seferde değil", () => {
    const state = withEnergy(0, 0);
    expect([1, 5, 10].map((m) => replenish(state, m * MIN).energy)).toEqual([1, 5, 10]);
  });

  it("30'u aşmaz ve doluyken süre biriktirmez", () => {
    expect(replenish(withEnergy(25, 0), 60 * MIN).energy).toBe(30);
    const full = replenish(withEnergy(30, 0), 60 * MIN);
    const spent = beginRun(full, "risk", 60 * MIN, day)!;
    expect(spent.energy).toBe(20);
    expect(replenish(spent, 60 * MIN + MIN - 1).energy).toBe(20);
    expect(replenish(spent, 61 * MIN).energy).toBe(21);
  });

  it("uygulama kapalıyken geçen süre dönüşte eklenir", () => {
    const saved = JSON.stringify(withEnergy(12, 0));
    expect(parseSpecialState(saved, 7 * MIN + 30_000).energy).toBe(19);
  });

  it("saat geri alınınca enerji artmaz ve sayaç başlangıcı ileri kaymaz", () => {
    const state = withEnergy(12, 10 * MIN);
    const back = replenish(state, 5 * MIN);
    expect(back).toBe(state);
    expect(replenish(back, 11 * MIN).energy).toBe(13);
  });

  it("sayaçlar: yeni oyuna kalan süre ve sonraki +1", () => {
    const state = withEnergy(17, 0);
    expect(msUntilStart(state, 30_000)).toBe(3 * MIN - 30_000);
    expect(formatCountdown(msUntilStart(state, 30_000))).toBe("2:30");
    expect(msUntilNextEnergy(state, 30_000)).toBe(30_000);
    expect(msUntilStart(withEnergy(20), 0)).toBe(0);
    expect(msUntilNextEnergy(withEnergy(30), 0)).toBeNull();
  });
});

describe("skor ve enerji ödülü", () => {
  it.each([
    [0, 400, 4],
    [1, 300, 2],
    [2, 200, 2],
    [3, 100, 0],
  ])("kazanılan oyunda %i hata → %i skor, +%i enerji", (mistakes, score, energy) => {
    expect(baseScore({ won: true, mistakes })).toBe(score);
    expect(energyReward(score)).toBe(energy);
  });

  it("dört hatada kaybedilen veya yarım kalan oyun 0 skor, 0 enerji", () => {
    expect(baseScore({ won: false, mistakes: 4 })).toBe(0);
    expect(baseScore({ won: false, mistakes: 1 })).toBe(0);
    expect(energyReward(0)).toBe(0);
  });

  it("ödül bir kez verilir ve 30'u aşmaz", () => {
    const started = beginRun(withEnergy(28, 0), "bomb", 0, day)!;
    expect(started.energy).toBe(18);
    const id = started.active!.id;
    const done = finishRun(started, id, { won: true, mistakes: 0 }, 0);
    expect(done).toMatchObject({ energy: 22, active: null, lastAward: { runId: id, score: 400, energy: 4 } });
    expect(finishRun(done, id, { won: true, mistakes: 0 }, 0)).toEqual(done);

    const nearFull: SpecialState = { ...withEnergy(28, 0), active: { id: 9, mode: "risk", slot: 0, day }, sequence: 9 };
    const capped = finishRun(nearFull, 9, { won: true, mistakes: 0 }, 0);
    expect(capped.energy).toBe(ENERGY_MAX);
    expect(capped.lastAward?.energy).toBe(2);
  });

  it("başka oyunun kimliğiyle bitirme ödül vermez", () => {
    const started = beginRun(initialSpecialState(0), "risk", 0, day)!;
    expect(finishRun(started, started.active!.id + 1, { won: true, mistakes: 0 }, 0)).toEqual(started);
  });
});

describe("kayıt ve göç", () => {
  it("17, 18, 19 gibi enerji değerleri kayıttan sıfırlanmadan okunur", () => {
    for (const energy of [17, 18, 19]) expect(parseSpecialState(JSON.stringify(withEnergy(energy, 0)), 0).energy).toBe(energy);
  });

  it("bozuk veya sınır dışı kayıt başlangıca döner", () => {
    expect(parseSpecialState("{bozuk", 0).energy).toBe(30);
    expect(parseSpecialState(JSON.stringify(withEnergy(31)), 0).energy).toBe(30);
    expect(parseSpecialState(JSON.stringify({ ...withEnergy(12), version: 1 }), 0).energy).toBe(30);
  });

  it("eski v1 kaydı: enerji ve yarım oyun korunur, eski hedef sonuçları düşer", () => {
    const legacy = { energy: 10, updatedAt: 0, sequence: 4, active: { id: 4, mode: "risk", slot: 3, day }, results: [500, 600], lastAward: null };
    const migrated = migrateLegacyState(JSON.stringify(legacy), 0)!;
    expect(migrated).toEqual({ version: 2, energy: 10, updatedAt: 0, sequence: 4, active: legacy.active, lastAward: null });
    expect(migrateLegacyState(JSON.stringify({ ...legacy, energy: 99 }), 0)).toBeNull();
    expect(migrateLegacyState(null, 0)).toBeNull();
  });
});
