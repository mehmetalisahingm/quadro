import type { Puzzle } from "@/features/game/contracts";
import { createEngineController } from "@/features/game/react/engineController";
import { CARD_INTROS } from "./cardIntros";

export const GAME_OPENINGS = ["board-prelude", "chef", "detective", "game-show", "claw", "newsroom", "red-carpet", "domino", "elevator", "baggage", "metro", "film", "record", ...CARD_INTROS] as const;
export function gameOpeningFor(puzzleId: string, dayKey: string): typeof GAME_OPENINGS[number] {
  const timestamp = Date.parse(`${dayKey}T00:00:00Z`);
  // Start the gallery with the recovered metallic sculpture, followed by the new scenes.
  let seed = Number.isFinite(timestamp) ? Math.floor((timestamp - Date.UTC(2026, 8, 20)) / 86400000) : 0;
  if (!Number.isFinite(timestamp)) {
    for (const char of puzzleId) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  }
  return GAME_OPENINGS[((seed % GAME_OPENINGS.length) + GAME_OPENINGS.length) % GAME_OPENINGS.length] ?? "metro";
}

export const OPENING_SCENES = ["four-corners", "metro", "film", "record", "domino", "elevator", "baggage", "claw", "newsroom", "red-carpet", "chef", "detective", "game-show"] as const;
export type OpeningScene = (typeof OPENING_SCENES)[number];
export const OPENING_DURATION = 3000;

export const OPENING_COPY: Record<OpeningScene, { name: string; kicker: string; title: string; detail: string }> = {
  "four-corners": { name: "Dört köşe", kicker: "HER ŞEY BİRBİRİNE BAĞLI", title: "Her şey yerini bulur.", detail: "Dört köşe. On altı olasılık." },
  metro: { name: "Sonraki durak", kicker: "QUADRO ŞEHİR HATLARI", title: "Sonraki durak: keşif.", detail: "Kapılar açılıyor. Bağlantılar seni bekliyor." },
  film: { name: "Motor. Kayıt.", kicker: "BİR QUADRO GÖSTERİSİ", title: "Ve… başlıyoruz.", detail: "On altı kelime. Başrolde sen." },
  record: { name: "Plak döner.", kicker: "QUADRO SES ARŞİVİ", title: "Bağlantının ritmi.", detail: "İğne iner. Kelimeler akmaya başlar." },
  domino: { name: "Domino", kicker: "KÜÇÜK BİR DOKUNUŞ", title: "Biri başlar, hepsi bağlanır.", detail: "Bir hareket. On altı olasılık." },
  elevator: { name: "Asansör", kicker: "QUADRO GRAND HOTEL", title: "Bir üst katta keşif var.", detail: "Kapılar açılıyor. Bir sonraki durak senin." },
  baggage: { name: "Bagaj bandı", kicker: "QUADRO INTERNATIONAL", title: "Kelimelerin yolculuğu.", detail: "Bagajın hazır. Bağlantıları teslim al." },
  chef: { name: "Şef mutfağı", kicker: "QUADRO ATELIER", title: "Bir tutam merak.", detail: "Doğra, karıştır. Bağlantının tarifi sende." },
  detective: { name: "Dedektif masası", kicker: "QUADRO ARAŞTIRMA BÜROSU", title: "Görünenden fazlası var.", detail: "Her kelime bir bulgu. Dikkatli bak." },
  "game-show": { name: "TV yarışması", kicker: "QUADRO SAHNESİ", title: "Hazırsan, başlıyoruz.", detail: "Işıklar açıldı. Sıra senin keşfinde." },
  claw: { name: "Pençe makinesi", kicker: "QUADRO ARCADE", title: "Şansını değil, bağını yakala.", detail: "Pençe iner. Olasılıklar yerini bulur." },
  newsroom: { name: "Haber stüdyosu", kicker: "QUADRO CANLI YAYIN", title: "Son dakika: bir bağ bulundu.", detail: "On altı kelime. Günün tek gündemi." },
  "red-carpet": { name: "Kırmızı halı", kicker: "QUADRO GALA GECESİ", title: "Bu gecenin yıldızı sensin.", detail: "Halı serildi. Kelimeler sahnede." },
};

