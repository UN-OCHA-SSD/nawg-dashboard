import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {archiveModel,summary,paired,comparable,persistence,nationalSeries} from '../src/analytics-model.mjs';
import {createModel,severityInfo} from '../src/data-model.mjs';
const json=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const archive=json('../data/nawg-archive.json'),geo=json('../public/data/counties.geojson'),model=archiveModel(archive,geo);
test('None recorded is a known classification, not a missing-data map colour',()=>{
 assert.notEqual(severityInfo('None recorded').color,severityInfo('No data').color);
 assert.equal(severityInfo('None recorded').label,'None recorded');
});
test('archive maps every record without duplicates; source aggregates reconcile for all 36 cycles',()=>{
 assert.equal(model.counties.length,79);assert.equal(model.rawCount,archive.rows.length);assert.equal(model.periods.length,archive.cycles.length);
 for(const c of archive.cycles){const s=summary(model,model.counties,c.id);assert.equal(s.n,c.n);assert.ok(Math.abs(s.mean-c.mean)<.0006);for(const b of archive.bands)assert.equal(s.counts[b.id]||0,c.counts[b.id]||0);}
});
test('June 2026 county and national figures match the supplied analysis',()=>{
 const c=model.cells.get('2026-06/twiceast');assert.equal(c.score,6.6);assert.equal(c.band,'C');assert.equal(c.row.climate,.165);assert.equal(c.row.conflict,1);
 const s=summary(model,model.counties,'2026-06');assert.equal(s.ab,18);assert.ok(Math.abs(s.mean-6.328987342)<1e-8);
 const pairs=paired(model,model.counties,'2026-06','2026-05');assert.equal(pairs.length,79);assert.equal(pairs.filter(c=>c.changed).length,8);
 assert.equal(pairs.find(c=>c.key==='twiceast').delta,.25);
});
test('framework revision blocks comparisons and excludes earlier cycles from persistence',()=>{
 assert.equal(comparable(model,'2025-11','2025-12'),false);assert.deepEqual(paired(model,model.counties,'2026-06','2025-06'),[]);
 const rows=persistence(model,model.counties,'2026-06');assert.ok(rows.length>0);assert.ok(rows.every(c=>c.cycles===7&&c.observed<=7));
 assert.equal(model.cells.get('2025-11/twiceast').row.climate_severity,'Not in framework');
});
test('monthly gaps stay missing and historical band labels retain a source crosswalk',()=>{
 const series=nationalSeries(model,model.counties,'2025-11',12);assert.equal(series.find(r=>r.period==='2025-07').mean,null);
 const c=model.cells.get('2025-11/twiceast');assert.equal(c.row.source_band,'B2');assert.equal(c.band,'C');
});
test('empty selections have null means; filtering is recomputed, not a national constant',()=>{
 assert.deepEqual(summary(model,[],'2026-06'),{n:0,total:0,mean:null,median:null,counts:{},ab:0});
 const c=model.counties.filter(c=>c.key==='twiceast');assert.equal(summary(model,c,'2026-06').mean,6.6);
});
test('ActivityInfo source is kept independent and preserves conflicts and source bands',()=>{
 const ai=createModel(json('../data/nawg-public.json').rows,geo);
 assert.equal(ai.cells.get('2025-11/twiceast').band,'B2');
 assert.ok(ai.duplicates.some(c=>c.conflict));
 assert.equal(model.sourceKind,'archive');
});
test('public archive uses a narrow allowlist and published reports have safe PDF paths',()=>{
 assert.deepEqual(Object.keys(archive.rows[0]).sort(),['adjustment','afi','amn','ats','band','classifications','contributions','county','cycle','initialBand','initialScore','score','uvs'].sort());
 for(const r of archive.reports){assert.match(r.file,/^reports\/[A-Za-z0-9_.-]+\.pdf$/);const bytes=fs.readFileSync(new URL('../public/'+r.file,import.meta.url));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');}
 assert.ok(archive.reports.length>=20);assert.equal(archive.notes,undefined);assert.equal(archive.geo,undefined);
});
test('framework bridge published values reconcile with national scores; sensitivity ranges ordered',()=>{
 for(const row of archive.bridge){assert.ok(row.lower<=row.midpoint&&row.midpoint<=row.upper);assert.ok(Math.abs(summary(model,model.counties,row.cycle).mean-row.published)<1e-8);}
});
