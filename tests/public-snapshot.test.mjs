import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {PUBLIC_FIELDS,sanitizeRows,publicSnapshot,validateSnapshot} from '../src/public-snapshot.mjs';
import {createModel,calendarTrend,csvText,calendarPeriods} from '../src/data-model.mjs';
import {trendGapSegments} from '../src/trend-gaps.mjs';
const root=new URL('../',import.meta.url);
const snapshot=JSON.parse(fs.readFileSync(new URL('data/nawg-public.json',root)));
const geo=JSON.parse(fs.readFileSync(new URL('public/data/counties.geojson',root)));
const model=validateSnapshot(snapshot,geo);

test('published data is valid county evidence with an explicit date and public field allowlist',()=>{
  assert.equal(model.counties.length,79);assert.equal(model.rawCount,snapshot.rows.length);
  assert.ok(model.periods.length>0);assert.equal(model.invalid.length,0);assert.equal(model.unmapped.length,0);
  assert.ok(snapshot.rows.every(row=>JSON.stringify(Object.keys(row))===JSON.stringify(PUBLIC_FIELDS)));
});
test('public export strips identifiers, notes, coordinates and unexpected future fields',()=>{
  const row={...snapshot.rows[0],_id:'private-id',note:'private note',email:'private@example.test',County:'internal-reference',Lat:9,Lon:31,token:'secret-value',future_private_field:'private'};
  const clean=sanitizeRows([row])[0];
  for(const key of ['_id','note','email','County','Lat','Lon','token','future_private_field'])assert.ok(!(key in clean));
  const exported=publicSnapshot([row],snapshot.fetchedAt,geo);
  assert.deepEqual(exported.rows[0],sanitizeRows([snapshot.rows[0]])[0]);
});
test('public export preserves zero, original metrics, conflict status and absent observations',()=>{
  const a={...snapshot.rows[0],needs_severity_score_NSS:4,needs_severity_score_NSS_edited:0};
  const b={...a,needs_severity_score_NSS_edited:2};
  const published=publicSnapshot([a,b],snapshot.fetchedAt,geo);
  const cell=[...createModel(published.rows,geo).cells.values()][0];
  assert.equal(cell.conflict,true);assert.equal(cell.score,null);assert.equal(cell.records[0].needs_severity_score_NSS_edited,0);
  assert.equal(cell.records[0].needs_severity_score_NSS,4);
  const zero=[...createModel(publicSnapshot([a],snapshot.fetchedAt,geo).rows,geo).cells.values()][0];
  assert.equal(zero.score,0);
});
test('snapshot validation rejects private fields, metadata, non-scalars and unmapped names',()=>{
  const extra=structuredClone(snapshot);extra.rows[0].note='private';assert.throws(()=>validateSnapshot(extra,geo));
  assert.throws(()=>validateSnapshot({...snapshot,token:'private'},geo));
  assert.throws(()=>sanitizeRows([{...snapshot.rows[0],band:{unexpected:'private'}}]));
  assert.throws(()=>publicSnapshot([{...snapshot.rows[0],'County.name':'Unknown county'}],snapshot.fetchedAt,geo));
});
test('calendar playback and 12/24-month trends remain available without a server',()=>{
  const months=calendarPeriods(model.periods);
  assert.ok(months.length>=model.periods.length);
  for(const range of [12,24]){
    const trend=calendarTrend(model,'twiceast',model.defaultPeriod,range),before=csvText(trend,['period','score']);
    assert.equal(trend.length,range);
    for(const [from,to]of trendGapSegments(trend)){
      assert.equal(trend.find(row=>row.period===from.x).score,from.y);
      assert.equal(trend.find(row=>row.period===to.x).score,to.y);
    }
    assert.equal(csvText(trend,['period','score']),before);
  }
});
test('Pages artifact uses the repository base and contains only approved public files',()=>{
  const output=new URL('dist/pages/',root);
  const html=fs.readFileSync(new URL('index.html',output),'utf8');
  assert.match(html,/\/nawg-dashboard\/assets\//);
  for(const match of html.matchAll(/(?:src|href)="\/nawg-dashboard\/([^"]+)"/g))assert.ok(fs.existsSync(new URL(match[1],output)));
  const reference=JSON.parse(fs.readFileSync(new URL('data/nawg-reference.json',root),'utf8'));
  const reports=new Set(reference.reports.map(r=>r.file));
  const files=fs.readdirSync(output,{recursive:true,withFileTypes:true}).filter(entry=>entry.isFile());
  for(const entry of files){
    const full=path.join(entry.parentPath,entry.name),relative=path.relative(new URL(output).pathname,full);
    assert.ok(relative==='index.html'||relative==='.nojekyll'||/^assets\/[\w.-]+\.(js|css|woff2?)$/.test(relative)||/^assets\/(reach|ocha|framework)-[\w-]+\.png$/.test(relative)||reports.has(relative)||/^data\/(nawg-public\.json|counties\.geojson|international-boundaries\.geojson)$/.test(relative),'Unexpected public artifact: '+relative);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(new URL('data/nawg-public.json',output))),snapshot);
  const bundles=files.filter(f=>f.name.endsWith('.js')).map(f=>fs.readFileSync(path.join(f.parentPath,f.name),'utf8')).join('\n');
  assert.ok(!bundles.includes('NAWG analysis archive'));assert.ok(bundles.includes('ActivityInfo'));
  for(const retired of ['hpc:2026','hpc:2025','hpcByCounty','Earlier-framework sensitivity range','Study: published 2026'])assert.ok(!bundles.includes(retired),'Retired data in public bundle: '+retired);
  assert.ok(!fs.existsSync(new URL('data/nawg-archive.json',output)));
  assert.ok(!bundles.includes('/api/data'));assert.ok(!bundles.includes('Bearer '));
});
