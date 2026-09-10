import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base=process.env.QA_URL||'http://127.0.0.1:4383/nawg-dashboard/';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1465,height:1073},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
const routes=['National overview','County profiles','Trends & persistent needs','Change analysis','Needs drivers','Data explorer','Publications & downloads','Methodology & sources'];
const navigate=name=>page.getByRole('button',{name,exact:true}).click();
const reset=async()=>{
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.waitForFunction(()=>document.activeElement?.classList.contains('reset-filters'));
};
const value=label=>page.getByLabel(label,{exact:true}).inputValue();
const camera=()=>page.evaluate(()=>{
 const polygon=document.querySelector('.leaflet-interactive[aria-label^="Twic East —"]').getBoundingClientRect();
 const map=document.querySelector('.leaflet-surface').getBoundingClientRect();
 // Compare rendered position: Leaflet can redistribute a pixel between path and pane translation.
 return {x:polygon.x-map.x,y:polygon.y-map.y,width:polygon.width,height:polygon.height,scale:visualViewport.scale};
});
const defaults=async()=>{
 assert.equal(await value('Reporting period'),'2026-06');
 if(await page.getByLabel('State',{exact:true}).count())assert.equal(await value('State'),'all');
 assert.match(await page.getByRole('button',{name:'Choose county',exact:true}).innerText(),/Twic East/);
 assert.equal(await value('Evidence source'),'archive');
};
try{
 await page.goto(base+'#overview?county=twiceast&period=2026-06&source=archive',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Twic East',exact:true}).waitFor();
 const initialCamera=await camera();
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.waitForTimeout(400);
 assert.notDeepEqual(await camera(),initialCamera);
 await page.getByLabel('State',{exact:true}).selectOption('Jonglei');
 await page.getByLabel('Band',{exact:true}).selectOption('C');
 await page.getByLabel('Map indicator').selectOption('score');
 await page.getByLabel('Reporting period').selectOption('2026-01');
 await page.getByLabel('National trend measure').selectOption('median');
 await page.getByRole('button',{name:'24m',exact:true}).click();
 await page.getByLabel('Playback speed').selectOption('2400');
 await page.getByRole('button',{name:'Play timeline',exact:true}).click();
 await reset();
 await defaults();
 assert.equal(await value('Band'),'all');
 assert.equal(await value('Map indicator'),'band');
 assert.equal(await value('National trend measure'),'mean');
 assert.equal(await value('Playback speed'),'1400');
 assert.ok(await page.getByRole('button',{name:'Play timeline',exact:true}).isVisible());
 assert.match(await page.getByRole('button',{name:'12m',exact:true}).getAttribute('class'),/active/);
 await page.waitForTimeout(2500);
 assert.equal(await value('Reporting period'),'2026-06','reset cancels pending playback');
 const resetCamera=await camera();
 for(const k of ['x','y','width','height'])assert.ok(Math.abs(resetCamera[k]-initialCamera[k])<=1,'reset restores map '+k);
 assert.equal(resetCamera.scale,initialCamera.scale,'reset preserves browser zoom');
 // A repeated reset also clears local state when global filter values already match defaults.
 await page.getByLabel('National trend measure').selectOption('median');
 await reset();
 assert.equal(await value('National trend measure'),'mean');

 await navigate('County profiles');
 await page.getByRole('button',{name:'Choose county',exact:true}).click();
 await page.getByRole('combobox',{name:'Search county or state'}).fill('guit');
 await page.getByRole('option',{name:'Guit',exact:true}).click();
 await page.getByLabel('Comparison period').selectOption('');
 await page.getByLabel('Trend measure').selectOption('aggregate_trigger_score_ATS');
 await page.getByRole('button',{name:'All',exact:true}).click();
 await page.getByRole('tab',{name:'Indicator data',exact:true}).click();
 await page.getByRole('button',{name:'Indicator table'}).click();
 await reset();
 await defaults();
 assert.equal(await value('Comparison period'),'2026-05');
 assert.equal(await value('Trend measure'),'score');
 assert.equal(await page.getByRole('tab',{name:'Overview',exact:true}).getAttribute('aria-selected'),'true');
 await page.getByRole('button',{name:'Choose county',exact:true}).click();
 assert.equal(await value('Search county or state'),'','county search clears');
 await page.getByRole('combobox',{name:'Search county or state'}).press('Escape');
 await page.getByRole('tab',{name:'Indicator data',exact:true}).click();
 assert.equal(await page.locator('.indicator-card').count(),10);

 await navigate('Trends & persistent needs');
 await page.getByLabel('National trend measure').selectOption('median');
 await page.getByLabel('National trend range').selectOption('48');
 await page.getByLabel('Band history range').selectOption('12');
 await page.getByLabel('Persistent severity threshold').selectOption('ABC');
 await reset();
 await defaults();
 for(const [label,expected] of [['National trend measure','mean'],['National trend range','12'],['Band history range','24'],['Persistent severity threshold','AB']])assert.equal(await value(label),expected);

 await navigate('Change analysis');
 await page.getByLabel('Change comparison period').selectOption('2026-01');
 await page.getByRole('button',{name:/Band C to B:/}).click();
 await page.getByLabel('Movement filter').selectOption('rising');
 await reset();
 assert.equal(await value('Change comparison period'),'2026-05');
 assert.equal(await value('Movement filter'),'all');
 assert.equal(await page.locator('.transition-matrix button[aria-pressed="true"]').count(),0);

 await navigate('Needs drivers');
 await page.getByLabel('Driver analysis measure').selectOption('high');
 await page.getByLabel('State',{exact:true}).selectOption('Jonglei');
 await reset();
 await defaults();
 assert.equal(await value('Driver analysis measure'),'contribution');

 await navigate('Data explorer');
 await page.getByLabel('Search data table').fill('Twic East');
 await page.locator('th').getByRole('button',{name:'County',exact:true}).click();
 await reset();
 assert.equal(await value('Search data table'),'');
 assert.equal(await page.locator('.explorer-table tbody tr').count(),79);
 assert.equal((await page.locator('.explorer-table th[aria-sort="descending"]').textContent()).trim(),'Final NSS');

 // Non-analytical page resets must not alter hidden global county/cycle selections.
 await page.getByLabel('Reporting period').selectOption('2026-01');
 await navigate('Publications & downloads');
 await page.getByLabel('Publication type').selectOption('framework');
 await page.getByLabel('Publication year').selectOption('2024');
 await reset();
 assert.equal(await value('Publication type'),'all');
 assert.equal(await value('Publication year'),'all');
 assert.equal(await page.locator('.report-library article').count(),20);
 assert.ok(page.url().includes('period=2026-01'));
 await navigate('Methodology & sources');
 await page.getByRole('button',{name:/View supplied methodology diagram/}).click();
 await page.locator('.framework-image').waitFor({state:'visible'});
 await reset();
 assert.equal(await page.locator('.framework-image').count(),0);
 assert.ok(page.url().includes('period=2026-01'));

 await navigate('National overview');
 await page.getByLabel('Evidence source').selectOption('activityinfo');
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await page.getByLabel('Reporting period').selectOption('2025-06');
 await reset();
 assert.equal(await value('Reporting period'),'2025-11','source-specific covered default, not sparse latest month');
 assert.equal(await value('Evidence source'),'activityinfo');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 assert.ok(page.url().includes('source=activityinfo'));
 assert.ok(page.url().includes('period=2025-11'));
 await page.getByLabel('Evidence source').selectOption('archive');
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 await fs.mkdir('qa/reset',{recursive:true});
 for(const width of [1465,884,783,390]){
  await page.setViewportSize({width,height:776});
  for(const route of routes){
   await navigate(route);
   await reset();
   assert.equal(await page.getByRole('button',{name:'Reset',exact:true}).count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' overflow at '+width);
  }
  await navigate('National overview');
  await page.screenshot({path:'qa/reset/overview-'+width+'.png'});
 }
 assert.deepEqual(errors,[]);
 console.log('PASS Reset on all eight pages: global filters, comparisons, charts, county tabs/search, table sorting/search, publications, methodology, source/theme preservation, playback cancellation, camera framing, keyboard focus and four responsive widths.');
}finally{await browser.close();}
