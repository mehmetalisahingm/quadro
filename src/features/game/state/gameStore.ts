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
};

/** {@link createGameStore} seçenekleri. */
export type GameStoreOptions = {
  /** Oynanacak bulmaca. */
  puzzle: Puzzle;
  /** Yayın günü; varsayılanı bulmacanın kendi günüdür. */
  dayKey?: string;
  /** Kayıt arka ucu; varsayılanı tarayıcı deposudur (sunucuda no-op). */
  storage?: SnapshotStorage;
};

/**
 * Bulmaca için oyun mağazası kurar. Kayıt {@link GameStore.hydrate} çağrılana
 * kadar ne okunur ne yazılır.
 */
export function createGameStore({
  puzzle,
  dayKey = puzzle.date,
  storage,
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
  engine.subscribe(() => {
    if (hydrated) writePersistedGame(engine.snapshot, depo());
    publish(state.restore);
  });

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

      writePersistedGame(engine.snapshot, depo());
      publish(restore);
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
      return engine.submitSelection();
    },
  };
}
