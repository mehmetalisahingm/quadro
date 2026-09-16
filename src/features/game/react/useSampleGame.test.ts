import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { SampleScenarioId } from "@/features/game/fixtures";
import { useSampleGame } from "@/features/game/react/useSampleGame";

/** Kancanın döndürdüğü değerleri düz metin olarak çizen deneme bileşeni. */
function Probe({ scenarioId }: { scenarioId?: SampleScenarioId }) {
  const { puzzle, controller, initialResult } = useSampleGame(scenarioId);
  const { snapshot } = controller;
  return createElement(
    "output",
    null,
    [
      puzzle.id,
      snapshot.status,
      `${snapshot.solvedGroupIds.length}/4`,
      `hak:${snapshot.mistakesRemaining}`,
      `seçim:${snapshot.selectedWordIds.length}`,
      `sonuç:${initialResult?.outcome.verdict ?? "yok"}`,
    ].join("|"),
  );
}

describe("useSampleGame", () => {
  it("varsayılan olarak boş oyunu açar", () => {
    expect(renderToStaticMarkup(createElement(Probe))).toBe(
      "<output>ornek-001|playing|0/4|hak:4|seçim:0|sonuç:yok</output>",
    );
  });

  it("senaryonun durumunu ve açılış sonucunu sunucu çiziminde de verir", () => {
    expect(renderToStaticMarkup(createElement(Probe, { scenarioId: "last-chance" }))).toBe(
      "<output>ornek-001|playing|1/4|hak:1|seçim:4|sonuç:one-away</output>",
    );
    expect(renderToStaticMarkup(createElement(Probe, { scenarioId: "won" }))).toBe(
      "<output>ornek-001|won|4/4|hak:3|seçim:0|sonuç:correct</output>",
    );
  });

  it("aynı senaryo sunucu ve istemcide aynı kart sırasını üretir", () => {
    function OrderProbe() {
      const { controller } = useSampleGame("long-words");
      return createElement("output", null, controller.snapshot.remainingWordOrder.join(","));
    }
    const first = renderToStaticMarkup(createElement(OrderProbe));
    expect(renderToStaticMarkup(createElement(OrderProbe))).toBe(first);
  });
});
