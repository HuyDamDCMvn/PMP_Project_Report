import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fetchPublishedData, createRefreshController } from '../src/data-update.js';
import { validateBundle } from '../src/bundle-schema.js';
const names=['bundle-manifest.json','dashboard-data.json','family-role-hours.json','weekly-hours.json'];
const bytes=Object.fromEntries(names.map(n=>[n,new Uint8Array(readFileSync(new URL('../public/data/'+n,import.meta.url)))]));
function fixture() {
  const p=Object.fromEntries(names.map(n=>[n,JSON.parse(new TextDecoder().decode(bytes[n]))]));
  return {manifest:p[names[0]],data:p[names[1]],familyRoleHours:p[names[2]],timeHistory:p[names[3]]};
}

test('published refresh loads all datasets without cache or credentials', async () => {
  const seen = [];
  const result = await fetchPublishedData(async (url, options) => {
    seen.push({ url, options });
    return { ok: true, arrayBuffer: async () => bytes[url.split('/').at(-1).split('?')[0]] };
  });
  assert.equal(seen.length, 5);
  assert.ok(seen.every(r => r.options.cache === 'no-store' && !r.options.headers));
  assert.ok(result.timeHistory);
});
test('refresh rejects HTTP failures or invalid data without returning partial state', async () => {
  await assert.rejects(fetchPublishedData(async () => ({ ok: false, status: 503 })), /503/);
  await assert.rejects(fetchPublishedData(async () => ({ ok: true, arrayBuffer: async () => new TextEncoder().encode('{}') })), /Invalid/);
});

test('nested schema rejects invalid rows, absent supplements, duplicate IDs, dates, references and mixed releases',()=>{
  for(const mutate of [b=>b.data.families[0]=null,b=>delete b.familyRoleHours.tickets[0].people,b=>delete b.timeHistory.entries,b=>b.data.tickets.push(b.data.tickets[0]),b=>b.data.families[0].actualCfm='2026-02-30',b=>b.data.deliverables[0].familyId='missing',b=>b.timeHistory.meta.releaseId='b'.repeat(64),b=>b.data.tickets[0].actualHours=Infinity]) {
    const b=fixture();mutate(b);assert.throws(()=>validateBundle(b),/Invalid bundle/);
  }
});
test('corrupted bytes and deployment changing mid-download are rejected',async()=>{
  await assert.rejects(fetchPublishedData(async(url)=>({ok:true,arrayBuffer:async()=>url.includes('dashboard-data')?new TextEncoder().encode('{}'):bytes[url.split('/').at(-1).split('?')[0]]})),/hash\/bytes/);
  let count=0;
  await assert.rejects(fetchPublishedData(async(url)=>({ok:true,arrayBuffer:async()=>{
    const name=url.split('/').at(-1).split('?')[0];
    if(name===names[0]&&++count===2)return new TextEncoder().encode(JSON.stringify({...fixture().manifest,releaseId:'a'.repeat(64)}));
    return bytes[name];
  }})),/release changed/);
});
test('signed weekly adjustments are allowed',()=>{
  const b=fixture();b.timeHistory.entries[0].hours=-0.25;b.timeHistory.entries[0].rawHours=-0.1;assert.equal(validateBundle(b),b);
});
test('failed staging and late older requests cannot overwrite committed state',async()=>{
  let committed='old';const pending=[];
  const refresh=createRefreshController({load:()=>new Promise(resolve=>pending.push(resolve)),prepare:b=>{if(b.fail)throw Error('staging failed');return b;},commit:b=>{committed=b.manifest.releaseId;}});
  const a=refresh(),b=refresh();pending[1]({manifest:{releaseId:'new'}});await b;
  pending[0]({manifest:{releaseId:'older'}});assert.equal((await a).stale,true);assert.equal(committed,'new');
  const c=refresh();pending[2]({fail:true});await assert.rejects(c,/staging failed/);assert.equal(committed,'new');
});
