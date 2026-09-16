import { describe, expect, it, vi } from "vitest";

import { GAME_CONSTANTS, type Four, type WordId } from "@/features/game/contracts";
import { standardPuzzle } from "@/features/game/fixtures/puzzles";
import {
  createSampleController,
  createSeededRandom,
  type SampleGameController,
} from "@/features/game/sampleController";

// Standart bulmacanın grupları: renkler, meyveler, gezegenler, sehirler.
const renkler: Four<WordId> = ["kirmizi", "mavi", "yesil", "sari"];
const meyveler: Four<WordId> = ["elma", "armut", "kiraz", "incir"];
const gezegenler: Four<WordId> = ["mars", "venus", "saturn", "merkur"];
const sehirler: Four<WordId> = ["adana", "bursa", "izmir", "mugla"];

const allWordIds = standardPuzzle.groups.flatMap((group) => group.words.map((word) => word.id));

function newController(): SampleGameController {
  return createSampleController({ puzzle: standardPuzzle, random: createSeededRandom(7) });
}

/** Seçimi temizleyip verilen kelimeleri seçer ve gönderir. */
function submit(controller: SampleGameController, wordIds: readonly WordId[]) {
  controller.clearSelection();
  for (const wordId of wordIds) controller.toggleWord(wordId);
  return controller.submitSelection();
}

describe("örnek adaptör: başlangıç ve seçim", () => {
  it("boş oyunla başlar: 16 kart, 4 hak, seçim ve geçmiş boş", () => {
    const { snapshot } = newController();
    expect(snapshot.status).toBe("playing");
    expect(snapshot.puzzleId).toBe(standardPuzzle.id);
    expect(snapshot.dayKey).toBe(standardPuzzle.date);
    expect([...snapshot.remainingWordOrder].sort()).toEqual([...allWordIds].sort());
    expect(snapshot.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes);
    expect(snapshot.selectedWordIds).toEqual([]);
    expect(snapshot.attempts).toEqual([]);
    expect(snapshot.solvedGroupIds).toEqual([]);
  });

  it("aynı tohum aynı başlangıç sırasını verir", () => {
    expect(newController().snapshot.remainingWordOrder).toEqual(
      newController().snapshot.remainingWordOrder,
    );
  });

  it("seçili karta tekrar basmak seçimi kaldırır; beşinci kart ve bilinmeyen kimlik etkisizdir", () => {
    const controller = newController();
    controller.toggleWord("mars");
    controller.toggleWord("elma");
    controller.toggleWord("mars");
    expect(controller.snapshot.selectedWordIds).toEqual(["elma"]);

    for (const wordId of ["kiraz", "adana", "mavi"]) controller.toggleWord(wordId);
    const full = controller.snapshot;
    controller.toggleWord("bursa");
    controller.toggleWord("yok-boyle-kelime");
    expect(controller.snapshot).toBe(full);
    expect(controller.snapshot.selectedWordIds).toHaveLength(GAME_CONSTANTS.groupSize);
  });

  it("çözülmüş gruptaki kelime seçilemez", () => {
    const controller = newController();
    submit(controller, meyveler);
    controller.toggleWord("elma");
    expect(controller.snapshot.selectedWordIds).toEqual([]);
  });
});

