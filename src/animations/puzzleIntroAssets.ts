export type PuzzleIntroTheme = "ocean" | "meadow" | "sky" | "sunrise" | "city";

export type PuzzleIntroScene = {
  theme: PuzzleIntroTheme;
  eyebrow: string;
  title: string;
  durationMs: number;
  animationData: Record<string, unknown>;
};

type Color = [number, number, number, number];
type Vec2 = [number, number];
type Vec3 = [number, number, number];
type Shape = Record<string, unknown>;
type Layer = Record<string, unknown>;

const WIDTH = 960;
const HEIGHT = 600;
const FPS = 60;
const FRAMES = 144;

const still = (value: unknown) => ({ a: 0, k: value });
const moving = (frames: unknown[]) => ({ a: 1, k: frames });

function keyframe(t: number, from: number[], to: number[]) {
  return {
    t,
    s: from,
    e: to,
    i: { x: [0.667], y: [1] },
    o: { x: [0.333], y: [0] },
  };
}

function transform(options: {
  position?: Vec3;
  scale?: Vec3;
  opacity?: number;
  rotation?: number;
  positionFrames?: unknown[];
  scaleFrames?: unknown[];
  opacityFrames?: unknown[];
  rotationFrames?: unknown[];
} = {}) {
  return {
    o: options.opacityFrames ? moving(options.opacityFrames) : still(options.opacity ?? 100),
    r: options.rotationFrames ? moving(options.rotationFrames) : still(options.rotation ?? 0),
    p: options.positionFrames ? moving(options.positionFrames) : still(options.position ?? [0, 0, 0]),
    a: still([0, 0, 0]),
    s: options.scaleFrames ? moving(options.scaleFrames) : still(options.scale ?? [100, 100, 100]),
  };
}

function fill(color: Color, opacity = 100): Shape {
  return { ty: "fl", c: still(color), o: still(opacity), r: 1, nm: "Fill" };
}

function shapeTransform(): Shape {
  return {
    ty: "tr",
    p: still([0, 0]),
    a: still([0, 0]),
    s: still([100, 100]),
    r: still(0),
    o: still(100),
    sk: still(0),
    sa: still(0),
    nm: "Transform",
  };
}

function ellipse(size: Vec2, color: Color, position: Vec2 = [0, 0]): Shape[] {
  return [
    { ty: "el", p: still(position), s: still(size), nm: "Ellipse" },
    fill(color),
    shapeTransform(),
  ];
}

function roundedRect(
  size: Vec2,
  radius: number,
  color: Color,
  position: Vec2 = [0, 0],
): Shape[] {
  return [
    { ty: "rc", p: still(position), s: still(size), r: still(radius), nm: "Rectangle" },
    fill(color),
    shapeTransform(),
  ];
}

function layer(index: number, name: string, shapes: Shape[], ks: ReturnType<typeof transform>): Layer {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: name,
    sr: 1,
    ks,
    ao: 0,
    shapes,
    ip: 0,
    op: FRAMES,
    st: 0,
    bm: 0,
  };
}

function animation(name: string, layers: Layer[]) {
  return {
    v: "5.13.0",
    fr: FPS,
    ip: 0,
    op: FRAMES,
    w: WIDTH,
    h: HEIGHT,
    nm: name,
    ddd: 0,
    assets: [],
    layers,
  };
}

