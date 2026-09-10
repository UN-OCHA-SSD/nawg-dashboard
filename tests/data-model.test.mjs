import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createModel,recordScore,calendarTrend,bandsForPeriod,csvText,normalizeName,calendarPeriods} from '../src/data-model.mjs';
import {monthlyPublications} from '../src/publications.mjs';
import {trendGapSegments} from '../src/trend-gaps.mjs';
const rows=JSON.parse(fs.readFileSync(new URL('../data/nawg-public.json',import.meta.url))).rows;
const geo=JSON.parse(fs.readFileSync(new URL('../public/data/counties.geojson',import.meta.url)));
const model=createModel(rows,geo);
test('real source snapshot reconciles county coverage and reviewed name alias',()=>{
  assert.equal(model.rawCount,2834);assert.equal(model.counties.length,79);assert.equal(model.unmapped.length,0);
  assert.equal(model.coverage['2025-11'].valid,79);assert.equal(model.coverage['2025-12'].valid,79);
  assert.equal(model.defaultPeriod,'2026-06');assert.equal(normalizeName('Abyei Administrative Area'),'abyeiregion');
});
test('preserves the source score and does not fabricate new-period observations',()=>{
  assert.equal(model.cells.get('2025-11/twiceast').score,6.5);assert.equal(model.cells.get('2025-11/twiceast').band,'B2');
  assert.equal(model.cells.get('2026-08/twiceast'),undefined);
});
test('edited zero survives; null edited score falls back to original',()=>{
  assert.equal(recordScore({needs_severity_score_NSS_edited:0,needs_severity_score_NSS:5}),0);
  assert.equal(recordScore({needs_severity_score_NSS_edited:null,needs_severity_score_NSS:5}),5);
});
test('conflicting duplicate groups are withheld, identical metrics collapse',()=>{
  const conflict=createModel([rows[0],{...rows[0],conflict:99}],geo);
  const cell=[...conflict.cells.values()][0];assert.equal(cell.conflict,true);assert.equal(cell.score,null);assert.equal(cell.row,null);
  const sample=rows.find(r=>r['County.name']==='Twic East'&&r.Month==='November'&&r.Year==='2025');
  const synthetic=createModel([sample,{...sample,_id:'duplicate'}],geo);
  assert.equal(synthetic.cells.get('2025-11/twiceast').score,6.5);assert.equal(synthetic.cells.get('2025-11/twiceast').conflict,false);
});
test('trend uses calendar months and leaves missing observations null',()=>{
  const t=calendarTrend(model,'twiceast','2025-11',12);
  assert.equal(t.length,12);assert.equal(t[0].period,'2024-12');
  assert.equal(t.find(d=>d.period==='2025-07').score,null);assert.equal(t.find(d=>d.period==='2025-08').score,null);
  assert.equal(t.at(-1).score,6.5);
});
test('dotted trend guides bridge Twic East missing months without changing data or CSV',()=>{
  const trend=calendarTrend(model,'twiceast','2025-11',12);
  const original=structuredClone(trend), before=csvText(trend,['period','score','band','conflict']);
  const gaps=trendGapSegments(trend);
  assert.deepEqual(gaps,[[{x:'2025-06',y:7.5},{x:'2025-09',y:7}]]);
  assert.deepEqual(trend,original);
  assert.equal(csvText(trend,['period','score','band','conflict']),before);
  assert.equal(trend.find(d=>d.period==='2025-07').score,null);
  assert.equal(trend.find(d=>d.period==='2025-08').score,null);
});
test('gap guides retain zero and bridge separate missing or conflicting runs',()=>{
  const trend=[null,0,null,2,3,null,null,0,null].map((score,i)=>({period:`2025-0${i+1}`,score,conflict:i===5}));
  assert.deepEqual(trendGapSegments(trend),[
    [{x:'2025-02',y:0},{x:'2025-04',y:2}],
    [{x:'2025-05',y:3},{x:'2025-08',y:0}],
  ]);
  assert.equal(trend[5].conflict,true);assert.equal(trend[5].score,null);
});
test('guides never extrapolate or join adjacent observations',()=>{
  for(const scores of [[],[null,null],[null,2,null],[1,2,3],[0],[null,0,1,null]]) {
    assert.deepEqual(trendGapSegments(scores.map((score,i)=>({period:String(i),score}))),[]);
  }
  assert.deepEqual(trendGapSegments([0,undefined,NaN,Infinity,2].map((score,i)=>({period:String(i),score}))),[[{x:'0',y:0},{x:'4',y:2}]]);
});
test('new records and A–F categories are discovered without changing the form or historical categories',()=>{
  const base=rows.find(r=>r['County.name']==='Twic East');
  const updated=createModel([...rows,{...base,Year:'2026',Month:'August',band:'E',band_edited:'E',needs_severity_score_NSS:2,needs_severity_score_NSS_edited:2}],geo);
  assert.ok(updated.periods.includes('2026-08'));assert.deepEqual(bandsForPeriod(updated,'2026-08'),['E']);
  assert.ok(bandsForPeriod(updated,'2025-11').includes('B2'));
});
test('CSV quotes text and neutralizes formula prefixes',()=>{
  const csv=csvText([{a:'=1+1',b:'a,"b"'}],['a','b']);
  assert.ok(csv.includes("'=1+1"));assert.ok(csv.includes('"a,""b"""'));
});
test('playback contains each calendar month without synthesizing missing records',()=>{
 const months=calendarPeriods(model.periods);
 assert.equal(months.length,42);assert.equal(months[0],'2023-01');assert.equal(months.at(-1),'2026-06');
 assert.ok(months.includes('2025-07'));assert.equal(model.coverage['2025-07'],undefined);
 assert.deepEqual(calendarPeriods([]),[]);
 assert.deepEqual(calendarPeriods(['2025-11','2026-02']),['2025-11','2025-12','2026-01','2026-02']);
});
test('international boundary data retains special-status line attributes',()=>{
 const geo=JSON.parse(fs.readFileSync(new URL('../public/data/international-boundaries.geojson',import.meta.url)));
 assert.equal(geo.features.length,24);
 assert.ok(geo.features.some(f=>f.properties.iso3cd==='SDN_SSD'&&f.properties.cartographic_style==='Dashed boundary line'));
 assert.ok(geo.features.some(f=>f.properties.cartographic_style==='Dotted boundary line'));
 assert.ok(geo.features.some(f=>f.properties.iso3cd==='ETH_SSD'&&f.properties.cartographic_style==='International boundary line'));
 assert.ok(geo.features.every(f=>['LineString','MultiLineString'].includes(f.geometry.type)));
});
test('monthly publication placeholders do not fabricate report URLs',()=>{
 assert.equal(monthlyPublications.length,12);
 assert.ok(monthlyPublications.every(p=>p.period.startsWith('2026-')&&p.pdfUrl===null&&p.reliefWebUrl===null));
});
