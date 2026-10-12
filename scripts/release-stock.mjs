import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export function dayIndex(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error("Invalid day " + day);
  const timestamp = Date.parse(day + "T00:00:00.000Z");
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== day)
    throw Error("Invalid calendar day " + day);
  return timestamp / 86400000;
}
export const addDays = (day, offset) =>
  new Date((dayIndex(day) + offset) * 86400000).toISOString().slice(0, 10);

export function isApproved(puzzle) {
  return puzzle?.status === "approved" && Number.isInteger(puzzle.revision) && puzzle.revision > 0 &&
    typeof puzzle.author === "string" && puzzle.author.trim().length > 0 &&
    typeof puzzle.reviewer === "string" && puzzle.reviewer.trim().length > 0 &&
    puzzle.reviewer.trim().toLowerCase() !== puzzle.author.trim().toLowerCase();
}
export function stockAudit(puzzles, launchDay, asOfDay) {
  dayIndex(launchDay); dayIndex(asOfDay);
  const dates = new Map(), ids = new Map(), errors = [];
  for (const p of puzzles) {
    try { dayIndex(p?.date); } catch { errors.push("Invalid date in candidate"); continue; }
    if (!p.id || typeof p.id !== "string") { errors.push("Missing ID " + p.date); continue; }
    if (dates.has(p.date)) errors.push("Duplicate day " + p.date);
    if (ids.has(p.id)) errors.push("Duplicate ID " + p.id);
    dates.set(p.date, p); ids.set(p.id, p.date);
  }
  const rows = (start, count) => Array.from({length: count}, (_, i) => {
    const date = addDays(start, i), p = dates.get(date);
    return {date, id: p?.id ?? null, revision: p?.revision ?? null,
      status: !p ? "missing" : isApproved(p) ? "approved" : "unapproved"};
  });
  const calendar = rows(launchDay, 30), runway = rows(asOfDay, 14);
  const count = (entries, status) => entries.filter(x => x.status === status).length;
  const summary = {available: 30-count(calendar,"missing"), approved: count(calendar,"approved"),
    unapproved: count(calendar,"unapproved"),missing:count(calendar,"missing"),
    runwayApproved:count(runway,"approved"),runwayUnapproved:count(runway,"unapproved"),
    runwayMissing:count(runway,"missing")};
  return {launchDay,lastDay:addDays(launchDay,29),asOfDay,candidates:puzzles.length,
    calendar,runway,errors,summary,
    ready:errors.length===0 && summary.approved===30 && summary.runwayApproved===14};
}
const flag = name => { const i=process.argv.indexOf(name); return i<0?null:process.argv[i+1]??null };
function istanbulToday() {
  const ps=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Istanbul",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const p=Object.fromEntries(ps.map(i=>[i.type,i.value]));
  return [p.year,p.month,p.day].join("-");
}
function cli() {
  const start=flag("--start"),asOf=flag("--as-of")||istanbulToday();
  if(!start) { console.error("Usage: npm run release:stock -- --start YYYY-MM-DD [--as-of YYYY-MM-DD] [--json] [--strict]"); process.exitCode=2; return; }
  const dir=join(resolve(fileURLToPath(new URL("../",import.meta.url))),"src/content/puzzles");
  const puzzles=readdirSync(dir).filter(f=>/^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f=>JSON.parse(readFileSync(join(dir,f),"utf8")));
  let report;
  try { report=stockAudit(puzzles,start,asOf) } catch(e) {console.error(e.message);process.exitCode=2;return}
  if(process.argv.includes("--json")) console.log(JSON.stringify(report,null,2));
  else {
    console.log("Q38 calendar "+start+" → "+report.lastDay);
    console.log("30-day candidate "+report.summary.available+"/30; approved "+report.summary.approved+"/30; missing "+report.summary.missing);
    console.log("14-day approved runway from "+asOf+": "+report.summary.runwayApproved+"/14; draft "+report.summary.runwayUnapproved+"; missing "+report.summary.runwayMissing);
    for(const row of report.calendar) if(row.status!=="approved") console.log(row.date+" "+row.status+" "+(row.id||""));
    for(const e of report.errors) console.error("ERROR "+e);
    console.log(report.ready?"STRUCTURAL READY — human release signoff required":"NOT READY — drafts do not count as approved stock");
  }
  if(process.argv.includes("--strict") && !report.ready) process.exitCode=1;
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])) cli();
