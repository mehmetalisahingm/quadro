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

type Building = {
  x: number;
  width: number;
  height: number;
  depth: number;
  windows: number;
};

type GrassBlade = {
  x: number;
  y: number;
  height: number;
  lean: number;
  alpha: number;
};

type Flower = {
  x: number;
  y: number;
  scale: number;
  phase: number;
  hue: number;
};

type SceneState = {
  particles: Particle[];
  clouds: Cloud[];
  buildings: Building[];
  grass: GrassBlade[];
  flowers: Flower[];
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
  const particles = Array.from({ length: 48 }, () => ({
    x: random(),
    y: random(),
    size: 0.8 + random() * 3.6,
    speed: 0.018 + random() * 0.052,
    phase: random() * Math.PI * 2,
    alpha: 0.14 + random() * 0.48,
  }));
  const clouds = Array.from({ length: 7 }, (_, index) => ({
    x: random(),
    y: 0.08 + random() * 0.42,
    scale: 0.5 + random() * 0.92,
    speed: 0.006 + random() * 0.014 + index * 0.0006,
    alpha: 0.22 + random() * 0.34,
  }));
  const buildings: Building[] = [];
  let buildingX = -0.04;
  while (buildingX < 1.06) {
    const width = 0.055 + random() * 0.105;
    buildings.push({
      x: buildingX,
      width,
      height: 0.18 + random() * 0.34,
      depth: random(),
      windows: 3 + Math.floor(random() * 5),
    });
    buildingX += width * (0.72 + random() * 0.35);
  }
  const grass = Array.from({ length: 120 }, () => ({
    x: random(),
    y: 0.66 + random() * 0.35,
    height: 0.025 + random() * 0.08,
    lean: -0.5 + random(),
    alpha: 0.22 + random() * 0.5,
  }));
  const flowers = Array.from({ length: 24 }, () => ({
    x: random(),
    y: 0.67 + random() * 0.26,
    scale: 0.55 + random() * 0.9,
    phase: random() * Math.PI * 2,
    hue: 320 + random() * 120,
  }));
  const dust = Array.from({ length: 34 }, () => ({
    x: random(),
    y: random(),
    size: 0.4 + random() * 1.4,
    speed: 0.006 + random() * 0.014,
    phase: random() * Math.PI * 2,
    alpha: 0.06 + random() * 0.14,
  }));
  return { particles, clouds, buildings, grass, flowers, dust };
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

function radialGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: string,
  outer = "rgba(255,255,255,0)",
): CanvasGradient {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
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

function drawGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  context.save();
  context.globalCompositeOperation = "screen";
  context.fillStyle = radialGlow(context, x, y, radius, color);
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
): void {
  context.save();
  context.globalAlpha = alpha;
  context.shadowColor = "rgba(255,255,255,0.45)";
  context.shadowBlur = 26 * scale;
  context.fillStyle = "rgba(255,255,255,0.96)";
  const puffs = [
    [-52, 10, 34],
    [-22, -8, 46],
    [18, -17, 56],
    [60, 4, 40],
    [94, 13, 28],
  ] as const;
  for (const [dx, dy, radius] of puffs) {
    context.beginPath();
    context.arc(x + dx * scale, y + dy * scale, radius * scale, 0, Math.PI * 2);
    context.fill();
  }
  context.fillRect(x - 78 * scale, y + 2 * scale, 188 * scale, 36 * scale);
  context.restore();
}