function oceanScene() {
  const layers: Layer[] = [];
  let index = 1;

  layers.push(
    layer(
      index++,
      "Sun glow",
      ellipse([126, 126], [1, 0.84, 0.42, 1]),
      transform({
        position: [760, 128, 0],
        scaleFrames: [
          keyframe(0, [62, 62, 100], [108, 108, 100]),
          keyframe(72, [108, 108, 100], [100, 100, 100]),
        ],
        opacityFrames: [keyframe(0, [0], [100]), keyframe(38, [100], [100])],
      }),
    ),
  );

  const waves: Array<{ y: number; color: Color; opacity: number; rotation: number }> = [
    { y: 392, color: [0.56, 0.9, 1, 1], opacity: 88, rotation: -2.2 },
    { y: 458, color: [0.23, 0.7, 0.9, 1], opacity: 78, rotation: 2.4 },
    { y: 520, color: [0.08, 0.43, 0.68, 1], opacity: 68, rotation: -2.2 },
  ];
  waves.forEach((wave, waveIndex) => {
    layers.push(
      layer(
        index++,
        `Wave ${waveIndex + 1}`,
        roundedRect([1160, 112 - waveIndex * 12], 54, wave.color),
        transform({
          positionFrames: [
            keyframe(0, [420 - waveIndex * 80, wave.y, 0], [540 + waveIndex * 55, wave.y - 10, 0]),
            keyframe(144, [540 + waveIndex * 55, wave.y - 10, 0], [540 + waveIndex * 55, wave.y - 10, 0]),
          ],
          rotation: wave.rotation,
          opacity: wave.opacity,
        }),
      ),
    );
  });

  const bubbles: Array<{ x: number; y: number; size: number }> = [
    { x: 124, y: 550, size: 32 },
    { x: 206, y: 496, size: 18 },
    { x: 330, y: 560, size: 26 },
    { x: 522, y: 536, size: 16 },
    { x: 610, y: 574, size: 24 },
    { x: 712, y: 530, size: 14 },
    { x: 846, y: 562, size: 22 },
  ];
  bubbles.forEach((bubble, bubbleIndex) => {
    const drift = bubbleIndex % 2 === 0 ? -18 : 26;
    layers.push(
      layer(
        index++,
        `Bubble ${bubbleIndex + 1}`,
        ellipse([bubble.size, bubble.size], [0.82, 0.97, 1, 1]),
        transform({
          positionFrames: [
            keyframe(bubbleIndex * 5, [bubble.x, bubble.y, 0], [bubble.x + drift, 142 + bubbleIndex * 13, 0]),
            keyframe(140, [bubble.x + drift, 142 + bubbleIndex * 13, 0], [bubble.x, 118, 0]),
          ],
          opacityFrames: [keyframe(0, [0], [74]), keyframe(118, [74], [0])],
        }),
      ),
    );
  });

  return animation("Quadro Ocean", layers);
}

function flowerShapes(petal: Color): Shape[] {
  const shapes: Shape[] = [];
  shapes.push(...roundedRect([9, 128], 5, [0.18, 0.52, 0.25, 1], [0, 62]));
  const petals: Vec2[] = [[0, -28], [25, -8], [16, 20], [-16, 20], [-25, -8]];
  petals.forEach((position) => shapes.push(...ellipse([42, 54], petal, position)));
  shapes.push(...ellipse([31, 31], [1, 0.72, 0.17, 1]));
  return shapes;
}

