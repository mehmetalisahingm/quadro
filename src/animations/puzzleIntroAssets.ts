export type PuzzleIntroTheme = "ocean" | "meadow" | "sky" | "sunrise" | "city";

export type PuzzleIntroScene = {
  theme: PuzzleIntroTheme;
  eyebrow: string;
  title: string;
  durationMs: number;
  animationData: Record<string, unknown>;
};

type Point = [number, number, number];
type LottieLayer = Record<string, unknown>;
type LottieShape = Record<string, unknown>;

const WIDTH = 960;
const HEIGHT = 600;
const FPS = 60;
const FRAMES = 144;

const linear = (t: number, from: number[], to: number[]) => ({
  t,
  s: from,
  e: to,
  i: { x: [0.667], y: [1] },
  o: { x: [0.333], y: [0] },
});

const staticProp = (value: unknown) => ({ a: 0, k: value });
const animatedProp = (frames: unknown[]) => ({ a: 1, k: frames });

function transform({
  position = [0, 0, 0] as Point,
  scale = [100, 100, 100] as Point,
  opacity = 100,
  rotation = 0,
  positionFrames,
  scaleFrames,
  opacityFrames,
  rotationFrames,
}: {
  position?: Point;
  scale?: Point;
  opacity?: number;
  rotation?: number;
  positionFrames?: unknown[];
  scaleFrames?: unknown[];
  opacityFrames?: unknown[];
  rotationFrames?: unknown[];
} = {}) {
  return {
    o: opacityFrames ? animatedProp(opacityFrames) : staticProp(opacity),
    r: rotationFrames ? animatedProp(rotationFrames) : staticProp(rotation),
    p: positionFrames ? animatedProp(positionFrames) : staticProp(position),
    a: staticProp([0, 0, 0]),
    s: scaleFrames ? animatedProp(scaleFrames) : staticProp(scale),
  };
}

function fill(color: [number, number, number, number], opacity = 100): LottieShape {
  return {
    ty: "fl",
    c: staticProp(color),
    o: staticProp(opacity),
    r: 1,
    nm: "Fill",
  };
}

function ellipse(
  size: [number, number],
  color: [number, number, number, number],
  position: [number, number] = [0, 0],
): LottieShape[] {
  return [
    { ty: "el", p: staticProp(position), s: staticProp(size), nm: "Ellipse" },
    fill(color),
    {
      ty: "tr",
      p: staticProp([0, 0]),
      a: staticProp([0, 0]),
      s: staticProp([100, 100]),
      r: staticProp(0),
      o: staticProp(100),
      sk: staticProp(0),
      sa: staticProp(0),
      nm: "Transform",
    },
  ];
}

function roundedRect(
  size: [number, number],
  radius: number,
  color: [number, number, number, number],
  position: [number, number] = [0, 0],
): LottieShape[] {
  return [
    { ty: "rc", p: staticProp(position), s: staticProp(size), r: staticProp(radius), nm: "Rectangle" },
    fill(color),
    {
      ty: "tr",
      p: staticProp([0, 0]),
      a: staticProp([0, 0]),
      s: staticProp([100, 100]),
      r: staticProp(0),
      o: staticProp(100),
      sk: staticProp(0),
      sa: staticProp(0),
      nm: "Transform",
    },
  ];
}

function shapeLayer(
  index: number,
  name: string,
  shapes: LottieShape[],
  layerTransform: ReturnType<typeof transform>,
): LottieLayer {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: name,
    sr: 1,
    ks: layerTransform,
    ao: 0,
    shapes,
    ip: 0,
    op: FRAMES,
    st: 0,
    bm: 0,
  };
}

