import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const externalBaseURL = process.env.QUADRO_BASE_URL;
const baseURL = externalBaseURL ?? `http://127.0.0.1:${PORT}`;
const ciUzerinde = Boolean(process.env.CI);

/**
 * Tarayıcı regresyonları `standardPuzzle` tahtasını oynar. Sunucu Q19'dan sonra günün
 * bulmacasını gerçek saate göre seçtiği için, test sunucusu sahte yayın stoğuna ve sabit
 * bir güne sabitlenir; yoksa testler takvime bağlı olur ve stok bitince düşer.
 * Bkz. `docs/DAILY_PUBLISHING.md`.
 */
const sunucuOrtami = {
  QUADRO_CONTENT_DIR: "tests/fixtures/content/puzzles",
  QUADRO_TODAY: "2026-09-20",
  // Sahte PostHog: anahtar yalnız derlemenin ölçüm yolunu açması içindir, hedef alan adı
  // gerçek değildir ve onay testleri tüm istekleri yakalayıp yerelde yanıtlar.
  NEXT_PUBLIC_POSTHOG_KEY: "phc_playwright_placeholder",
  NEXT_PUBLIC_POSTHOG_HOST: "https://posthog.quadro.test",
};

/**
 * Onay testleri dışındaki regresyonlar çerez kararı verilmiş bir ziyaretçi gibi açılır
 * (ölçüm reddedilmiş). Böylece şerit tahta kontrollerinin üstünde durmaz ve hiçbir
 * test ölçüm isteği üretmez. Onay akışı `onay.spec.ts` içinde boş depolamayla sınanır.
 */
const kararVerilmisZiyaretci = {
  cookies: [],
  origins: [{
    origin: baseURL,
    localStorage: [{
      name: "quadro:consent:v1",
      value: JSON.stringify({ version: 1, analytics: false, ads: false, decidedAt: new Date().toISOString() }),
    }],
  }],
};

export default defineConfig({
  testDir: "./tests/playwright",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: ciUzerinde,
  retries: ciUzerinde ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: ciUzerinde
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    storageState: kararVerilmisZiyaretci,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Otomatik WebKit kanıtı gerçek iPhone/Safari kabulünün yerine geçmez.
      // Q36 yalnız motor farklarını CI'da yakalamak için iki tarayıcı ailesini koşar.
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: `npm run build && npm run start -- -H 127.0.0.1 -p ${PORT}`,
        url: baseURL,
        env: sunucuOrtami,
        reuseExistingServer: !ciUzerinde,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
