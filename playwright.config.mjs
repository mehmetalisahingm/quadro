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
