import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreLayout, saveLayout } from '../src/layout-preferences.js';

test('layout round trip restores presentation without restoring record filters', () => {
  let value;
  const storage = { setItem: (_, text) => { value = text; }, getItem: () => value };
  saveLayout({ page: 'team', collapsed: { 'group-issues': true }, uploadAxisStep: 50, hiddenErrorSeries: ['Geometry_Dimensions'], showIssueLabels: true, filters: { owner: 'someone' } }, storage);
  const restored = { filters: { owner: '' } };
  restoreLayout(restored, storage);
  assert.equal(restored.page, 'team');
  assert.deepEqual(restored.collapsed, { 'group-issues': true });
  assert.equal(restored.uploadAxisStep, 50);
  assert.deepEqual(restored.hiddenErrorSeries, ['Geometry_Dimensions']);
  assert.equal(restored.showIssueLabels, true);
  assert.deepEqual(restored.filters, { owner: '' });
});

test('invalid and inaccessible storage preserve usable defaults', () => {
  const state = { page: 'tidp', collapsed: {}, hoursAxisStep: 200 };
  restoreLayout(state, { getItem: () => '{' });
  restoreLayout(state, { getItem: () => JSON.stringify({ page: 'removed-page', collapsed: { bad: 'yes' }, hoursAxisStep: -5 }) });
  assert.deepEqual(state, { page: 'tidp', collapsed: {}, hoursAxisStep: 200 });
  assert.doesNotThrow(() => saveLayout(state, { setItem: () => { throw new Error('blocked'); } }));
});
