import { describe, expect, it } from "vitest";

import {
  APP_NAME,
  APP_TAGLINE,
  APP_TITLE,
  GAME_RULES,
  PLAY_DESCRIPTION,
  SOCIAL_IMAGE_ALT,
  TUTORIAL_DESCRIPTION,
} from "@/lib/config";

describe("uygulama yapılandırması", () => {
  it("uygulama adını ve tutarlı metadata metinlerini sağlar", () => {
    expect(APP_NAME).toBe("Quadro");
    expect(APP_TITLE).toContain(APP_NAME);
    expect(APP_TAGLINE).toContain("16 kelime");
    expect(PLAY_DESCRIPTION).toContain("dört gizli bağı");
    expect(TUTORIAL_DESCRIPTION).toContain("günlük oyundan bağımsız");
    expect(SOCIAL_IMAGE_ALT).toContain("4×4");
  });

  it("temel oyun kuralları tutarlıdır (16 kelime = 4x4, 4 hata)", () => {
    expect(GAME_RULES.wordCount).toBe(GAME_RULES.groupCount * GAME_RULES.groupSize);
    expect(GAME_RULES.maxMistakes).toBe(4);
  });
});
