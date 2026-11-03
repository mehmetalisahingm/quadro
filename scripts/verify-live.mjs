/** Read-only release checks; does not send sign-in mail or create player results. */
const base = new URL(process.env.QUADRO_LIVE_URL ?? "https://quadro-teal.vercel.app");
if (base.protocol !== "https:" || base.username || base.password || base.port ||
  !base.hostname.includes(".") || /^[\d.]+$/.test(base.hostname) ||
  /\.(local|internal|test)$/.test(base.hostname)) throw new Error("Use a public canonical HTTPS origin");
base.pathname = "/";
base.search = "";
base.hash = "";
const checks = [];
async function read(path, expected = 200) {
  const response = await fetch(new URL(path, base), { redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (response.status !== expected) throw new Error(`${path}: expected ${expected}, received ${response.status}`);
  checks.push({ path, status: response.status });
  return response;
}
const health = await (await read("/api/health")).json();
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
if (!health.playable || health.dayKey !== day) throw new Error("Daily game is unavailable or stale");
const home = await (await read("/")).text();
if (!home.includes("/play?mode=daily")) throw new Error("Home does not link to the daily game");
const daily = await (await read("/play?mode=daily")).text();
if (!daily.includes("q-play-header")) throw new Error("Daily game page is incomplete");
await read("/play");
await read("/animations");
const journey = await (await read("/journey")).text();
if (!journey.includes("50 adımlık keşif haritası")) throw new Error("Journey map is incomplete");
await read("/journey/step?level=1");
const login = await (await read("/login")).text();
const mailButton = [...login.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
  .find(match => match[2].includes("giriş bağlantısı gönder"));
if (!mailButton || /\bdisabled\b/.test(mailButton[1])) throw new Error("Production email sign-in is not configured");
await read("/auth/callback");
await read("/admin");
await read("/api/admin/dashboard", 401);
const invalid = await fetch(new URL("/api/analytics", base), {
  method: "POST", headers: { "content-type": "application/json" }, body: "null",
  redirect: "error", signal: AbortSignal.timeout(20_000),
});
if (invalid.status !== 400) throw new Error("Analytics must reject invalid JSON objects safely");
checks.push({ path: "/api/analytics (invalid payload)", status: invalid.status });
console.log(JSON.stringify({ origin: base.origin, day, checks, selection: health.selection,
  publishedDays: health.publishedDays, editorialStockLow: health.editorialStockLow }, null, 2));
