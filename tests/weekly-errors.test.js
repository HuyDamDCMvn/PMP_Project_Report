import test from 'node:test';
import assert from 'node:assert/strict';
import { weeklyErrors, weeklyIssueSeries } from '../src/weekly-errors.js';
import { familyProductivity } from '../src/family-outcomes.js';
import { readFileSync } from 'node:fs';
test('weekly error series preserve X flags by upload week, distinct Family and snapshot', () => {
  const a = { id: 'a', end: '2026-09-30', reworkOutcome: 'Returned', reworkErrors: ['Graphics_2D_Visibility', 'Connector_MEP'], ticketIds: [1, 2] };
  const series = weeklyErrors([a, a, { ...a, id: 'b', end: '2026-10-01' }, { ...a, id: 'c', reworkOutcome: 'One_pass' }], '2026-09-30');
  assert.equal(series.length, 9);
  assert.equal(series[0].weeks.length, 21);
  assert.equal(series[0].weeks[0].key, '2026-CW20');
  assert.equal(series[0].weeks.at(-1).value, 1);
  assert.equal(series.flatMap(s => s.weeks).reduce((sum, w) => sum + w.value, 0), 2);
});

test('upload reference reconciles every week with Weekly Family uploads', () => {
  const data = JSON.parse(readFileSync(new URL('../public/data/dashboard-data.json', import.meta.url)));
  const series = weeklyIssueSeries(data.families, '2026-09-30');
  const weeks = familyProductivity(data.families, [], '2026-09-30', { startWeek: 20 }).weeks;
  assert.deepEqual(series[0].weeks.map(w => [w.key, w.value]), weeks.map(w => [w.key, w.uploaded.length]));
  assert.equal(series[0].weeks.reduce((sum, w) => sum + w.value, 0), 2001);
  const sourceFlags = weeks.flatMap(w => w.uploaded).filter(f => f.reworkOutcome === 'Returned').reduce((sum, f) => sum + f.reworkErrors.length, 0);
  assert.equal(series.slice(1).flatMap(s => s.weeks).reduce((sum, w) => sum + w.value, 0), sourceFlags);
  assert.equal(series[0].weeks.at(-1).value, 83);
});
