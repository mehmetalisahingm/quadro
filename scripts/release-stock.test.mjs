import test from "node:test";
import assert from "node:assert/strict";
import {addDays,dayIndex,isApproved,stockAudit} from "./release-stock.mjs";
const p=(date,n,overrides={})=>({date,id:"q-"+n,revision:1,status:"draft",author:"alice",reviewer:"bob",...overrides});
test("rejects date rollover",()=>{assert.throws(()=>dayIndex("2026-02-31"));assert.equal(addDays("2026-10-31",1),"2026-11-01")});
test("candidates, self reviews, unversioned content not approved",()=>{
  for(const patch of [{},{status:"approved",reviewer:"alice"},{status:"approved",reviewer:""},{status:"approved",revision:0}])
    assert.equal(Boolean(isApproved(p("2026-10-12",1,patch))),false);
  assert.equal(Boolean(isApproved(p("2026-10-12",1,{status:"approved"}))),true);
});
test("30 drafts are zero approved days",()=>{
  const x=Array.from({length:30},(_,i)=>p(addDays("2026-10-12",i),i)),r=stockAudit(x,"2026-10-12","2026-10-12");
  assert.equal(r.summary.available,30);assert.equal(r.summary.approved,0);assert.equal(r.ready,false);
});
test("missing days, duplicate days and IDs blocked",()=>{
  const r=stockAudit([p("2026-10-12",1),p("2026-10-13",1),p("2026-10-13",2)],"2026-10-12","2026-10-12");
  assert.equal(r.summary.missing,28);assert.equal(r.errors.length,2);
});
test("both approved calendar and 14-day runway needed",()=>{
  const x=Array.from({length:30},(_,i)=>p(addDays("2026-10-12",i),i,{status:"approved"}));
  assert.equal(stockAudit(x,"2026-10-12","2026-10-12").ready,true);
  assert.equal(stockAudit(x,"2026-10-12","2026-11-05").ready,false);
});
test("cross-month dates",()=>{
  const r=stockAudit([],"2026-10-20","2026-10-31");
  assert.equal(r.lastDay,"2026-11-18");assert.equal(r.runway[13].date,"2026-11-13");
});
