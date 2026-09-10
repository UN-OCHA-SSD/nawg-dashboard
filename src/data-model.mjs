export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const BANDS = ['A','B1','B2','C','D'];
export const BAND_COLORS = {A:'#c52c42', B:'#eb6260', B1:'#eb6260', B2:'#ffab79', C:'#f6d897', D:'#f9ebc2', E:'#eee8d6', F:'#f6f5ee', 'Not classified':'#b9c2cd'};
export function bandsForPeriod(model,period) {
  const order=['A','B','B1','B2','C','D','E','F'];
  const bands=[...new Set(model.counties.map(c=>model.cells.get(period+'/'+c.key)).filter(c=>c?.row).map(c=>c.band).filter(b=>b!=='Not classified'))];
  return bands.sort((a,b)=>{const i=order.indexOf(a),j=order.indexOf(b);return (i<0?99:i)-(j<0?99:j)||a.localeCompare(b);});
}
export const INDICATORS = [
  {id:'demographic', label:'Demographic vulnerability', field:'demographic_vulnerability', severity:'demographic_vulnerability_severity', group:'Underlying vulnerability'},
  {id:'stock', label:'IDPs / returnee stock', field:'IDP_returnee_stock', severity:'IDP_returnee_stock_severity', group:'Underlying vulnerability'},
  {id:'ipcAverage', label:'IPC longitudinal average', field:'IPC_longitudinal_average', severity:'IPC_longitudinal_average_severity', group:'Underlying vulnerability'},
  {id:'protection', label:'Protection', field:'protection', severity:'protection_severity', group:'First-level triggers'},
  {id:'flow', label:'IDP / returnee flow', field:'IDP_returnee_flow', severity:'IDP_returnee_flow_severity', group:'First-level triggers'},
  {id:'disease', label:'Disease outbreak', field:'disease_outbreak', severity:'disease_outbreak_severity', group:'First-level triggers'},
  {id:'food', label:'Food security · IPC AFI', field:'IPC_AFI', severity:'IPC_AFI_phase_severity', group:'First-level triggers'},
  {id:'nutrition', label:'Malnutrition · IPC AMN', field:'IPC_AMN', severity:'IPC_AMN_phase_severity', group:'First-level triggers'},
];
export const normalizeName = s => {
  const key=String(s ?? '').toLowerCase().replace(/[^a-z]/g, '');
  return key==='abyeiadministrativearea'?'abyeiregion':key;
};
export function numeric(v) { return v === null || v === undefined || String(v).trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v); }
export function periodKey(row) {
  const month = MONTHS.findIndex(m => m.toLowerCase() === String(row.Month).toLowerCase());
  return month < 0 || !/^20\d{2}$/.test(String(row.Year)) ? null : String(row.Year)+'-'+String(month+1).padStart(2,'0');
}
export function periodLabel(key, short=true) {
  if (!key) return 'No period';
  const [y,m] = key.split('-');
  return (short ? MONTHS[+m-1]?.slice(0,3) : MONTHS[+m-1])+' '+y;
}
export function recordScore(r) { return numeric(r?.needs_severity_score_NSS_edited) ?? numeric(r?.needs_severity_score_NSS); }
export function recordBand(r) { return r?.band_edited?.trim() || r?.band?.trim() || 'Not classified'; }
export const metricFields = ['needs_severity_score_NSS','needs_severity_score_NSS_edited','band','band_edited','NSS_severity','underlying_dimvulnerability_score_UVS','aggregate_trigger_score_ATS',...INDICATORS.flatMap(i=>[i.field,i.severity])];
const metricSignature = r => JSON.stringify(metricFields.map(f=>r[f]??null));
export function createModel(rows, geo) {
  const features = geo.features.map(f => ({...f, key:normalizeName(f.properties.adm2_name), name:f.properties.adm2_name, state:f.properties.adm1_name}));
  const counties = features.map(f=>({key:f.key,name:f.name,state:f.state,pcode:f.properties.adm2_pcode})).sort((a,b)=>a.name.localeCompare(b.name));
  const groups=new Map(), unmapped=[], invalid=[];
  const known=new Set(counties.map(c=>c.key));
  for (const r of rows) {
    const period=periodKey(r), key=normalizeName(r['County.name']);
    if (!period) { invalid.push(r); continue; }
    if (!known.has(key)) { unmapped.push(r); continue; }
    const id=period+'/'+key;
    if(!groups.has(id)) groups.set(id,[]);
    groups.get(id).push(r);
  }
  const cells=new Map(), duplicates=[];
  for (const [id, records] of groups) {
    const conflict=new Set(records.map(metricSignature)).size>1;
    const row=conflict?null:records[0];
    const notes=[...new Set(records.map(r=>r.note).filter(Boolean))];
    const cell={row,records,conflict,notes,score:row?recordScore(row):null,band:row?recordBand(row):'Not classified'};
    cells.set(id,cell);
    if(records.length>1) duplicates.push({id,count:records.length,conflict});
  }
  const periods=[...new Set([...cells.keys()].map(k=>k.split('/')[0]))].sort();
  const coverage=Object.fromEntries(periods.map(period=>{
    const valid=counties.filter(c=>cells.get(period+'/'+c.key)?.score!=null).length;
    const conflicts=counties.filter(c=>cells.get(period+'/'+c.key)?.conflict).length;
    const reported=counties.filter(c=>cells.has(period+'/'+c.key)).length;
    return [period,{valid,conflicts,reported,total:counties.length}];
  }));
  const defaultPeriod=[...periods].reverse().find(k=>coverage[k].valid>=counties.length*0.8) || periods.at(-1);
  return {features,counties,periods,cells,coverage,defaultPeriod,duplicates,unmapped,invalid,rawCount:rows.length,international:geo.international};
}
export function calendarPeriods(periods) {
  if(!periods.length)return [];
  const [startY,startM]=periods[0].split('-').map(Number),[endY,endM]=periods.at(-1).split('-').map(Number);
  return Array.from({length:(endY-startY)*12+endM-startM+1},(_,i)=>new Date(Date.UTC(startY,startM-1+i,1)).toISOString().slice(0,7));
}
export function severityInfo(value) {
  const v=String(value??'Not available'), lower=v.toLowerCase();
  if(lower==='none recorded')return {label:v,level:0,max:4,color:'#f4f6f3'};
  if(lower.includes('pockets of 5')) return {label:v,level:4,max:5,color:'#c52c42'};
  const p=lower.match(/phase\s*(\d)/);
  if(p) return {label:v,level:+p[1],max:5,color:['','#f9ebc2','#f6d897','#ffab79','#eb6260','#c52c42'][+p[1]] || '#b9c2cd'};
  const level={'low':1,'moderate':2,'high':3,'very high':4}[lower] || 0;
  return {label:v,level,max:4,color:['#b9c2cd','#f6d897','#ffab79','#eb6260','#c52c42'][level]};
}
export function calendarTrend(model, county, until, range=12) {
  if(!until) return [];
  const [y,m]=until.split('-').map(Number);
  return Array.from({length:range},(_,i)=>{
    const date=new Date(Date.UTC(y,m-range+i,1));
    const key=date.toISOString().slice(0,7), cell=model.cells.get(key+'/'+county);
    return {period:key,label:periodLabel(key),short:MONTHS[date.getUTCMonth()].slice(0,3),score:cell?.score??null,band:cell?.band,conflict:cell?.conflict??false};
  });
}
export function csvText(rows, fields) {
  const quote=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
  return '\uFEFF'+[fields.map(quote).join(','),...rows.map(r=>fields.map(f=>quote(r[f])).join(','))].join('\r\n');
}