describe("örnek adaptör: gönderim sonuçları", () => {
  it("doğru grupta solvedGroupIds artar, seçim temizlenir, hak değişmez", () => {
    const controller = newController();
    const { outcome, snapshot } = submit(controller, ["kiraz", "elma", "incir", "armut"]);

    expect(outcome).toEqual({ verdict: "correct", solvedGroup: standardPuzzle.groups[1] });
    expect(snapshot).toBe(controller.snapshot);
    expect(snapshot.status).toBe("playing");
    expect(snapshot.solvedGroupIds).toEqual(["meyveler"]);
    expect(snapshot.selectedWordIds).toEqual([]);
    expect(snapshot.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes);
    expect(snapshot.remainingWordOrder).toHaveLength(12);
    expect(snapshot.remainingWordOrder.some((id) => meyveler.includes(id))).toBe(false);
    expect(snapshot.attempts.at(-1)?.verdict).toBe("correct");
  });

  it("dördüncü doğru grup solvedGroup ile birlikte status='won' üretir", () => {
    const controller = newController();
    submit(controller, renkler);
    submit(controller, meyveler);
    submit(controller, gezegenler);
    const { outcome, snapshot } = submit(controller, sehirler);

    expect(outcome.verdict).toBe("correct");
    expect(outcome.verdict === "correct" && outcome.solvedGroup.id).toBe("sehirler");
    expect(snapshot.status).toBe("won");
    expect(snapshot.solvedGroupIds).toEqual(["renkler", "meyveler", "gezegenler", "sehirler"]);
    expect(snapshot.remainingWordOrder).toEqual([]);
    expect(snapshot.selectedWordIds).toEqual([]);
  });

  it("yanlışta bir hak azalır, seçim korunur ve geçmişe yazılır", () => {
    const controller = newController();
    const selection: Four<WordId> = ["mars", "kirmizi", "adana", "mavi"];
    const { outcome, snapshot } = submit(controller, selection);

    expect(outcome).toEqual({ verdict: "wrong" });
    expect(snapshot.mistakesRemaining).toBe(3);
    expect(snapshot.selectedWordIds).toEqual(selection);
    expect(snapshot.attempts).toEqual([{ id: "a1", wordIds: selection, verdict: "wrong" }]);
  });

  it("dördüncü yanlış status='lost' yapar; seçim boşalır, çözülen gruplar değişmez", () => {
    const controller = newController();
    submit(controller, meyveler);
    submit(controller, ["mars", "kirmizi", "adana", "mavi"]);
    submit(controller, ["bursa", "kirmizi", "venus", "izmir"]);
    submit(controller, ["mars", "yesil", "izmir", "sari"]);
    const { outcome, snapshot } = submit(controller, ["venus", "mavi", "adana", "merkur"]);

    expect(outcome).toEqual({ verdict: "wrong" });
    expect(snapshot.status).toBe("lost");
    expect(snapshot.mistakesRemaining).toBe(0);
    expect(snapshot.selectedWordIds).toEqual([]);
    expect(snapshot.solvedGroupIds).toEqual(["meyveler"]);
    expect(snapshot.remainingWordOrder).toHaveLength(12);
  });

  it("one-away yalnız tam üç kelime aynı gruptayken tetiklenir; 2+2 yanlıştır", () => {
    const controller = newController();
    expect(submit(controller, ["mars", "venus", "saturn", "adana"]).outcome).toEqual({
      verdict: "one-away",
    });
    expect(controller.snapshot.selectedWordIds).toEqual(["mars", "venus", "saturn", "adana"]);
    expect(controller.snapshot.mistakesRemaining).toBe(3);

    expect(submit(controller, ["mars", "venus", "adana", "bursa"]).outcome).toEqual({
      verdict: "wrong",
    });
  });

  it("hakkı bitiren one-away sonucunu korur ve status='lost' olur", () => {
    const controller = newController();
    submit(controller, ["mars", "kirmizi", "adana", "mavi"]);
    submit(controller, ["bursa", "kirmizi", "venus", "izmir"]);
    submit(controller, ["mars", "yesil", "izmir", "sari"]);
    const { outcome, snapshot } = submit(controller, ["elma", "armut", "kiraz", "mugla"]);

    expect(outcome).toEqual({ verdict: "one-away" });
    expect(snapshot.status).toBe("lost");
    expect(snapshot.attempts.at(-1)?.verdict).toBe("one-away");
  });

  it("aynı dörtlü farklı sırayla gönderilince repeated döner; hak, geçmiş ve durum değişmez", () => {
    const controller = newController();
    submit(controller, ["mars", "venus", "saturn", "adana"]);
    const before = controller.snapshot;

    const { outcome, snapshot } = submit(controller, ["adana", "saturn", "venus", "mars"]);
    expect(outcome).toEqual({ verdict: "repeated" });
    expect(snapshot.mistakesRemaining).toBe(3);
    expect(snapshot.attempts).toBe(before.attempts);
  });

  it("eksik seçim selection-count, çözülmüş veya tekrar eden kimlik invalid-words döner", () => {
    const controller = newController();
    controller.toggleWord("mars");
    const partial = controller.snapshot;
    expect(controller.submitSelection()).toEqual({
      outcome: { verdict: "invalid", reason: "selection-count" },
      snapshot: partial,
    });

    submit(controller, meyveler);
    const solved = createSampleController({
      puzzle: standardPuzzle,
      snapshot: { ...controller.snapshot, selectedWordIds: ["elma", "mars", "venus", "saturn"] },
    });
    expect(solved.submitSelection().outcome).toEqual({ verdict: "invalid", reason: "invalid-words" });

    const duplicated = createSampleController({
      puzzle: standardPuzzle,
      snapshot: { ...controller.snapshot, selectedWordIds: ["mars", "mars", "venus", "saturn"] },
    });
    expect(duplicated.submitSelection().outcome).toEqual({
      verdict: "invalid",
      reason: "invalid-words",
    });
    expect(duplicated.snapshot.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes);
  });

  it("doğru gönderimden hemen sonra ikinci çağrı hak düşürmez (çift gönderim)", () => {
    const controller = newController();
    submit(controller, meyveler);
    expect(controller.submitSelection().outcome).toEqual({
      verdict: "invalid",
      reason: "selection-count",
    });
    expect(controller.snapshot.mistakesRemaining).toBe(GAME_CONSTANTS.maxMistakes);
  });
});

