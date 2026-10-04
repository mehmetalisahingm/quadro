/** Presentation only: no puzzle groups, difficulty or answers enter this module. */
export const CARD_INTROS = ["four-corners", "deck-burst", "orbit", "cascade", "cross-shuffle", "magnet-snap"] as const;
export type CardIntro = typeof CARD_INTROS[number];
export const INTRO_DURATION = 2600;
export const INTRO_REVEAL = 2050;

export const INTRO_CAPTIONS: Record<CardIntro, string> = {
  "four-corners": "DÖRT KÖŞE. TEK TAHTA.",
  "deck-burst": "BİR DESTE OLASILIK.",
  orbit: "HER KELİMENİN BİR YÖRÜNGESİ VAR.",
  cascade: "KELİMELER AKIŞINI BULUR.",
  "cross-shuffle": "YOLLAR KESİŞİR. BAĞLAR GİZLENİR.",
  "magnet-snap": "KELİMELER BİRBİRİNİ ÇEKER.",
};

export function selectCardIntro(puzzleId: string, dayKey?: string): CardIntro {
  // A UTC day ordinal is timezone independent and prevents adjacent-day repeats.
  const day = dayKey && /^\d{4}-\d{2}-\d{2}$/.test(dayKey) ? Date.parse(`${dayKey}T00:00:00Z`) : NaN;
  let seed = Number.isFinite(day) ? Math.floor(Number(day) / 86400000) : 0;
  if (!Number.isFinite(day)) {
    for (const char of puzzleId) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  }
  return CARD_INTROS[((seed % CARD_INTROS.length) + CARD_INTROS.length) % CARD_INTROS.length] ?? "four-corners";
}

type Geometry = { width: number; height: number; target: { left: number; top: number; width: number; height: number } };
type Pose = [x: number, y: number, angle: number, scale: number];

export function cardIntroMotion(variant: CardIntro, index: number, { width, height, target: r }: Geometry) {
  const pack = Math.floor(index / 4), rank = index % 4;
  const sx = pack % 2 ? 1 : -1, sy = pack > 1 ? 1 : -1;
  const cx = (width - r.width) / 2, cy = (height - r.height) / 2;
  const gridWidth = Math.min(width - 40, 920), gridHeight = Math.min(height * .5, 460);
  const gx = (width - gridWidth) / 2 + (rank + .5) * gridWidth / 4 - r.width / 2;
  const gy = (height - gridHeight) / 2 + (pack + .5) * gridHeight / 4 - r.height / 2;
  const scale = Math.min(1.3, (gridWidth / 4 - 9) / r.width);
  const rx = Math.max(0, (width - r.width) * .37), ry = Math.max(0, (height - r.height - 160) * .36);
  const angle = index * Math.PI / 8;
  const orbit = (a: number, factor = 1): Pose => [cx + Math.cos(a) * rx * factor, cy + Math.sin(a) * ry * factor, Math.sin(a) * 14, 1];
  const corner: Pose = [sx > 0 ? width - r.width - 24 - rank * 7 : 24 + rank * 7,
    sy > 0 ? height - r.height - 80 - rank * 7 : 90 + rank * 7, sx * (rank - 1.5) * 9, 1.04];
  let poses: Pose[];
  switch (variant) {
    case "four-corners":
      poses = [[corner[0] + sx * width * .3, corner[1] + sy * height * .3, sx * 35, 1.1], corner,
        [cx + sx * (rank - 1.5) * Math.min(65, width * .13), cy + sy * (rank - 1.5) * 32, (rank - 1.5) * 17, 1.08]];
      break;
    case "deck-burst":
      poses = [[cx, cy + height * .15, -12, .75], [cx + (index - 7.5) * 1.8, cy - index * 2, (index - 7.5) * 1.4, 1],
        [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry, (rank - 1.5) * 12, 1.04]];
      break;
    case "orbit":
      poses = [orbit(angle - 1.8, .7), orbit(angle - .9), orbit(angle + .8)];
      break;
    case "cascade":
      poses = [[gx - 35, -r.height - index * 12, -14, .95], [gx, gy - 45, 6, 1],
        [cx + (1.5 - rank) * gridWidth / 4, gy + 20, (rank - 1.5) * -8, 1]];
      break;
    case "cross-shuffle": {
      const horizontal = pack < 2;
      const direction = pack % 2 ? 1 : -1;
      const lane = (rank - 1.5) * Math.min(28, width * .045);
      poses = horizontal
        ? [[cx + direction * width, cy + lane, direction * 12, 1], [cx + direction * rx, cy + lane, direction * 6, 1], [cx - direction * rx * .6, cy + lane, -direction * 8, 1]]
        : [[cx + lane, cy + direction * height, direction * -12, 1], [cx + lane, cy + direction * ry, direction * -6, 1], [cx + lane, cy - direction * ry * .6, direction * 8, 1]];
      break;
    }
    case "magnet-snap":
      poses = [orbit(angle, .95), orbit(angle + .12, 1.06), [cx + Math.cos(angle) * 24, cy + Math.sin(angle) * 24, (index - 7.5) * 3, .88]];
      break;
  }
  poses.push([gx, gy, 0, scale], [r.left, r.top, 0, 1]);
  const offsets = [0, .23, .52, .76, 1];
  const keyframes: Keyframe[] = poses.map(([x, y, rotation, zoom], i) => ({
    offset: offsets[i], transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${zoom})`,
    opacity: i === 0 ? 0 : 1, easing: "cubic-bezier(.45, 0, .2, 1)",
  }));
  return { keyframes, delay: variant === "cascade" ? index * 16 : rank * 30 + pack * 30 };
}
