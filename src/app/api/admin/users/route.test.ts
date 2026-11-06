import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
const req = (token = "Bearer user-token", page = "1") => new Request(`https://example.test/api/admin/users?page=${page}`, { headers: { authorization: token } });
beforeEach(() => { vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://db.example.test"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key"); vi.stubEnv("SUPABASE_SECRET_KEY", "server-secret"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("registered user list authorization", () => {
  it("requires a session without accessing Supabase", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await GET(req(""))).status).toBe(401); expect(fetcher).not.toHaveBeenCalled();
  });
  it("never fetches account data for a non-admin", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(false)); vi.stubGlobal("fetch", fetcher);
    const response = await GET(req()); expect(response.status).toBe(403); expect(fetcher).toHaveBeenCalledTimes(1); expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("returns only minimal account fields to an authorized admin", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(true)).mockResolvedValueOnce(Response.json({ users: [{ id:"u1", email:"x@example.test", created_at:"2026-11-01T00:00:00Z", last_sign_in_at:null, email_confirmed_at:"2026-11-01T00:00:00Z", user_metadata:{ display_name:"Oyuncu" }, encrypted_password:"must-not-leak", app_metadata:{ secret:"must-not-leak" } }] }, { headers: { "x-total-count": "26" } })); vi.stubGlobal("fetch", fetcher);
    const response = await GET(req()); const text = await response.text();
    expect(response.status).toBe(200); expect(text).not.toContain("must-not-leak");
    expect(JSON.parse(text)).toEqual({ users: [{ id:"u1", email:"x@example.test", displayName:"Oyuncu", createdAt:"2026-11-01T00:00:00Z", lastSignInAt:null, emailConfirmed:true }], page:1, hasNext:true });
    expect(fetcher.mock.calls[1]![0]).toContain("page=1&per_page=25");
  });
  it("rejects invalid pages without querying private data", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await GET(req("Bearer token", "-2"))).status).toBe(400); expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not expose backend failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(true)).mockRejectedValueOnce(new Error("private backend detail")));
    const response = await GET(req()); expect(response.status).toBe(502); expect(await response.text()).not.toContain("private backend detail");
  });
});
