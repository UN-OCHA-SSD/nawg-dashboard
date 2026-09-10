import {metricFields,createModel,periodKey,numeric} from './data-model.mjs';
import {classificationContext,CLASSIFICATION_CONTEXTS} from './analytics-model.mjs';

export const PUBLIC_FIELDS=Object.freeze(['County.name','County.parent.name','Year','Month',...metricFields]);
export const SOURCE_URL='https://www.activityinfo.org/resources/query/v43/form/cdqmo0mmmapb33se';
export function sanitizeRows(rows) {
  if(!Array.isArray(rows)||!rows.length)throw new Error('A nonempty ActivityInfo export is required.');
  return rows.map(row=>Object.fromEntries(PUBLIC_FIELDS.map(field=>{
    const value=field==='classification_context'?classificationContext(row):row[field]??null;
    if(value!==null&&(typeof value!=='string'&&typeof value!=='number'))throw new Error('Unsupported public field type: '+field);
    if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Invalid public numeric value: '+field);
    if(typeof value==='string'&&value.length>200)throw new Error('Review unexpectedly long field before publication: '+field);
    return [field,value];
  })));
}
export function validateSnapshot(snapshot,geo) {
  if(snapshot.schemaVersion!==2||snapshot.publicSnapshot!==true||snapshot.source!==SOURCE_URL)throw new Error('Unrecognized public snapshot.');
  if(!Number.isFinite(Date.parse(snapshot.fetchedAt))||!Number.isFinite(Date.parse(snapshot.publishedAt)))throw new Error('Snapshot dates are required.');
  if(Object.keys(snapshot).some(k=>!['schemaVersion','publicSnapshot','source','fetchedAt','publishedAt','quality','rows'].includes(k)))throw new Error('Unexpected snapshot metadata.');
  const q=snapshot.quality;
  if(!q||Object.keys(q).sort().join(',')!=='excludedInvalidDates,sourceRecords'||![q.sourceRecords,q.excludedInvalidDates].every(n=>Number.isInteger(n)&&n>=0)||q.sourceRecords!==snapshot.rows.length+q.excludedInvalidDates)throw new Error('Invalid quality totals.');
  const clean=sanitizeRows(snapshot.rows);
  if(JSON.stringify(clean)!==JSON.stringify(snapshot.rows))throw new Error('Snapshot must contain only approved fields in canonical order.');
  for(const row of clean){
    if(!CLASSIFICATION_CONTEXTS.includes(row.classification_context))throw new Error('Unknown classification context.');
    for(const field of ['needs_severity_score_NSS','needs_severity_score_NSS_edited']){
      const value=numeric(row[field]);
      if(row[field]!=null&&String(row[field]).trim()!==''&&(value===null||value<0||value>10))throw new Error('Invalid needs score; review ActivityInfo.');
    }
    for(const field of ['band','band_edited'])if(row[field]&&!['A','B','B1','B2','C','D','E','F','Not classified'].includes(row[field]))throw new Error('Unrecognised band; review ActivityInfo.');
  }
  const model=createModel(clean,geo);
  if(model.invalid.length||model.unmapped.length||!model.periods.length)throw new Error('Review invalid dates or unmatched counties before publication.');
  return model;
}
export function publicSnapshot(rows,fetchedAt,geo) {
  if(!Array.isArray(rows)||!rows.length)throw new Error('A nonempty ActivityInfo export is required.');
  const dated=rows.filter(row=>periodKey(row));
  const snapshot={schemaVersion:2,publicSnapshot:true,source:SOURCE_URL,fetchedAt,publishedAt:new Date().toISOString(),quality:{sourceRecords:rows.length,excludedInvalidDates:rows.length-dated.length},rows:sanitizeRows(dated)};
  const model=validateSnapshot(snapshot,geo),original=createModel(dated.map(r=>({...r,classification_context:classificationContext(r)})),geo);
  for(const [key,cell] of original.cells){
    const published=model.cells.get(key);
    if(!published||published.score!==cell.score||published.band!==cell.band||published.conflict!==cell.conflict)throw new Error('Public export changed county evidence.');
  }
  return snapshot;
}
