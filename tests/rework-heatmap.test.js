import test from 'node:test';
import assert from 'node:assert/strict';
import { familyErrorSystems, reworkHeatmap } from '../src/rework-heatmap.js';
test('error flags count once under explicit, unknown or conflicting system links', () => {
  const systems = familyErrorSystems([{ familyId: 'a', system: 'SAN' }, { familyId: 'a', system: 'SAN' }, { familyId: 'b', system: 'SAN' }, { familyId: 'b', system: 'HKG' }]);
  const model = reworkHeatmap([
    { id: 'a', reworkOutcome: 'Returned', reworkErrors: ['Geometry', 'Naming'] },
    { id: 'b', reworkOutcome: 'Returned', reworkErrors: ['Naming'] },
    { id: 'c', reworkOutcome: 'Returned', reworkErrors: ['Geometry'] },
    { id: 'd', reworkOutcome: 'One_pass', reworkErrors: ['Geometry'] },
  ], systems);
  assert.equal(systems.get('a'), 'SAN');
  assert.equal(systems.get('b'), 'Multiple systems');
  assert.equal(model.rows.flatMap(r => r.cells).reduce((sum, c) => sum + c.families.length, 0), 4);
  assert.ok(model.rows.some(r => r.system === 'Unknown system'));
});

test('approved Mapress error ownership follows stable key and Ticket ID without adding a planning link',()=>{
  const families=[{id:'reordered-id',key:'420pfcsccapmapress',ticketIds:[72176]},{id:'other',key:'another',ticketIds:[999]}];
  const systems=familyErrorSystems([],families);assert.equal(systems.get('reordered-id'),'HKG');assert.equal(systems.has('other'),false);
});
