import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {api} from './api.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist/client');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.woff2':'font/woff2','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
const server=http.createServer(async(req,res)=>{
  if(await api(req,res)) return;
  try {
    const url=new URL(req.url,'http://localhost'), relative=decodeURIComponent(url.pathname);
    let file=path.resolve(root,'.'+relative);
    if(!file.startsWith(root+path.sep) && file!==root) {res.writeHead(403);res.end();return;}
    if(!path.extname(file)) file=path.join(root,'index.html');
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('NAWG dashboard: http://127.0.0.1:'+(process.env.PORT||4173)));
