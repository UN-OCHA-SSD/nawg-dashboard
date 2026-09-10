import {build} from 'vite';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateSnapshot} from '../src/public-snapshot.mjs';
const root=new URL('../',import.meta.url);
const snapshot=JSON.parse(await fs.readFile(new URL('data/nawg-public.json',root),'utf8'));
const geo=JSON.parse(await fs.readFile(new URL('public/data/counties.geojson',root),'utf8'));
validateSnapshot(snapshot,geo);
await build({root:fileURLToPath(root),mode:'pages'});
const output=new URL('dist/pages/',root);
await fs.mkdir(new URL('data/',output),{recursive:true});
// No blanket public/ copy: the original meeting PPT remains local.
for(const name of ['counties.geojson','international-boundaries.geojson'])await fs.copyFile(new URL('public/data/'+name,root),new URL('data/'+name,output));
await fs.copyFile(new URL('data/nawg-public.json',root),new URL('data/nawg-public.json',output));
const archive=JSON.parse(await fs.readFile(new URL('data/nawg-archive.json',root),'utf8'));
await fs.mkdir(new URL('reports/',output),{recursive:true});
for(const report of archive.reports){
  if(!/^reports\/[A-Za-z0-9_.-]+\.pdf$/.test(report.file))throw new Error('Invalid report path');
  await fs.copyFile(new URL('public/'+report.file,root),new URL(report.file,output));
}
await fs.writeFile(new URL('.nojekyll',output),'');
console.log('GitHub Pages output ready in dist/pages (public data and static assets only).');