function drawWave(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  y: number,
  amplitude: number,
  frequency: number,
  phase: number,
  color: string,
): void {
  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(0, y);
  const steps = 72;
  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * width;
    const waveY = y + Math.sin(index * frequency + phase) * amplitude;
    context.lineTo(x, waveY);
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
    [0, "#5dc9ff"],
    [0.34, "#8fd9f8"],
    [0.48, "#d7f4ff"],
    [0.49, "#1485b7"],
    [1, "#063d64"],
  ]);

  const sunX = width * 0.77;
  const sunY = height * 0.2;
  drawGlow(context, sunX, sunY, Math.min(width, height) * 0.25, "rgba(255,229,140,0.92)");
  context.fillStyle = "#ffe9a0";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.055, 0, Math.PI * 2);
  context.fill();

  for (const cloud of state.clouds.slice(0, 4)) {
    const x = ((cloud.x + time * cloud.speed) % 1.35 - 0.14) * width;
    drawCloud(context, x, cloud.y * height, cloud.scale * 0.7, cloud.alpha * 0.64);
  }

  const horizon = height * 0.5;
  drawWave(context, width, height, horizon + height * 0.04, 5, 0.5, time * 1.25, "rgba(21,132,181,0.82)");
  drawWave(context, width, height, horizon + height * 0.15, 11, 0.42, time * 1.6 + 1.1, "rgba(9,104,154,0.72)");
  drawWave(context, width, height, horizon + height * 0.29, 18, 0.35, time * 1.9 + 2.3, "rgba(4,67,108,0.84)");

  context.save();
  context.globalCompositeOperation = "screen";
  for (let line = 0; line < 22; line += 1) {
    const spread = line / 21;
    const y = horizon + height * 0.04 + spread * height * 0.42;
    const center = sunX + Math.sin(time * 0.7 + line) * 8;
    const halfWidth = width * (0.025 + spread * 0.12);
    context.strokeStyle = `rgba(255,231,164,${0.22 * (1 - spread * 0.5)})`;
    context.lineWidth = 1 + spread * 2;
    context.beginPath();
    context.moveTo(center - halfWidth, y);
    context.lineTo(center + halfWidth, y);
    context.stroke();
  }
  context.restore();

  for (const particle of state.particles) {
    const progress = (particle.y - time * particle.speed + 2) % 1;
    const x = (particle.x + Math.sin(time * 1.6 + particle.phase) * 0.016) * width;
    const y = (0.54 + progress * 0.46) * height;
    context.strokeStyle = `rgba(220,249,255,${particle.alpha})`;
    context.lineWidth = Math.max(1, particle.size * 0.75);
    context.beginPath();
    context.arc(x, y, particle.size * 2.1, 0, Math.PI * 2);
    context.stroke();
  }
}

function drawFlower(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  phase: number,
  hue: number,
  time: number,
): void {
  const sway = Math.sin(time * 1.7 + phase) * 4 * scale;
  const stem = 34 * scale;
  context.strokeStyle = "rgba(39,112,58,0.9)";
  context.lineWidth = Math.max(1, 2.2 * scale);
  context.beginPath();
  context.moveTo(x, y);
  context.quadraticCurveTo(x + sway * 0.4, y - stem * 0.55, x + sway, y - stem);
  context.stroke();

  const cx = x + sway;
  const cy = y - stem;
  for (let petal = 0; petal < 6; petal += 1) {
    const angle = (petal / 6) * Math.PI * 2 + time * 0.08;
    context.save();
    context.translate(cx, cy);
    context.rotate(angle);
    context.fillStyle = `hsla(${hue},82%,68%,0.94)`;
    context.beginPath();
    context.ellipse(0, -7 * scale, 4.5 * scale, 9 * scale, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
  context.fillStyle = "rgba(255,211,83,0.98)";
  context.beginPath();
  context.arc(cx, cy, 4.5 * scale, 0, Math.PI * 2);
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
    [0, "#67c5f0"],
    [0.43, "#c9efff"],
    [0.59, "#97cf78"],
    [1, "#285f37"],
  ]);
  const sunX = width * 0.8;
  const sunY = height * 0.17;
  drawGlow(context, sunX, sunY, Math.min(width, height) * 0.28, "rgba(255,234,150,0.9)");
  context.fillStyle = "#ffe7a0";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.048, 0, Math.PI * 2);
  context.fill();

  for (const cloud of state.clouds.slice(0, 5)) {
    const x = ((cloud.x + time * cloud.speed * 0.6) % 1.3 - 0.13) * width;
    drawCloud(context, x, cloud.y * height, cloud.scale * 0.6, cloud.alpha * 0.46);
  }

  context.fillStyle = "rgba(69,126,61,0.38)";
  context.beginPath();
  context.moveTo(0, height * 0.66);
  for (let index = 0; index <= 12; index += 1) {
    const x = (index / 12) * width;
    const y = height * (0.59 + Math.sin(index * 0.86) * 0.028);
    context.lineTo(x, y);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.fill();

  for (const blade of state.grass) {
    const x = blade.x * width;
    const y = blade.y * height;
    const bladeHeight = blade.height * height;
    const sway = Math.sin(time * 2 + blade.x * 18) * 4 + blade.lean * 8;
    context.strokeStyle = `rgba(28,92,49,${blade.alpha})`;
    context.lineWidth = 1.1;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + sway * 0.35, y - bladeHeight * 0.5, x + sway, y - bladeHeight);
    context.stroke();
  }

  for (const flower of state.flowers) {
    drawFlower(
      context,
      flower.x * width,
      flower.y * height,
      flower.scale,
      flower.phase,
      flower.hue,
      time,
    );
  }

  context.save();
  context.globalCompositeOperation = "screen";
  for (const particle of state.particles.slice(0, 32)) {
    const y = ((particle.y - time * particle.speed * 0.65 + 1.2) % 1) * height;
    const x = (particle.x + Math.sin(time * 0.9 + particle.phase) * 0.024) * width;
    drawGlow(context, x, y, particle.size * 4.5, `rgba(255,240,165,${particle.alpha * 0.7})`);
  }
  context.restore();
}

