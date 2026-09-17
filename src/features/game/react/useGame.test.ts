import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GameBoard } from "@/components/game/GameBoard";
import type { GameSnapshot, Puzzle } from "@/features/game/contracts";
import { longWordsPuzzle, standardPuzzle as puzzle } from "@/features/game/fixtures/puzzles";

import { createGameController } from "./gameController";
import { useGame, type UseGameOptions } from "./useGame";

/** Kancanın döndürdüğü değerleri düz metin olarak çizen deneme bileşeni. */
function Probe({ target, options }: { target: Puzzle; options?: UseGameOptions }) {
  const { puzzle: active, controller } = useGame(target, options);
  const { snapshot } = controller;
  return createElement(
    "output",
    null,
    [
      active.id,
      snapshot.status,
      `${snapshot.solvedGroupIds.length}/4`,
      `hak:${snapshot.mistakesRemaining}`,
      snapshot.remainingWordOrder.join(","),
    ].join("|"),
  );
}

function renderProbe(target: Puzzle, options?: UseGameOptions): string {
  return renderToStaticMarkup(createElement(Probe, { target, options }));
}

function renderBoard(target: Puzzle, initialSnapshot?: GameSnapshot): string {
  return renderToStaticMarkup(createElement(GameBoard, { puzzle: target, initialSnapshot }));
}

/** Çizilen kelime kartlarının metinleri, tahtadaki sırayla. */
function tileTexts(html: string): string[] {
  return [...html.matchAll(/<button[^>]*class="q-word-tile"[^>]*>([^<]*)<\/button>/g)].map(
    (match) => match[1] ?? "",
  );
}

/** Kimlikleri bulmacadaki kelime metinlerine çevirir. */
function textsOf(target: Puzzle, wordIds: readonly string[]): string[] {
  const textById = new Map(
    target.groups.flatMap((group) => group.words.map((word) => [word.id, word.text] as const)),
  );
  return wordIds.map((wordId) => textById.get(wordId) ?? wordId);
}

describe("useGame", () => {
  it("bulmacayı gerçek motorla açar: boş oyun ve motorun tohumlu başlangıç sırası", () => {
    const { snapshot } = createGameController({ puzzle });
    expect(renderProbe(puzzle)).toBe(
      `<output>ornek-001|playing|0/4|hak:4|${snapshot.remainingWordOrder.join(",")}</output>`,
    );
  });

  it("sunucu ve istemci çizimleri aynı başlangıç tahtasını üretir; tohum verilirse onu kullanır", () => {
    expect(renderProbe(puzzle)).toBe(renderProbe(puzzle));
    expect(renderProbe(longWordsPuzzle)).toBe(renderProbe(longWordsPuzzle));
    expect(renderProbe(puzzle, { seed: 42 })).toBe(renderProbe(puzzle, { seed: 42 }));
    expect(renderProbe(puzzle, { seed: 42 })).not.toBe(renderProbe(puzzle));
  });

  it("kayıttan gelen durumu olduğu gibi açar", () => {
    const played = createGameController({ puzzle });
    for (const wordId of ["kiraz", "elma", "incir", "armut"]) played.toggleWord(wordId);
    played.submitSelection();

    expect(renderProbe(puzzle, { initialSnapshot: played.snapshot })).toBe(
      `<output>ornek-001|playing|1/4|hak:4|${played.snapshot.remainingWordOrder.join(",")}</output>`,
    );
  });
});

describe("GameBoard ve gerçek motor", () => {
  it("kartları motorun ürettiği sırayla çizer; arayüz kendi sırasını üretmez", () => {
    const { snapshot } = createGameController({ puzzle });
    const html = renderBoard(puzzle);

    expect(tileTexts(html)).toEqual(textsOf(puzzle, snapshot.remainingWordOrder));
    expect(html).toContain("0/4 seçili");
    expect(html).toContain("4 hata hakkı kaldı");
    expect(html).toContain("Grupla");
    expect(html).not.toContain("q-result");
  });

  it("iş kuralı hesaplamaz: verilen snapshot'ı yeniden yorumlamadan gösterir", () => {
    const start = createGameController({ puzzle }).snapshot;
    const allGroupIds = puzzle.groups.map((group) => group.id);

    // Dört grup çözülmüş görünse de durum `playing` ise oyun sürer; kazanma sayımdan çıkarılmaz.
    const stillPlaying = renderBoard(puzzle, {
      ...start,
      solvedGroupIds: allGroupIds,
      remainingWordOrder: [],
    });
    expect(stillPlaying).toContain("Grupla");
    expect(stillPlaying).not.toContain("q-result");

    // Durum `won` ise sonuç açılır; bulunan grup ve hata sayısı snapshot'tan okunur.
    const won = renderBoard(puzzle, {
      ...start,
      status: "won",
      solvedGroupIds: ["meyveler"],
      mistakesRemaining: 2,
    });
    expect(won).toContain("TAMAMLANDI");
    expect(won).toMatch(/<dt>Bulunan<\/dt><dd>1\/4<\/dd>/);
    expect(won).toMatch(/<dt>Hata<\/dt><dd>2<\/dd>/);
    expect(won).not.toContain("Grupla");
  });

  it("üretim akışı örnek adaptörü ve motor iç fonksiyonlarını doğrudan kullanmaz", () => {
    const root = process.cwd();
    const gameComponents = readdirSync(join(root, "src/components/game"))
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => join("src/components/game", file));
    const sources = [...gameComponents, "src/app/play/page.tsx"].map((file) => ({
      file,
      text: readFileSync(join(root, file), "utf8"),
    }));

    expect(sources.map(({ file }) => file)).toContain(join("src/components/game", "GameBoard.tsx"));
    for (const { file, text } of sources) {
      const forbidden = text.match(
        /sampleController|useSampleGame|fixtures\/scenarios|@\/features\/game\/fixtures"|@\/features\/game\/engine/,
      );
      expect(forbidden, `${file} içinde ${forbidden?.[0]}`).toBeNull();
    }
    expect(sources.find(({ file }) => file.endsWith("GameBoard.tsx"))?.text).toContain(
      "@/features/game/react/useGame",
    );
  });
});
