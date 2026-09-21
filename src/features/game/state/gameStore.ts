/**
 * Oyun mağazası: motor + kayıt (Q20).
 *
 * Tahtanın durumu React'in değil, bu mağazanın içindedir; React ona
 * `useSyncExternalStore` ile bakar. Ayrımın nedeni kalıcılıktır: kayıt bir dış
 * sistemdir ve okuma/yazması render'a değil, mağazanın kendi yaşam döngüsüne
 * bağlanmalıdır. Böylece React tarafında ne kurulum durumu (`useState`) ne de
 * etki içinde durum güncellemesi kalır, ve mağaza React olmadan test edilir.
 *
 * Yaşam döngüsü iki aşamalıdır:
 *
 * 1. **Kurulum.** Motor bulmacadan taze tahtayı kurar. Bu aşama sunucuda da
 *    çalışır ve tohumlu olduğu için sunucuyla istemcide aynı sonucu verir.
 * 2. **Devralma ({@link GameStore.hydrate}).** Yalnız istemcide, bağlanma
 *    sonrası çağrılır: günün kaydı okunur, uygunsa tahtaya uygulanır ve
 *    kaydetme açılır. Bundan önce hiçbir şey yazılmaz; yoksa taze tahta,
 *    okunmamış kaydın üzerine yazılırdı.
 *
 * Aktif süre de (Q21) buraya bağlıdır. Sayacın matematiği `activeTimer.ts`
 * içinde saf durur; mağazanın işi **ne zaman işlediğine** karar vermektir. Koşul
 * tek bir yerde toplanır ({@link shouldRun}): kayıt devralındı, oyun ekranı
 * oyuncunun önünde ve oyun sürüyor. Üçünden biri düşerse oturum kapanır ve süre
 * kayda geçer. React yalnız ekranın önde olup olmadığını bildirir
 * ({@link GameStore.setScreenVisible}) ve saniyede bir sayacı akıtır
 * ({@link GameStore.tick}); kural bilgisi React tarafına hiç sızmaz.
 */

import type {
  GameController,
  GameSnapshot,
  Puzzle,
  SubmitResult,
  WordId,
} from "@/features/game/contracts";
import { createEngineController } from "@/features/game/react/engineController";
import { defaultSnapshotStorage, type SnapshotStorage } from "@/lib/persistence";

import {
  createActiveTimer,
  pauseTimer,
  resumeTimer,
  timerSeconds,
  type ActiveTimer,
} from "./activeTimer";
import {
  readPersistedGame,
  writePersistedGame,
  type GameRestoreState,
} from "./persistentGame";

/** Mağazanın dışarıya verdiği durum; kimliği yalnız değişince yenilenir. */
export type GameStoreState = {
  /** Güncel oyun durumu. */
  snapshot: GameSnapshot;
  /** Kaydın devralınıp devralınmadığı; devralma öncesi `pending`. */
  restore: GameRestoreState;
};

/** Oyun mağazası: okuma, abonelik, devralma ve oyun eylemleri. */
export type GameStore = Pick<
  GameController,
  "toggleWord" | "clearSelection" | "shuffle" | "submitSelection"
> & {
  /** Oynanan bulmaca. */
  readonly puzzle: Puzzle;
  /** Güncel durum. Aynı durumda aynı nesneyi döndürür. */
  getState: () => GameStoreState;
  /** Değişiklik aboneliği; dönen fonksiyon aboneliği bırakır. */
  subscribe: (listener: () => void) => () => void;
  /** Günün kaydını devralır ve kaydetmeyi açar. Birden çok çağrıda bir kez çalışır. */
  hydrate: () => void;
  /**
   * Oyun ekranının oyuncunun önünde olup olmadığını bildirir (Q21).
   *
   * "Önünde" iki koşulun birleşimidir: ekran DOM'da ve sekme görünür. İkisini de
   * React bilir, mağaza bilmez. Aynı değerin tekrar bildirilmesi etkisizdir,
   * dolayısıyla üst üste gelen görünürlük olayları süreyi bozmaz.
   */
  setScreenVisible: (visible: boolean) => void;
  /**
   * Sayacın o andaki değerini tahtaya ve kayda akıtır (Q21).
   *
   * Süre duruma eklenmez, üzerine yazılır; bu yüzden kaç kez çağrıldığının
   * önemi yoktur. Sayaç işlemiyorsa hiçbir şey değişmez.
   */
  tick: () => void;
};

/** {@link createGameStore} seçenekleri. */
export type GameStoreOptions = {
  /** Oynanacak bulmaca. */
  puzzle: Puzzle;
  /** Yayın günü; varsayılanı bulmacanın kendi günüdür. */
  dayKey?: string;
  /** Kayıt arka ucu; varsayılanı tarayıcı deposudur (sunucuda no-op). */
  storage?: SnapshotStorage;
  /**
   * Aktif süre sayacının saati (milisaniye); varsayılanı `Date.now`.
   *
   * Sayaç `setInterval`e gömülü değildir: mağaza yalnız "şu an" sorusunu sorar,
   * anı ilerleten React tarafıdır. Testler buraya kontrollü bir saat verip
   * gerçek bekleme olmadan saatler geçirebilir.
   */
  now?: () => number;
};

/**
 * Bulmaca için oyun mağazası kurar. Kayıt {@link GameStore.hydrate} çağrılana
 * kadar ne okunur ne yazılır; süre de o ana kadar işlemez.
 */
