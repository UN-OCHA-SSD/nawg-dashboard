export const isStatic=import.meta.env?.MODE==='pages';
const base=import.meta.env?.BASE_URL||'/';
export const assetUrl=path=>base+path.replace(/^\//,'');
export const dataUrl=(force=false)=>isStatic?assetUrl('data/nawg-public.json'):'/api/data'+(force?'?refresh=1':'');
