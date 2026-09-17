import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const externalBaseURL = process.env.QUADRO_BASE_URL;
const baseURL = externalBaseURL ?? `http://127.0.0.1:${PORT}`;
const ciUzerinde = Boolean(process.env.CI);

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
        reuseExistingServer: !ciUzerinde,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