export function createGameStore({
  puzzle,
  dayKey = puzzle.date,
  storage,
  now = Date.now,
}: GameStoreOptions): GameStore {
  const engine = createEngineController({ puzzle });
  const listeners = new Set<() => void>();

  let state: GameStoreState = { snapshot: engine.snapshot, restore: { status: "pending" } };
  let hydrated = false;

  // Depo ilk kullanımda çözülür: kurulum render sırasında da olabilir ve o an
  // `localStorage`a dokunmanın (erişilebilirlik yoklaması) bir nedeni yoktur.
  let backend: SnapshotStorage | null = storage ?? null;
  const depo = (): SnapshotStorage => (backend ??= defaultSnapshotStorage());

  const notify = (): void => {
    listeners.forEach((listener) => listener());
  };

  const publish = (restore: GameRestoreState): void => {
    state = { snapshot: engine.snapshot, restore };
    notify();
  };

  // Motorun her durum değişimi mağazaya yansır ve devralmadan sonra kaydedilir.
  // Süre akıtması da buradan geçer: saniyede bir kayıt tazelenir, böylece sekme
  // beklenmedik biçimde kapanırsa en çok bir saniye kaybedilir.
  engine.subscribe(() => {
    if (hydrated) writePersistedGame(engine.snapshot, depo());
    publish(state.restore);
  });

  // Sayaç durmuş başlar. Taban taze tahtanın sıfırıdır; kayıt devralınınca
  // `hydrate` sayacı kayıttaki süreden yeniden kurar.
  let timer: ActiveTimer = createActiveTimer(engine.snapshot.activeSeconds);
  let screenVisible = false;

  /**
   * Sayaç şu an işlemeli mi?
   *
   * Üç koşulun hepsi gerekir:
   * - **Devralma bitti.** Öncesinde kayıttaki süre henüz okunmamıştır; sayılan
   *   her saniye taze sıfırın üstüne biner ve kaydı ezerdi.
   * - **Ekran önde.** Oyun ekranı DOM'da ve sekme görünür. Ana sayfa ve
   *   öğretici bu mağazayı hiç kurmaz, arka plandaki sekme `false` bildirir.
   * - **Oyun sürüyor.** `won`/`lost` terminaldir; süre orada donar.
   */
  const shouldRun = (): boolean =>
    hydrated && screenVisible && engine.snapshot.status === "playing";

  /**
   * Koşulları saate uygular ve güncel süreyi tahtaya yazar.
   *
   * Koşul değişmediyse sayaç da değişmez (`resumeTimer`/`pauseTimer` aynı
   * nesneyi döndürür), yazılan değer de aynı kalır ve motor bildirim üretmez.
   * Bu yüzden tekrar tekrar çağrılması güvenlidir.
   */
  const syncTimer = (): void => {
    const at = now();
    timer = shouldRun() ? resumeTimer(timer, at) : pauseTimer(timer, at);
    engine.setActiveSeconds(timerSeconds(timer, at));
  };

  return {
    puzzle,

    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    hydrate() {
      if (hydrated) return;

      const start = readPersistedGame({ puzzle, dayKey, storage: depo() });
      // Uygulama sırasındaki bildirim henüz kayıtsızdır; yazma devralma bitince yapılır.
      const applied = start.snapshot !== undefined && engine.restore(start.snapshot);
      hydrated = true;

      // Motor kaydı reddettiyse (başka bulmaca) taze tahta kalır ve kayıt düşer.
      const kabul = start.snapshot === undefined || applied;
      const restore: GameRestoreState = kabul
        ? start.restore
        : { status: "discarded", reason: "puzzle-mismatch" };

      // Sayaç kayıttaki süreden devam eder: taban geri yüklenen değerdir ve
      // oturum ancak buradan sonra, ekran önde olduğu bildirilince başlar.
      // Oyunun kapalı geçtiği süre böylece hiç ölçülmez ve kayıtlı süre
      // ne sıfırlanır ne de ikinci kez sayılır.
      timer = createActiveTimer(engine.snapshot.activeSeconds);

      writePersistedGame(engine.snapshot, depo());
      publish(restore);

      // Devralma bittiğine göre koşul artık sağlanabilir; ekran önde
      // bildirilmişse sayaç bu çağrıda başlar.
      syncTimer();
    },

    setScreenVisible(visible: boolean) {
      if (screenVisible === visible) return;
      screenVisible = visible;
      syncTimer();
    },

    tick() {
      syncTimer();
    },

    toggleWord(wordId: WordId) {
      engine.toggleWord(wordId);
    },

    clearSelection() {
      engine.clearSelection();
    },

    shuffle() {
      engine.shuffle();
    },

    submitSelection(): SubmitResult {
      const result = engine.submitSelection();

      // Gönderim oyunu bitirdiyse (`won`/`lost`) koşul düşer: oturum burada
      // kapanır, o ana kadar geçen süre birikime eklenir ve değer sabitlenir.
      // Oyun sürüyorsa akıtma yalnız kaydı tazeler.
      syncTimer();

      // Sonuç, süre yazıldıktan sonraki durumu taşır: sonuç ekranı ve paylaşım
      // gönderimin döndürdüğü snapshot'ı okur, ayrı bir sayaca bakmaz.
      return { outcome: result.outcome, snapshot: engine.snapshot };
    },
  };
}
