import type { GameDifficulty } from "./difficulty";
import { SLOT_COUNT } from "./specialEnergy";
import { trackPuzzleId } from "./tracks";

/**
 * Özel mod tahtaları ile mod parkuru tahtaları arasındaki eşleme (#171).
 * Slot 0–11 Orta, 12–23 Zor, 24–35 Kolay, 36–47 Ultra parkurunun 1–12. bölümüdür.
 * Sunucu (`/api/challenge-puzzle`) ve istemci aynı eşlemeyi kullanır.
 */
export const SLOT_MODES: readonly GameDifficulty[] = ["medium", "hard", "easy", "ultra"];
const LEVELS = 12;

export function slotTrack(slot: number): { mode: GameDifficulty; level: number } {
  return { mode: SLOT_MODES[Math.floor(slot / LEVELS)]!, level: (slot % LEVELS) + 1 };
}

export function slotPuzzleId(slot: number): string {
  const { mode, level } = slotTrack(slot);
  return trackPuzzleId(mode, level);
}

/**
 * `start` slotundan başlayıp oyuncunun görmediği ilk tahtayı seçer. Hepsi görülmüşse
 * `start` döner. Deterministiktir: aynı başlangıç ve aynı görülenler aynı slotu verir.
 */
export function pickUnseenSlot(start: number, seen: ReadonlySet<string>): number {
  for (let offset = 0; offset < SLOT_COUNT; offset++) {
    const slot = (start + offset) % SLOT_COUNT;
    if (!seen.has(slotPuzzleId(slot))) return slot;
  }
  return start;
}

const TRACK_ID = /track-(?:easy|medium|balanced|hard)-\d{3}/;

/**
 * Tarayıcı kayıtlarından oyuncunun gördüğü mod tahtalarını çıkarır: parkur kayıtları,
 * yedek havuzdan gelen günlük oyun ve önceki özel oyunlar. Yalnız anahtarlara ve kayıttaki
 * bulmaca kimliğine bakar; cevap okumaz.
 */
export function seenTrackIds(entries: Iterable<[string, string | null]>): Set<string> {
  const seen = new Set<string>();
  for (const [key, value] of entries) {
    if (key.startsWith("quadro:tracks:v1:") || /^quadro:(risk|ladder|bomb):v1:/.test(key)) {
      const match = TRACK_ID.exec(key);
      if (match) seen.add(match[0]);
      continue;
    }
    if (key.startsWith("quadro:save:v1:") && value) {
      try {
        const puzzleId: unknown = JSON.parse(value)?.snapshot?.puzzleId;
        const match = typeof puzzleId === "string" ? TRACK_ID.exec(puzzleId) : null;
        if (match) seen.add(match[0]);
      } catch { /* Bozuk kayıt görülmüş sayılmaz. */ }
    }
  }
  return seen;
}

export function readSeenTrackIds(storage: Storage = localStorage): Set<string> {
  const entries: [string, string | null][] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key) entries.push([key, key.startsWith("quadro:save:v1:") ? storage.getItem(key) : null]);
  }
  return seenTrackIds(entries);
}
