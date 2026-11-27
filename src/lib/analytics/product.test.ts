import { describe, expect, it } from "vitest";

import { standardPuzzle } from "@/features/game/fixtures";

import { beforeSend, sanitizeUrl } from "./posthog";
import { puzzleContext, sanitizeProductProperties } from "./product";

describe("ürün olayları", () => {
  it("modu ve bölümü bulmaca kimliğinden çıkarır", () => {
    expect(puzzleContext({ id: "track-easy-003", date: "2026-10-07" })).toEqual({ mode: "easy", level: 3 });
    expect(puzzleContext({ id: "track-balanced-002", date: "2026-10-06" })).toEqual({ mode: "hard", level: 2 });
    expect(puzzleContext({ id: "track-hard-012", date: "2026-10-16" })).toEqual({ mode: "ultra", level: 12 });
    expect(puzzleContext({ id: "journey-004", date: "2026-11-06" })).toEqual({ mode: "journey", level: 4 });
    expect(puzzleContext({ id: "picture-002", date: "2026-11-01" })).toEqual({ mode: "pictures", level: 2 });
    expect(puzzleContext({ id: "daily-2026-11-27-track-easy-001", date: "2026-11-27" })).toEqual({ mode: "daily", day: "2026-11-27" });
  });

  it("izin verilmeyen alanları ve uzun metni düşürür", () => {
    const leaky = {
      mode: "easy", level: 1, result: "won", mistakes: 1, duration_s: 42, hints_used: 1,
      words: ["ELMA"], groupTitle: "Meyveler", email: "a@b.c",
    } as unknown as Parameters<typeof sanitizeProductProperties<"puzzle_complete">>[1];
    expect(sanitizeProductProperties("puzzle_complete", leaky)).toEqual({
      mode: "easy", level: 1, result: "won", mistakes: 1, duration_s: 42, hints_used: 1,
    });
    expect(sanitizeProductProperties("share_click", { mode: "nope" as never, method: "share" })).toEqual({ method: "share" });
  });

  it("hiçbir olay yükü bulmacanın kelimelerini ya da grup adlarını içermez", () => {
    const context = puzzleContext(standardPuzzle);
    const payloads = [
      sanitizeProductProperties("puzzle_start", { ...context, resumed: true }),
      sanitizeProductProperties("puzzle_complete", { ...context, result: "lost", mistakes: 4, duration_s: 90, hints_used: 2 }),
      sanitizeProductProperties("share_click", { ...context, method: "copy" }),
      sanitizeProductProperties("hint_used", { ...context, hint_index: 1 }),
    ];
    const serialized = JSON.stringify(payloads).toLocaleLowerCase("tr");
    const secrets = standardPuzzle.groups.flatMap((group) => [group.title, ...group.words.map((word) => word.text)]);
    for (const secret of secrets) expect(serialized).not.toContain(secret.toLocaleLowerCase("tr"));
  });

  it("URL'den hash'i (giriş token'ı) ve izinsiz parametreleri siler", () => {
    expect(sanitizeUrl("https://playquadro.com.tr/auth/callback#access_token=abc&refresh_token=def")).toBe("https://playquadro.com.tr/auth/callback");
    expect(sanitizeUrl("https://playquadro.com.tr/play?difficulty=easy&level=2&utm_source=tiktok&email=a%40b.c")).toBe("https://playquadro.com.tr/play?difficulty=easy&level=2&utm_source=tiktok");
    const event = beforeSend({
      properties: { $current_url: "https://playquadro.com.tr/auth/callback#access_token=abc", $referrer: "https://t.co/x?secret=1", other: "x" },
      $set_once: { $initial_current_url: "https://playquadro.com.tr/?token=1#x" },
    });
    expect(event.properties).toEqual({ $current_url: "https://playquadro.com.tr/auth/callback", $referrer: "https://t.co/x", other: "x" });
    expect(event.$set_once).toEqual({ $initial_current_url: "https://playquadro.com.tr/" });
  });
});