describe("örnek adaptör: terminal oyun, karıştır ve seçimi temizle", () => {
  it("terminal oyunda submit invalid/game-ended döner; toggle, shuffle ve clear etkisizdir", () => {
    const controller = newController();
    for (const group of [renkler, meyveler, gezegenler, sehirler]) submit(controller, group);
    const final = controller.snapshot;
    const listener = vi.fn();
    controller.subscribe(listener);

    expect(controller.submitSelection()).toEqual({
      outcome: { verdict: "invalid", reason: "game-ended" },
      snapshot: final,
    });
    controller.toggleWord("mars");
    controller.shuffle();
    controller.clearSelection();
    expect(controller.snapshot).toBe(final);
    expect(listener).not.toHaveBeenCalled();
  });

  it("shuffle yalnız çözülmemiş kartları karıştırır; seçim, haklar ve geçmiş korunur", () => {
    const controller = newController();
    submit(controller, meyveler);
    submit(controller, ["mars", "kirmizi", "adana", "mavi"]);
    controller.clearSelection();
    controller.toggleWord("venus");
    controller.toggleWord("bursa");
    const before = controller.snapshot;

    controller.shuffle();
    const after = controller.snapshot;
    expect(after).not.toBe(before);
    expect([...after.remainingWordOrder].sort()).toEqual([...before.remainingWordOrder].sort());
    expect(after.remainingWordOrder).not.toEqual(before.remainingWordOrder);
    expect(after.selectedWordIds).toEqual(["venus", "bursa"]);
    expect(after.mistakesRemaining).toBe(before.mistakesRemaining);
    expect(after.attempts).toBe(before.attempts);
    expect(after.solvedGroupIds).toBe(before.solvedGroupIds);
  });

  it("clearSelection seçimi boşaltır; hak ve geçmiş değişmez, boş seçimde etkisizdir", () => {
    const controller = newController();
    submit(controller, ["mars", "kirmizi", "adana", "mavi"]);
    const before = controller.snapshot;

    controller.clearSelection();
    expect(controller.snapshot.selectedWordIds).toEqual([]);
    expect(controller.snapshot.mistakesRemaining).toBe(before.mistakesRemaining);
    expect(controller.snapshot.attempts).toBe(before.attempts);

    const empty = controller.snapshot;
    controller.clearSelection();
    expect(controller.snapshot).toBe(empty);
  });
});

describe("örnek adaptör: abonelik ve başlangıç durumu", () => {
  it("dinleyici yalnız durum değişince çağrılır ve abonelik bitirilebilir", () => {
    const controller = newController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    controller.toggleWord("mars");
    controller.toggleWord("yok-boyle-kelime");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.toggleWord("venus");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("başka bulmacaya ait başlangıç durumunu reddeder", () => {
    const { snapshot } = newController();
    expect(() =>
      createSampleController({
        puzzle: standardPuzzle,
        snapshot: { ...snapshot, puzzleId: "baska-bulmaca" },
      }),
    ).toThrow(/baska-bulmaca/);
  });
});
