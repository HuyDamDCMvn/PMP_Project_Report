import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectCohorts } from '../src/cohorts.js';

const fixture = {
  meta: { asOf: '2026-09-30' },
  deliverables: [
    { id:'A', owner:'Hanh Pham', workType:'Revise the RFA library', familyKey:'a', familyId:null },
    { id:'B', owner:'Hanh Pham', workType:'Revise the RFA library', familyKey:'b', familyId:'F1' },
    { id:'C', owner:'Lam Truong', workType:'Revise the RFA library', familyKey:'c', familyId:'F2' },
  ],
  families:[{ id:'F1', key:'b', ticketIds:[101] }, { id:'F2', key:'c', ticketIds:[102] }],
  tickets:[{id:101,handler:'Other',workType:'Revise the RFA library'}, {id:102,handler:'Hanh Pham',reporter:'bn.hoai',workType:'Revise the RFA library'}],
};
test('Plan Owner is not Handler; native planning filters preserve unmatched rows', () => {
  assert.deepEqual(selectCohorts(fixture, {owner:'Hanh Pham'}).deliverables.map(r=>r.id), ['A','B']);
  assert.equal(selectCohorts(fixture, {workType:'Revise the RFA library'}).deliverables.length,3);
  const selected = selectCohorts(fixture,{handler:'Hanh Pham'});
  assert.deepEqual(selected.tickets.map(r=>r.id),[102]);
  assert.equal(selected.deliverables.length,3);
  assert.equal(selected.evidenceDeliverables.length,1);
});
test('snapshot planning baseline survives Owner/workType and evidence filters', () => {
  const data=JSON.parse(readFileSync(new URL('../public/data/dashboard-data.json',import.meta.url)));
  const hanh=selectCohorts(data,{owner:'Hanh Pham',workType:'Revise the RFA library'});
  const keys=new Map(hanh.deliverables.map(r=>[r.familyKey,r]));
  assert.equal(hanh.deliverables.length,413); assert.equal(keys.size,411);
  assert.equal([...keys.values()].filter(r=>r.familyId).length,406);
  const rfa=selectCohorts(data,{workType:'Revise the RFA library'});
  assert.equal(rfa.deliverables.length,2301);
  assert.equal(new Set(rfa.deliverables.map(r=>r.familyKey)).size,2295);
  assert.equal(selectCohorts(data,{reporter:'bn.hoai'}).deliverables.length,2512);
});

test('Work Type-only retains unlinked native tickets and their hours',()=> {
  const data=JSON.parse(readFileSync(new URL('../public/data/dashboard-data.json',import.meta.url)));
  const scoped=selectCohorts(data,{workType:'Revise the RFA library'});
  assert.equal(scoped.tickets.length,2435);
  assert.ok(scoped.tickets.some(t=>t.id===75949));
  assert.equal(scoped.tickets.reduce((s,t)=>s+(t.actualHours||0),0),20644.25);
  const positive=selectCohorts(data,{workType:'Revise the RFA library',active:'Positive'});
  assert.equal(positive.tickets.length,2304);
  assert.equal(positive.tickets.reduce((s,t)=>s+(t.actualHours||0),0),18578.5);
  const copy=structuredClone(fixture);copy.tickets.push({id:103,workType:'Revise the RFA library',familyIds:[]});
  assert.deepEqual(selectCohorts(copy,{workType:'Revise the RFA library'}).tickets.map(t=>t.id),[101,102,103]);
  assert.deepEqual(selectCohorts(copy,{owner:'Hanh Pham'}).tickets.map(t=>t.id),[101]);
});
