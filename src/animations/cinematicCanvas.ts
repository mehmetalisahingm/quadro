import type { PuzzleIntroTheme } from "./puzzleIntroAssets";

type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  alpha: number;
};

type Cloud = {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
};

type Flower = {
  x: number;
  y: number;
  scale: number;
  phase: number;
  hue: number;
};

type Building = {
  x: number;
  width: number;
  height: number;
  depth: number;
};

type SceneState = {
  particles: Particle[];
  clouds: Cloud[];
  flowers: Flower[];
  buildings: Building[];
  dust: Particle[];
};

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function buildState(seedText: string): SceneState {
  const random = mulberry32(hashText(seedText));
  const particles = Array.from({ length: 62 }, () => ({
    x: random(),
    y: random(),
    size: 0.8 + random() * 3.2,
    speed: 0.012 + random() * 0.045,
    phase: random() * Math.PI * 2,
    alpha: 0.12 + random() * 0.46,
  }));
  const clouds = Array.from({ length: 8 }, (_, index) => ({
    x: random(),
    y: 0.08 + random() * 0.4,
    scale: 0.48 + random() * 0.9,
    speed: 0.005 + random() * 0.011 + index * 0.0005,
    alpha: 0.22 + random() * 0.34,
  }));
  const flowers = Array.from({ length: 32 }, () => ({
    x: random(),
    y: 0.66 + random() * 0.28,
    scale: 0.5 + random() * 0.92,
    phase: random() * Math.PI * 2,
    hue: 300 + random() * 150,
  }));
  const buildings: Building[] = [];
  let buildingX = -0.05;
  while (buildingX < 1.08) {
    const width = 0.05 + random() * 0.085;
    buildings.push({
      x: buildingX,
      width,
      height: 0.19 + random() * 0.34,
      depth: random(),
    });
    buildingX += width * (0.78 + random() * 0.32);
  }
  const dust = Array.from({ length: 40 }, () => ({
    x: random(),
    y: random(),
    size: 0.5 + random() * 1.4,
    speed: 0.004 + random() * 0.01,
    phase: random() * Math.PI * 2,
    alpha: 0.035 + random() * 0.1,
  }));
  return { particles, clouds, flowers, buildings, dust };
}

function verticalGradient(
  context: CanvasRenderingContext2D,
  height: number,
  stops: readonly [number, string][],
): CanvasGradient {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}

function fillBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  stops: readonly [number, string][],
): void {
  context.fillStyle = verticalGradient(context, height, stops);
  context.fillRect(0, 0, width, height);
}

function glow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: string,
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function cloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
): void {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "rgba(255,255,255,0.96)";
  context.shadowColor = "rgba(255,255,255,0.32)";
  context.shadowBlur = 18 * scale;
  const blobs = [
    [-58, 9, 31],
    [-27, -8, 42],
    [10, -18, 51],
    [48, -4, 39],
    [78, 10, 29],
  ] as const;
  for (const [dx, dy, radius] of blobs) {
    context.beginPath();
    context.arc(x + dx * scale, y + dy * scale, radius * scale, 0, Math.PI * 2);
    context.fill();
  }
  context.fillRect(x - 73 * scale, y + 3 * scale, 164 * scale, 31 * scale);
  context.restore();
}

