import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateMidp } from '../src/midp.js';
test('MIDP preserves source activity gaps and supports future team/lot adapters', () => {
  const records = [
    { id: '1', workType: 'REV', system: 'RLT', weeks: [{ week: 5, activity: 'REV' }, { week: 8, activity: 'TRM' }] },
    { id: '2', workType: 'REV', system: 'RLT', weeks: [{ week: 5, activity: 'AUD' }] },
    { id: 'DIG:1', teamId: 'DIG', batchId: 'Batch A', workType: 'REV', weeks: [{ week: 6, activity: 'CFM' }] },
  ];
  const groups = aggregateMidp(records);
  assert.equal(groups.length, 2);
  const mep = groups.find(g => g.team === 'MEP');
  assert.equal(mep.records.length, 2);
  assert.equal(mep.weeks.get(5).ids.size, 2);
  assert.equal(mep.weeks.has(6), false);
  assert.equal(groups.find(g => g.team === 'DIG').batch, 'Batch A');
});
import { midpWeeklyActual } from '../src/midp.js';

test('MIDP actual counts unique uploads in their own ISO CW, not cumulative', () => {
  const group = { workType: 'Revise the RFA library', records: [{ id: 'a', familyKey: 'x', familyId: 'f1' }, { id: 'b', familyKey: 'x', familyId: 'f1' }, { id: 'c', familyKey: 'y', familyId: 'f2' }] };
  const rows = midpWeeklyActual(group, [{ id: 'f1', key: 'x', end: '2026-05-25' }, { id: 'f1', key: 'x', end: '2026-06-01' }, { id: 'f2', key: 'y', end: '2026-06-01' }], '2026-09-30');
  assert.deepEqual(rows.map(r => r.actualWeek), [22, 23]);
  assert.deepEqual(midpWeeklyActual({ workType: 'Framework deliverables' }, [], '2026-09-30'), []);
  assert.equal(midpWeeklyActual(group, [{ id: 'f1', key: 'x', end: '2026-10-01' }], '2026-09-30').length, 0);
});

test('MIDP ticket actual requires explicit single system, completed status and valid snapshot date', () => {
  const group = { workType: 'Output Checklists', batch: 'ELT/MSR' };
  const base = { workType: 'Output Checklists', status: 'resolved', active: 'Positive', end: '2026-09-28' };
  const tickets = [
    { ...base, id: 1, summary: 'LPH8 Check list for MSR discipline' },
    { ...base, id: 2, summary: 'ELT and SAN checklist' },
    { ...base, id: 3, summary: 'ELT checklist', status: 'new' },
    { ...base, id: 4, summary: 'Checklist', reporter: 'h.pham' },
    { ...base, id: 5, summary: 'ELT checklist', end: '2026-10-01' },
    { ...base, id: 6, summary: 'ELT checklist', active: 'Negative' },
  ];
  assert.deepEqual(midpWeeklyActual(group, [], '2026-09-30', tickets).map(row => [row.id, row.actualWeek]), [[1, 40]]);
});
