import React, {useMemo, useState} from 'react';
import {ResponsiveContainer, ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip} from 'recharts';
import {ArrowSquareOut, DownloadSimple} from '@phosphor-icons/react';
import referenceStudy from '../data/framework-comparison-reference.json';
import {frameworkComparisonForPeriod} from './framework-comparison.mjs';
import {nationalTrendDomain} from './trend-scale.mjs';
import {assetUrl} from './deployment.mjs';
import {periodLabel, csvText} from './data-model.mjs';
import {downloadFile} from './Trend.jsx';
import './framework-comparison.css';

const fmt=value=>value==null?'—':value.toFixed(2);
const reasonText=reason=>({
 'national-scope-required':'the study is available only for all 79 counties',
 'incomplete-or-conflicting-coverage':'one or both years have missing or conflicting county observations',
 'activityinfo-source-mismatch':'ActivityInfo means have changed from the supplied study inputs',
 'invalid-reference-range':'the supplied range did not pass validation',
}[reason]||'no validated reference is available');
const series=[
 {key:'published2026',label:'2026 published NSS · ActivityInfo',color:'var(--chart-line)'},
 {key:'published2025',label:'2025 published NSS · ActivityInfo',color:'var(--muted)',dash:'5 4'},
 {key:'midpoint',label:'2026 under 2025 framework · supplied study',color:'var(--comparison-line)',dash:'3 3'},
];
function ComparisonTooltip({active,payload}){
 const row=payload?.find(p=>p.payload)?.payload;
 if(!active||!row)return null;
 return <div className="chart-tooltip comparison-tooltip"><strong>{periodLabel(row.period)} · same-month comparison</strong><span>2026 published: {fmt(row.published2026)}</span><span>2025 published: {fmt(row.published2025)}</span>{row.available?<><span>2026 adjusted range: {fmt(row.lower)}–{fmt(row.upper)}</span><small>Midpoint {fmt(row.midpoint)} · sensitivity, not a confidence interval</small></>:<small>Adjusted range withheld: {reasonText(row.reason)}</small>}</div>;
}
export default function FrameworkComparison({model,counties,period}){
 const [scale,setScale]=useState('focused'),[visible,setVisible]=useState(()=>Object.fromEntries(series.map(s=>[s.key,true])));
 const comparison=useMemo(()=>frameworkComparisonForPeriod(model,period,referenceStudy,{counties}),[model,counties,period]);
 const national=counties.length===model.counties.length&&new Set(counties.map(c=>c.key)).size===model.counties.length;
 const rows=comparison.rows.map(r=>({...r,sensitivity:r.available?[r.lower,r.upper]:null}));
 const latest=rows.at(-1),available=rows.filter(r=>r.available),withheld=rows.filter(r=>!r.available);
 const domain=nationalTrendDomain(rows.flatMap(r=>series.flatMap(s=>visible[s.key]?[r[s.key],...(s.key==='midpoint'?[r.lower,r.upper]:[])]:[])),scale);
 const exportCSV=()=>downloadFile('NAWG-framework-reference-comparison.csv',csvText(rows.map(r=>({
  period:r.period,published_2026_activityinfo:r.published2026,published_2025_activityinfo:r.published2025,
  adjusted_2026_lower_reference:r.lower,adjusted_2026_upper_reference:r.upper,adjusted_2026_midpoint_reference:r.midpoint,
  counties:r.n,reference_status:r.available?'Aligned supplied study':r.reason,
  interpretation:'Sensitivity range, not a confidence interval; adjusted values are a supplied reference study, not recalculated from ActivityInfo',
 })),['period','published_2026_activityinfo','published_2025_activityinfo','adjusted_2026_lower_reference','adjusted_2026_upper_reference','adjusted_2026_midpoint_reference','counties','reference_status','interpretation']));
 return <section className="analysis-card framework-comparison" aria-label="Framework-adjusted national comparison">
  <div className="card-heading"><div><span className="report-type">REFERENCE STUDY · NATIONAL ONLY</span><h2>Separating framework effects from changes in needs</h2><p>January–June 2026 under the previous framework, alongside published NSS and the same months of 2025.</p></div><div className="chart-options"><div className="chart-scale-toggle" role="group" aria-label="Framework comparison y-axis scale"><button type="button" aria-pressed={scale==='focused'} onClick={()=>setScale('focused')}>Focused 5–7.5</button><button type="button" aria-pressed={scale==='full'} onClick={()=>setScale('full')}>Full 0–10</button></div>{national&&rows.length>0&&<button className="icon-button" aria-label="Download framework reference comparison" onClick={exportCSV}><DownloadSimple/></button>}</div></div>
  <p className="body-copy">The supplied study applies 2025 weights and restriction logic to 2026 inputs, excluding the new climate and conflict contributions. It removes the 2026 automatic restriction uplift and adds contextual adjustments once after rescaling. Its shaded range reflects alternative displacement-flow assumptions—not sampling uncertainty or a confidence interval.</p>
  {!national?<div className="method-note">This supplied study covers all 79 counties. Reset state and band filters to view the national comparison; county or state estimates are not available.</div>:!rows.length?<div className="method-note">The supplied comparison covers January–June 2026 only. Select a reporting month in or after that window to view it. No earlier or later adjusted values are estimated.</div>:<>
   <div className="comparison-legend" role="group" aria-label="Comparison series visibility">{series.map(s=><button type="button" key={s.key} aria-pressed={visible[s.key]} onClick={()=>setVisible(v=>({...v,[s.key]:!v[s.key]}))}><i style={{borderColor:s.color,borderTopStyle:s.dash?'dashed':'solid'}}/>{s.label}</button>)}<span><i className="sensitivity-swatch"/>Sensitivity range</span></div>
   <p className="small-note">Mean NSS · equal weight per county · 79 counties required in both years. {scale==='focused'?`Focused y-axis is truncated (${fmt(domain[0])}–${fmt(domain[1])}).`:'Full NSS scale: 0–10.'}</p>
   <div className="chart-canvas tall"><ResponsiveContainer><ComposedChart data={rows} margin={{top:12,right:20,left:-12,bottom:6}}><CartesianGrid vertical={false} stroke="var(--grid)"/><XAxis dataKey="period" tickFormatter={p=>new Date(p+'-01T00:00:00Z').toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'})} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}}/><YAxis domain={domain} ticks={scale==='full'?[0,2,4,6,8,10]:domain[0]===5&&domain[1]===7.5?[5,5.5,6,6.5,7,7.5]:undefined} axisLine={false} tickLine={false} tick={{fill:'var(--muted)',fontSize:12}}/><Tooltip content={<ComparisonTooltip/>}/>{visible.midpoint&&<Area dataKey="sensitivity" fill="var(--comparison-line)" fillOpacity={0.14} stroke="none" connectNulls={false} isAnimationActive={false}/>} {series.filter(s=>visible[s.key]).map(s=><Line key={s.key} dataKey={s.key} name={s.label} stroke={s.color} strokeDasharray={s.dash} strokeWidth={2.5} dot={{r:3,fill:s.color,stroke:'var(--panel)',strokeWidth:1}} connectNulls={false} isAnimationActive={false}/>)}</ComposedChart></ResponsiveContainer></div>
   {latest?.available&&<div className="comparison-readout" aria-label="Latest framework comparison"><div><span>{periodLabel(latest.period)} · published 2026</span><strong>{fmt(latest.published2026)}</strong></div><div><span>2026 under previous framework</span><strong>{fmt(latest.lower)}–{fmt(latest.upper)}</strong><small>Supplied sensitivity range</small></div><div><span>Same month in 2025 · published</span><strong>{fmt(latest.published2025)}</strong></div></div>}
   {withheld.length>0&&<p className="method-note" role="status">Adjusted bounds withheld for {withheld.map(r=>periodLabel(r.period)).join(', ')}: {reasonText(withheld[0].reason)}. Published lines remain ActivityInfo values.</p>}
   {available.length>0&&<p className="small-note">The adjusted midpoint is a visual summary of the two scenarios, not a new observed score. These results illustrate methodological sensitivity; they do not establish causal changes in humanitarian conditions.</p>}
  </>}
  <details className="comparison-provenance"><summary>Source, alignment checks & limitations</summary><p>Published means above come from the current ActivityInfo snapshot. Adjusted endpoints are the colleague’s supplied framework comparison, documented in the January–June 2026 trend study. Bounds appear only when both published means and complete 79-county coverage match the supplied study inputs. This aggregate check does not independently verify each county’s adjustment.</p><p>The adjustment calculation workbook was not supplied, so its sensitivity bounds have not been independently reproduced here. The study is frozen to January–June 2026 and is never interpolated or extended. A revised validated output or the calculation workbook is needed for further periods.</p></details>
  <a className="text-button comparison-source" href={assetUrl('reports/trend_Trend-analysis-January-to-June-2026.pdf')} target="_blank" rel="noreferrer">Read the supplied trend study <ArrowSquareOut/></a>
 </section>;
}
