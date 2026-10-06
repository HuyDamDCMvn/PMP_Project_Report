import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uploadDetails,progressDetails} from '../src/pie-detail-model.js';
import {selectCohorts} from '../src/cohorts.js';
import {serializeCsv} from '../src/table-export.js';
const data=JSON.parse(readFileSync(new URL('../public/data/dashboard-data.json',import.meta.url)));
test('active Uploaded and arithmetic detail use scoped records without mutating selection',()=>{
  for(const filters of [{},{reporter:'h.pham'},{owner:'Hanh Pham'}]) {
    const scoped=selectCohorts(data,filters),before=JSON.stringify(filters);
    const upload=uploadDetails('uploaded',scoped,data.meta.asOf);
    const balance=uploadDetails('balance',scoped,data.meta.asOf);
    assert.equal(balance.rows.length,1);assert.equal(balance.rows[0].uploaded,upload.rows.length);
    assert.equal(JSON.stringify(filters),before);
    if(!Object.keys(filters).length) {
      assert.equal(upload.rows.length,2002);
      const csv=serializeCsv(upload.columns.map(key=>({key,label:key})),upload.rows);
      assert.equal(csv.split("\r\n").length-2,2002);assert.equal(balance.rows[0].planned,2295);assert.equal(balance.rows[0].balance,293);
      assert.ok(upload.rows.some(f=>f.key==='420pfcsccapmapress'&&f.ticketIds.includes(72176)));
    }
  }
});

test('active CFM and TRM detail selection preserves dates and source provenance',async()=>{
  const {confirmedFamilyPlan}=await import('../src/family-plan.js');
  const {linkedUploadDates}=await import('../src/family-links.js');
  const names=confirmedFamilyPlan(data.deliverables);
  const cfm=linkedUploadDates(data.deliverables,data.families,data.meta.asOf,'actualCfm');
  const trm=linkedUploadDates(data.deliverables,data.families,data.meta.asOf,'actualTrm');
  const rows=[...names].map(([key,item])=>{
    const p=data.deliverables.find(r=>r.familyKey===key),f=data.families.find(f=>f.id===p.familyId);
    return {title:p.title,plannedStartWeek:item.first,actualCfm:cfm.get(key)||null,actualTrm:trm.get(key)||null,cfmKind:f?.milestoneEvidence?.actualCfm?.kind,cfmCell:f?.milestoneEvidence?.actualCfm?.sourceCell};
  });
  const meta={rows,weekEnd:week=>new Date(Date.UTC(2025,11,29+week*7-1)).toISOString().slice(0,10)};
  const actual=progressDetails(meta,'Actual CFM',40,data.meta.asOf);
  const transmittal=progressDetails(meta,'MEP Transmittal',40,data.meta.asOf);
  assert.equal(actual.rows.length,2000);assert.equal(transmittal.rows.length,2001);
  assert.ok(actual.columns.includes('actualCfm'));assert.ok(!actual.columns.includes('end'));
  assert.ok(transmittal.columns.includes('actualTrm'));
  assert.ok(actual.rows.every(r=>r.cfmKind&&r.cfmCell));
});

test('pending drawer deduplicates TIDP keys and excludes eligible linked uploads',()=>{
  const scoped=selectCohorts(data);const pending=uploadDetails('pending',scoped,data.meta.asOf);
  assert.equal(pending.rows.length,294);assert.equal(new Set(pending.rows.map(r=>r.familyKey)).size,294);
  const empty=uploadDetails('pending',{...scoped,families:[]},data.meta.asOf);assert.equal(empty.rows.length,2295);
  assert.equal(uploadDetails('pending',selectCohorts(data,{owner:'Hanh Pham'}),data.meta.asOf).rows.length,5);
});