function wave(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  y: number,
  amplitude: number,
  wavelength: number,
  phase: number,
  color: string,
): void {
  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(0, y);
  for (let x = 0; x <= width + 8; x += 8) {
    context.lineTo(x, y + Math.sin(x / wavelength + phase) * amplitude);
  }
  context.lineTo(width, height);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function drawOcean(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  fillBackground(context, width, height, [
    [0, "#4db7ea"],
    [0.34, "#8dd8f4"],
    [0.48, "#d8f5ff"],
    [0.49, "#1585b4"],
    [0.72, "#0870a4"],
    [1, "#043654"],
  ]);

  const sunX = width * 0.76;
  const sunY = height * 0.18;
  glow(context, sunX, sunY, Math.min(width, height) * 0.26, "rgba(255,229,142,0.94)");
  context.fillStyle = "#ffe59a";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.048, 0, Math.PI * 2);
  context.fill();

  for (const item of state.clouds.slice(0, 4)) {
    const x = ((item.x + time * item.speed) % 1.34 - 0.14) * width;
    cloud(context, x, item.y * height, item.scale * 0.68, item.alpha * 0.58);
  }

  const horizon = height * 0.5;
  wave(context, width, height, horizon + height * 0.02, 4, 72, time * 1.2, "rgba(42,151,193,0.8)");
  wave(context, width, height, horizon + height * 0.13, 10, 62, time * 1.55 + 1.1, "rgba(13,112,163,0.8)");
  wave(context, width, height, horizon + height * 0.27, 16, 55, time * 1.85 + 2.2, "rgba(5,71,112,0.9)");

  context.save();
  context.globalCompositeOperation = "screen";
  for (let line = 0; line < 24; line += 1) {
    const spread = line / 23;
    const y = horizon + height * 0.04 + spread * height * 0.38;
    const half = width * (0.022 + spread * 0.13);
    const jitter = Math.sin(time * 1.1 + line * 0.9) * 8;
    context.strokeStyle = `rgba(255,231,166,${0.26 - spread * 0.12})`;
    context.lineWidth = 1 + spread * 2;
    context.beginPath();
    context.moveTo(sunX - half + jitter, y);
    context.lineTo(sunX + half + jitter, y);
    context.stroke();
  }
  context.restore();

  for (const particle of state.particles) {
    const progress = (particle.y - time * particle.speed + 2) % 1;
    const x = (particle.x + Math.sin(time * 1.6 + particle.phase) * 0.018) * width;
    const y = (0.52 + progress * 0.48) * height;
    context.strokeStyle = `rgba(223,249,255,${particle.alpha})`;
    context.lineWidth = Math.max(1, particle.size * 0.7);
    context.beginPath();
    context.arc(x, y, particle.size * 1.9, 0, Math.PI * 2);
    context.stroke();
  }
}

