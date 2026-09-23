import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SoundPreference } from "./SoundPreference";

describe("SoundPreference", () => {
  it("kapalı durumu erişilebilir düğmeyle gösterir ve açma isteğini bir kez yollar", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SoundPreference enabled={false} onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Ses kapalı" });
    expect(button.getAttribute("aria-pressed")).toBe("false");

    await user.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("açık durumda kapatma isteği yollar", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SoundPreference enabled onChange={onChange} />);

    const button = screen.getByRole("button", { name: "Ses açık" });
    expect(button.getAttribute("aria-pressed")).toBe("true");

    await user.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
