/**
 * Aktif süreyi sekme yaşam döngüsüne bağlayan kanca (Q21).
 *
 * Kancanın iki işi vardır ve ikisi de yalnız haber vermektir:
 *
 * 1. **Ekran önde mi?** Oyun ekranı DOM'da olduğu sürece sekmenin görünürlüğü
 *    izlenir ve mağazaya bildirilir. Süreyi işletip işletmeme kararı mağazanın
 *    ({@link GameStore.setScreenVisible} çağrısının tek anlamı "ekran şu an
 *    oyuncunun önünde").
 * 2. **Şimdi neresi?** Oyun sürerken saniyede bir sayaç akıtılır. Süre duruma
 *    eklenmez, üzerine yazılır (bkz. `activeTimer.ts`), bu yüzden atlanan ya da
 *    tarayıcı tarafından kısılan bir vuruş süreyi bozmaz: bir sonraki vuruş
 *    doğru toplamı yazar.
 *
 * **Ana sayfa ve öğretici yapıca saymaz.** Bu kanca `usePersistentGame`in
 * içinden, yani yalnız günlük oyun tahtası çizildiğinde kurulur. Ana sayfa
 * mağazayı hiç kurmaz; öğretici (`/play?mode=tutorial`) kendi bileşenidir
 * (`TutorialExperience`) ve günlük oyun durumuna hiç dokunmaz. Süre için ayrıca
 * bir "burada sayma" koşulu yazmak gerekmez; sayılmaması, kancanın orada
 * bulunmamasının doğal sonucudur.
 *
 * **SSR güvenli.** `document` ve `window` yalnız etki içinde okunur; sunucuda
 * etki çalışmaz. Görünürlük bilgisi hiçbir şey çizmez, dolayısıyla ilk ağaç
 * sunucuda ve istemcide birebir aynıdır ve hidrasyon uyuşmazlığı doğmaz.
 */

import { useEffect, useState } from "react";

import type { GameStatus } from "@/features/game/contracts";

import type { GameStore } from "./gameStore";

/** Sayacın kayda ve arayüze akıtılma aralığı (milisaniye). */
export const TICK_MS = 1000;

/**
 * Oyun ekranının süre sayacını sekmenin yaşam döngüsüne bağlar.
 *
 * @param store Süreyi işletecek oyun mağazası.
 * @param status Güncel oyun durumu; terminal olunca akıtma durur.
 */
export function useActiveTimer(store: GameStore, status: GameStatus): void {
  // Vuruş etkisinin görünürlüğe bağımlı olması için React tarafında da tutulur.
  // Hiçbir şey çizmez; sunucudaki ve istemcideki ilk değeri aynıdır.
  const [screenVisible, setScreenVisible] = useState(false);

  useEffect(() => {
    const apply = (visible: boolean): void => {
      setScreenVisible(visible);
      store.setScreenVisible(visible);
    };

    // Görünürlüğün tek doğruluk kaynağı belgenin kendisidir; olaylar yalnız
    // "yeniden oku" demek için dinlenir. `focus`/`blur` de buna dahildir:
    // koşul odağa değil görünürlüğe bakar (ekran gerçekten öndeyken sürenin
    // takılması daha kötü bir hatadır; gömülü bir çerçevede odak hiç gelmeyebilir),
    // ama bazı tarayıcılarda — özellikle iOS Safari'de — `visibilitychange`
    // güvenilmez biçimde atlanır ve durumu yakalayan tek olay odak olayı olur.
    const sync = (): void => apply(document.visibilityState !== "hidden");

    // Sayfa terk ediliyor (yenileme, gezinme, arka plana alınma): görünürlüğü
    // sormadan durdur. Duraklama son parçayı kayda geçirir, böylece yenilemeden
    // sonra süre kaldığı yerden sürer.
    const suspend = (): void => apply(false);

    sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    window.addEventListener("blur", sync);
    window.addEventListener("pageshow", sync);
    window.addEventListener("pagehide", suspend);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      window.removeEventListener("blur", sync);
      window.removeEventListener("pageshow", sync);
      window.removeEventListener("pagehide", suspend);

      // Oyun ekranı DOM'dan kalktı: ekran artık önde değil. Durum güncellemesi
      // sökülen bileşene yapılmaz, yalnız mağazaya haber verilir.
      store.setScreenVisible(false);
    };
  }, [store]);

  useEffect(() => {
    if (!screenVisible || status !== "playing") return;

    const ticker = setInterval(() => store.tick(), TICK_MS);
    return () => clearInterval(ticker);
  }, [screenVisible, status, store]);
}