function drawBird(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  wing: number,
): void {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.strokeStyle = "rgba(31,48,66,0.76)";
  context.lineWidth = 2.2;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-12, 2);
  context.quadraticCurveTo(-5, -6 - wing * 4, 0, 0);
  context.quadraticCurveTo(5, -6 + wing * 4, 12, 2);
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
    [0, "#3a9ee7"],
    [0.55, "#83d3fb"],
    [1, "#e6f7ff"],
  ]);
  const sunX = width * 0.78;
  const sunY = height * 0.2;
  drawGlow(context, sunX, sunY, Math.min(width, height) * 0.34, "rgba(255,239,170,0.92)");
  context.fillStyle = "#fff0ad";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.057, 0, Math.PI * 2);
  context.fill();

  for (const cloud of state.clouds) {
    const x = ((cloud.x + time * cloud.speed) % 1.42 - 0.2) * width;
    drawCloud(context, x, cloud.y * height, cloud.scale, cloud.alpha + 0.18);
  }

  for (let index = 0; index < 5; index += 1) {
    const flight = (time * (0.045 + index * 0.003) + index * 0.19) % 1.35;
    const x = (-0.16 + flight) * width;
    const y = height * (0.18 + index * 0.065 + Math.sin(time * 0.8 + index) * 0.02);
    drawBird(context, x, y, 0.62 + index * 0.08, Math.sin(time * 5 + index));
  }

  context.save();
  context.globalCompositeOperation = "screen";
  const beam = context.createLinearGradient(0, height * 0.18, width, height * 0.86);
  beam.addColorStop(0, "rgba(255,255,255,0.18)");
  beam.addColorStop(0.55, "rgba(255,255,255,0.035)");
  beam.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = beam;
  context.beginPath();
  context.moveTo(sunX - 35, sunY + 28);
  context.lineTo(width * 0.42, height);
  context.lineTo(width * 0.76, height);
  context.closePath();
  context.fill();
  context.restore();
}

