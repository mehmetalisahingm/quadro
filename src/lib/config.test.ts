import { describe, expect, it } from "vitest";
import { APP_NAME, GAME_RULES } from "@/lib/config";

describe("uygulama yapılandırması", () => {
  it("uygulama adını sağlar", () => {
    expect(APP_NAME).toBe("Quadro");
  });

  it("temel oyun kuralları tutarlıdır (16 kelime = 4x4, 4 hata)", () => {
    expect(GAME_RULES.wordCount).toBe(GAME_RULES.groupCount * GAME_RULES.groupSize);
    expect(GAME_RULES.maxMistakes).toBe(4);
  });
});