function baseAnimation(name: string, layers: LottieLayer[]) {
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
  const layers: LottieLayer[] = [];
  let index = 1;

  layers.push(
    shapeLayer(
      index++,
      "Sun glow",
      ellipse([126, 126], [1, 0.84, 0.42, 1]),
      transform({
        position: [760, 128, 0],
        scaleFrames: [linear(0, [62, 62, 100], [108, 108, 100]), linear(72, [108, 108, 100], [100, 100, 100])],
        opacityFrames: [linear(0, [0], [100]), linear(38, [100], [100])],
      }),
    ),
  );

  const waveColors: [number, number, number, number][] = [
    [0.56, 0.9, 1, 1],
    [0.23, 0.7, 0.9, 1],
    [0.08, 0.43, 0.68, 1],
  ];
  [392, 458, 520].forEach((y, waveIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Wave ${waveIndex + 1}`,
        roundedRect([1160, 112 - waveIndex * 12], 54, waveColors[waveIndex]),
        transform({
          positionFrames: [
            linear(0, [420 - waveIndex * 80, y, 0], [540 + waveIndex * 55, y - 10, 0]),
            linear(144, [540 + waveIndex * 55, y - 10, 0], [540 + waveIndex * 55, y - 10, 0]),
          ],
          rotation: waveIndex % 2 === 0 ? -2.2 : 2.4,
          opacity: 88 - waveIndex * 10,
        }),
      ),
    );
  });

  const bubblePositions = [
    [124, 550, 32],
    [206, 496, 18],
    [330, 560, 26],
    [522, 536, 16],
    [610, 574, 24],
    [712, 530, 14],
    [846, 562, 22],
  ] as const;
  bubblePositions.forEach(([x, y, size], bubbleIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Bubble ${bubbleIndex + 1}`,
        ellipse([size, size], [0.82, 0.97, 1, 1]),
        transform({
          positionFrames: [
            linear(bubbleIndex * 5, [x, y, 0], [x + (bubbleIndex % 2 ? 26 : -18), 142 + bubbleIndex * 13, 0]),
            linear(140, [x + (bubbleIndex % 2 ? 26 : -18), 142 + bubbleIndex * 13, 0], [x, 118, 0]),
          ],
          opacityFrames: [linear(0, [0], [74]), linear(118, [74], [0])],
        }),
      ),
    );
  });

  return baseAnimation("Quadro Ocean", layers);
}

function flowerShapes(petal: [number, number, number, number]): LottieShape[] {
  const items: LottieShape[] = [];
  items.push(...roundedRect([9, 128], 5, [0.18, 0.52, 0.25, 1], [0, 62]));
  const petalCenters: [number, number][] = [
    [0, -28],
    [25, -8],
    [16, 20],
    [-16, 20],
    [-25, -8],
  ];
  petalCenters.forEach((center) => {
    items.push(...ellipse([42, 54], petal, center));
  });
  items.push(...ellipse([31, 31], [1, 0.72, 0.17, 1], [0, 0]));
  return items;
}

function meadowScene() {
  const layers: LottieLayer[] = [];
  let index = 1;
  layers.push(
    shapeLayer(
      index++,
      "Sun",
      ellipse([110, 110], [1, 0.84, 0.36, 1]),
      transform({
        position: [774, 116, 0],
        scaleFrames: [linear(0, [45, 45, 100], [108, 108, 100]), linear(78, [108, 108, 100], [100, 100, 100])],
      }),
    ),
  );

  const flowerData = [
    [164, 452, [0.95, 0.34, 0.45, 1]],
    [320, 486, [0.58, 0.38, 0.92, 1]],
    [506, 446, [1, 0.45, 0.66, 1]],
    [684, 492, [0.42, 0.65, 0.96, 1]],
    [824, 454, [1, 0.55, 0.3, 1]],
  ] as const;

  flowerData.forEach(([x, y, color], flowerIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Flower ${flowerIndex + 1}`,
        flowerShapes(color as [number, number, number, number]),
        transform({
          position: [x, y, 0],
          scaleFrames: [
            linear(flowerIndex * 8, [8, 8, 100], [112, 112, 100]),
            linear(72 + flowerIndex * 4, [112, 112, 100], [100, 100, 100]),
          ],
          rotationFrames: [
            linear(0, [flowerIndex % 2 ? -7 : 7], [flowerIndex % 2 ? 4 : -4]),
            linear(144, [flowerIndex % 2 ? 4 : -4], [flowerIndex % 2 ? -3 : 3]),
          ],
          opacityFrames: [linear(0, [0], [100]), linear(42 + flowerIndex * 4, [100], [100])],
        }),
      ),
    );
  });

  const pollen = [
    [98, 286],
    [222, 214],
    [416, 282],
    [584, 198],
    [748, 248],
    [862, 180],
  ];
  pollen.forEach(([x, y], pollenIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Pollen ${pollenIndex + 1}`,
        ellipse([10 + (pollenIndex % 3) * 4, 10 + (pollenIndex % 3) * 4], [1, 0.92, 0.58, 1]),
        transform({
          positionFrames: [
            linear(0, [x, y + 60, 0], [x + (pollenIndex % 2 ? 70 : -50), y - 34, 0]),
            linear(144, [x + (pollenIndex % 2 ? 70 : -50), y - 34, 0], [x + 10, y - 74, 0]),
          ],
          opacityFrames: [linear(8, [0], [88]), linear(122, [88], [0])],
        }),
      ),
    );
  });

  return baseAnimation("Quadro Meadow", layers);
}

