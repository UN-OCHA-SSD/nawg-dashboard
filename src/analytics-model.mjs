import {createModel,INDICATORS,BAND_COLORS,calendarPeriods,periodKey,numeric,recordScore,recordBand} from './data-model.mjs';

export const revisedColors={A:'#d7191c',B:'#fc8d59',C:'#fdbf6f',D:'#fae8b5',E:'#e6e1d9',F:'#ffffff'};
export const frameworkOf=(_model,p)=>p>='2025-12'?'v2':'v1';
export const colorsFor=(model,period=model?.defaultPeriod)=>frameworkOf(model,period)==='v2'?revisedColors:BAND_COLORS;
export const cellColor=cell=>colorsFor(null,cell?.row?periodKey(cell.row):null)[cell?.band]||'#b9c2cd';
export const indicatorsFor=()=>INDICATORS;
export const comparable=(model,a,b)=>Boolean(a&&b&&frameworkOf(model,a)===frameworkOf(model,b));
export const previousPeriod=(model,p)=>model.periods.filter(k=>k<p).at(-1)||'';
export const highBands=(period,bandSet='AB')=>period>='2025-12'?(bandSet==='AB'?['A','B']:['A','B','C']):(bandSet==='AB'?['A','B1']:['A','B1','B2']);
export const highBandLabel=(period,bandSet='AB')=>'Bands '+highBands(period,bandSet).join(' / ');
export const CLASSIFICATION_CONTEXTS=['IPC methodological restriction','Technical correction','Contextual note recorded','Final result differs','No change recorded'];
// Only bounded labels leave the private export. Never publish note text or infer
// a meeting decision from a score difference alone.
export function classificationContext(row){
  if(CLASSIFICATION_CONTEXTS.includes(row.classification_context))return row.classification_context;
  const note=String(row.note||'').trim().toLowerCase();
  if(note.includes('methodological restriction'))return CLASSIFICATION_CONTEXTS[0];
  if(note.includes('rounding')||note.includes('issue in the script'))return CLASSIFICATION_CONTEXTS[1];
  if(note)return CLASSIFICATION_CONTEXTS[2];
  if((numeric(row.needs_severity_score_NSS)!==null&&recordScore(row)!==numeric(row.needs_severity_score_NSS))||recordBand(row)!==String(row.band||'').trim())return CLASSIFICATION_CONTEXTS[3];
  return CLASSIFICATION_CONTEXTS[4];
}
export function activityModel(payload,geo,reference){
  const rows=payload.rows.map(r=>({...r,classification_context:classificationContext(r)}));
  const model=createModel(rows,geo);
  // References contain only definitions and publication metadata, never
  // observations. Every dashboard figure is derived from ActivityInfo.
  return {...model,rows,sourceKind:'activityinfo',sourceLabel:'ActivityInfo',indicators:INDICATORS,reference,fetchedAt:payload.fetchedAt,quality:payload.quality};
}
export function summary(model,counties,period){
  const cells=counties.map(c=>model.cells.get(period+'/'+c.key)).filter(c=>c?.score!=null),scores=cells.map(c=>c.score).sort((a,b)=>a-b),n=scores.length;
  return {n,total:counties.length,mean:n?scores.reduce((a,b)=>a+b,0)/n:null,median:n?(scores[Math.floor((n-1)/2)]+scores[Math.floor(n/2)])/2:null,counts:cells.reduce((o,c)=>(o[c.band]=(o[c.band]||0)+1,o),{}),ab:cells.filter(c=>highBands(period).includes(c.band)).length};
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
  return counties.map(c=>{const rows=periods.map(p=>model.cells.get(p+'/'+c.key)).filter(c=>c?.score!=null);const high=rows.filter(c=>highBands(period,bandSet).includes(c.band)).length;return {...c,high,observed:rows.length,cycles:periods.length,share:rows.length?high/rows.length:null};}).filter(c=>c.observed>=Math.min(3,periods.length)&&c.share>=threshold).sort((a,b)=>b.share-a.share||b.high-a.high||a.name.localeCompare(b.name));
}
