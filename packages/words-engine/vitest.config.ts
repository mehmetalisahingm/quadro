import { defineConfig } from "vitest/config";

// Kökteki web vitest yapılandırması yukarı doğru aranıp bulunmasın diye motorun kendi yapılandırması.
// Motor kaynağı (src) Node ve DOM tiplerini görmez; platformdan bağımsız kalır.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
