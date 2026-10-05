import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmedFamilyPlan } from '../src/family-plan.js';
import { linkedUploadDates } from '../src/family-links.js';

test('MEP Transmittal uses Actual_TRM independently of CFM and End Date', () => {
  const families = [
    { id: 'a', actualTrm: '2026-06-01', actualCfm: '2026-09-20' },
    { id: 'b', actualTrm: null, end: '2026-06-02' },
    { id: 'c', actualTrm: '2026-10-01' },
    { id: 'd', actualTrm: 'invalid' },
  ];
  const records = families.map(f => ({ familyId: f.id, familyKey: f.id }));
  records.push({ familyId: 'a', familyKey: 'a' });
  assert.deepEqual([...linkedUploadDates(records, families, '2026-09-30', 'actualTrm')], [['a', '2026-06-01']]);
});
test('Actual uses source Actual_CFM without upload-date fallback', () => {
  const families = [{ id: 'a', end: '2026-06-01', actualCfm: '2026-09-20' }, { id: 'b', end: '2026-06-02', actualCfm: null }, { id: 'c', end: '2026-06-03', actualCfm: '2026-10-01' }];
  const records = families.map(f => ({ familyId: f.id, familyKey: f.id }));
  assert.deepEqual([...linkedUploadDates(records, families, '2026-09-30', 'actualCfm')], [['a', '2026-09-20']]);
});
test('Plan counts distinct RFA Families at first CFM, including combined markers', () => {
  const row = (familyKey, weeks) => ({ familyKey, workType: 'Revise the RFA library', weeks });
  const plan = confirmedFamilyPlan([
    row('a', [{ week: 20, activity: 'TRM' }, { week: 25, activity: 'REV | CFM' }]),
    row('a', [{ week: 26, activity: 'CFM' }]),
    row('b', [{ week: 21, activity: 'AUD' }]),
    row('c', [{ week: 23, activity: 'NOT_CFM' }]),
    { ...row('d', [{ week: 22, activity: 'CFM' }]), workType: 'Other' },
  ]);
  assert.equal(plan.size, 1);
  assert.equal(plan.get('a').first, 25);
});
