import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {publicSnapshot,SOURCE_URL} from '../src/public-snapshot.mjs';
const root=new URL('../',import.meta.url),cache=new URL('.cache/activityinfo.json',root);
const geo=JSON.parse(await fs.readFile(new URL('public/data/counties.geojson',root),'utf8'));
let rows,fetchedAt;
if(process.argv.includes('--refresh')){
  try{process.loadEnvFile(fileURLToPath(new URL('.env.local',root)));}catch{}
  if(!process.env.ACTIVITYINFO_TOKEN)throw new Error('Configure ACTIVITYINFO_TOKEN locally before refreshing.');
  const res=await fetch(SOURCE_URL,{headers:{Authorization:'Bearer '+process.env.ACTIVITYINFO_TOKEN,Accept:'application/json'},signal:AbortSignal.timeout(45000)});
  if(!res.ok)throw new Error('ActivityInfo refresh failed: HTTP '+res.status);
  rows=await res.json();fetchedAt=new Date().toISOString();
}else{
  rows=JSON.parse(await fs.readFile(cache,'utf8'));fetchedAt=(await fs.stat(cache)).mtime.toISOString();
}
// Write only an allowlisted public export, never the raw response.
const snapshot=publicSnapshot(rows,fetchedAt,geo);
await fs.mkdir(new URL('data/',root),{recursive:true});
await fs.writeFile(new URL('data/nawg-public.json',root),JSON.stringify(snapshot)+'\n');
console.log('Prepared public county snapshot: '+snapshot.rows.length+' records; private notes, identifiers and credentials excluded.');
