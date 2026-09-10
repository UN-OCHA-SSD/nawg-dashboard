// Browser regression, ready to run with the user's approved browser choice.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:783,height:776},deviceScaleFactor:1});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const base=process.env.QA_URL||'http://127.0.0.1:4381';
const snapshot=()=>page.evaluate(()=>{
 const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};};
 const polygon=document.querySelector('.leaflet-interactive[aria-label^="Twic East —"]');
 return {map:box('.leaflet-surface'),timeline:box('.month-timeline'),grid:box('.overview-grid'),pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,scale:visualViewport?.scale||1,scrollX,scrollY,path:polygon.getAttribute('d'),transform:document.querySelector('.leaflet-map-pane').style.transform};
});
function stable(before,after){
 for(const name of ['map','timeline','grid'])for(const dimension of ['x','y','width','height'])assert.ok(Math.abs(before[name][dimension]-after[name][dimension])<=1,name+' '+dimension+': '+before[name][dimension]+' → '+after[name][dimension]);
 for(const name of ['pageWidth','pageHeight','scale','scrollX','scrollY','path','transform'])assert.equal(after[name],before[name],name+' must remain stable');
}
try{
 await page.goto(base+'/#overview?county=twiceast&period=2025-06',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(400);
 // Set a non-default map view and scroll position before the timer advances.
 await page.locator('.month-timeline').scrollIntoViewIfNeeded();
 await page.getByLabel('Playback speed').selectOption('700');
 const before=await snapshot();
 await page.getByRole('button',{name:'Play timeline',exact:true}).click();
 const samples=[];
 for(const period of ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12']){
  await page.waitForFunction(p=>document.querySelector('[aria-label="Reporting period"]').value===p,period);
  await page.waitForTimeout(80);
  const sample=await snapshot();stable(before,sample);samples.push({period,...sample});
 }
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'qa/playback-stable-783.png',fullPage:true});
 await fs.writeFile('qa/playback-stability-results.json',JSON.stringify({before,samples,errors},null,2));
 console.log('PASS playback preserves map geometry, zoom representation, layout, scroll and browser scale at 783×776');
}finally{await browser.close();}
