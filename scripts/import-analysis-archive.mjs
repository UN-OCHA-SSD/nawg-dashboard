// Manual, reproducible import. Never copy the bundled website or its raw notes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const [input,website]=process.argv.slice(2);
if(!input||!website)throw new Error('Usage: node scripts/import-analysis-archive.mjs colleague-data.json website-directory');
const d=JSON.parse(await fs.readFile(input,'utf8'));
const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
const output={
  schemaVersion:1,source:'NAWG analysis archive',built:d.meta.built,
  bands:d.bands.map(o=>pick(o,['id','label','color'])),
  indicators:d.pillars.map(o=>pick(o,['id','name','group','ipc','max_v1','max_v2'])),
  cycles:d.cycles.map(o=>pick(o,['id','window','meeting','fw','n','mean','counts'])),
  counties:d.counties.map(o=>pick(o,['key','name','state'])),
  rows:d.panel.map(r=>({cycle:d.cycles[r[0]].id,county:d.counties[r[1]].key,score:r[2],band:d.bands[r[3]]?.id??null,initialScore:r[4],initialBand:d.bands[r[5]]?.id??null,adjustment:d.adj_labels[r[6]],uvs:r[8],ats:r[9],contributions:r[10],classifications:r[11].map(i=>d.sev_labels[i]),afi:r[12],amn:r[13]})),
  bridge:d.framework_bridge.map(o=>pick(o,['cycle','prior_cycle','lower','upper','midpoint','published','previous'])),
  hpc:{years:d.evidence.hpc.years,definition:d.evidence.hpc.definition,sources:d.evidence.hpc.sources,urls:d.evidence.hpc.urls,records:d.evidence.hpc.records},
  reports:d.reports.map(o=>pick(o,['kind','cycle','title','meeting_date','file']))
};
const keys=new Set();
for(const r of output.rows){
  if(keys.has(r.cycle+'/'+r.county))throw new Error('Duplicate county/cycle');
  keys.add(r.cycle+'/'+r.county);
  if(r.score!==null&&(!Number.isFinite(r.score)||r.score<0||r.score>10))throw new Error('Invalid NSS');
  if(r.contributions.length!==10||r.classifications.length!==10)throw new Error('Invalid indicators');
}
for(const c of output.cycles){
  const rows=output.rows.filter(r=>r.cycle===c.id&&r.score!==null);
  if(rows.length!==c.n)throw new Error('Coverage mismatch '+c.id);
  if(Math.abs(rows.reduce((s,r)=>s+r.score,0)/rows.length-c.mean)>.0006)throw new Error('Mean mismatch '+c.id);
  for(const b of output.bands)if(rows.filter(r=>r.band===b.id).length!==(c.counts[b.id]??0))throw new Error('Band mismatch '+c.id);
}
await fs.mkdir(path.join(root,'public/reports'),{recursive:true});
for(const report of output.reports){
  if(!/^reports\/[A-Za-z0-9_.-]+\.pdf$/.test(report.file))throw new Error('Unsafe report path');
  const source=path.join(website,report.file),bytes=await fs.readFile(source);
  if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Invalid PDF');
  await fs.copyFile(source,path.join(root,'public',report.file));
}
await fs.writeFile(path.join(root,'data/nawg-archive.json'),JSON.stringify(output));
console.log('Validated '+output.rows.length+' records across '+output.cycles.length+' cycles; copied '+output.reports.length+' PDFs. No raw notes or record IDs exported.');