function drawMountain(
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
  const steps = 10;
  for (let index = 0; index <= steps; index += 1) {
    const x = (index / steps) * width;
    const y = baseY - Math.abs(Math.sin(index * 1.42 + phase)) * amplitude;
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
    [0, "#1b244f"],
    [0.27, "#6a466d"],
    [0.56, "#da715f"],
    [0.78, "#ffbd78"],
    [1, "#f7dcad"],
  ]);
  const rise = Math.min(1, time / 2.1);
  const sunX = width * 0.5;
  const sunY = height * (0.69 - rise * 0.13);
  drawGlow(context, sunX, sunY, Math.min(width, height) * (0.23 + rise * 0.08), "rgba(255,200,102,0.92)");
  context.fillStyle = "#ffd484";
  context.beginPath();
  context.arc(sunX, sunY, Math.min(width, height) * 0.07, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.globalCompositeOperation = "screen";
  context.translate(sunX, sunY);
  context.rotate(time * 0.025);
  for (let ray = 0; ray < 18; ray += 1) {
    context.rotate((Math.PI * 2) / 18);
    const gradient = context.createLinearGradient(0, 0, 0, -height * 0.6);
    gradient.addColorStop(0, "rgba(255,225,153,0.16)");
    gradient.addColorStop(1, "rgba(255,225,153,0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(-4, 0);
    context.lineTo(4, 0);
    context.lineTo(18, -height * 0.58);
    context.lineTo(-18, -height * 0.58);
    context.closePath();
    context.fill();
  }
  context.restore();

  drawMountain(context, width, height, height * 0.76, height * 0.17, "rgba(47,41,70,0.78)", 0.2);
  drawMountain(context, width, height, height * 0.83, height * 0.12, "rgba(34,38,59,0.92)", 1.2);

  context.save();
  for (const cloud of state.clouds.slice(0, 4)) {
    const x = ((cloud.x + time * cloud.speed * 0.45) % 1.3 - 0.12) * width;
    drawCloud(context, x, (0.28 + cloud.y * 0.5) * height, cloud.scale * 0.52, cloud.alpha * 0.18);
  }
  context.restore();

  for (let band = 0; band < 4; band += 1) {
    context.fillStyle = `rgba(255,226,191,${0.08 - band * 0.012})`;
    context.beginPath();
    const y = height * (0.73 + band * 0.06 + Math.sin(time * 0.3 + band) * 0.008);
    context.ellipse(width * 0.5, y, width * (0.42 - band * 0.04), height * 0.032, 0, 0, Math.PI * 2);
    context.fill();
  }
}

function drawRoundedRect(
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

function drawCity(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  fillBackground(context, width, height, [
    [0, "#101a38"],
    [0.4, "#293e63"],
    [0.68, "#704e67"],
    [1, "#171c2b"],
  ]);
  drawGlow(context, width * 0.72, height * 0.16, Math.min(width, height) * 0.24, "rgba(255,176,113,0.36)");

  const skylineY = height * 0.67;
  for (const building of state.buildings) {
    const x = building.x * width;
    const buildingWidth = building.width * width;
    const buildingHeight = building.height * height;
    const y = skylineY - buildingHeight;
    const shade = Math.round(22 + building.depth * 22);
    context.fillStyle = `rgb(${shade} ${shade + 7} ${shade + 24})`;
    context.fillRect(x, y, buildingWidth, buildingHeight + height * 0.08);

    const columns = Math.max(2, Math.floor(building.windows));
    const rows = Math.max(2, Math.floor(buildingHeight / 28));
    const gapX = buildingWidth / (columns + 1);
    const gapY = buildingHeight / (rows + 1);
    for (let row = 1; row <= rows; row += 1) {
      for (let column = 1; column <= columns; column += 1) {
        const lit = (row * 7 + column * 11 + Math.round(building.x * 100)) % 4 !== 0;
        context.fillStyle = lit ? "rgba(255,205,126,0.5)" : "rgba(120,160,198,0.12)";
        context.fillRect(x + gapX * column - 2, y + gapY * row - 2, 4, 4);
      }
    }
  }

  const roadTop = height * 0.67;
  context.fillStyle = "#151922";
  context.fillRect(0, roadTop, width, height - roadTop);
  const asphalt = context.createLinearGradient(0, roadTop, 0, height);
  asphalt.addColorStop(0, "rgba(72,77,87,0.5)");
  asphalt.addColorStop(1, "rgba(15,18,25,0.9)");
  context.fillStyle = asphalt;
  context.fillRect(0, roadTop, width, height - roadTop);

  for (let lane = 0; lane < 8; lane += 1) {
    const y = roadTop + (lane + 1) * ((height - roadTop) / 9);
    context.fillStyle = "rgba(255,220,140,0.22)";
    const offset = ((time * 170 + lane * 70) % 120) - 120;
    for (let x = offset; x < width + 120; x += 120) {
      context.fillRect(x, y, 54, 2);
    }
  }

  context.save();
  context.globalCompositeOperation = "screen";
  for (let streak = 0; streak < 12; streak += 1) {
    const y = roadTop + 20 + (streak / 12) * (height - roadTop - 34);
    const offset = ((time * (170 + streak * 7) + streak * 89) % (width + 240)) - 120;
    const gradient = context.createLinearGradient(offset - 180, y, offset + 36, y);
    gradient.addColorStop(0, "rgba(255,119,80,0)");
    gradient.addColorStop(0.7, "rgba(255,119,80,0.22)");
    gradient.addColorStop(1, "rgba(255,236,184,0.65)");
    context.strokeStyle = gradient;
    context.lineWidth = 1 + (streak % 3);
    context.beginPath();
    context.moveTo(offset - 180, y);
    context.lineTo(offset + 36, y);
    context.stroke();
  }
  context.restore();

  const carProgress = (time * 0.42) % 1.45;
  const carX = (-0.23 + carProgress) * width;
  const carY = height * 0.77;
  const carWidth = Math.max(120, width * 0.22);
  const carHeight = carWidth * 0.34;

  drawGlow(context, carX + carWidth * 0.9, carY + carHeight * 0.58, carWidth * 0.34, "rgba(255,238,191,0.55)");
  context.save();
  context.translate(carX, carY);
  const body = context.createLinearGradient(0, 0, 0, carHeight);
  body.addColorStop(0, "#f4f1ea");
  body.addColorStop(0.5, "#bfc8d1");
  body.addColorStop(1, "#687585");
  context.fillStyle = body;
  context.shadowColor = "rgba(0,0,0,0.35)";
  context.shadowBlur = 20;
  drawRoundedRect(context, 0, carHeight * 0.34, carWidth, carHeight * 0.42, carHeight * 0.12);
  context.fill();
  context.fillStyle = "rgba(126,180,216,0.78)";
  context.beginPath();
  context.moveTo(carWidth * 0.28, carHeight * 0.34);
  context.lineTo(carWidth * 0.42, 0);
  context.lineTo(carWidth * 0.72, 0);
  context.lineTo(carWidth * 0.84, carHeight * 0.34);
  context.closePath();
  context.fill();
  context.fillStyle = "#151a22";
  for (const wheelX of [carWidth * 0.24, carWidth * 0.78]) {
    context.beginPath();
    context.arc(wheelX, carHeight * 0.76, carHeight * 0.16, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#82909d";
    context.beginPath();
    context.arc(wheelX, carHeight * 0.76, carHeight * 0.07, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#151a22";
  }
  context.fillStyle = "#fff1c7";
  context.fillRect(carWidth * 0.91, carHeight * 0.46, carWidth * 0.08, carHeight * 0.08);
  context.restore();
}

function drawFilmFinish(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: SceneState,
): void {
  context.save();
  const vignette = context.createRadialGradient(
    width * 0.5,
    height * 0.48,
    Math.min(width, height) * 0.18,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.68,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(4,9,18,0.32)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

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
  drawFilmFinish(context, width, height, time, state);
}

export function startCinematicCanvas(
  canvas: HTMLCanvasElement,
  theme: PuzzleIntroTheme,
  seedText: string,
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
    resize();
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderTheme(context, theme, width, height, (timestamp - startedAt) / 1000, state);
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
