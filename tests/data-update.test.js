import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPublishedData } from '../src/data-update.js';

test('published refresh loads all datasets without cache or credentials', async () => {
  const seen = [];
  const result = await fetchPublishedData(async (url, options) => {
    seen.push({ url, options });
    return { ok: true, json: async () => url.includes('dashboard-data') ? { meta: { asOf: '2026-09-30' }, families: [], tickets: [], deliverables: [] } : { meta: {} } };
  });
  assert.equal(seen.length, 3);
  assert.ok(seen.every(r => r.options.cache === 'no-store' && !r.options.headers));
  assert.ok(result.timeHistory);
});
test('refresh rejects HTTP failures or invalid data without returning partial state', async () => {
  await assert.rejects(fetchPublishedData(async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(fetchPublishedData(async () => ({ ok: true, json: async () => ({}) })), /invalid/);
});
