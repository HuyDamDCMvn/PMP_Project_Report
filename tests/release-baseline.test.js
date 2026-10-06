import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uploadedFamilyCohort,familyOutcome} from '../src/family-outcomes.js';
import {isOpenTicket} from '../src/domain.js';
const data=JSON.parse(readFileSync(new URL('../public/data/dashboard-data.json',import.meta.url)));
test('release source invariants preserve counts, hours, unknowns, statuses and QA evidence',()=>{
  assert.equal(data.tickets.length,2703);assert.equal(data.deliverables.length,2512);assert.equal(data.families.length,2002);
  const rfa=data.deliverables.filter(p=>p.workType==='Revise the RFA library');
  assert.equal(rfa.length,2301);assert.equal(rfa.filter(p=>p.familyId).length,2004);
  assert.equal(new Set(rfa.map(p=>p.familyKey)).size,2295);
  assert.equal(new Set(rfa.filter(p=>p.familyId).map(p=>p.familyKey)).size,2001);
  const total=rows=>rows.reduce((s,t)=>s+(t.actualHours??0),0);
  assert.equal(total(data.tickets),40233.5);
  assert.equal(total(data.tickets.filter(t=>['Positive','Re-Assessment'].includes(t.active))),37339.75);
  assert.equal(total(data.tickets.filter(t=>t.active==='Negative')),2893.75);
  assert.equal(data.tickets.filter(t=>t.actualHours===null).length,55);
  const floor=data.tickets.find(t=>t.id===67303);assert.equal(floor.actualHoursSource,316);assert.equal(floor.actualHours,316);
  assert.deepEqual(['One pass','Returned','Unclassified'].map(outcome=>data.families.filter(f=>familyOutcome(f)===outcome).length),[1500,502,0]);
  const cohort=uploadedFamilyCohort(data.families,data.tickets,data.meta.asOf);
  assert.equal(total(cohort.tickets),15953.25);
  assert.deepEqual(cohort.tickets.filter(isOpenTicket).map(t=>t.id).sort((a,b)=>a-b),[71722,73575,75204]);
  assert.equal(data.tickets.filter(isOpenTicket).length,315);
  assert.deepEqual(['ticket_status_conflict','historical_sheet_overlap','cfm_before_trm_review','future_cfm'].map(type=>data.qualityRecords.filter(r=>r.type===type).length),[10,17,44,1]);
});

