import { randomStep } from "./random";

/**
 * Parçalar: 1–4 harflik, sabit yönlü (döndürülemez) şekiller. Döndürme #215'te.
 *
 * `dr`/`dc` parçanın sol üst köşesine göre satır/sütun farkıdır; hücreler okuma
 * sırasındadır (önce satır, sonra sütun). Harfler tek Unicode kod noktasıdır (İ, Ş, Ğ…).
 */
export type PieceCell = { readonly dr: number; readonly dc: number; readonly letter: string };
export type Piece = { readonly id: number; readonly shape: ShapeId; readonly cells: readonly PieceCell[] };

type Offset = readonly [number, number];

export const SHAPES = {
  single: [[0, 0]],
  h2: [[0, 0], [0, 1]],
  v2: [[0, 0], [1, 0]],
  h3: [[0, 0], [0, 1], [0, 2]],
  v3: [[0, 0], [1, 0], [2, 0]],
  cornerTopLeft: [[0, 0], [0, 1], [1, 0]],
  cornerTopRight: [[0, 0], [0, 1], [1, 1]],
  cornerBottomLeft: [[0, 0], [1, 0], [1, 1]],
  cornerBottomRight: [[0, 1], [1, 0], [1, 1]],
  h4: [[0, 0], [0, 1], [0, 2], [0, 3]],
  v4: [[0, 0], [1, 0], [2, 0], [3, 0]],
  square: [[0, 0], [0, 1], [1, 0], [1, 1]],
} as const satisfies Record<string, readonly Offset[]>;

export type ShapeId = keyof typeof SHAPES;
export const SHAPE_IDS = Object.keys(SHAPES) as ShapeId[];

/**
 * Türkçe harf ağırlıkları (yaklaşık, yüzde). Geçici: #204'te seçilen sözlükten hesaplanacak,
 * #206'daki akıllı üretici de bunları kullanacak. Toplamın 100 olması gerekmez.
 */
export const TURKISH_LETTER_WEIGHTS: Readonly<Record<string, number>> = {
  A: 11.9, E: 8.9, İ: 8.6, N: 7.5, R: 6.9, L: 5.9, I: 5.1, K: 4.7, D: 4.7, M: 3.7,
  Y: 3.3, U: 3.2, T: 3.0, S: 3.0, B: 2.8, O: 2.5, Ü: 1.9, Ş: 1.8, Z: 1.5, G: 1.3,
  Ç: 1.2, H: 1.1, Ğ: 1.1, V: 1.0, C: 1.0, P: 0.9, Ö: 0.8, F: 0.5, J: 0.1,
};

export function makePiece(id: number, shape: ShapeId, letters: readonly string[]): Piece {
  const offsets: readonly Offset[] = SHAPES[shape];
  if (letters.length !== offsets.length) {
    throw new RangeError(`${shape} için ${offsets.length} harf gerekli, ${letters.length} verildi.`);
  }
  return {
    id,
    shape,
    cells: offsets.map(([dr, dc], index) => ({ dr, dc, letter: letters[index] as string })),
  };
}

/**
 * Parça kaynağı: tepside boşalan yeri dolduracak parçayı üretir. Saf olmalı:
 * aynı (rng, context) her zaman aynı sonucu vermeli. #206'nın akıllı üreticisi bu
 * sözleşmeyi uygular; motor üreticinin içini bilmez.
 */
export type PieceSourceContext = { readonly id: number; readonly moveCount: number };
export type PieceSource = (rng: number, context: PieceSourceContext) => { piece: Piece; rng: number };

function pickWeighted<T extends string>(rng: number, entries: readonly (readonly [T, number])[]): { value: T; rng: number } {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const step = randomStep(rng);
  let threshold = step.value * total;
  for (const [value, weight] of entries) {
    threshold -= weight;
    if (threshold < 0) return { value, rng: step.state };
  }
  const last = entries.at(-1);
  if (!last) throw new RangeError("Boş ağırlık listesi.");
  return { value: last[0], rng: step.state };
}

const LETTER_ENTRIES = Object.entries(TURKISH_LETTER_WEIGHTS) as [string, number][];
const SHAPE_ENTRIES: [ShapeId, number][] = SHAPE_IDS.map((shape) => [shape, 1]);

/**
 * Basit, deterministik kaynak: şekil eşit olasılıkla, harfler Türkçe sıklığına göre.
 * Yalnız motor testleri ve ilk prototip içindir; oyunun dengesi #206'da kurulur.
 */
export const naivePieceSource: PieceSource = (rng, { id }) => {
  const shapePick = pickWeighted(rng, SHAPE_ENTRIES);
  let state = shapePick.rng;
  const letters: string[] = [];
  for (let index = 0; index < SHAPES[shapePick.value].length; index++) {
    const letter = pickWeighted(state, LETTER_ENTRIES);
    letters.push(letter.value);
    state = letter.rng;
  }
  return { piece: makePiece(id, shapePick.value, letters), rng: state };
};
