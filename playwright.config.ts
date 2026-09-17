import { defineConfig, devices } from "@playwright/test";

/**
 * Q17 tarayıcı regresyonlarının yapılandırması.
 *
 * Testler gerçek Chromium'da ve **üretim derlemesi** üzerinde koşar (`next dev` değil):
 * geliştirme sunucusu React StrictMode ile bileşenleri iki kez render eder, bu da
 * `useGame` içindeki tohumlu motor kurulumunun beklenenden fazla rastgele sayı
 * tüketmesine yol açabilirdi. Üretim derlemesinde böyle bir çift render yoktur,
 * dolayısıyla tahta sırası deterministiktir.
 *
 * Birim testleri (Vitest) bu yapılandırmadan bağımsızdır; `npm run test` ile koşar.
 */

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const ciUzerinde = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",

  // Testler birbirinden bağımsız: her biri kendi sayfasında sıfırdan oyun açar.
  fullyParallel: true,

  // CI'da yanlışlıkla bırakılmış `test.only` derlemeyi kırsın.
  forbidOnly: ciUzerinde,

  // CI koşucusunun anlık yavaşlamalarına karşı tek tekrar hakkı; yerelde tekrar yok.
  retries: ciUzerinde ? 1 : 0,

  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: ciUzerinde
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  use: {
    baseURL,
    // Hata ayıklama kanıtı yalnız başarısız koşularda üretilir; yeşil koşu iz bırakmaz.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Derleme + üretim sunucusu tek komutta: `npm run test:e2e` temiz ağaçta da çalışır.
    command: "npm run build && npm run start",
    url: baseURL,
    // Yerelde açık sunucu varsa yeniden derleme yapılmaz; CI her zaman sıfırdan kurar.
    reuseExistingServer: !ciUzerinde,
    // `next build` süresini kapsayacak kadar geniş.
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
