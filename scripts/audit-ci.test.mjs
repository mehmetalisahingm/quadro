import test from "node:test";
import assert from "node:assert/strict";
import {
  assertProductionClean, assertScopedDevelopmentAudit, ADVISORY_URL, EXPIRES_ON_UTC, DEV_ONLY_CHAIN
} from "./audit-ci.mjs";

const makeReport = () => ({
  metadata: { vulnerabilities: { total: 5 } },
  vulnerabilities: Object.fromEntries(Object.entries(DEV_ONLY_CHAIN).map(([name, via]) => [
    name, {
      severity: "high",
      via: [via === null ? { name: "braces", url: ADVISORY_URL, severity: "high" } : via],
      nodes: ["node_modules/" + name]
    }
  ]))
});
const makeLock = () => ({
  packages: {
    "": { name: "quadro" },
    ...Object.fromEntries(Object.keys(DEV_ONLY_CHAIN).map(name => [
      "node_modules/" + name, { version: name === "braces" ? "3.0.3" : "1.0.0", dev: true }
    ]))
  }
});

test("production audit rejects security findings", () => {
  assert.doesNotThrow(() => assertProductionClean({ metadata: { vulnerabilities: { total: 0 } }, vulnerabilities: {} }));
  assert.throws(() => assertProductionClean({ metadata: { vulnerabilities: { total: 1 } }, vulnerabilities: { sharp: {} } }));
});

test("only the exact unpatched dev-only braces chain is temporarily allowed", () => {
  const result = assertScopedDevelopmentAudit(makeReport(), makeLock(), new Date("2026-10-12T12:00:00Z"));
  assert.equal(result.exceptional.length, 5);
});

test("a different advisory is not silenced", () => {
  const report = makeReport();
  report.vulnerabilities.braces.via[0].url = "https://github.com/advisories/GHSA-other";
  assert.throws(() => assertScopedDevelopmentAudit(report, makeLock(), new Date("2026-10-12T12:00:00Z")));
});

test("new development advisories fail CI", () => {
  const report = makeReport();
  report.vulnerabilities.sharp = { severity: "high", via: ["next"], nodes: ["node_modules/sharp"] };
  assert.throws(() => assertScopedDevelopmentAudit(report, makeLock(), new Date("2026-10-12T12:00:00Z")));
});

test("non-development-only copies of braces fail CI", () => {
  const lock = makeLock();
  lock.packages["node_modules/braces"].dev = false;
  assert.throws(() => assertScopedDevelopmentAudit(makeReport(), lock, new Date("2026-10-12T12:00:00Z")));
});

test("waiver expires and fails closed", () => {
  assert.throws(() => assertScopedDevelopmentAudit(makeReport(), makeLock(), new Date(EXPIRES_ON_UTC + "T00:00:00Z")));
});

test("no findings needs no waiver", () => {
  const clean = { metadata: { vulnerabilities: { total: 0 } }, vulnerabilities: {} };
  assert.deepEqual(assertScopedDevelopmentAudit(clean, makeLock(), new Date("2027-01-01T00:00:00Z")), { exceptional: [] });
});