/** Calendar rotation prevents adjacent-day repeats, independently of difficulty. */
export function openingSceneFor(puzzleId: string, dayKey: string): OpeningScene {
  const timestamp = Date.parse(`${dayKey}T00:00:00.000Z`);
  if (Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === dayKey) {
    const day = Math.floor(timestamp / 86_400_000);
    return OPENING_SCENES[((day % OPENING_SCENES.length) + OPENING_SCENES.length) % OPENING_SCENES.length]!;
  }
  let hash = 0;
  for (const char of puzzleId) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0;
  return OPENING_SCENES[hash % OPENING_SCENES.length]!;
}

/** Same seeded order as the fresh live board; no stores, timers or saves are started. */
export function openingWords(puzzle: Puzzle): readonly string[] {
  const words = new Map(puzzle.groups.flatMap((group) => group.words.map((word) => [word.id, word.text] as const)));
  return createEngineController({ puzzle }).snapshot.remainingWordOrder.map((id) => words.get(id)!);
}

/** Pure geometry: visual routes depend only on board position, never answer groups. */
export function openingCardFrames(
  scene: OpeningScene,
  index: number,
  target: { x: number; y: number; width: number; height: number },
  stage: { width: number; height: number },
): Keyframe[] {
  const { x, y, width, height } = target;
  const move = (dx: number, dy: number, angle = 0, scale = 1) =>
    `translate3d(${dx}px, ${dy}px, 0) rotate(${angle}deg) scale(${scale})`;
  const cx = (stage.width - width) / 2 - x;
  const cy = (stage.height - height) / 2 - y;
  const rank = index % 4;
  if (scene === "chef") {
    // Chopping beats match the decorative arm; never use solution groups.
    const drift = (index % 2 ? 1 : -1) * width * .17;
    return [
      { offset: 0, opacity: 0, transform: move(cx, cy + stage.height * .25, 0, .3) },
      { offset: .19, opacity: 0, transform: move(cx, cy + stage.height * .25, 0, .3) },
      { offset: .26, opacity: .9, transform: move(cx * .2 + drift, 12, -3, .82) },
      { offset: .32, opacity: 1, transform: move(cx * .15 - drift, -6, 3, .88) },
      { offset: .39, opacity: 1, transform: move(cx * .1 + drift, 10, -2, .9) },
      { offset: .45, opacity: 1, transform: move(-drift, -5, 2, .94) },
      { offset: .51, opacity: 1, transform: move(drift * .5, 7, -1, .97) },
      { offset: .58, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "detective") {
    const row = Math.floor(index / 4);
    const scan = row % 2 ? 3 - rank : rank;
    const start = .12 + (row * 4 + scan) * .031;
    return [
      { offset: 0, opacity: 0, transform: move(0, 20, -5, .92) },
      { offset: start, opacity: 0, transform: move(0, 20, -5, .92) },
      { offset: start + .11, opacity: 1, transform: move(0, -3, 1, 1.02) },
      { offset: start + .2, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "game-show") {
    const start = .47 + index * .014;
    return [
      { offset: 0, opacity: 0, transform: move(cx * .25, stage.height * .3, 0, .55) },
      { offset: start, opacity: 0, transform: move(cx * .25, stage.height * .3, 0, .55) },
      { offset: start + .1, opacity: 1, transform: move(0, -6, 0, 1.04) },
      { offset: start + .19, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "claw") {
    // Four visual grabs based only on shuffled board position.
    const grab = index % 4;
    const dx = stage.width * [.28, .43, .58, .73][grab]! - x - width / 2;
    const start = .18 + grab * .14;
    return [
      { offset: 0, opacity: 0, transform: move(dx, cy + stage.height * .13, 0, .28) },
      { offset: start, opacity: 0, transform: move(dx, cy + stage.height * .13, 0, .28) },
      { offset: start + .055, opacity: 1, transform: move(dx, cy - stage.height * .18, (index % 3 - 1) * 7, .48) },
      { offset: start + .16, opacity: 1, transform: move(0, -8, 0, 1.04) },
      { offset: start + .23, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "newsroom") {
    const start = .23 + index * .026;
    return [
      { offset: 0, opacity: 0, transform: move(stage.width * .3, -35, 0, .88) },
      { offset: start, opacity: 0, transform: move(stage.width * .3, -35, 0, .88) },
      { offset: start + .1, opacity: 1, transform: move(-7, 0, 0, 1.02) },
      { offset: start + .19, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "red-carpet") {
    const start = .3 + (index % 2) * .25;
    return [
      { offset: 0, opacity: 0, transform: move(cx * .7, stage.height * .45, (rank - 1.5) * 6, .45) },
      { offset: start, opacity: 0, transform: move(cx * .7, stage.height * .45, (rank - 1.5) * 6, .45) },
      { offset: start + .15, opacity: 1, transform: move(0, -5, 0, 1.02) },
      { offset: start + .29, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "domino") {
    const start = .22 + index * .024;
    return [
      { offset: 0, opacity: 0, transform: move(0, 28, -12, .72) },
      { offset: start, opacity: 0, transform: move(0, 28, -12, .72) },
      { offset: start + .12, opacity: 1, transform: move(0, -9, 2, 1.06) },
      { offset: start + .23, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "elevator") {
    const start = [.19, .4, .6][index % 3]!;
    return [
      { offset: 0, opacity: 0, transform: move(cx, cy + 20, 0, .18) },
      { offset: start, opacity: 0, transform: move(cx, cy + 20, 0, .18) },
      { offset: start + .09, opacity: 1, transform: move(cx * .6, cy * .6, (rank - 1.5) * 4, .6) },
      { offset: start + .27, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "baggage") {
    const start = .18 + index * .025;
    const dx = stage.width * .7 - x - width / 2;
    const dy = stage.height * .64 - y - height / 2;
    return [
      { offset: 0, opacity: 0, transform: move(dx - stage.width * .25, dy, 0, .5) },
      { offset: start, opacity: 0, transform: move(dx - stage.width * .25, dy, 0, .5) },
      { offset: start + .07, opacity: 1, transform: move(dx, dy, -4, .55) },
      { offset: start + .28, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "metro") {
    const door = (index * 7) % 3;
    const dx = stage.width * [.158, .495, .832][door]! - x - width / 2;
    const dy = stage.height * .46 - y - height / 2;
    return [
      { offset: 0, opacity: 0, transform: move(dx, dy, 0, .18) },
      { offset: .42, opacity: 0, transform: move(dx, dy, 0, .18) },
      { offset: .53, opacity: 1, transform: move(dx, dy + 34, (rank - 1.5) * 7, .55) },
      { offset: .70, opacity: 1, transform: move(cx + (index % 2 ? 1 : -1) * stage.width * .19, cy + (rank - 1.5) * 18, (rank - 1.5) * 9, .86) },
      { offset: .91, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  if (scene === "film") {
    const side = index % 2 ? 1 : -1;
    return [
      { offset: 0, opacity: 0, transform: move(cx + side * stage.width * .57, cy + (rank - 1.5) * 45, side * 24, .65) },
      { offset: .41, opacity: 0, transform: move(cx + side * stage.width * .57, cy + (rank - 1.5) * 45, side * 24, .65) },
      { offset: .62, opacity: 1, transform: move(cx + side * stage.width * .18, cy + (Math.floor(index / 4) - 1.5) * 48, -side * 7, .92) },
      { offset: .90, opacity: 1, transform: move(0, 0) },
      { offset: 1, opacity: 1, transform: move(0, 0) },
    ];
  }
  // Original four-corner choreography: four packs -> central shuffle -> grid.
  const pack = Math.floor(index / 4);
  const sx = pack % 2 ? 1 : -1;
  const sy = pack > 1 ? 1 : -1;
  return [
    { offset: 0, opacity: 0, transform: move(cx + sx * stage.width * .55, cy + sy * stage.height * .55, sx * 35) },
    { offset: .24, opacity: 1, transform: move(cx + sx * stage.width * .3 + rank * 7, cy + sy * stage.height * .27 + rank * 5, sx * (rank - 1.5) * 9) },
    { offset: .53, opacity: 1, transform: move(cx + sx * (rank - 1.5) * 26, cy + sy * (rank - 1.5) * 20, (rank - 1.5) * 17, 1.05) },
    { offset: .90, opacity: 1, transform: move(0, 0) },
    { offset: 1, opacity: 1, transform: move(0, 0) },
  ];
}
