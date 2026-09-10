import React,{useMemo,useState} from 'react';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ReferenceLine,ReferenceArea} from 'recharts';
import {DownloadSimple,ChartLine} from '@phosphor-icons/react';
import {calendarTrend,periodLabel,numeric,csvText} from './data-model.mjs';
import {frameworkOf,comparable} from './analytics-model.mjs';
import {trendGapSegments} from './trend-gaps.mjs';
export function downloadFile(name,text,type='text/csv;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function TrendTooltip({active,payload,label}) {
  if(!active||!label)return null;
  const point=payload?.find(p=>p.payload)?.payload;
  return <div className="chart-tooltip"><strong>{periodLabel(label,false)}</strong><span>{point?.score==null?(point?.conflict?'Conflicting records':'No observation'):point.score.toFixed(2)}</span>{point?.band&&<small>Band {point.band}</small>}</div>;
}
export function Trend({model,selected,period,compare,onPeriod,countyPage=false}) {
  const [range,setRange]=useState(12),[metric,setMetric]=useState('score');
  const name=model.counties.find(c=>c.key===selected)?.name||'Selected county';
  const data=useMemo(()=>calendarTrend(model,selected,period,range).map(d=>{
    if(metric==='score')return d;const cell=model.cells.get(d.period+'/'+selected);return {...d,score:cell?.row?numeric(cell.row[metric]):null};
  }),[model,selected,period,range,metric]);
  const gapSegments=useMemo(()=>trendGapSegments(data).filter(s=>comparable(model,s[0].x,s[1].x)),[data,model]);
  const chartData=data.map(d=>({...d,earlier:frameworkOf(model,d.period)===frameworkOf(model,model.periods[0])?d.score:null,revised:frameworkOf(model,d.period)!==frameworkOf(model,model.periods[0])?d.score:null}));
  const any=data.some(d=>d.score!=null),metricName=metric==='score'?'Needs severity score':metric==='underlying_dimvulnerability_score_UVS'?'Underlying vulnerability score':'Aggregate trigger score';
  const max=Math.max(metric==='score'?10:2,...data.map(d=>d.score??0));
  return <section className={'trend-section '+(countyPage?'county-trend':'')} aria-label="County severity trend">
    <div className="trend-heading"><div><h2><span>{name}</span><span className="heading-divider">/</span>{countyPage?'Severity trend':'Needs severity over time'}</h2><p title="Dotted lines connect reported values across missing or conflicting months. They are visual guides, not estimated monthly scores.">{metricName} · dotted links span gaps, not estimates · break at Dec 2025 framework revision</p></div><div className="trend-actions">
      {countyPage&&<select aria-label="Trend measure" value={metric} onChange={e=>setMetric(e.target.value)}><option value="score">Needs severity score</option><option value="underlying_dimvulnerability_score_UVS">Vulnerability score</option><option value="aggregate_trigger_score_ATS">Trigger score</option></select>}
      <div className="segmented small">{(countyPage?[12,24,48]:[12,24]).map(n=><button key={n} className={range===n?'active':''} onClick={()=>setRange(n)}>{n===48?'All':n+'m'}</button>)}</div>
      <button className="icon-button" title="Download trend data" aria-label="Download trend data" onClick={()=>downloadFile(name+'-trend.csv',csvText(data,['period','score','band','conflict']))}><DownloadSimple/></button></div></div>
    <div className="trend-canvas">{any?<ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:12,right:30,bottom:4,left:4}} onClick={s=>{const k=s?.activeLabel;if(model.periods.includes(k))onPeriod(k);}}>
      <CartesianGrid stroke="var(--grid)" vertical={false}/><XAxis dataKey="period" tickFormatter={k=>periodLabel(k)} tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false} minTickGap={25} dy={8}/><YAxis domain={[0,Math.ceil(max)]} tick={{fill:'var(--muted)',fontSize:11}} axisLine={false} tickLine={false} width={34} tickCount={5}/>
      <Tooltip content={<TrendTooltip/>} filterNull={false} cursor={{stroke:'var(--accent)',strokeDasharray:'3 3'}}/>
      {compare&&data.some(d=>d.period===compare)&&<ReferenceLine x={compare} stroke="var(--muted)" strokeDasharray="4 4" label={{value:'Comparison',position:'insideTopRight',fill:'var(--muted)',fontSize:10}}/>}
      <ReferenceArea x1={data.at(-2)?.period} x2={data.at(-1)?.period} fill="var(--accent)" fillOpacity={0.035}/>
      {gapSegments.map(segment=><ReferenceLine key={segment[0].x+'-'+segment[1].x} segment={segment} className="trend-gap-connector" stroke="var(--chart-line)" strokeWidth={2} strokeDasharray="1 5" strokeLinecap="round" strokeOpacity={0.75} pointerEvents="none"/>) }
      {['earlier','revised'].map(key=><Line key={key} type="linear" dataKey={key} stroke="var(--chart-line)" strokeWidth={2.5} dot={{r:3.5,strokeWidth:1.5,stroke:'var(--panel)',fill:'var(--chart-line)'}} activeDot={{r:6}} connectNulls={false} isAnimationActive={false}/>)}
    </LineChart></ResponsiveContainer>:<div className="empty-inline"><ChartLine size={28}/><strong>No trend data for this selection</strong><span>Choose another county or reporting period.</span></div>}</div>
  </section>;
}
