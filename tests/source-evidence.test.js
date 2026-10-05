import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../public/data/dashboard-data.json',import.meta.url)));
test('Family-preferred status preserves Matrix and both exact source cells',()=>{
  const conflicts=data.qualityRecords.filter(q=>q.type==='ticket_status_conflict');
  assert.equal(conflicts.length,10);
  assert.equal(data.tickets.filter(t=>t.matrixStatus!==t.status).length,10);
  for(const q of conflicts){
    const ticket=data.tickets.find(t=>t.id===q.ticketId);
    assert.equal(ticket.status,q.left.value);assert.equal(ticket.matrixStatus,q.right.value);
    assert.match(q.left.cell,/^[A-Z]+\d+$/);assert.match(q.right.cell,/^[A-Z]+\d+$/);
  }
});
test('historic overlaps and cycle review flags do not delete Family population',()=>{
  assert.equal(data.families.length,2002);
  assert.equal(data.qualityRecords.filter(q=>q.type==='historical_sheet_overlap').length,17);
  assert.equal(data.qualityRecords.filter(q=>q.type==='cfm_before_trm_review').length,44);
});
test('seven upload-created proxies have source lineage; six are inside snapshot',()=>{
  const proxies=data.families.filter(f=>f.milestoneEvidence.actualCfm.kind==='uploadCreatedProxy');
  assert.equal(proxies.length,7);assert.equal(proxies.filter(f=>f.actualCfm<=data.meta.asOf).length,6);
  for(const f of proxies){const e=f.milestoneEvidence.actualCfm;assert.equal(e.value,f.actualCfm);assert.match(e.sourceCell,/^[A-Z]+\d+$/);assert.equal(e.sourceEventId,null);assert.equal(e.precision,'date');}
});
