import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Next.js ile aynı otomatik JSX çalışma zamanı; bileşenler testte `React` içe aktarmadan çizilir.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
