import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base=process.env.QA_URL||'http://127.0.0.1:4383/nawg-dashboard/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1360,height:768}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const snapshot=()=>page.evaluate(()=>{
 const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 return {scrollX,scrollY,width:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,scale:visualViewport.scale,header:box('.topbar'),filters:box('.filters'),content:box('#main-content')};
});
const check=async(before,label)=>{
 const after=await snapshot();
 assert.deepEqual(after,before,label+' must not move or resize the page');
 assert.ok(after.width<=after.viewport,label+' horizontal overflow');
 const menu=await page.locator('.county-picker-popover').boundingBox(),trigger=await page.getByRole('button',{name:'Choose county',exact:true}).boundingBox();
 const rail=await page.locator('.nav-rail').boundingBox();
 assert.ok(menu.x>=rail.width,'menu stays outside the navigation rail');
 assert.ok(menu.x+menu.width<=after.viewport,'menu stays inside the right edge');
 assert.ok(Math.abs(menu.x+menu.width-trigger.x-trigger.width)<2,'menu is right-aligned with County');
};
try{
 await page.goto(base+'#compare?county=twiceast&period=2026-04&source=archive',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Change analysis',exact:true}).waitFor();
 await fs.mkdir('qa/county-picker',{recursive:true});
 for(const width of [1360,1190,884,783,680,390,320]){
  await page.setViewportSize({width,height:768});
  for(const route of ['Change analysis','County profiles','National overview','Data explorer','Trends & persistent needs','Needs drivers']){
   await page.getByRole('button',{name:route,exact:true}).click();
   await page.mouse.move(55,0);
   const trigger=page.getByRole('button',{name:'Choose county',exact:true});
   await trigger.focus();
   const before=await snapshot();
   await trigger.press('Enter');
   const search=page.getByRole('combobox',{name:'Search county or state'});
   await search.waitFor();
   await check(before,'Opening '+route+' at '+width);
   for(let i=0;i<18;i++)await search.press('ArrowDown');
   await check(before,'Keyboard navigation');
   assert.ok(await page.locator('#county-options').evaluate(el=>el.scrollTop)>0,'only the options list scrolls');
   await search.fill('western equatoria');
   await check(before,'Searching');
   await search.press('Escape');
   assert.equal(await trigger.getAttribute('aria-expanded'),'false');
   assert.deepEqual(await snapshot(),before,'closing preserves layout and scroll');
   if(route==='Change analysis'&&[1360,390].includes(width)){
    await trigger.press('Enter');
    await page.screenshot({path:'qa/county-picker/open-'+width+'.png'});
    await search.fill('guit');await search.press('Enter');
    assert.match(await trigger.innerText(),/Guit/);
    assert.equal(await page.evaluate(()=>scrollX),0);
    await page.getByRole('button',{name:'Reset',exact:true}).click();
   }
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS county dropdown on all six analytical pages and seven widths: right alignment, no page shift/overflow, search, keyboard list scrolling, Escape and selection.');
}finally{await browser.close();}