function cloudShapes(scale = 1): LottieShape[] {
  const c: [number, number, number, number] = [0.97, 0.99, 1, 1];
  return [
    ...ellipse([116 * scale, 70 * scale], c, [-48 * scale, 10 * scale]),
    ...ellipse([144 * scale, 92 * scale], c, [16 * scale, -10 * scale]),
    ...ellipse([105 * scale, 62 * scale], c, [82 * scale, 14 * scale]),
    ...roundedRect([232 * scale, 58 * scale], 29 * scale, c, [18 * scale, 22 * scale]),
  ];
}

function skyScene() {
  const layers: LottieLayer[] = [];
  let index = 1;
  layers.push(
    shapeLayer(
      index++,
      "Sun",
      ellipse([136, 136], [1, 0.86, 0.42, 1]),
      transform({
        position: [760, 140, 0],
        scaleFrames: [linear(0, [76, 76, 100], [104, 104, 100]), linear(72, [104, 104, 100], [100, 100, 100])],
      }),
    ),
  );
  layers.push(
    shapeLayer(
      index++,
      "Cloud one",
      cloudShapes(0.92),
      transform({
        positionFrames: [linear(0, [-130, 202, 0], [298, 202, 0]), linear(144, [298, 202, 0], [362, 202, 0])],
        opacity: 92,
      }),
    ),
  );
  layers.push(
    shapeLayer(
      index++,
      "Cloud two",
      cloudShapes(0.7),
      transform({
        positionFrames: [linear(0, [1040, 330, 0], [738, 330, 0]), linear(144, [738, 330, 0], [670, 330, 0])],
        opacity: 78,
      }),
    ),
  );

  const birds = [
    [190, 118, -10],
    [254, 152, 8],
    [334, 104, -4],
  ] as const;
  birds.forEach(([x, y, rotate], birdIndex) => {
    const wing: LottieShape[] = [
      ...roundedRect([44, 8], 4, [0.12, 0.18, 0.28, 1], [-19, 0]),
      ...roundedRect([44, 8], 4, [0.12, 0.18, 0.28, 1], [19, 0]),
    ];
    layers.push(
      shapeLayer(
        index++,
        `Bird ${birdIndex + 1}`,
        wing,
        transform({
          positionFrames: [linear(0, [x - 250, y + 24, 0], [x, y, 0]), linear(144, [x, y, 0], [x + 390, y - 54, 0])],
          rotation: rotate,
          scaleFrames: [linear(0, [70, 70, 100], [100, 100, 100]), linear(92, [100, 100, 100], [82, 82, 100])],
        }),
      ),
    );
  });

  return baseAnimation("Quadro Sky", layers);
}

