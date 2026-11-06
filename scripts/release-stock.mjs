/**
 * Günlük yayın stoğu denetimi (Q38).
 *
 * 30 günlük takvimi ve 14 günlük ileri stoğu raporlar. Yalnız okur: bulmaca durumunu
 * değiştirmez, onay üretmez. Bir gün ancak dosyası `published` ise ve yazarından farklı bir
 * kişi tarafından gözden geçirilmişse onaylı sayılır; uygulamanın yayınladığı durum da
 * `published` olduğu için rapor oyuncunun göreceğiyle aynı ölçütü kullanır.
 *
 * Kaynak: Mehmet'in #139 PR'ındaki taslak.
 *
 * Kullanım: `npm run release:stock -- --start YYYY-MM-DD [--as-of YYYY-MM-DD] [--json] [--strict]`
 * İlk yayın günü Q41 kararıyla verilir, tahmin edilmez.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CALENDAR_DAYS = 30;
export const RUNWAY_DAYS = 14;

export function dayIndex(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Geçersiz gün: ${day}`);
  const timestamp = Date.parse(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== day) {
    throw new Error(`Takvimde olmayan gün: ${day}`);
  }
  return timestamp / 86_400_000;
}

export const addDays = (day, offset) => new Date((dayIndex(day) + offset) * 86_400_000).toISOString().slice(0, 10);

/** `review-pending` gibi yer tutucular gerçek bir gözden geçiren sayılmaz. */
const PLACEHOLDER_REVIEWERS = new Set(["review-pending", "optional-blind-trial"]);

export function isApproved(puzzle) {
  const author = typeof puzzle?.author === "string" ? puzzle.author.trim().toLowerCase() : "";
  const reviewer = typeof puzzle?.reviewer === "string" ? puzzle.reviewer.trim().toLowerCase() : "";
  return puzzle?.status === "published" && Number.isInteger(puzzle.revision) && puzzle.revision > 0 &&
    author !== "" && reviewer !== "" && reviewer !== author && !PLACEHOLDER_REVIEWERS.has(reviewer);
}

export function stockAudit(puzzles, launchDay, asOfDay) {
  dayIndex(launchDay);
  dayIndex(asOfDay);
  const byDate = new Map();
  const seenIds = new Set();
  const errors = [];

  for (const puzzle of puzzles) {
    try {
      dayIndex(puzzle?.date);
    } catch {
      errors.push(`Geçersiz tarih: ${puzzle?.id ?? "kimliksiz aday"}`);
      continue;
    }
    if (typeof puzzle.id !== "string" || puzzle.id === "") {
      errors.push(`Kimlik eksik: ${puzzle.date}`);
      continue;
    }
    if (byDate.has(puzzle.date)) errors.push(`Aynı güne iki bulmaca: ${puzzle.date}`);
    if (seenIds.has(puzzle.id)) errors.push(`Yinelenen kimlik: ${puzzle.id}`);
    byDate.set(puzzle.date, puzzle);
    seenIds.add(puzzle.id);
  }

  const rows = (start, count) => Array.from({ length: count }, (_, index) => {
    const date = addDays(start, index);
    const puzzle = byDate.get(date);
    return {
      date,
      id: puzzle?.id ?? null,
      revision: puzzle?.revision ?? null,
      status: !puzzle ? "missing" : isApproved(puzzle) ? "approved" : "unapproved",
    };
  });
  const count = (entries, status) => entries.filter((entry) => entry.status === status).length;
  const calendar = rows(launchDay, CALENDAR_DAYS);
  const runway = rows(asOfDay, RUNWAY_DAYS);
  const summary = {
    approved: count(calendar, "approved"),
    unapproved: count(calendar, "unapproved"),
    missing: count(calendar, "missing"),
    runwayApproved: count(runway, "approved"),
    runwayUnapproved: count(runway, "unapproved"),
    runwayMissing: count(runway, "missing"),
    /** Tarihi `asOfDay`den önce kaldığı için takvime kendiliğinden giremeyen adaylar. */
    expiredUnapproved: puzzles.filter((puzzle) => typeof puzzle?.date === "string" && puzzle.date < asOfDay && !isApproved(puzzle)).length,
  };

  return {
    launchDay,
    lastDay: addDays(launchDay, CALENDAR_DAYS - 1),
    asOfDay,
    candidates: puzzles.length,
    calendar,
    runway,
    errors,
    summary,
    ready: errors.length === 0 && summary.approved === CALENDAR_DAYS && summary.runwayApproved === RUNWAY_DAYS,
  };
}

function flag(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

function istanbulToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function cli() {
  const start = flag("--start");
  const asOf = flag("--as-of") ?? istanbulToday();
  if (!start) {
    console.error("Kullanım: npm run release:stock -- --start YYYY-MM-DD [--as-of YYYY-MM-DD] [--json] [--strict]");
    process.exitCode = 2;
    return;
  }

  const directory = join(resolve(fileURLToPath(new URL("../", import.meta.url))), "src/content/puzzles");
  const puzzles = readdirSync(directory)
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")));

  let report;
  try {
    report = stockAudit(puzzles, start, asOf);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    const { summary } = report;
    console.log(`Takvim ${start} → ${report.lastDay}: onaylı ${summary.approved}/${CALENDAR_DAYS}, onaysız ${summary.unapproved}, eksik ${summary.missing}`);
    console.log(`${asOf} itibarıyla ileri stok: onaylı ${summary.runwayApproved}/${RUNWAY_DAYS}, onaysız ${summary.runwayUnapproved}, eksik ${summary.runwayMissing}`);
    console.log(`Tarihi geçmiş onaysız aday: ${summary.expiredUnapproved}`);
    for (const row of report.calendar) if (row.status === "unapproved") console.log(`  ${row.date} onaysız ${row.id}`);
    for (const error of report.errors) console.error(`HATA ${error}`);
    console.log(report.ready ? "Yapısal olarak hazır; insan yayın onayı yine gerekir." : "HAZIR DEĞİL.");
  }
  if (process.argv.includes("--strict") && !report.ready) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) cli();
