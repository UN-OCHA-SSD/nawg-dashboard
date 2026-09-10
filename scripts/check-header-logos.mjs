import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1465,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('qa/header-logos',{recursive:true});
try{
 await page.goto((process.env.QA_URL||'http://127.0.0.1:4383/nawg-dashboard/')+'#overview',{waitUntil:'networkidle'});
 await page.getByRole('img',{name:'United Nations OCHA',exact:true}).waitFor();
 const results=[];
 for(const theme of ['light','dark']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:'Switch to '+theme+' mode'}).click();
  for(const width of [1465,1251,1190,900,884,783,701,700,390,320]){
   await page.setViewportSize({width,height:900});
   // Let existing chart/map ResizeObservers settle before checking page width.
   await page.waitForTimeout(180);
   const layout=await page.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const reach=document.querySelector('.reach-logo'),ocha=document.querySelector('.ocha-logo'),v=ocha.viewBox.baseVal;
    return {reach:box('.reach-logo'),ocha:box('.ocha-logo'),logos:box('.partner-logos'),header:box('.topbar'),title:box('.full-brand'),page:document.documentElement.scrollWidth,viewport:innerWidth,reachLoaded:reach.complete&&reach.naturalWidth===520,viewBox:{x:v.x,y:v.y,width:v.width,height:v.height}};
   });
   assert.ok(layout.reachLoaded);
   assert.ok(Math.abs(layout.reach.height-layout.ocha.height)<.1,'matching logo heights');
   assert.ok(Math.abs(layout.reach.y-layout.ocha.y)<.1,'aligned logos');
   assert.ok(layout.reach.right<layout.ocha.x,'REACH before OCHA without overlap');
   assert.ok(layout.logos.right<=layout.header.right&&layout.logos.bottom<=layout.header.bottom,'logos fit the header');
   assert.ok(layout.title.right<=layout.logos.x||layout.title.bottom<=layout.logos.y,'title and logos do not overlap');
   assert.ok(layout.page<=layout.viewport,'no horizontal overflow: '+JSON.stringify({theme,width,layout}));
   assert.ok(Math.abs(layout.reach.width/layout.reach.height-520/114)<.01,'REACH aspect ratio preserved');
   assert.ok(Math.abs(layout.ocha.width/layout.ocha.height-3879/957)<.01,'OCHA aspect ratio preserved');
   // Visible blue artwork was measured from the unmodified 5001×2509 source:
   // x 581–4419, y 794–1710. Leave clear space on all four sides.
   const v=layout.viewBox;
   assert.ok(v.x<581&&v.y<794&&v.x+v.width>4419&&v.y+v.height>1710,'full OCHA emblem and wordmark inside viewport');
   results.push({theme,width,logoHeight:layout.reach.height});
   if([1465,884,390].includes(width))await page.locator('.topbar').screenshot({path:'qa/header-logos/'+theme+'-'+width+'.png'});
  }
 }
 assert.deepEqual(errors,[]);
 await fs.writeFile('qa/header-logos/results.json',JSON.stringify(results,null,2));
 console.log('PASS: matching logo heights, full OCHA artwork, original proportions and no title/viewport overlap at ten widths in both themes.');
}finally{await browser.close();}
