import {createModel,INDICATORS,MONTHS,normalizeName,BAND_COLORS,calendarPeriods} from './data-model.mjs';
export const ARCHIVE_INDICATORS=[...INDICATORS.slice(0,6),
  {id:'climate',label:'Climate',field:'climate',severity:'climate_severity',group:'First-level triggers'},
  {id:'conflict',label:'Conflict',field:'conflict',severity:'conflict_severity',group:'First-level triggers'},
  ...INDICATORS.slice(6)];
export const indicatorsFor=cell=>cell?.row?.evidence_source==='archive'?ARCHIVE_INDICATORS:INDICATORS;
export const archiveColors={A:'#d7191c',B:'#fc8d59',C:'#fdbf6f',D:'#fae8b5',E:'#e6e1d9',F:'#ffffff'};
export const colorsFor=model=>model?.sourceKind==='archive'?archiveColors:BAND_COLORS;
export const cellColor=cell=>(cell?.row?.evidence_source==='archive'?archiveColors:BAND_COLORS)[cell?.band]||'#b9c2cd';
export const frameworkOf=(model,p)=>model.sourceKind==='archive'?(model.cycles.find(c=>c.id===p)?.fw??(p>='2025-12'?'v2':'v1')):(p>='2025-12'?'revised':'legacy');
export const comparable=(model,a,b)=>Boolean(a&&b&&frameworkOf(model,a)===frameworkOf(model,b));
export const previousPeriod=(model,p)=>model.periods.filter(k=>k<p).at(-1)||'';
export function archiveModel(data,geo){
  const counties=new Map(data.counties.map(c=>[c.key,c]));
  const rows=data.rows.map(r=>{
    const c=counties.get(r.county),[y,m]=r.cycle.split('-'),fw=data.cycles.find(c=>c.id===r.cycle).fw;
    const row={'County.name':c.name==='Abyei'?'Abyei Region':c.name,'County.parent.name':c.state,Year:y,Month:MONTHS[+m-1],needs_severity_score_NSS:r.initialScore,needs_severity_score_NSS_edited:r.score,band:r.initialBand,band_edited:r.band,NSS_severity:data.bands.find(b=>b.id===r.band)?.label,underlying_dimvulnerability_score_UVS:r.uvs,aggregate_trigger_score_ATS:r.ats,evidence_source:'archive',framework:fw,adjustment:r.adjustment,source_band:fw==='v1'?({A:'A',B:'B1',C:'B2',D:'C',E:'D',F:'E'}[r.band]):r.band};
    ARCHIVE_INDICATORS.forEach((i,n)=>{row[i.field]=r.contributions[n];row[i.severity]=data.indicators[n]['max_'+fw]===0?'Not in framework':n===8||n===9?((n===8?r.afi:r.amn)==null?'No data':(n===8?r.afi:r.amn)===4.5?'Phase 4 · pockets of 5':'Phase '+(n===8?r.afi:r.amn)):r.classifications[n];});
    for(const year of data.hpc.years)row['HPC_'+year]=data.hpc.records[year]?.[r.county]??null;
    return row;
  });
  const model=createModel(rows,geo);
  if(model.unmapped.length||model.invalid.length||model.duplicates.length)throw new Error('Archive has unmapped or duplicate records; review import.');
  return {...model,sourceKind:'archive',sourceLabel:'NAWG analysis archive',indicators:ARCHIVE_INDICATORS,cycles:data.cycles,archive:data,rows,hpcByCounty:Object.fromEntries(data.counties.map(c=>[normalizeName(c.name==='Abyei'?'Abyei Region':c.name),Object.fromEntries(data.hpc.years.map(y=>[y,data.hpc.records[y]?.[c.key]??null]))]))};
}
export function summary(model,counties,period){
  const cells=counties.map(c=>model.cells.get(period+'/'+c.key)).filter(c=>c?.score!=null),scores=cells.map(c=>c.score).sort((a,b)=>a-b),n=scores.length;
  return {n,total:counties.length,mean:n?scores.reduce((a,b)=>a+b,0)/n:null,median:n?(scores[Math.floor((n-1)/2)]+scores[Math.floor(n/2)])/2:null,counts:cells.reduce((o,c)=>(o[c.band]=(o[c.band]||0)+1,o),{}),ab:cells.filter(c=>model.sourceKind==='archive'?['A','B'].includes(c.band):['A','B','B1'].includes(c.band)).length};
}
export function paired(model,counties,period,compare){
  if(!comparable(model,period,compare))return [];
  return counties.flatMap(c=>{const a=model.cells.get(compare+'/'+c.key),b=model.cells.get(period+'/'+c.key);return a?.score!=null&&b?.score!=null?[{...c,previous:a.score,current:b.score,delta:+(b.score-a.score).toFixed(3),from:a.band,to:b.band,changed:a.band!==b.band}]:[];});
}
export function nationalSeries(model,counties,period,range=12){
  return calendarPeriods([model.periods[0],period]).slice(-range).map(p=>({period:p,...summary(model,counties,p),framework:frameworkOf(model,p)}));
}
export function persistence(model,counties,period,threshold=.8,bandSet='AB'){
  const periods=model.periods.filter(p=>p<=period&&comparable(model,p,period)).slice(-12);
  return counties.map(c=>{const rows=periods.map(p=>model.cells.get(p+'/'+c.key)).filter(c=>c?.score!=null);const high=rows.filter(c=>(model.sourceKind==='archive'?(bandSet==='AB'?['A','B']:['A','B','C']):(bandSet==='AB'?['A','B','B1']:['A','B','B1','B2'])).includes(c.band)).length;return {...c,high,observed:rows.length,cycles:periods.length,share:rows.length?high/rows.length:null};}).filter(c=>c.observed>=Math.min(3,periods.length)&&c.share>=threshold).sort((a,b)=>b.share-a.share||b.high-a.high||a.name.localeCompare(b.name));
}
