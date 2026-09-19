/**
 * Oyun durumunun çalışma zamanı (Q20).
 *
 * Motor (saf), kalıcılık (saf) ve React arasındaki bağdır: bugünün bulmacasını
 * kaydedilmiş ilerlemesiyle açar ve her durum değişimini geri yazar. Bileşenler
 * depoya doğrudan dokunmaz; tek giriş noktası buradaki kancadır.
 */

export * from "./gameStore";
export * from "./persistentGame";
export * from "./usePersistentGame";
