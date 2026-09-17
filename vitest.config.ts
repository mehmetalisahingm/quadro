import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Next.js ile aynı otomatik JSX çalışma zamanı; bileşenler testte `React` içe aktarmadan çizilir.
  esbuild: { jsx: "automatic" },
  test: {
    // Vitest 4'te `environmentMatchGlobs` kaldırıldı; birim ve DOM akışları ayrı projelerdir.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
        },
      },
      {
        extends: true,
        test: {
          name: "e2e-jsdom",
          environment: "jsdom",
          include: ["tests/e2e/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
