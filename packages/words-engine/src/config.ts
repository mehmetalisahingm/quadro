/**
 * Kurallar ve puanlama ayarları. #205'te "playtest ile ayarlanabilir" denen her şey burada.
 *
 * Varsayımlar (#213 review'unda sahibe soruldu, cevap gelince yalnız buradaki değerler değişir):
 * - V1 Okuma yönü: yalnız soldan sağa ve yukarıdan aşağıya. Ters okuma yok.
 * - V2 Aynı doğrultuda birden fazla aday: birbiriyle çakışmayan kelimelerin hepsi silinir;
 *   çakışanlardan uzun olan, eşitlikte başlangıç koordinatı küçük olan kazanır.
 * - V3 Çoklu kelime bonusu: hamlede n kelime silinirse toplam puan × (1 + comboStep × (n − 1)).
 */
export type Direction = "horizontal" | "vertical";

export type EngineConfig = {
  readonly boardSize: number;
  readonly trayCapacity: number;
  /** Silinmek için gereken en kısa kelime. Planda 4; playtest 3'ü de deneyebilir. */
  readonly minWordLength: number;
  readonly directions: readonly Direction[];
  /** Kelime puanı = lengthFactor × uzunluk². */
  readonly lengthFactor: number;
  /** Çoklu kelime çarpanının adımı (V3). */
  readonly comboStep: number;
};

export const DEFAULT_CONFIG: EngineConfig = {
  boardSize: 7,
  trayCapacity: 3,
  minWordLength: 4,
  directions: ["horizontal", "vertical"],
  lengthFactor: 10,
  comboStep: 0.5,
};

export function resolveConfig(overrides: Partial<EngineConfig> = {}): EngineConfig {
  const config = { ...DEFAULT_CONFIG, ...overrides };
  if (!Number.isInteger(config.boardSize) || config.boardSize < 4 || config.boardSize > 12) {
    throw new RangeError(`boardSize 4–12 arası bir tam sayı olmalı: ${config.boardSize}`);
  }
  if (!Number.isInteger(config.trayCapacity) || config.trayCapacity < 1 || config.trayCapacity > 5) {
    throw new RangeError(`trayCapacity 1–5 arası bir tam sayı olmalı: ${config.trayCapacity}`);
  }
  if (!Number.isInteger(config.minWordLength) || config.minWordLength < 2 || config.minWordLength > config.boardSize) {
    throw new RangeError(`minWordLength 2 ile boardSize arasında olmalı: ${config.minWordLength}`);
  }
  if (config.directions.length === 0) throw new RangeError("En az bir okuma yönü gerekli.");
  return config;
}
