/**
 * Quadro'nun gerçek iki gruplu öğretici arayüzünü Chromium'da oynatarak sessiz
 * oynanış kaydı üretir. Günlük bulmaca çözümlerini ve kullanıcı verisini içermez.
 * Usage: node scripts/record-tutorial-video.mjs (server localhost:3000).
 */
import { chromium } from "@playwright/test";
import { mkdir, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const recordingDir = resolve(".quadro-recording");
await mkdir(recordingDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
  recordVideo: { dir: recordingDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const video = page.video();
try {
  await page.goto("http://127.0.0.1:3000/play?mode=tutorial", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Bağlantıyı bulmayı dene" }).waitFor();
  await page.waitForTimeout(1300);
  for (const word of ["İLKBAHAR", "YAZ", "SONBAHAR", "KIŞ"]) {
    await page.getByRole("button", { name: word, exact: true }).click();
    await page.waitForTimeout(600);
  }
  await page.getByRole("button", { name: "Kontrol et" }).click();
  await page.getByText("MEVSİMLER", { exact: true }).waitFor();
  await page.waitForTimeout(1400);
  for (const word of ["KUZEY", "GÜNEY", "DOĞU", "BATI"]) {
    await page.getByRole("button", { name: word, exact: true }).click();
    await page.waitForTimeout(600);
  }
  await page.getByRole("button", { name: "Kontrol et" }).click();
  await page.getByRole("heading", { name: "Öğretici tamamlandı" }).waitFor();
  await page.waitForTimeout(3000);
} finally {
  await context.close();
  await browser.close();
}
const recordings = (await readdir(recordingDir)).filter(f => f.endsWith(".webm"));
if (recordings.length !== 1 || !video) throw new Error("Expected exactly one browser recording");
const source = await video.path();
const output = resolve("public/videos/quadro-oynanis.mp4");
await mkdir(resolve("public/videos"), { recursive: true });
const cmd = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", source, "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-preset", "medium", "-movflags", "+faststart", output], { stdio: "inherit" });
if (cmd.error || cmd.status !== 0) throw new Error("MP4 encoding failed: " + String(cmd.error || cmd.status));
console.log("Generated actual gameplay recording: " + output);
