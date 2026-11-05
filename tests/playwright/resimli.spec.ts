import { mkdirSync, readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

// Dosya sıralı koşar: paralel yükü artırıp süreye duyarlı klasik akış testlerini zaman aşımına düşürmesin.
test.describe.configure({ mode: "default" });

const KANIT_DIZINI = process.env.QUADRO_KANIT_DIZINI;

async function kanit(page: Page, ad: string): Promise<void> {
  if (!KANIT_DIZINI) return;
  mkdirSync(KANIT_DIZINI, { recursive: true });
  await page.screenshot({ path: `${KANIT_DIZINI}/${ad}.png`, fullPage: true });
}

const tahta = (page: Page) => page.getByLabel(/görselli oyun tahtası$/);

async function tasmaYok(page: Page): Promise<void> {
  const olcu = await page.evaluate(() => ({
    pencere: window.innerWidth,
    belge: document.documentElement.scrollWidth,
  }));
  expect(olcu.belge).toBeLessThanOrEqual(olcu.pencere);
}

for (const genislik of [320, 390]) {
  test(`${genislik}px: görseller okunur, yatay taşma yok`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 800 });
    await page.goto("/pictures/board?board=3");
    await expect(tahta(page).getByRole("button")).toHaveCount(16);
    await expect(tahta(page).locator('[data-image-status="loaded"]')).toHaveCount(16);
    await tasmaYok(page);

    const olcu = await tahta(page).locator(".q-picture-image").first().boundingBox();
    expect(olcu?.width ?? 0).toBeGreaterThanOrEqual(55);
    const ilk = tahta(page).getByRole("button").first();
    await ilk.click();
    await expect(ilk).toHaveAttribute("aria-pressed", "true");
    await kanit(page, `mobil-${genislik}`);
  });
}

test("masaüstü: ana ekrandan girilir, tahta klavyeyle oynanır", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("link", { name: "Görsellerle oyna ↗" }).click();
  await expect(page.getByRole("heading", { name: "Resimli Quadro" })).toBeVisible();
  await kanit(page, "lobi");

  await page.getByRole("link", { name: /Tahta 1/ }).click();
  await expect(tahta(page).locator('[data-image-status="loaded"]')).toHaveCount(16);
  await tasmaYok(page);

  const ilk = tahta(page).getByRole("button").first();
  await ilk.focus();
  await page.keyboard.press("Enter");
  await expect(ilk).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Space");
  await expect(ilk).toHaveAttribute("aria-pressed", "false");
  await ilk.click();
  await kanit(page, "masaustu");
});

test("yavaş ve başarısız görsel: açıklama gösterilir, yeniden deneme çalışır", async ({ page }) => {
  let engelli = true;
  await page.route("**/images/pictures/*.svg*", async (route) => {
    if (engelli) await route.abort();
    else await route.continue();
  });
  await page.goto("/pictures/board?board=1");

  await expect(tahta(page).locator('[data-image-status="failed"]')).toHaveCount(16);
  await tasmaYok(page);
  await kanit(page, "yukleme-hatasi");

  const ilk = tahta(page).locator(".q-picture-tile").first();
  await ilk.click();
  await expect(ilk).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("4 hata hakkı kaldı")).toBeAttached();

  engelli = false;
  await tahta(page).getByRole("button", { name: /görselini yeniden yükle$/ }).first().click();
  await expect(ilk).toHaveAttribute("data-image-status", "loaded");
  await expect(ilk).toHaveAttribute("aria-pressed", "true");
});

test("yavaş görsel: yüklenirken kart seçilir, taşma olmaz, seçim yüklemeden sonra korunur", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  let beklet = true;
  const bekleyenler: (() => void)[] = [];
  await page.route("**/images/pictures/*.svg*", async (route) => {
    if (beklet) await new Promise<void>((serbest) => bekleyenler.push(serbest));
    await route.continue();
  });
  await page.goto("/pictures/board?board=1", { waitUntil: "commit" });

  await expect(tahta(page).getByRole("button")).toHaveCount(16);
  await expect(tahta(page).locator('[data-image-status="loading"]')).toHaveCount(16);
  await tasmaYok(page);
  await kanit(page, "yavas-yukleme");

  const ilk = tahta(page).locator(".q-picture-tile").first();
  await ilk.click();
  await expect(ilk).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("4 hata hakkı kaldı")).toBeAttached();

  beklet = false;
  bekleyenler.forEach((serbest) => serbest());
  await expect(tahta(page).locator('[data-image-status="loaded"]')).toHaveCount(16);
  await expect(ilk).toHaveAttribute("aria-pressed", "true");
});

test("tahta tamamlanır; sonuç, paylaşım ve istatistik modu söyler", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const icerik = JSON.parse(readFileSync("src/content/pictures/1.json", "utf8")) as {
    groups: { words: { image: { alt: string } }[] }[];
  };
  await page.goto("/pictures/board?board=1");
  await expect(tahta(page).getByRole("button")).toHaveCount(16);

  let ilkGrup = true;
  for (const grup of icerik.groups) {
    for (const kelime of grup.words) {
      await tahta(page).getByRole("button", { name: kelime.image.alt, exact: true }).click();
    }
    await page.getByRole("button", { name: "Grupla", exact: true }).click();
    await expect(page.getByRole("button", { name: "Grupla", exact: true }).or(page.getByRole("region", { name: "Dört bağı da buldun." }))).toBeVisible({ timeout: 10_000 });
    if (ilkGrup) {
      await kanit(page, "cozulen-grup");
      ilkGrup = false;
    }
  }

  const sonuc = page.getByRole("region", { name: "Dört bağı da buldun." });
  await expect(sonuc).toContainText("RESİMLİ QUADRO");
  const paylasim = await page.getByLabel("Spoilersız paylaşım önizlemesi").textContent();
  expect(paylasim).toMatch(/^Resimli Quadro · Tahta 1 4\/4/);
  await tasmaYok(page);
  await kanit(page, "sonuc");

  await page.goto("/stats");
  const panel = page.getByRole("region", { name: "Resimli Quadro" });
  await expect(panel).toContainText("1/3");
  await expect(page.getByLabel("Kişisel istatistikler")).toContainText("0");
});

test("yenileme sonrası seçim korunur", async ({ page }) => {
  await page.goto("/pictures/board?board=2");
  const ilk = tahta(page).getByRole("button").first();
  const ad = await ilk.getAttribute("aria-label");
  await ilk.click();
  await kanit(page, "tahta-2");
  await page.reload();
  await expect(tahta(page).getByRole("button", { name: ad ?? "" })).toHaveAttribute("aria-pressed", "true");
});