function meadowScene() {
  const layers: Layer[] = [];
  let index = 1;

  layers.push(
    layer(
      index++,
      "Sun",
      ellipse([110, 110], [1, 0.84, 0.36, 1]),
      transform({
        position: [774, 116, 0],
        scaleFrames: [
          keyframe(0, [45, 45, 100], [108, 108, 100]),
          keyframe(78, [108, 108, 100], [100, 100, 100]),
        ],
      }),
    ),
  );

  const flowers: Array<{ x: number; y: number; color: Color }> = [
    { x: 164, y: 452, color: [0.95, 0.34, 0.45, 1] },
    { x: 320, y: 486, color: [0.58, 0.38, 0.92, 1] },
    { x: 506, y: 446, color: [1, 0.45, 0.66, 1] },
    { x: 684, y: 492, color: [0.42, 0.65, 0.96, 1] },
    { x: 824, y: 454, color: [1, 0.55, 0.3, 1] },
  ];
  flowers.forEach((flower, flowerIndex) => {
    const lean = flowerIndex % 2 === 0 ? 7 : -7;
    layers.push(
      layer(
        index++,
        `Flower ${flowerIndex + 1}`,
        flowerShapes(flower.color),
        transform({
          position: [flower.x, flower.y, 0],
          scaleFrames: [
            keyframe(flowerIndex * 8, [8, 8, 100], [112, 112, 100]),
            keyframe(72 + flowerIndex * 4, [112, 112, 100], [100, 100, 100]),
          ],
          rotationFrames: [keyframe(0, [lean], [-lean * 0.55]), keyframe(144, [-lean * 0.55], [lean * 0.4])],
          opacityFrames: [keyframe(0, [0], [100]), keyframe(42 + flowerIndex * 4, [100], [100])],
        }),
      ),
    );
  });

  const pollen: Array<{ x: number; y: number }> = [
    { x: 98, y: 286 },
    { x: 222, y: 214 },
    { x: 416, y: 282 },
    { x: 584, y: 198 },
    { x: 748, y: 248 },
    { x: 862, y: 180 },
  ];
  pollen.forEach((dot, pollenIndex) => {
    const drift = pollenIndex % 2 === 0 ? -50 : 70;
    const size = 10 + (pollenIndex % 3) * 4;
    layers.push(
      layer(
        index++,
        `Pollen ${pollenIndex + 1}`,
        ellipse([size, size], [1, 0.92, 0.58, 1]),
        transform({
          positionFrames: [
            keyframe(0, [dot.x, dot.y + 60, 0], [dot.x + drift, dot.y - 34, 0]),
            keyframe(144, [dot.x + drift, dot.y - 34, 0], [dot.x + 10, dot.y - 74, 0]),
          ],
          opacityFrames: [keyframe(8, [0], [88]), keyframe(122, [88], [0])],
        }),
      ),
    );
  });

  return animation("Quadro Meadow", layers);
}

function cloudShapes(scale: number): Shape[] {
  const cloud: Color = [0.97, 0.99, 1, 1];
  return [
    ...ellipse([116 * scale, 70 * scale], cloud, [-48 * scale, 10 * scale]),
    ...ellipse([144 * scale, 92 * scale], cloud, [16 * scale, -10 * scale]),
    ...ellipse([105 * scale, 62 * scale], cloud, [82 * scale, 14 * scale]),
    ...roundedRect([232 * scale, 58 * scale], 29 * scale, cloud, [18 * scale, 22 * scale]),
  ];
}

function skyScene() {
  const layers: Layer[] = [];
  let index = 1;

  layers.push(
    layer(
      index++,
      "Sun",
      ellipse([136, 136], [1, 0.86, 0.42, 1]),
      transform({
        position: [760, 140, 0],
        scaleFrames: [
          keyframe(0, [76, 76, 100], [104, 104, 100]),
          keyframe(72, [104, 104, 100], [100, 100, 100]),
        ],
      }),
    ),
  );

  layers.push(
    layer(
      index++,
      "Cloud one",
      cloudShapes(0.92),
      transform({
        positionFrames: [keyframe(0, [-130, 202, 0], [298, 202, 0]), keyframe(144, [298, 202, 0], [362, 202, 0])],
        opacity: 92,
      }),
    ),
  );
  layers.push(
    layer(
      index++,
      "Cloud two",
      cloudShapes(0.7),
      transform({
        positionFrames: [keyframe(0, [1040, 330, 0], [738, 330, 0]), keyframe(144, [738, 330, 0], [670, 330, 0])],
        opacity: 78,
      }),
    ),
  );

  const birds: Array<{ x: number; y: number; rotation: number }> = [
    { x: 190, y: 118, rotation: -10 },
    { x: 254, y: 152, rotation: 8 },
    { x: 334, y: 104, rotation: -4 },
  ];
  birds.forEach((bird, birdIndex) => {
    const wings = [
      ...roundedRect([44, 8], 4, [0.12, 0.18, 0.28, 1], [-19, 0]),
      ...roundedRect([44, 8], 4, [0.12, 0.18, 0.28, 1], [19, 0]),
    ];
    layers.push(
      layer(
        index++,
        `Bird ${birdIndex + 1}`,
        wings,
        transform({
          positionFrames: [
            keyframe(0, [bird.x - 250, bird.y + 24, 0], [bird.x, bird.y, 0]),
            keyframe(144, [bird.x, bird.y, 0], [bird.x + 390, bird.y - 54, 0]),
          ],
          rotation: bird.rotation,
          scaleFrames: [keyframe(0, [70, 70, 100], [100, 100, 100]), keyframe(92, [100, 100, 100], [82, 82, 100])],
        }),
      ),
    );
  });

  return animation("Quadro Sky", layers);
}

