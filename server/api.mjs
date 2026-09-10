import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {publicSnapshot} from '../src/public-snapshot.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try { process.loadEnvFile(path.join(root,'.env.local')); } catch {}
const cacheFile=path.join(root,'.cache/activityinfo.json');
const endpoint='https://www.activityinfo.org/resources/query/v43/form/cdqmo0mmmapb33se';
let memo, pending;
async function loadCache() {
  if(memo) return memo;
  try {
    const [body,stat]=await Promise.all([fs.readFile(cacheFile,'utf8'),fs.stat(cacheFile)]);
    const rows=JSON.parse(body);
    if(Array.isArray(rows)) memo={rows,fetchedAt:stat.mtime.toISOString(),source:endpoint,cached:true};
  } catch {}
  return memo;
}
async function fetchFresh() {
  const token=process.env.ACTIVITYINFO_TOKEN;
  if(!token) throw new Error('The ActivityInfo connection has not been configured.');
  const response=await fetch(endpoint,{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(45000)});
  if(!response.ok) throw new Error('ActivityInfo returned status '+response.status+'.');
  const rows=await response.json();
  if(!Array.isArray(rows) || !rows.length || !rows[0]['County.name']) throw new Error('ActivityInfo returned an unexpected dataset.');
  await fs.mkdir(path.dirname(cacheFile),{recursive:true});
  await fs.writeFile(cacheFile,JSON.stringify(rows),{mode:0o600});
  memo={rows,fetchedAt:new Date().toISOString(),source:endpoint,cached:false};
  return memo;
}
export async function api(req,res) {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname!=='/api/data') return false;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.statusCode=405;res.end(JSON.stringify({error:'Read-only endpoint.'}));return true;}
  try {
    let data=await loadCache();
    if(url.searchParams.get('refresh')==='1'||!data) {
      if(!pending) pending=fetchFresh().finally(()=>{pending=null;});
      try {data=await pending;} catch(e) {
        if(!data) throw e;
        data={...data,cached:true,warning:e.message+' Showing the saved snapshot.'};
      }
    }
    const geo=JSON.parse(await fs.readFile(path.join(root,'public/data/counties.geojson'),'utf8'));
    res.end(JSON.stringify({...publicSnapshot(data.rows,data.fetchedAt,geo),...(data.warning?{warning:data.warning}:{})}));
  } catch(e) {res.statusCode=503;res.end(JSON.stringify({error:e.message}));}
  return true;
}
