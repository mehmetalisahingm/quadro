import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Next.js ile aynı otomatik JSX çalışma zamanı; bileşenler testte `React` içe aktarmadan çizilir.
  esbuild: { jsx: "automatic" },
  test: {
    // Birim testleri (src) node ortamında, akış regresyonları (tests/e2e) jsdom'da koşar.
    environment: "node",
    environmentMatchGlobs: [["tests/e2e/**", "jsdom"]],
    include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/e2e/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
