import { readFileSync } from 'node:fs';
import { fetchPublishedData } from '../src/data-update.js';
const base = new URL('../public/data/', import.meta.url);
const bundle = await fetchPublishedData(async url => {
  const name=url.split('/').at(-1).split('?')[0];
  return {ok:true,arrayBuffer:async()=>new Uint8Array(readFileSync(new URL(name,base)))};
});
process.stdout.write('Validated bundle '+bundle.manifest.releaseId+'\n');
