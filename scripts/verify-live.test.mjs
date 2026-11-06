import test from "node:test";
import assert from "node:assert/strict";

for (const scenario of ["healthy", "disabled-login", "admin-exposed", "journey-missing", "pictures-missing", "picture-image-missing"]) {
  test(`live gate: ${scenario}`, async t => {
    t.mock.method(console, "log", () => undefined);
    t.mock.method(globalThis, "fetch", async url => {
      const path = new URL(url).pathname;
      if (path === "/api/health") return Response.json({ playable: true, dayKey: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date()), selection: "reserve", publishedDays: 0, editorialStockLow: true });
      if (path === "/api/admin/dashboard") return new Response("{}", { status: scenario === "admin-exposed" ? 200 : 401 });
      if (path === "/api/analytics") return new Response("{}", { status: 400 });
      if (path === "/login") return new Response(`<button ${scenario === "disabled-login" ? 'disabled=""' : ""}>E-posta ile giriş bağlantısı gönder</button>`);
      if (path === "/journey") return new Response(scenario === "journey-missing" ? "" : '<ul aria-label="Dünyalar"><a href="/journey/step?level=1">1</a></ul>');
      if (path === "/pictures") return new Response(scenario === "pictures-missing" ? "" : "<h1>Resimli Quadro</h1>");
      if (path === "/images/pictures/gitar.svg") return new Response("<svg/>", { status: scenario === "picture-image-missing" ? 404 : 200 });
      return new Response('<a href="/play?mode=daily">Oyna</a><header class="q-play-header"></header>');
    });
    const run = import(`./verify-live.mjs?scenario=${scenario}`);
    if (scenario === "healthy") await run;
    else await assert.rejects(run, scenario === "disabled-login" ? /sign-in is not configured/ : scenario === "journey-missing" ? /Journey map is incomplete/ : scenario === "pictures-missing" ? /Picture mode is incomplete/ : scenario === "picture-image-missing" ? /gitar\.svg: expected 200/ : /expected 401/);
  });
}
