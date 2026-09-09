import {metricFields,createModel} from './data-model.mjs';

export const PUBLIC_FIELDS=Object.freeze(['County.name','County.parent.name','Year','Month',...metricFields]);
export const SOURCE_URL='https://www.activityinfo.org/resources/query/v43/form/cdqmo0mmmapb33se';
export function sanitizeRows(rows) {
  if(!Array.isArray(rows)||!rows.length)throw new Error('A nonempty ActivityInfo export is required.');
  return rows.map(row=>Object.fromEntries(PUBLIC_FIELDS.map(field=>{
    const value=row[field]??null;
    if(value!==null&&(typeof value!=='string'&&typeof value!=='number'))throw new Error('Unsupported public field type: '+field);
    if(typeof value==='number'&&!Number.isFinite(value))throw new Error('Invalid public numeric value: '+field);
    if(typeof value==='string'&&value.length>200)throw new Error('Review unexpectedly long field before publication: '+field);
    return [field,value];
  })));
}
export function validateSnapshot(snapshot,geo) {
  if(snapshot.schemaVersion!==1||snapshot.publicSnapshot!==true||snapshot.source!==SOURCE_URL)throw new Error('Unrecognized public snapshot.');
  if(!Number.isFinite(Date.parse(snapshot.fetchedAt))||!Number.isFinite(Date.parse(snapshot.publishedAt)))throw new Error('Snapshot dates are required.');
  if(Object.keys(snapshot).some(k=>!['schemaVersion','publicSnapshot','source','fetchedAt','publishedAt','rows'].includes(k)))throw new Error('Unexpected snapshot metadata.');
  const clean=sanitizeRows(snapshot.rows);
  if(JSON.stringify(clean)!==JSON.stringify(snapshot.rows))throw new Error('Snapshot must contain only approved fields in canonical order.');
  const model=createModel(clean,geo);
  if(model.invalid.length||model.unmapped.length||!model.periods.length)throw new Error('Review invalid dates or unmatched counties before publication.');
  return model;
}
export function publicSnapshot(rows,fetchedAt,geo) {
  const snapshot={schemaVersion:1,publicSnapshot:true,source:SOURCE_URL,fetchedAt,publishedAt:new Date().toISOString(),rows:sanitizeRows(rows)};
  const model=validateSnapshot(snapshot,geo),original=createModel(rows,geo);
  for(const [key,cell] of original.cells){
    const published=model.cells.get(key);
    if(!published||published.score!==cell.score||published.band!==cell.band||published.conflict!==cell.conflict)throw new Error('Public export changed county evidence.');
  }
  return snapshot;
}