function flower(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  phase: number,
  hue: number,
  time: number,
): void {
  const sway = Math.sin(time * 1.55 + phase) * 5 * scale;
  const stem = 33 * scale;
  context.strokeStyle = "rgba(28,102,52,0.88)";
  context.lineWidth = Math.max(1, 2 * scale);
  context.beginPath();
  context.moveTo(x, y);
  context.quadraticCurveTo(x + sway * 0.32, y - stem * 0.55, x + sway, y - stem);
  context.stroke();

  const cx = x + sway;
  const cy = y - stem;
  for (let petal = 0; petal < 7; petal += 1) {
    const angle = (petal / 7) * Math.PI * 2 + Math.sin(time * 0.22 + phase) * 0.08;
    context.save();
    context.translate(cx, cy);
    context.rotate(angle);
    context.fillStyle = `hsla(${hue},84%,66%,0.96)`;
    context.beginPath();
    context.ellipse(0, -7.2 * scale, 4.7 * scale, 9.5 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  glow(context, cx, cy, 13 * scale, "rgba(255,216,91,0.36)");
  context.fillStyle = "#ffd65e";
  context.beginPath();
  context.arc(cx, cy, 4.4 * scale, 0, Math.PI * 2);
  context.fill();
}

function drawMeadow(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  fillBackground(context, width, height, [
    [0, "#5ebeea"],
    [0.42, "#c6ecfb"],
    [0.59, "#8cca70"],
    [0.75, "#5da755"],
    [1, "#255d38"],
  ]);

  const sunX = width * 0.8;
  const sunY = height * 0.16;
  glow(context, sunX, sunY, Math.min(width, height) * 0.27, "rgba(255,231,144,0.88)");
  context.fillStyle = "#ffe19a";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.044, 0, Math.PI * 2);
  context.fill();

  for (const item of state.clouds.slice(0, 5)) {
    const x = ((item.x + time * item.speed * 0.58) % 1.3 - 0.12) * width;
    cloud(context, x, item.y * height, item.scale * 0.58, item.alpha * 0.46);
  }

  context.fillStyle = "rgba(62,121,60,0.36)";
  context.beginPath();
  context.moveTo(0, height * 0.65);
  for (let index = 0; index <= 14; index += 1) {
    const x = (index / 14) * width;
    const y = height * (0.58 + Math.sin(index * 0.82 + 0.4) * 0.028);
    context.lineTo(x, y);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.fill();

  for (let index = 0; index < 160; index += 1) {
    const t = index / 159;
    const x = ((index * 53) % 163) / 163 * width;
    const y = height * (0.67 + ((index * 31) % 61) / 61 * 0.32);
    const blade = 8 + ((index * 17) % 21);
    const sway = Math.sin(time * 1.9 + t * 22) * 4;
    context.strokeStyle = `rgba(24,86,45,${0.18 + (index % 7) * 0.045})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + sway * 0.4, y - blade * 0.52, x + sway, y - blade);
    context.stroke();
  }

  for (const item of state.flowers) {
    flower(context, item.x * width, item.y * height, item.scale, item.phase, item.hue, time);
  }

  context.save();
  context.globalCompositeOperation = "screen";
  for (const particle of state.particles.slice(0, 42)) {
    const y = ((particle.y - time * particle.speed * 0.5 + 1.2) % 1) * height;
    const x = (particle.x + Math.sin(time * 0.8 + particle.phase) * 0.026) * width;
    glow(context, x, y, particle.size * 4.6, `rgba(255,239,163,${particle.alpha * 0.52})`);
  }
  context.restore();
}

function bird(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  wing: number,
): void {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.strokeStyle = "rgba(29,47,67,0.72)";
  context.lineWidth = 2.2;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-12, 2);
  context.quadraticCurveTo(-5, -7 - wing * 4, 0, 0);
  context.quadraticCurveTo(5, -7 + wing * 4, 12, 2);
  context.stroke();
  context.restore();
}

function drawSky(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  fillBackground(context, width, height, [
    [0, "#399be3"],
    [0.5, "#7fd0f8"],
    [1, "#e8f8ff"],
  ]);
  const sunX = width * 0.78;
  const sunY = height * 0.18;
  glow(context, sunX, sunY, Math.min(width, height) * 0.34, "rgba(255,239,171,0.94)");
  context.fillStyle = "#fff0ae";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.052, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.globalCompositeOperation = "screen";
  const beam = context.createLinearGradient(sunX, sunY, width * 0.4, height);
  beam.addColorStop(0, "rgba(255,255,255,0.22)");
  beam.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = beam;
  context.beginPath();
  context.moveTo(sunX - 30, sunY + 25);
  context.lineTo(width * 0.34, height);
  context.lineTo(width * 0.7, height);
  context.closePath();
  context.fill();
  context.restore();

  for (const item of state.clouds) {
    const x = ((item.x + time * item.speed) % 1.42 - 0.2) * width;
    cloud(context, x, item.y * height, item.scale, item.alpha + 0.16);
  }

  for (let index = 0; index < 6; index += 1) {
    const flight = (time * (0.046 + index * 0.002) + index * 0.2) % 1.36;
    const x = (-0.18 + flight) * width;
    const y = height * (0.17 + index * 0.055 + Math.sin(time * 0.8 + index) * 0.018);
    bird(context, x, y, 0.58 + index * 0.07, Math.sin(time * 5 + index));
  }
}

function mountains(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseY: number,
  amplitude: number,
  color: string,
  phase: number,
): void {
  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(0, baseY);
  for (let index = 0; index <= 12; index += 1) {
    const x = (index / 12) * width;
    const y = baseY - Math.abs(Math.sin(index * 1.38 + phase)) * amplitude;
    context.lineTo(x, y);
  }
  context.lineTo(width, height);
  context.closePath();
  context.fillStyle = color;
  context.fill();
}

function drawSunrise(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  fillBackground(context, width, height, [
    [0, "#19224d"],
    [0.27, "#644367"],
    [0.54, "#d16b5a"],
    [0.78, "#ffb972"],
    [1, "#f9ddb0"],
  ]);

  const rise = Math.min(1, time / 2.15);
  const sunX = width * 0.5;
  const sunY = height * (0.7 - rise * 0.14);
  glow(context, sunX, sunY, Math.min(width, height) * (0.24 + rise * 0.09), "rgba(255,202,106,0.92)");
  context.fillStyle = "#ffd483";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.066, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.globalCompositeOperation = "screen";
  context.translate(sunX, sunY);
  context.rotate(time * 0.018);
  for (let ray = 0; ray < 20; ray += 1) {
    context.rotate((Math.PI * 2) / 20);
    const rayGradient = context.createLinearGradient(0, 0, 0, -height * 0.62);
    rayGradient.addColorStop(0, "rgba(255,226,155,0.15)");
    rayGradient.addColorStop(1, "rgba(255,226,155,0)");
    context.fillStyle = rayGradient;
    context.beginPath();
    context.moveTo(-3, 0);
    context.lineTo(3, 0);
    context.lineTo(17, -height * 0.6);
    context.lineTo(-17, -height * 0.6);
    context.closePath();
    context.fill();
  }
  context.restore();

  mountains(context, width, height, height * 0.76, height * 0.17, "rgba(52,42,73,0.76)", 0.2);
  mountains(context, width, height, height * 0.84, height * 0.12, "rgba(31,36,57,0.94)", 1.1);

  for (let band = 0; band < 5; band += 1) {
    context.fillStyle = `rgba(255,226,192,${0.09 - band * 0.012})`;
    context.beginPath();
    const y = height * (0.73 + band * 0.055 + Math.sin(time * 0.3 + band) * 0.007);
    context.ellipse(width * 0.5, y, width * (0.43 - band * 0.045), height * 0.026, 0, 0, Math.PI * 2);
    context.fill();
  }

  for (const item of state.clouds.slice(0, 4)) {
    const x = ((item.x + time * item.speed * 0.4) % 1.3 - 0.12) * width;
    cloud(context, x, (0.28 + item.y * 0.46) * height, item.scale * 0.52, item.alpha * 0.16);
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function formulaCar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  time: number,
): void {
  const height = length * 0.29;
  context.save();
  context.translate(x, y);
  context.shadowColor = "rgba(0,0,0,0.5)";
  context.shadowBlur = 24;

  const rearWheelX = length * 0.23;
  const frontWheelX = length * 0.78;
  const wheelY = height * 0.68;
  const wheelRadius = height * 0.2;

  for (const wheelX of [rearWheelX, frontWheelX]) {
    context.fillStyle = "#08090c";
    context.beginPath();
    context.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(215,220,226,0.44)";
    context.lineWidth = Math.max(1, length * 0.006);
    context.beginPath();
    context.arc(wheelX, wheelY, wheelRadius * 0.52, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#4a505a";
    context.beginPath();
    context.arc(wheelX, wheelY, wheelRadius * 0.25, 0, Math.PI * 2);
    context.fill();
  }

  const bodyGradient = context.createLinearGradient(0, 0, length, 0);
  bodyGradient.addColorStop(0, "#7a1018");
  bodyGradient.addColorStop(0.38, "#e22e38");
  bodyGradient.addColorStop(0.7, "#f35646");
  bodyGradient.addColorStop(1, "#bd1925");
  context.fillStyle = bodyGradient;
  context.beginPath();
  context.moveTo(length * 0.12, height * 0.58);
  context.lineTo(length * 0.3, height * 0.51);
  context.lineTo(length * 0.42, height * 0.28);
  context.lineTo(length * 0.58, height * 0.22);
  context.lineTo(length * 0.67, height * 0.48);
  context.lineTo(length * 0.92, height * 0.53);
  context.lineTo(length, height * 0.64);
  context.lineTo(length * 0.9, height * 0.72);
  context.lineTo(length * 0.18, height * 0.74);
  context.closePath();
  context.fill();

  context.fillStyle = "#151821";
  context.beginPath();
  context.ellipse(length * 0.55, height * 0.37, length * 0.085, height * 0.18, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#d9dde3";
  context.lineWidth = Math.max(2, length * 0.008);
  context.beginPath();
  context.arc(length * 0.55, height * 0.39, length * 0.055, Math.PI * 1.05, Math.PI * 1.95);
  context.stroke();

  context.fillStyle = "#0d1016";
  roundedRect(context, length * 0.06, height * 0.45, length * 0.12, height * 0.09, height * 0.025);
  context.fill();
  roundedRect(context, length * 0.82, height * 0.37, length * 0.17, height * 0.06, height * 0.02);
  context.fill();

  context.fillStyle = "rgba(255,255,255,0.8)";
  context.fillRect(length * 0.86, height * 0.51, length * 0.075, height * 0.025);

  context.fillStyle = "rgba(12,14,19,0.95)";
  context.fillRect(length * 0.14, height * 0.31, length * 0.08, height * 0.28);
  context.fillRect(length * 0.17, height * 0.24, length * 0.14, height * 0.055);

  context.strokeStyle = "rgba(255,110,80,0.4)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(length * 0.22, height * 0.76);
  context.lineTo(length * 0.72, height * 0.76 + Math.sin(time * 8) * 1.5);
  context.stroke();

  context.restore();
}

function drawCity(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  fillBackground(context, width, height, [
    [0, "#0d1530"],
    [0.42, "#293c5e"],
    [0.67, "#684a61"],
    [1, "#161b29"],
  ]);

  glow(context, width * 0.73, height * 0.14, Math.min(width, height) * 0.24, "rgba(255,176,111,0.32)");

  const skylineY = height * 0.66;
  for (const building of state.buildings) {
    const x = building.x * width;
    const buildingWidth = building.width * width;
    const buildingHeight = building.height * height;
    const y = skylineY - buildingHeight;
    const shade = Math.round(19 + building.depth * 24);
    context.fillStyle = `rgb(${shade} ${shade + 7} ${shade + 23})`;
    context.fillRect(x, y, buildingWidth, buildingHeight + height * 0.06);

    const columns = Math.max(2, Math.floor(buildingWidth / 22));
    const rows = Math.max(3, Math.floor(buildingHeight / 27));
    const gapX = buildingWidth / (columns + 1);
    const gapY = buildingHeight / (rows + 1);
    for (let row = 1; row <= rows; row += 1) {
      for (let column = 1; column <= columns; column += 1) {
        const lit = (row * 5 + column * 7 + Math.floor(building.x * 100)) % 4 !== 0;
        context.fillStyle = lit ? "rgba(255,207,128,0.48)" : "rgba(117,158,201,0.1)";
        context.fillRect(x + gapX * column - 2, y + gapY * row - 2, 4, 4);
      }
    }
  }

  const roadTop = height * 0.66;
  const asphalt = context.createLinearGradient(0, roadTop, 0, height);
  asphalt.addColorStop(0, "#303640");
  asphalt.addColorStop(0.35, "#20252e");
  asphalt.addColorStop(1, "#0f1219");
  context.fillStyle = asphalt;
  context.fillRect(0, roadTop, width, height - roadTop);

  context.save();
  context.globalCompositeOperation = "screen";
  for (let streak = 0; streak < 18; streak += 1) {
    const y = roadTop + 10 + (streak / 18) * (height - roadTop - 20);
    const speed = 210 + streak * 9;
    const head = ((time * speed + streak * 97) % (width + 380)) - 190;
    const tail = 120 + (streak % 5) * 26;
    const gradient = context.createLinearGradient(head - tail, y, head + 24, y);
    gradient.addColorStop(0, "rgba(255,95,72,0)");
    gradient.addColorStop(0.72, streak % 3 === 0 ? "rgba(255,80,66,0.28)" : "rgba(104,190,255,0.18)");
    gradient.addColorStop(1, "rgba(255,240,200,0.68)");
    context.strokeStyle = gradient;
    context.lineWidth = 1 + (streak % 4) * 0.55;
    context.beginPath();
    context.moveTo(head - tail, y);
    context.lineTo(head + 24, y);
    context.stroke();
  }
  context.restore();

  for (let lane = 0; lane < 5; lane += 1) {
    const y = roadTop + (lane + 1) * ((height - roadTop) / 6);
    const offset = ((time * 210 + lane * 73) % 138) - 138;
    context.fillStyle = "rgba(247,223,166,0.21)";
    for (let x = offset; x < width + 140; x += 138) context.fillRect(x, y, 58, 2);
  }

  const pass = Math.min(1.18, time / 1.78);
  const eased = 1 - Math.pow(1 - Math.min(1, pass), 3);
  const carLength = Math.max(178, width * 0.28);
  const carX = -carLength * 1.12 + eased * (width + carLength * 1.45);
  const carY = height * 0.73;

  context.save();
  context.globalCompositeOperation = "screen";
  const trail = context.createLinearGradient(carX - carLength * 1.4, carY, carX + carLength * 0.12, carY);
  trail.addColorStop(0, "rgba(255,82,64,0)");
  trail.addColorStop(0.82, "rgba(255,88,68,0.2)");
  trail.addColorStop(1, "rgba(255,224,181,0.68)");
  context.fillStyle = trail;
  context.fillRect(carX - carLength * 1.4, carY + carLength * 0.13, carLength * 1.55, 4);
  context.restore();

  glow(context, carX + carLength * 0.92, carY + carLength * 0.16, carLength * 0.22, "rgba(255,233,190,0.4)");
  formulaCar(context, carX, carY, carLength, time);
}

function filmFinish(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.2,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.68,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(4,9,18,0.3)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalCompositeOperation = "screen";
  for (const particle of state.dust) {
    const x = (particle.x + Math.sin(time * 0.21 + particle.phase) * 0.006) * width;
    const y = (particle.y + Math.cos(time * 0.17 + particle.phase) * 0.005) * height;
    context.fillStyle = `rgba(255,255,255,${particle.alpha})`;
    context.fillRect(x, y, particle.size, particle.size);
  }
  context.restore();
}

function renderTheme(
  context: CanvasRenderingContext2D,
  theme: PuzzleIntroTheme,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  context.clearRect(0, 0, width, height);
  if (theme === "ocean") drawOcean(context, width, height, time, state);
  else if (theme === "meadow") drawMeadow(context, width, height, time, state);
  else if (theme === "sky") drawSky(context, width, height, time, state);
  else if (theme === "sunrise") drawSunrise(context, width, height, time, state);
  else drawCity(context, width, height, time, state);
  filmFinish(context, width, height, time, state);
}

export function startCinematicCanvas(
  canvas: HTMLCanvasElement,
  theme: PuzzleIntroTheme,
  seedText: string,
  onFrame?: (source: HTMLCanvasElement) => void,
): () => void {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return () => undefined;

  const state = buildState(`${theme}:${seedText}`);
  let width = 1;
  let height = 1;
  let dpr = 1;
  let frame = 0;
  let stopped = false;
  let startedAt = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  };

  const draw = (timestamp: number) => {
    if (stopped) return;
    if (startedAt === 0) startedAt = timestamp;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderTheme(context, theme, width, height, (timestamp - startedAt) / 1000, state);
    onFrame?.(canvas);
    frame = window.requestAnimationFrame(draw);
  };

  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  observer?.observe(canvas);
  resize();
  frame = window.requestAnimationFrame(draw);

  return () => {
    stopped = true;
    if (frame) window.cancelAnimationFrame(frame);
    observer?.disconnect();
  };
}