function sunriseScene() {
  const layers: Layer[] = [];
  let index = 1;

  for (let ray = 0; ray < 12; ray += 1) {
    layers.push(
      layer(
        index++,
        `Ray ${ray + 1}`,
        roundedRect([8, 148], 4, [1, 0.83, 0.42, 1], [0, -112]),
        transform({
          position: [480, 350, 0],
          rotation: ray * 30,
          opacityFrames: [keyframe(ray * 2, [0], [62]), keyframe(108, [62], [28])],
          scaleFrames: [keyframe(0, [50, 50, 100], [108, 108, 100]), keyframe(86, [108, 108, 100], [100, 100, 100])],
        }),
      ),
    );
  }

  layers.push(
    layer(
      index++,
      "Rising sun",
      ellipse([190, 190], [1, 0.72, 0.28, 1]),
      transform({
        positionFrames: [keyframe(0, [480, 620, 0], [480, 364, 0]), keyframe(96, [480, 364, 0], [480, 346, 0])],
        scaleFrames: [keyframe(0, [72, 72, 100], [106, 106, 100]), keyframe(100, [106, 106, 100], [100, 100, 100])],
      }),
    ),
  );

  const horizons: Array<{ y: number; x: number; color: Color }> = [
    { y: 510, x: 480, color: [0.31, 0.2, 0.42, 1] },
    { y: 552, x: 540, color: [0.2, 0.16, 0.31, 1] },
  ];
  horizons.forEach((horizon, horizonIndex) => {
    layers.push(
      layer(
        index++,
        `Horizon ${horizonIndex + 1}`,
        roundedRect([1120, 98], 48, horizon.color),
        transform({ position: [horizon.x, horizon.y, 0], opacity: 92 }),
      ),
    );
  });

  return animation("Quadro Sunrise", layers);
}

function carShapes(): Shape[] {
  return [
    ...roundedRect([238, 74], 30, [0.95, 0.22, 0.2, 1], [0, 4]),
    ...roundedRect([116, 62], 22, [0.95, 0.22, 0.2, 1], [8, -44]),
    ...roundedRect([88, 38], 14, [0.62, 0.87, 0.98, 1], [10, -46]),
    ...ellipse([49, 49], [0.08, 0.1, 0.14, 1], [-70, 42]),
    ...ellipse([49, 49], [0.08, 0.1, 0.14, 1], [74, 42]),
    ...ellipse([18, 18], [0.68, 0.7, 0.75, 1], [-70, 42]),
    ...ellipse([18, 18], [0.68, 0.7, 0.75, 1], [74, 42]),
    ...roundedRect([28, 16], 8, [1, 0.88, 0.54, 1], [121, 2]),
  ];
}

