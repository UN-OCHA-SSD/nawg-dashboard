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
const fields=new Set(rows.flatMap(Object.keys));
for(const field of ['County.name','Year','Month','needs_severity_score_NSS','needs_severity_score_NSS_edited','band','band_edited','climate_impact','climate_impact_severity','conflict','conflict_severity'])if(!fields.has(field))throw new Error('Required ActivityInfo field is missing: '+field);
const snapshot=publicSnapshot(rows,fetchedAt,geo);
await fs.mkdir(new URL('data/',root),{recursive:true});
await fs.writeFile(new URL('data/nawg-public.json.pending',root),JSON.stringify(snapshot)+'\n');
await fs.rename(new URL('data/nawg-public.json.pending',root),new URL('data/nawg-public.json',root));
// Refresh the ignored private cache only after validation, so local live mode
// and future offline exports cannot silently revert to the older data.
if(process.argv.includes('--refresh')){
  await fs.mkdir(new URL('.cache/',root),{recursive:true});
  await fs.writeFile(new URL('.cache/activityinfo.json.pending',root),JSON.stringify(rows),{mode:0o600});
  await fs.rename(new URL('.cache/activityinfo.json.pending',root),cache);
}
console.log('Prepared '+snapshot.rows.length+' dated records from '+rows.length+' ActivityInfo rows; excluded invalid dates: '+snapshot.quality.excludedInvalidDates+'. Private notes, identifiers and credentials excluded.');
