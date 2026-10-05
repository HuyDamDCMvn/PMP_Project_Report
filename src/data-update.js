import { validateBundle, requireValue } from './bundle-schema.js';
export const PUBLISHED_DATA_URL = 'https://huydamdcmvn.github.io/PMP_Project_Report/data/';
const FILES = ['dashboard-data.json','family-role-hours.json','weekly-hours.json'];
export async function sha256(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function fetchPublishedData(fetcher=fetch,base=PUBLISHED_DATA_URL) {
  const signal=AbortSignal.timeout(30000);
  const get=async name=>{
    const response=await fetcher(base+name+'?refresh='+Date.now(),{cache:'no-store',signal});
    if (!response.ok) throw new Error('Could not download '+name+' ('+response.status+').');
    return new Uint8Array(await response.arrayBuffer());
  };
  const decode=bytes=>JSON.parse(new TextDecoder().decode(bytes));
  const manifest=decode(await get('bundle-manifest.json'));
  requireValue(manifest?.schemaVersion===1 && Array.isArray(manifest.files) && manifest.files.length===3,'manifest');
  const datasets=await Promise.all(FILES.map(async name=>{
    const desc=manifest.files.find(f=>f.name===name); requireValue(desc,'manifest file');
    const bytes=await get(name);
    requireValue(bytes.length===desc.bytes && await sha256(bytes)===desc.sha256,name+' hash/bytes');
    return decode(bytes);
  }));
  const after=decode(await get('bundle-manifest.json'));
  requireValue(JSON.stringify(after)===JSON.stringify(manifest),'release changed during download; retry update');
  return validateBundle({data:datasets[0],familyRoleHours:datasets[1],timeHistory:datasets[2],manifest});
}
export function createRefreshController({load,prepare,commit}) {
  let generation=0;
  return async()=>{
    const mine=++generation;
    const bundle=await load();
    const next=await prepare(bundle);
    if (mine!==generation) return {stale:true};
    await commit(next);
    return {stale:false,releaseId:bundle.manifest.releaseId};
  };
}
