// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisteredUsers } from "./RegisteredUsers";
vi.mock("@/lib/auth/client", () => ({ readStoredSession: () => ({ accessToken: "test-token" }) }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("registered accounts", () => {
  it("shows accounts without completed games and loads the next page", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ page: 1, hasNext: true, users: [{ id:"u1", email:"new@example.test", displayName:null, createdAt:"2026-11-06T09:00:00Z", lastSignInAt:null, emailConfirmed:true }] })).mockResolvedValueOnce(Response.json({ page:2, hasNext:false, users:[] }));
    vi.stubGlobal("fetch", fetcher);
    render(<RegisteredUsers />);
    expect(await screen.findByText("new@example.test")).toBeTruthy();
    expect(screen.getByText("Doğrulandı")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name:"Sonraki" }));
    await waitFor(() => expect(screen.getByText("Sayfa 2")).toBeTruthy());
    expect(fetcher.mock.calls[1]![0]).toBe("/api/admin/users?page=2");
  });
});
