import assert from "node:assert/strict";

import { chromium } from "@playwright/test";

const baseURL = process.env.QUADRO_BASE_URL ?? "http://127.0.0.1:3000";

const groups = [
  ["KIRMIZI", "MAVİ", "YEŞİL", "SARI"],
  ["ELMA", "ARMUT", "KİRAZ", "İNCİR"],
  ["MARS", "VENÜS", "SATÜRN", "MERKÜR"],
  ["ADANA", "BURSA", "İZMİR", "MUĞLA"],
];

const groupTitles = ["RENKLER", "MEYVELER", "GEZEGENLER", "ŞEHİRLER"];
const allWords = groups.flat();

function wordButton(page, word) {
  return page.getByRole("button", { name: word, exact: true });
}

async function selectWords(page, words) {
  for (const word of words) {
    const button = wordButton(page, word);
    await button.waitFor({ state: "visible" });
    await button.click();
    assert.equal(await button.getAttribute("aria-pressed"), "true", `${word} seçili olmalı`);
  }
}

async function submit(page, words) {
  await selectWords(page, words);
  await page.getByRole("button", { name: "Grupla", exact: true }).click();
}

async function waitForTransition(page) {
  await page.getByRole("button", { name: "Grupla", exact: true }).waitFor({ state: "visible" });
}

async function openContext(browser, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ baseURL, viewport });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
  return context;
}

async function verifySpoilerFreeShare(page, expectedScore) {
  const preview = page.getByLabel("Spoilersız paylaşım önizlemesi");
  await preview.waitFor({ state: "visible" });
  const text = (await preview.textContent()) ?? "";

  assert.match(text, new RegExp(`^Quadro 2026-09-20 ${expectedScore}`, "u"));

  for (const secret of [...allWords, ...groupTitles]) {
    assert.equal(text.includes(secret), false, `Paylaşım metni cevap sızdırmamalı: ${secret}`);
  }

  await page.getByRole("button", { name: "Kopyala", exact: true }).click();
  await page.getByText("Sonuç panoya kopyalandı.", { exact: true }).waitFor({ state: "visible" });
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(clipboard, text, "Panodaki paylaşım metni önizlemeyle aynı olmalı");
}

async function runWinFlow(browser) {
  const context = await openContext(browser);
  const page = await context.newPage();

  await page.goto("/");
  await page.getByRole("link", { name: "Bugünün bulmacasını çöz", exact: true }).click();
  await page.waitForURL("**/play");
  await page.getByRole("heading", { name: "Gizli bağları bul", exact: true }).waitFor();

  for (let index = 0; index < groups.length; index += 1) {
    await submit(page, groups[index]);
    if (index < groups.length - 1) {
      await page.getByText(groupTitles[index], { exact: true }).waitFor({ state: "visible" });
      await waitForTransition(page);
    }
  }

  await page.getByRole("heading", { name: "Dört bağı da buldun.", exact: true }).waitFor();
  assert.equal(await page.locator(".q-game-board").count(), 0, "Terminal durumda tahta kalkmalı");
  await verifySpoilerFreeShare(page, "4/4");

  await context.close();
}

async function runLossFlow(browser) {
  const context = await openContext(browser);
  const page = await context.newPage();
  await page.goto("/play");

  const wrongAttempts = [
    ["KIRMIZI", "ELMA", "MARS", "ADANA"],
    ["MAVİ", "ARMUT", "VENÜS", "BURSA"],
    ["YEŞİL", "KİRAZ", "SATÜRN", "İZMİR"],
    ["SARI", "İNCİR", "MERKÜR", "MUĞLA"],
  ];

  for (let index = 0; index < wrongAttempts.length; index += 1) {
    await submit(page, wrongAttempts[index]);
    if (index < wrongAttempts.length - 1) {
      await waitForTransition(page);
      await page.getByRole("button", { name: "Temizle", exact: true }).click();
    }
  }

  await page.getByRole("heading", { name: "Bugünlük bu kadar.", exact: true }).waitFor();
  assert.equal(await page.getByText("Cevap", { exact: true }).count(), 4, "Kayıpta dört cevap açılmalı");
  await verifySpoilerFreeShare(page, "0/4");

  await context.close();
}

async function runMobileFlow(browser) {
  const context = await openContext(browser, { width: 320, height: 800 });
  const page = await context.newPage();
  await page.goto("/play");
  await page.getByRole("heading", { name: "Gizli bağları bul", exact: true }).waitFor();

  const metrics = await page.evaluate(() => {
    const board = document.querySelector(".q-game-board");
    const rect = board?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      boardLeft: rect?.left ?? -1,
      boardRight: rect?.right ?? Number.POSITIVE_INFINITY,
    };
  });

  assert.equal(metrics.viewportWidth, 320);
  assert.ok(metrics.documentWidth <= metrics.viewportWidth, `320px görünüm yatay taşmamalı: ${metrics.documentWidth}px`);
  assert.ok(metrics.boardLeft >= 0, "Tahta viewport dışına sola taşmamalı");
  assert.ok(metrics.boardRight <= metrics.viewportWidth + 0.5, "Tahta viewport dışına sağa taşmamalı");
  assert.equal(await page.locator(".q-word-tile").count(), 16, "Mobilde 16 kartın tamamı çizilmeli");

  const firstTile = page.locator(".q-word-tile").first();
  await firstTile.click();
  assert.equal(await firstTile.getAttribute("aria-pressed"), "true", "Mobilde kart seçimi çalışmalı");

  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runWinFlow(browser);
  await runLossFlow(browser);
  await runMobileFlow(browser);
  console.log("Q17 Playwright Chromium smoke: PASS");
} finally {
  await browser.close();
}
