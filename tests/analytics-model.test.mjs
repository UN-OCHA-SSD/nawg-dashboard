import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {activityModel,summary,paired,comparable,persistence,nationalSeries,highBands,colorsFor,classificationContext} from '../src/analytics-model.mjs';
import {createModel,severityInfo,INDICATORS} from '../src/data-model.mjs';
import {publicSnapshot,validateSnapshot} from '../src/public-snapshot.mjs';
const json=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const snapshot=json('../data/nawg-public.json'),reference=json('../data/nawg-reference.json'),geo=json('../public/data/counties.geojson'),model=activityModel(snapshot,geo,reference);
test('ActivityInfo migration preserves all dated observations and reports exclusions',()=>{
 assert.equal(model.rawCount,2834);assert.equal(model.periods.length,36);assert.equal(model.defaultPeriod,'2026-06');
 assert.equal(model.unmapped.length,0);assert.equal(model.invalid.length,0);assert.deepEqual(model.duplicates,[]);
 assert.deepEqual(snapshot.quality,{sourceRecords:2912,excludedInvalidDates:78});
 assert.equal(model.sourceKind,'activityinfo');
 for(const period of model.periods){
  const rows=snapshot.rows.filter(r=>r.Year===period.slice(0,4)&&r.Month===new Date(period+'-01T00:00:00Z').toLocaleString('en-US',{month:'long',timeZone:'UTC'}));
  const scores=rows.map(r=>r.needs_severity_score_NSS_edited??r.needs_severity_score_NSS).filter(v=>v!==null).map(Number);
  const s=summary(model,model.counties,period);assert.equal(s.n,scores.length);assert.ok(Math.abs(s.mean-scores.reduce((a,b)=>a+b,0)/scores.length)<1e-9);
 }
});
test('June 2026 county and national figures reconcile after source migration',()=>{
 const c=model.cells.get('2026-06/twiceast');assert.equal(c.score,6.6);assert.equal(c.band,'C');
 assert.equal(c.row.climate_impact,.165);assert.equal(c.row.conflict,1);assert.equal(INDICATORS.length,10);
 const s=summary(model,model.counties,'2026-06');assert.equal(s.n,79);assert.equal(s.ab,18);assert.equal(s.median,6.16);
 assert.deepEqual(s.counts,{A:12,D:21,C:39,B:6,E:1});assert.ok(Math.abs(s.mean-6.328987342)<1e-8);
 const pairs=paired(model,model.counties,'2026-06','2026-05');assert.equal(pairs.length,79);assert.equal(pairs.filter(c=>c.changed).length,8);assert.equal(pairs.find(c=>c.key==='twiceast').delta,.25);
});
test('historical labels and colours remain source-specific without recoding',()=>{
 const c=model.cells.get('2025-11/twiceast');assert.equal(c.band,'B2');assert.equal(c.row.source_band,undefined);
 assert.deepEqual(highBands('2025-11'),['A','B1']);assert.deepEqual(highBands('2026-06','ABC'),['A','B','C']);
 assert.notEqual(colorsFor(model,'2025-11').C,colorsFor(model,'2026-06').C);
});
test('revised framework blocks comparisons and persistence across the break',()=>{
 assert.equal(comparable(model,'2025-11','2025-12'),false);assert.deepEqual(paired(model,model.counties,'2026-06','2025-06'),[]);
 const rows=persistence(model,model.counties,'2026-06');assert.ok(rows.length>0);assert.ok(rows.every(c=>c.cycles===7&&c.observed<=7));
 assert.equal(nationalSeries(model,model.counties,'2025-11',12).find(r=>r.period==='2025-07').mean,null);
});
test('empty selections and missing months are never filled from references',()=>{
 assert.deepEqual(summary(model,[],'2026-06'),{n:0,total:0,mean:null,median:null,counts:{},ab:0});
 const sparse=activityModel({...snapshot,rows:snapshot.rows.filter(r=>r.Year!=='2026')},geo,reference);
 assert.equal(sparse.cells.get('2026-06/twiceast'),undefined);
 assert.equal(sparse.hpcByCounty,undefined);
 assert.equal(reference.rows,undefined);assert.equal(reference.cycles,undefined);assert.equal(reference.counties,undefined);
 assert.deepEqual(Object.keys(reference).sort(),['bands','indicators','preparedAt','reports','source']);
 assert.equal(reference.hpc,undefined);assert.equal(reference.bridge,undefined);
});
test('private notes produce bounded context labels, not publicly exposed text',()=>{
 assert.equal(classificationContext({note:'IPC methodological restriction, PRIVATE DETAILS'}),'IPC methodological restriction');
 assert.equal(classificationContext({note:'PRIVATE DETAILS'}),'Contextual note recorded');
 const row={...snapshot.rows[0],classification_context:undefined,note:'PRIVATE DETAILS'},out=publicSnapshot([row],snapshot.fetchedAt,geo);
 assert.equal(out.rows[0].classification_context,'Contextual note recorded');assert.ok(!JSON.stringify(out).includes('PRIVATE DETAILS'));
});
test('invalid dates are excluded with an auditable count; invalid scores fail closed',()=>{
 const out=publicSnapshot([snapshot.rows[0],{...snapshot.rows[0],Year:'Not classified',Month:'Not classified'}],snapshot.fetchedAt,geo);
 assert.equal(out.rows.length,1);assert.deepEqual(out.quality,{sourceRecords:2,excludedInvalidDates:1});
 assert.throws(()=>publicSnapshot([{...snapshot.rows[0],needs_severity_score_NSS_edited:11}],snapshot.fetchedAt,geo));
 assert.throws(()=>validateSnapshot({...out,quality:{sourceRecords:2,excludedInvalidDates:0}},geo));
});
test('new climate or conflict disagreements cannot be silently collapsed',()=>{
 const a=snapshot.rows[0],b={...a,climate_impact:.333};
 const m=createModel(publicSnapshot([a,b],snapshot.fetchedAt,geo).rows,geo),c=[...m.cells.values()][0];
 assert.equal(c.conflict,true);assert.equal(c.score,null);
});
test('known classifications distinguish zero impacts and IPC pockets from missing values',()=>{
 assert.notEqual(severityInfo('None recorded').color,severityInfo('No data').color);
 assert.equal(severityInfo('Phase 4 with pockets of Phase 5').level,4);
 assert.equal(severityInfo('Phase 4 with pockets of Phase 5').color,'#c52c42');
});
test('reference publications remain safe PDF downloads, not monthly data input',()=>{
 for(const r of reference.reports){assert.match(r.file,/^reports\/[A-Za-z0-9_.-]+\.pdf$/);assert.equal(fs.readFileSync(new URL('../public/'+r.file,import.meta.url)).subarray(0,5).toString(),'%PDF-');}
 assert.equal(reference.reports.length,20);assert.equal(reference.source,'Supplied NAWG reference material');
 assert.equal(reference.bridge,undefined);
});
