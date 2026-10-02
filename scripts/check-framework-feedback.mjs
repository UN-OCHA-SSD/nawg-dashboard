import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4383/nawg-dashboard/';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1465,height:1000},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const nav=name=>page.getByRole('button',{name,exact:true}).click();
const comparison=page.locator('.framework-comparison');
try{
 await fs.mkdir('qa/framework-feedback',{recursive:true});
 await page.goto(base+'#trends?county=twiceast&period=2026-06&source=activityinfo',{waitUntil:'networkidle'});
 await comparison.waitFor();
 assert.match(await comparison.locator('.comparison-readout').innerText(),/6\.33[\s\S]*6\.66–6\.90[\s\S]*6\.44/);
 const national=page.locator('.national-charts');
 assert.equal(await national.getByRole('button',{name:'Focused 5–7.5',exact:true}).getAttribute('aria-pressed'),'true');
 await national.getByRole('button',{name:'Full 0–10',exact:true}).click();
 assert.equal(await national.getByRole('button',{name:'Full 0–10',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 assert.equal(await national.getByRole('button',{name:'Focused 5–7.5',exact:true}).getAttribute('aria-pressed'),'true');
 await comparison.getByRole('button',{name:'2026 under 2025 framework · supplied study',exact:true}).click();
 assert.equal(await comparison.getByRole('button',{name:'2026 under 2025 framework · supplied study',exact:true}).getAttribute('aria-pressed'),'false');
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 assert.equal(await comparison.getByRole('button',{name:'2026 under 2025 framework · supplied study',exact:true}).getAttribute('aria-pressed'),'true');
 const [download]=await Promise.all([page.waitForEvent('download'),comparison.getByRole('button',{name:'Download framework reference comparison'}).click()]);
 const csv=await fs.readFile(await download.path(),'utf8');
 assert.match(csv,/"2026-06","6\.328987/);assert.match(csv,/Sensitivity range, not a confidence interval/);assert.ok(!csv.includes('private'));
 await page.getByLabel('State',{exact:true}).selectOption('Jonglei');
 assert.equal(await comparison.locator('.recharts-surface').count(),0);
 assert.match(await comparison.innerText(),/Reset state and band filters/);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.getByLabel('Reporting period').selectOption('2025-06');
 assert.equal(await comparison.locator('.recharts-surface').count(),0);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await comparison.screenshot({path:'qa/framework-feedback/comparison-light.png'});
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await comparison.screenshot({path:'qa/framework-feedback/comparison-dark.png'});
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 await nav('Needs drivers');
 const climate=page.locator('.driver-analysis-grid>div').filter({has:page.locator('span',{hasText:/^Climate$/})});
 assert.match(await climate.innerText(),/maximum 1\.0 points/);
 await nav('Methodology & sources');
 assert.equal(await page.locator('.framework-image').count(),0);
 assert.match(await page.locator('tr').filter({has:page.locator('td',{hasText:/^Climate$/})}).innerText(),/1\.0/);
 await page.locator('#framework-climate').click();
 assert.match(await page.locator('.framework-detail.is-open').innerText(),/Climate/);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 assert.equal(await page.locator('.framework-detail.is-open').count(),0);
 await page.locator('.framework-diagram').screenshot({path:'qa/framework-feedback/diagram-light.png'});
 await page.getByRole('button',{name:'Switch to dark mode'}).click();
 await page.locator('.framework-diagram').screenshot({path:'qa/framework-feedback/diagram-dark.png'});
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 for(const width of [884,783,390]){
  await page.setViewportSize({width,height:776});
  for(const route of ['National overview','Trends & persistent needs','Needs drivers','Methodology & sources']){
   await nav(route);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' overflow '+width);
   if(route==='Trends & persistent needs')await comparison.screenshot({path:`qa/framework-feedback/comparison-${width}.png`});
   if(route==='Methodology & sources')await page.locator('.framework-diagram').screenshot({path:`qa/framework-feedback/diagram-${width}.png`});
  }
 }
 assert.deepEqual(errors,[]);
 console.log('PASS framework feedback: climate1.0, interactive diagram/reset, focused/full scale/reset, reference readout/CSV/legend/reset, filtered/historical withholding, light/dark, 4 widths.');
}finally{await browser.close();}
