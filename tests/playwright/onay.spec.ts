import { mkdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";

import { expect, test, type Page, type Request } from "@playwright/test";

import { oyunaGir, oyunuKazan, spoilerMetinleri, tahtaKartlari } from "./yardimcilar";

/**
 * KVKK onay akışı. Bu dosya boş depolamayla (karar verilmemiş ziyaretçi) başlar.
 * PostHog'un alan adı sahtedir (playwright.config.mjs); istekler burada yakalanır ve
 * yerelde yanıtlanır, hiçbir istek dışarı çıkmaz.
 */
test.use({ storageState: { cookies: [], origins: [] } });

// PostHog, otomasyon tarayıcısını (navigator.webdriver, "HeadlessChrome" markası) bot sayıp
// olayları bilerek atar; üretimde istenen davranış budur.
// Gerçek bir ziyaretçinin akışını sınamak için yalnız bu dosyada bu işaret kapatılır.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });
    Object.defineProperty(Navigator.prototype, "userAgentData", { get: () => undefined });
  });
});

const POSTHOG = "https://posthog.quadro.test";
const KANIT_DIZINI = process.env.QUADRO_KANIT_DIZINI;

async function kanit(page: Page, ad: string): Promise<void> {
  if (!KANIT_DIZINI) return;
  mkdirSync(KANIT_DIZINI, { recursive: true });
  await page.screenshot({ path: `${KANIT_DIZINI}/${ad}.png` });
}

/** Ölçüm isteklerini kaydeder; PostHog'u sahte yanıtlar ya da engeller. */
async function olcumuIzle(page: Page, { engelle = false } = {}) {
  const istekler: Request[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith(POSTHOG) || url.includes("/api/analytics")) istekler.push(request);
  });
  await page.route(`${POSTHOG}/**`, (route) => (engelle ? route.abort("blockedbyclient") : route.fulfill({ status: 200, contentType: "application/json", body: "{\"status\":1}" })));
  if (engelle) await page.route("**/api/analytics", (route) => route.abort("blockedbyclient"));
  return {
    posthog: () => istekler.filter((request) => request.url().startsWith(POSTHOG)),
    supabase: () => istekler.filter((request) => request.url().includes("/api/analytics")),
  };
}

async function olcumAnahtarlari(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(localStorage).filter((key) =>
    key.startsWith("ph_") || key.startsWith("__ph") || key.startsWith("quadro:analytics") || key === "quadro:visitor:v1",
  ));
}

const serit = (page: Page) => page.getByTestId("consent-banner");

/** PostHog gövdesi düz JSON ya da gzip olabilir; her iki durumda da metne çevrilir. */
function govdeMetni(request: Request): string {
  const ham = request.postDataBuffer();
  if (!ham) return "";
  try {
    return gunzipSync(ham).toString("utf8");
  } catch {
    return ham.toString("utf8");
  }
}

test("karar verilmeden hiçbir ölçüm yüklenmez, cihaza kimlik yazılmaz", async ({ page }) => {
  const olcum = await olcumuIzle(page);
  await page.goto("/?utm_source=tiktok&utm_medium=social&utm_campaign=kasim");
  await expect(serit(page)).toBeVisible();
  await kanit(page, "onay-serit-masaustu");

  await page.goto("/play?day=2026-09-20");
  await oyunaGir(page);
  await oyunuKazan(page);
  await page.waitForTimeout(1_000);

  expect(olcum.posthog()).toEqual([]);
  expect(olcum.supabase()).toEqual([]);
  expect(await olcumAnahtarlari(page)).toEqual([]);
});

test("Reddet tek tıktır; reddedince hiçbir şey gönderilmez", async ({ page }) => {
  const olcum = await olcumuIzle(page);
  await page.goto("/play?day=2026-09-20");
  await page.getByRole("button", { name: "Reddet" }).click();
  await expect(serit(page)).toHaveCount(0);

  await oyunaGir(page);
  await oyunuKazan(page);
  await page.reload();
  await expect(serit(page)).toHaveCount(0);
  await page.waitForTimeout(1_000);

  expect(olcum.posthog()).toEqual([]);
  expect(olcum.supabase()).toEqual([]);
  expect(await olcumAnahtarlari(page)).toEqual([]);
});

