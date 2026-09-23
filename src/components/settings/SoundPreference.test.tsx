import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SoundPreference } from "./SoundPreference";

describe("SoundPreference", () => {
  it("kapalı durumu erişilebilir düğmeyle gösterir", () => {
    const html = renderToStaticMarkup(
      <SoundPreference enabled={false} onChange={vi.fn()} />,
    );

    expect(html).toContain('aria-label="Ses tercihi"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Ses kapalı");
  });

  it("açık durumu erişilebilir düğmeyle gösterir", () => {
    const html = renderToStaticMarkup(
      <SoundPreference enabled onChange={vi.fn()} />,
    );

    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Ses açık");
  });
});
