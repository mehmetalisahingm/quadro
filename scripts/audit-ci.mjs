import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Temporary, narrowly scoped exception for GHSA-vfj7-8cjw-p6xm.
// See docs/security/BRACES_EXCEPTION.md. Do not expand the allowlist.
export const EXPIRES_ON_UTC = "2026-11-12";
export const ADVISORY_URL = "https://github.com/advisories/GHSA-vfj7-8cjw-p6xm";
export const DEV_ONLY_CHAIN = Object.freeze({
  braces: null,
  micromatch: "braces",
  "fast-glob": "micromatch",
  "@next/eslint-plugin-next": "fast-glob",
  "eslint-config-next": "@next/eslint-plugin-next"
});

function fail(message) {
  throw new Error("[dependency-security] " + message);
}

function requireValidAudit(report, label) {
  if (!report || typeof report !== "object" || report.error ||
      !report.metadata || !report.metadata.vulnerabilities ||
      !report.vulnerabilities || typeof report.vulnerabilities !== "object") {
    fail(label + " did not return a valid npm audit JSON report");
  }
}

export function assertProductionClean(report) {
  requireValidAudit(report, "Production");
  const counts = report.metadata.vulnerabilities;
  const findings = Object.keys(report.vulnerabilities);
  if (findings.length || counts.total !== 0) {
    fail("Production dependencies contain " + findings.length + " vulnerable package(s): " + findings.join(", "));
  }
}

export function assertScopedDevelopmentAudit(report, lockfile, now = new Date()) {
  requireValidAudit(report, "Full");
  if (!lockfile || !lockfile.packages || !lockfile.packages[""]) {
    fail("package-lock.json missing, cannot check dev-only path");
  }

  const findings = Object.entries(report.vulnerabilities);
  if (findings.length === 0) {
    if (report.metadata.vulnerabilities.total !== 0) {
      fail("npm audit metadata and findings disagree");
    }
    return { exceptional: [] };
  }

  if (now.toISOString().slice(0, 10) >= EXPIRES_ON_UTC) {
    fail("The temporary braces waiver has expired (" + EXPIRES_ON_UTC + ")");
  }
  const observed = new Set();
  for (const [name, finding] of findings) {
    if (!Object.hasOwn(DEV_ONLY_CHAIN, name)) {
      fail("Unapproved vulnerability in " + name);
    }
    const entry = lockfile.packages["node_modules/" + name];
    if (!entry || entry.dev !== true || entry.optional === true) {
      fail(name + " is not verified as dev-only in package-lock.json");
    }
    if (finding.severity !== "high" || !Array.isArray(finding.via) || finding.via.length !== 1) {
      fail("Unexpected severity or advisory chain for " + name);
    }
    if (name === "braces") {
      const advisory = finding.via[0];
      if (entry.version !== "3.0.3" || !advisory || typeof advisory !== "object" ||
          advisory.name !== "braces" || advisory.url !== ADVISORY_URL ||
          advisory.severity !== "high") {
        fail("Unrecognized braces advisory or version");
      }
    } else if (finding.via[0] !== DEV_ONLY_CHAIN[name]) {
      fail("Unexpected transitively affected dependency for " + name);
    }
    observed.add(name);
  }

  if (!observed.has("braces")) {
    fail("Transitive finding without the expected braces root advisory");
  }
  // These findings are NOT fixed. They are reported and time-bound, not hidden.
  return { exceptional: [...observed] };
}

function runNpmAudit(args, label) {
  const executable = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(executable, ["audit", "--json", "--audit-level=moderate", ...args], {
    encoding: "utf8", maxBuffer: 8 * 1024 * 1024
  });
  if (result.error) fail("Unable to run " + label + " npm audit: " + result.error.message);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    fail(label + " npm audit failed without JSON: " + (result.stderr || result.stdout).slice(0, 1000));
  }
  if (result.status !== 0 && !Object.keys(report.vulnerabilities || {}).length) {
    fail(label + " npm audit command failed (exit " + result.status + ") without any findings");
  }
  return report;
}

function main() {
  const lockfile = JSON.parse(readFileSync("package-lock.json", "utf8"));
  assertProductionClean(runNpmAudit(["--omit=dev"], "production"));
  const result = assertScopedDevelopmentAudit(runNpmAudit([], "full"), lockfile);
  if (result.exceptional.length) {
    console.warn("UNPATCHED DEV-ONLY GHSA-vfj7-8cjw-p6xm (waiver expires " + EXPIRES_ON_UTC + ")");
    console.warn("Affected chain: " + result.exceptional.join(" -> "));
    console.warn("See docs/security/BRACES_EXCEPTION.md; do not treat this as vulnerability-free.");
  }
  console.log("[dependency-security] Production clean; no unapproved npm advisories.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1].replace(/\\/g, "/")))) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