test("Kabul edince ölçüm başlar; olaylarda cevap ve kişisel veri yok", async ({ page }) => {
  const olcum = await olcumuIzle(page);
  await page.goto("/play?day=2026-09-20&utm_source=instagram&utm_medium=social");
  await page.getByRole("button", { name: "Kabul et" }).click();
  await oyunaGir(page);
  await oyunuKazan(page);

  await expect.poll(() => olcum.posthog().length, { timeout: 15_000 }).toBeGreaterThan(0);
  await expect.poll(() => olcum.supabase().length).toBeGreaterThan(0);

  // PostHog'a giden her gövde okunur: ürün olayları var, cevaplar ve kişisel veri yok.
  const tumGovdeler = () => olcum.posthog().map(govdeMetni).join(" ");
  await expect.poll(tumGovdeler, { timeout: 15_000 }).toContain("puzzle_complete");
  const govdeler = tumGovdeler();
  expect(govdeler).toContain("puzzle_start");
  expect(govdeler).toContain("instagram");
  for (const metin of spoilerMetinleri()) expect(govdeler).not.toContain(metin);
  expect(govdeler).not.toContain("access_token");
});

test("analitik engellense (adblock) de oyun sonuna kadar oynanır", async ({ page }) => {
  const hatalar: string[] = [];
  page.on("pageerror", (error) => hatalar.push(error.message));
  await olcumuIzle(page, { engelle: true });
  await page.goto("/play?day=2026-09-20");
  await page.getByRole("button", { name: "Kabul et" }).click();
  await oyunaGir(page);
  await oyunuKazan(page);
  await expect(page.getByRole("region", { name: /Dört bağı da buldun/ }).or(page.getByText(/Dört bağı da buldun/)).first()).toBeVisible();
  expect(hatalar).toEqual([]);
});

test("footer'dan tercih değiştirilir; izni geri alınca yerel ölçüm kayıtları silinir", async ({ page }) => {
  const olcum = await olcumuIzle(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Kabul et" }).click();
  await expect.poll(() => olcumAnahtarlari(page)).not.toEqual([]);

  await page.getByRole("button", { name: "Çerez tercihleri" }).click();
  await expect(serit(page)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /Analitik/ })).toBeChecked();
  await kanit(page, "onay-tercihler");
  await page.getByRole("checkbox", { name: /Analitik/ }).uncheck();
  await page.getByRole("button", { name: "Seçimi kaydet" }).click();

  await expect.poll(() => olcumAnahtarlari(page)).toEqual([]);
  const sonra = olcum.posthog().length;
  await page.goto("/play?day=2026-09-20");
  await oyunaGir(page);
  await page.waitForTimeout(1_000);
  expect(olcum.posthog().length).toBe(sonra);
});

for (const genislik of [320, 390]) {
  test(`${genislik}px: şerit oyun tahtasını kapatmaz`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 740 });
    await page.goto("/play?day=2026-09-20");
    await oyunaGir(page);
    await expect(serit(page)).toBeVisible();
    await kanit(page, `onay-serit-mobil-${genislik}`);

    const seritKutusu = await serit(page).boundingBox();
    expect(seritKutusu?.height ?? 999).toBeLessThanOrEqual(740 * 0.4);

    // Şerit sabit bir katman değildir: hiçbir kart ya da kontrolle kesişmez.
    expect(await serit(page).evaluate((element) => getComputedStyle(element).position)).not.toBe("fixed");
    const kutular = [
      ...(await tahtaKartlari(page).all()),
      page.getByRole("button", { name: "Grupla", exact: true }),
    ];
    for (const hedef of kutular) {
      const kutu = await hedef.boundingBox();
      if (!kutu || !seritKutusu) continue;
      const kesisir = kutu.y < seritKutusu.y + seritKutusu.height && seritKutusu.y < kutu.y + kutu.height;
      expect(kesisir).toBe(false);
    }
    const tasma = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(tasma).toBeLessThanOrEqual(0);
  });
}
