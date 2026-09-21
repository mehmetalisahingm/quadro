/**
 * Oyun durumunun çalışma zamanı (Q20).
 *
 * Motor (saf), kalıcılık (saf) ve React arasındaki bağdır: bugünün bulmacasını
 * kaydedilmiş ilerlemesiyle açar ve her durum değişimini geri yazar. Bileşenler
 * depoya doğrudan dokunmaz; tek giriş noktası buradaki kancadır.
 *
 * Aktif oyun süresi de (Q21) buradadır: sayacın matematiği `activeTimer.ts`
 * içinde saf ve zamanı enjekte edilebilir durur, hangi koşullarda işlediği
 * `gameStore.ts` içinde tek yerde toplanır, sekmenin görünürlüğüne bağlanması
 * `useActiveTimer.ts` içindedir.
 */

export * from "./activeTimer";
export * from "./gameStore";
export * from "./persistentGame";
export * from "./useActiveTimer";
export * from "./usePersistentGame";
