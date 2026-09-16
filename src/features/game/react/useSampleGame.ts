/**
 * Örnek adaptör için React kancası (Q03).
 *
 * Arayüz bileşenleri gerçek motor hazır olmadan `GameController` sözleşmesiyle çalışabilsin
 * diye hazır senaryolardan birini açar. Kanca iş kuralı hesaplamaz; yalnız örnek adaptörün
 * durumuna abone olur ve her değişiklikte güncel `snapshot` ile yeniden çizim sağlar.
 * Q16'da gerçek motorun kancasıyla değiştirilir; `controller` kullanımı aynı kalır.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import type { GameController, Puzzle, SubmitResult } from "@/features/game/contracts";
import {
  createSampleScenario,
  type SampleScenario,
  type SampleScenarioId,
} from "@/features/game/fixtures/scenarios";

/** `useSampleGame` dönüşü. */
export type SampleGame = {
  /** Oynanan bulmaca; kelime metni, grup başlığı ve açıklaması için. */
  puzzle: Puzzle;
  /** Sözleşmeye uyan denetleyici; `controller.snapshot` her çizimde günceldir. */
  controller: GameController;
  /**
   * Senaryonun açılışındaki son gönderim sonucu. Arayüz geri bildirim durumunu yalnız ilk
   * açılışta bununla başlatabilir; sonraki sonuçlar `controller.submitSelection()` dönüşünden
   * okunur.
   */
  initialResult: SubmitResult | null;
  /** Senaryoyu başlangıç durumuna döndürür. */
  reset: () => void;
};

/**
 * Hazır bir örnek senaryoyu açar ve sözleşmeye uyan denetleyici döndürür.
 *
 * Başlangıç kart sırası tohumlu olduğundan sunucu ve istemci aynı tahtayı çizer. Senaryo
 * kimliği değişirse senaryo yeniden açılır.
 *
 * @param scenarioId Açılacak senaryo; varsayılanı boş oyundur.
 */
export function useSampleGame(scenarioId: SampleScenarioId = "empty"): SampleGame {
  const [state, setState] = useState<{ id: SampleScenarioId; scenario: SampleScenario }>(() => ({
    id: scenarioId,
    scenario: createSampleScenario(scenarioId),
  }));

  let current = state;
  if (state.id !== scenarioId) {
    // Önceki çizimden gelen bilgiyle durumu güncelleme kalıbı.
    current = { id: scenarioId, scenario: createSampleScenario(scenarioId) };
    setState(current);
  }

  const { scenario } = current;
  const source = scenario.controller;
  const snapshot = useSyncExternalStore(
    source.subscribe,
    () => source.snapshot,
    () => source.snapshot,
  );

  const controller = useMemo<GameController>(
    () => ({
      snapshot,
      toggleWord: source.toggleWord,
      clearSelection: source.clearSelection,
      shuffle: source.shuffle,
      submitSelection: source.submitSelection,
    }),
    [snapshot, source],
  );

  const reset = useCallback(() => {
    setState({ id: scenarioId, scenario: createSampleScenario(scenarioId) });
  }, [scenarioId]);

  return {
    puzzle: scenario.puzzle,
    controller,
    initialResult: scenario.lastResult,
    reset,
  };
}
