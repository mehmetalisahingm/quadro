import { defineConfig } from "vitest/config";

// Yalnız React Native'e bağlı olmayan saf modüller (kayıt mantığı) burada test edilir.
// Ekran ve hareket testleri fiziksel cihazda (#210).
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
