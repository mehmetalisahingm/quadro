import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BoardPrelude } from "@/components/game/BoardPrelude";

afterEach(() => {
  cleanup();
  document.body.style.removeProperty("overflow");
});

describe("BoardPrelude document scrolling", () => {
  it("never locks the page, including overlapping openings and their cleanup", () => {
    const first = render(<BoardPrelude onComplete={vi.fn()} />);
    const second = render(<BoardPrelude onComplete={vi.fn()} />);

    expect(document.body.style.overflow).toBe("");
    first.unmount();
    second.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("preserves existing overflow and still allows skipping the opening", () => {
    document.body.style.overflow = "auto";
    const onComplete = vi.fn();
    const view = render(<BoardPrelude onComplete={onComplete} />);

    expect(document.body.style.overflow).toBe("auto");
    fireEvent.click(view.getByRole("button", { name: /oyuna geç/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