function cityScene() {
  const layers: Layer[] = [];
  let index = 1;

  const buildings: Array<{ x: number; y: number; width: number; height: number; color: Color }> = [
    { x: 84, y: 340, width: 100, height: 248, color: [0.12, 0.15, 0.25, 1] },
    { x: 196, y: 392, width: 86, height: 144, color: [0.17, 0.2, 0.31, 1] },
    { x: 288, y: 316, width: 108, height: 296, color: [0.12, 0.15, 0.25, 1] },
    { x: 410, y: 370, width: 96, height: 188, color: [0.17, 0.2, 0.31, 1] },
    { x: 520, y: 292, width: 116, height: 342, color: [0.12, 0.15, 0.25, 1] },
    { x: 650, y: 354, width: 98, height: 218, color: [0.17, 0.2, 0.31, 1] },
    { x: 766, y: 304, width: 124, height: 318, color: [0.12, 0.15, 0.25, 1] },
    { x: 892, y: 382, width: 82, height: 164, color: [0.17, 0.2, 0.31, 1] },
  ];
  buildings.forEach((building, buildingIndex) => {
    layers.push(
      layer(
        index++,
        `Building ${buildingIndex + 1}`,
        roundedRect([building.width, building.height], 8, building.color),
        transform({
          position: [building.x, building.y, 0],
          opacityFrames: [keyframe(buildingIndex * 3, [0], [100]), keyframe(58 + buildingIndex * 2, [100], [100])],
        }),
      ),
    );
  });

  const streaks = [148, 210, 276, 340, 404];
  streaks.forEach((y, streakIndex) => {
    layers.push(
      layer(
        index++,
        `Speed streak ${streakIndex + 1}`,
        roundedRect([260 - streakIndex * 20, 6], 3, [0.74, 0.91, 1, 1]),
        transform({
          positionFrames: [keyframe(0, [1080, y, 0], [-220, y, 0]), keyframe(72, [-220, y, 0], [-220, y, 0])],
          opacityFrames: [keyframe(0, [0], [54]), keyframe(66, [54], [0])],
        }),
      ),
    );
  });

  layers.push(
    layer(
      index++,
      "Hero car",
      carShapes(),
      transform({
        positionFrames: [
          keyframe(8, [-230, 478, 0], [505, 478, 0]),
          keyframe(82, [505, 478, 0], [1180, 478, 0]),
          keyframe(128, [1180, 478, 0], [1180, 478, 0]),
        ],
        rotationFrames: [keyframe(0, [-2], [1.4]), keyframe(90, [1.4], [0])],
        scaleFrames: [keyframe(0, [82, 82, 100], [108, 108, 100]), keyframe(92, [108, 108, 100], [100, 100, 100])],
      }),
    ),
  );

  return animation("Quadro City Rush", layers);
}

const SCENES: Record<PuzzleIntroTheme, Omit<PuzzleIntroScene, "theme">> = {
  ocean: {
    eyebrow: "DERİN MAVİ",
    title: "Dalgaların arasından",
    durationMs: 2380,
    animationData: oceanScene(),
  },
  meadow: {
    eyebrow: "ÇİÇEK RÜZGÂRI",
    title: "Bir şeyler filizleniyor",
    durationMs: 2400,
    animationData: meadowScene(),
  },
  sky: {
    eyebrow: "AÇIK GÖKYÜZÜ",
    title: "Yukarı bak",
    durationMs: 2320,
    animationData: skyScene(),
  },
  sunrise: {
    eyebrow: "ALTIN SAAT",
    title: "Gün doğuyor",
    durationMs: 2440,
    animationData: sunriseScene(),
  },
  city: {
    eyebrow: "ŞEHİR AKIŞI",
    title: "Hızını yakala",
    durationMs: 2260,
    animationData: cityScene(),
  },
};

export function introThemeForPuzzle(puzzleId: string): PuzzleIntroTheme {
  const parsed = Number.parseInt(puzzleId.match(/\d+/)?.[0] ?? "1", 10);
  const numeric = Math.max(1, Number.isFinite(parsed) ? parsed : 1);
  switch ((numeric - 1) % 5) {
    case 0:
      return "ocean";
    case 1:
      return "meadow";
    case 2:
      return "sky";
    case 3:
      return "sunrise";
    default:
      return "city";
  }
}

export function puzzleIntroScene(puzzleId: string): PuzzleIntroScene {
  const theme = introThemeForPuzzle(puzzleId);
  return { theme, ...SCENES[theme] };
}
