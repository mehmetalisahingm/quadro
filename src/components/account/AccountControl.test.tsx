// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/lib/auth/client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/client")>("@/lib/auth/client");
  return {
    ...actual,
    readStoredSession: () => null,
    refreshStoredSession: async () => null,
  };
});

import { AccountControl } from "./AccountControl";

afterEach(() => cleanup());

describe("AccountControl", () => {
  it("keeps login optional and visible for guests", async () => {
    render(<AccountControl />);
    const login = await screen.findByRole("link", { name: "Giriş Yap" });
    expect(login.getAttribute("href")).toBe("/login");
  });
});
