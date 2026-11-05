import test from "node:test";
import assert from "node:assert/strict";

import { addDays, dayIndex, isApproved, stockAudit } from "./release-stock.mjs";

const candidate = (date, n, overrides = {}) => ({ date, id: `q-${n}`, revision: 1, status: "draft", author: "alice", reviewer: "bob", ...overrides });
const calendar = (start, overrides) => Array.from({ length: 30 }, (_, i) => candidate(addDays(start, i), i, overrides));

test("takvimde olmayan gün reddedilir, ay geçişi çalışır", () => {
  assert.throws(() => dayIndex("2026-02-31"));
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
});

test("yalnız bağımsız gözden geçirilmiş published içerik onaylıdır", () => {
  assert.equal(isApproved(candidate("2026-10-12", 1, { status: "published" })), true);
  for (const patch of [
    {},
    { status: "approved" },
    { status: "published", reviewer: "ALICE " },
    { status: "published", reviewer: "" },
    { status: "published", reviewer: "review-pending" },
    { status: "published", reviewer: "optional-blind-trial" },
    { status: "published", revision: 0 },
  ]) assert.equal(isApproved(candidate("2026-10-12", 1, patch)), false, JSON.stringify(patch));
});

test("30 taslak sıfır onaylı gündür", () => {
  const report = stockAudit(calendar("2026-10-12"), "2026-10-12", "2026-10-12");
  assert.equal(report.summary.unapproved, 30);
  assert.equal(report.summary.approved, 0);
  assert.equal(report.ready, false);
});

test("eksik gün, yinelenen gün ve kimlik yakalanır", () => {
  const report = stockAudit([candidate("2026-10-12", 1), candidate("2026-10-13", 1), candidate("2026-10-13", 2)], "2026-10-12", "2026-10-12");
  assert.equal(report.summary.missing, 28);
  assert.equal(report.errors.length, 2);
});

test("hem 30 günlük takvim hem 14 günlük ileri stok gerekir", () => {
  const puzzles = calendar("2026-10-12", { status: "published" });
  assert.equal(stockAudit(puzzles, "2026-10-12", "2026-10-12").ready, true);
  assert.equal(stockAudit(puzzles, "2026-10-12", "2026-11-05").ready, false);
});

test("tarihi geçmiş onaysız adaylar ayrı sayılır", () => {
  const report = stockAudit([candidate("2026-10-01", 1), candidate("2026-11-06", 2), candidate("2026-10-02", 3, { status: "published" })], "2026-11-05", "2026-11-05");
  assert.equal(report.summary.expiredUnapproved, 1);
});

test("ay aşan takvim sınırları", () => {
  const report = stockAudit([], "2026-10-20", "2026-10-31");
  assert.equal(report.lastDay, "2026-11-18");
  assert.equal(report.runway[13].date, "2026-11-13");
});
