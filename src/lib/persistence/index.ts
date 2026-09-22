/**
 * Kalıcılık katmanı (Q20).
 *
 * Oyun oturumunu tarayıcıda güvenle saklar ve geri yükler. Saf ve enjekte
 * edilebilirdir: depo bir arayüzdür, saat dışarıdan verilebilir, hiçbir
 * fonksiyon hata fırlatmaz. `localStorage`a yalnız `storage.ts` dokunur ve o da
 * sunucuda no-op'a düşer, dolayısıyla bu modüller SSR sırasında da içe
 * aktarılabilir.
 *
 * Kuralların sözlü karşılığı `docs/PERSISTENCE.md` içindedir. React tarafı
 * (`src/features/game/state/`) bu kapıyı kullanır; bileşenler doğrudan depoya
 * dokunmaz.
 */

export * from "./compatibility";
export * from "./record";
export * from "./snapshotStore";
export * from "./statsStore";
export * from "./storage";