function sunriseScene() {
  const layers: LottieLayer[] = [];
  let index = 1;

  for (let ray = 0; ray < 12; ray += 1) {
    layers.push(
      shapeLayer(
        index++,
        `Ray ${ray + 1}`,
        roundedRect([8, 148], 4, [1, 0.83, 0.42, 1], [0, -112]),
        transform({
          position: [480, 350, 0],
          rotation: ray * 30,
          opacityFrames: [linear(ray * 2, [0], [62]), linear(108, [62], [28])],
          scaleFrames: [linear(0, [50, 50, 100], [108, 108, 100]), linear(86, [108, 108, 100], [100, 100, 100])],
        }),
      ),
    );
  }

  layers.push(
    shapeLayer(
      index++,
      "Rising sun",
      ellipse([190, 190], [1, 0.72, 0.28, 1]),
      transform({
        positionFrames: [linear(0, [480, 620, 0], [480, 364, 0]), linear(96, [480, 364, 0], [480, 346, 0])],
        scaleFrames: [linear(0, [72, 72, 100], [106, 106, 100]), linear(100, [106, 106, 100], [100, 100, 100])],
      }),
    ),
  );

  const horizonColors: [number, number, number, number][] = [
    [0.31, 0.2, 0.42, 1],
    [0.2, 0.16, 0.31, 1],
  ];
  [510, 552].forEach((y, horizonIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Horizon ${horizonIndex + 1}`,
        roundedRect([1120, 98], 48, horizonColors[horizonIndex]),
        transform({ position: [480 + horizonIndex * 60, y, 0], opacity: 92 }),
      ),
    );
  });

  return baseAnimation("Quadro Sunrise", layers);
}

function carShapes(): LottieShape[] {
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
  const layers: LottieLayer[] = [];
  let index = 1;

  const buildings = [
    [84, 340, 100, 248],
    [196, 392, 86, 144],
    [288, 316, 108, 296],
    [410, 370, 96, 188],
    [520, 292, 116, 342],
    [650, 354, 98, 218],
    [766, 304, 124, 318],
    [892, 382, 82, 164],
  ] as const;
  buildings.forEach(([x, y, width, height], buildingIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Building ${buildingIndex + 1}`,
        roundedRect([width, height], 8, buildingIndex % 2 ? [0.17, 0.2, 0.31, 1] : [0.12, 0.15, 0.25, 1]),
        transform({
          position: [x, y, 0],
          opacityFrames: [linear(buildingIndex * 3, [0], [100]), linear(58 + buildingIndex * 2, [100], [100])],
        }),
      ),
    );
  });

  const streaks = [148, 210, 276, 340, 404] as const;
  streaks.forEach((y, streakIndex) => {
    layers.push(
      shapeLayer(
        index++,
        `Speed streak ${streakIndex + 1}`,
        roundedRect([260 - streakIndex * 20, 6], 3, [0.74, 0.91, 1, 1]),
        transform({
          positionFrames: [linear(0, [1080, y, 0], [-220, y + (streakIndex % 2 ? 8 : -8), 0]), linear(72, [-220, y, 0], [-220, y, 0])],
          opacityFrames: [linear(0, [0], [54]), linear(66, [54], [0])],
        }),
      ),
    );
  });

  layers.push(
    shapeLayer(
      index++,
      "Hero car",
      carShapes(),
      transform({
        positionFrames: [
          linear(8, [-230, 478, 0], [505, 478, 0]),
          linear(82, [505, 478, 0], [1180, 478, 0]),
          linear(128, [1180, 478, 0], [1180, 478, 0]),
        ],
        rotationFrames: [linear(0, [-2], [1.4]), linear(90, [1.4], [0])],
        scaleFrames: [linear(0, [82, 82, 100], [108, 108, 100]), linear(92, [108, 108, 100], [100, 100, 100])],
      }),
    ),
  );

  return baseAnimation("Quadro City Rush", layers);
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
  const numeric = Number.parseInt(puzzleId.match(/\d+/)?.[0] ?? "1", 10);
  const themes: PuzzleIntroTheme[] = ["ocean", "meadow", "sky", "sunrise", "city"];
  return themes[(Math.max(1, Number.isFinite(numeric) ? numeric : 1) - 1) % themes.length];
}

export function puzzleIntroScene(puzzleId: string): PuzzleIntroScene {
  const theme = introThemeForPuzzle(puzzleId);
  return { theme, ...SCENES[theme] };
}
