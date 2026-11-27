import { applyMove, createGame, legalPlacements, serializeState, type Dictionary, type GameState } from "@quadro/words-engine";
import { describe, expect, it } from "vitest";

import { memoryStore, type KeyValueStore } from "./keyValue";
import { createPersistence, DEFAULT_SETTINGS, EMPTY_META, EMPTY_RECORDS, KEYS, shareText } from "./persistence";

const none: Dictionary = { has: () => false };

/** Birkaç yasal hamle oynanmış bir oyun. */
function playedGame(seed: number, moves: number): GameState {
  let state = createGame({ seed });
  for (let i = 0; i < moves; i++) {
    const slot = state.tray.findIndex((_, s) => legalPlacements(state, s).length > 0);
    const spot = legalPlacements(state, slot)[0]!;
    const outcome = applyMove(state, { slot, ...spot }, none);
    if (!outcome.ok) throw new Error(outcome.reason);
    state = outcome.state;
  }
  return state;
}

describe("oyun kaydı", () => {
  it("kaydedilen oyun aynen geri yüklenir (yeniden açılış)", () => {
    const store = memoryStore();
    const persistence = createPersistence(store);
    const state = playedGame(11, 5);
    persistence.saveGame(state, { longestWord: 5, assisted: false });

    const reopened = createPersistence(store).loadGame();
    expect(reopened.source).toBe("main");
    expect(reopened.state && serializeState(reopened.state)).toBe(serializeState(state));
    expect(reopened.state ? reopened.meta : null).toEqual({ longestWord: 5, assisted: false });
  });

  it("kayıt yoksa yeni oyun", () => {
    expect(createPersistence(memoryStore()).loadGame()).toEqual({ state: null, source: "none" });
  });

  it("ana kayıt bozulursa bir önceki hamlenin yedeğinden devam edilir", () => {
    const store = memoryStore();
    const persistence = createPersistence(store);
    const first = playedGame(12, 3);
    const second = playedGame(12, 4);
    persistence.saveGame(first, EMPTY_META);
    persistence.saveGame(second, EMPTY_META);
    store.set(KEYS.game, '{"version":"0.1.0","board":');

    const loaded = createPersistence(store).loadGame();
    expect(loaded.source).toBe("backup");
    expect(loaded.state && serializeState(loaded.state)).toBe(serializeState(first));
  });

  it("ana kayıt ve yedek bozuksa 'corrupt' döner; uygulama yeni oyun başlatır", () => {
    const store = memoryStore({ [KEYS.game]: "çöp", [KEYS.gameBackup]: "{}" });
    expect(createPersistence(store).loadGame()).toEqual({ state: null, source: "corrupt" });
  });

  it("motor sürümü değişmiş kayıt devam ettirilmez", () => {
    const store = memoryStore();
    const old = JSON.parse(serializeState(playedGame(13, 2))) as Record<string, unknown>;
    old.version = "0.0.9";
    store.set(KEYS.game, JSON.stringify(old));
    expect(createPersistence(store).loadGame().state).toBeNull();
  });

  it("bitmiş oyun devam ettirilmez", () => {
    const store = memoryStore();
    const over = { ...playedGame(14, 1), over: true };
    store.set(KEYS.game, serializeState(over));
    expect(createPersistence(store).loadGame()).toEqual({ state: null, source: "none" });
  });

  it("süreç yazma sırasında öldürülse de (ana kayıt yazılamadı) geçerli bir kayıt kalır", () => {
    const backing = memoryStore();
    let failNextGameWrite = false;
    const flaky: KeyValueStore = {
      get: backing.get,
      remove: backing.remove,
      set: (key, value) => {
        if (key === KEYS.game && failNextGameWrite) throw new Error("süreç öldürüldü");
        backing.set(key, value);
      },
    };
    const persistence = createPersistence(flaky);
    const first = playedGame(15, 3);
    persistence.saveGame(first, EMPTY_META);
    failNextGameWrite = true;
    expect(persistence.saveGame(playedGame(15, 4), EMPTY_META)).toBe(false);

    const loaded = createPersistence(backing).loadGame();
    expect(loaded.state && serializeState(loaded.state)).toBe(serializeState(first));
  });

  it("depo hiç çalışmasa da (okuma/yazma hata verir) çökmez", () => {
    const broken: KeyValueStore = { get: () => { throw new Error("x"); }, set: () => { throw new Error("x"); }, remove: () => { throw new Error("x"); } };
    const persistence = createPersistence(broken);
    expect(persistence.loadGame()).toEqual({ state: null, source: "none" });
    expect(persistence.saveGame(playedGame(16, 1), EMPTY_META)).toBe(false);
    expect(persistence.loadRecords()).toEqual(EMPTY_RECORDS);
    expect(() => persistence.clearAll()).not.toThrow();
  });
});

describe("rekorlar ve ayarlar", () => {
  it("desteksiz ve destekli rekor ayrı tutulur; rekor yalnız yükselir", () => {
    const persistence = createPersistence(memoryStore());
    let records = persistence.loadRecords();
    records = persistence.recordGameEnd(records, 1200, false);
    records = persistence.recordGameEnd(records, 800, false);
    records = persistence.recordGameEnd(records, 5000, true);
    expect(records).toMatchObject({ best: 1200, bestAssisted: 5000, games: 3 });
    expect(persistence.loadRecords()).toEqual(records);
  });

  it("kelime sayısı ve en uzun kelime uzunluğu birikir", () => {
    const persistence = createPersistence(memoryStore());
    let records = persistence.recordWords(EMPTY_RECORDS, [4, 6]);
    records = persistence.recordWords(records, [5]);
    expect(records).toMatchObject({ words: 3, longestWord: 6 });
  });

  it("bozuk ya da kurcalanmış rekor ve ayar kaydı varsayılana döner", () => {
    const store = memoryStore({
      [KEYS.records]: JSON.stringify({ version: 1, best: -5, bestAssisted: 0, games: 0, words: 0, longestWord: 0 }),
      [KEYS.settings]: "{bozuk",
    });
    const persistence = createPersistence(store);
    expect(persistence.loadRecords()).toEqual(EMPTY_RECORDS);
    expect(persistence.loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("ayarlar kalıcıdır", () => {
    const store = memoryStore();
    createPersistence(store).saveSettings({ version: 1, haptics: false, tutorialSeen: true });
    expect(createPersistence(store).loadSettings()).toEqual({ version: 1, haptics: false, tutorialSeen: true });
  });

  it("verileri sil: oyun, yedek, rekor ve ayarlar cihazdan kalkar", () => {
    const store = memoryStore();
    const persistence = createPersistence(store);
    persistence.saveGame(playedGame(17, 2), EMPTY_META);
    persistence.saveGame(playedGame(17, 3), EMPTY_META);
    persistence.recordGameEnd(EMPTY_RECORDS, 100, false);
    persistence.saveSettings({ version: 1, haptics: false, tutorialSeen: true });
    persistence.clearAll();
    expect(store.dump()).toEqual({});
  });
});

describe("paylaşım", () => {
  it("spoilersız: yalnız sayılar, kelime yok", () => {
    expect(shareText(1840, 23, 7)).toBe("Quadro Words · 1840 puan · 23 kelime · en uzun kelime 7 harf\nplayquadro.com.tr");
    expect(shareText(0, 0, 0)).toBe("Quadro Words · 0 puan · 0 kelime\nplayquadro.com.tr");
  });
});
