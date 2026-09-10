import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.QA_URL||'http://127.0.0.1:4383/nawg-dashboard/';
await fs.mkdir('qa/combined',{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const context=await browser.newContext({viewport:{width:1465,height:1073},deviceScaleFactor:1});
const page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)requests.push(r.url()+' '+r.status());});
const reports=[];
try{
 await page.goto(base+'#overview?county=twiceast&period=2026-06&source=archive',{waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Twic East',exact:true}).waitFor();
 assert.equal(await page.locator('.score-value').first().innerText(),'6.60');
 await page.mouse.move(600,50);
 await page.screenshot({path:'qa/combined/overview-desktop.png',fullPage:true});
 await page.screenshot({path:'qa/combined/overview-viewport.png'});
 for(const [label,route] of [['County profiles','county'],['Trends & persistent needs','trends'],['Change analysis','compare'],['Needs drivers','drivers'],['Data explorer','data'],['Publications & downloads','publications'],['Methodology & sources','about']]){
  await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(300);await page.mouse.move(600,50);
  assert.ok(await page.locator('main h1').count()>0,route+' heading');
  await page.screenshot({path:'qa/combined/'+route+'-desktop.png',fullPage:true});
  reports.push({route,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 }
 await page.getByRole('button',{name:'County profiles',exact:true}).click();
 await page.getByRole('tab',{name:'Indicator data',exact:true}).click();
 assert.equal(await page.locator('.indicator-card').count(),10);
 await page.locator('.indicator-card-trigger').first().click();
 assert.ok(await page.locator('.indicator-card-detail').isVisible());
 await page.screenshot({path:'qa/combined/county-indicators.png',fullPage:true});
 await page.getByRole('button',{name:'Choose county',exact:true}).click();
 await page.getByRole('combobox',{name:'Search county or state'}).fill('guit');
 await page.getByRole('option',{name:'Guit',exact:true}).click();
 assert.ok((await page.locator('.county-heading h1').innerText()).includes('Guit'));
 await page.getByRole('button',{name:'Change analysis',exact:true}).click();
 await page.getByLabel('Change comparison period').selectOption('2025-06');
 await page.getByRole('heading',{name:'These cycles use different frameworks'}).waitFor();
 await page.getByLabel('Change comparison period').selectOption('2026-05');
 await page.getByRole('button',{name:/Band C to B:/}).click();
 assert.ok(await page.locator('.movers-list>button').count()>0);
 await page.getByRole('button',{name:'Data explorer',exact:true}).click();
 await page.getByLabel('Search data table').fill('Twic East');
 assert.equal(await page.locator('.explorer-table tbody tr').count(),1);
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download CSV',exact:true}).click()]);
 const csv=await fs.readFile(await download.path(),'utf8');assert.ok(csv.includes('Twic East'));assert.ok(!csv.includes('_id'));
 await page.getByRole('button',{name:'Publications & downloads',exact:true}).click();
 assert.equal(await page.locator('.report-library article').count(),20);
 await page.getByLabel('Publication type').selectOption('summary');await page.getByLabel('Publication year').selectOption('2026');
 assert.equal(await page.locator('.report-library article').count(),6);
 const pdf=await context.request.get(new URL(await page.locator('.report-library article a').first().getAttribute('href'),base).href);assert.equal(pdf.status(),200);assert.equal((await pdf.body()).subarray(0,5).toString(),'%PDF-');
 await page.getByRole('button',{name:'National overview',exact:true}).click();
 await page.getByLabel('Map indicator').selectOption('change');assert.ok((await page.locator('.leaflet-interactive[aria-label^="Guit —"]').getAttribute('aria-label')).includes('+1.40'));
 await page.getByLabel('Map indicator').selectOption('hpc:2026');assert.ok((await page.locator('.leaflet-interactive[aria-label^="Twic East —"]').getAttribute('aria-label')).includes('annual severity 4/5'));
 await page.getByLabel('Map indicator').selectOption('score');await page.getByLabel('Map indicator').selectOption('band');
 await page.getByLabel('Evidence source').selectOption('activityinfo');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Reporting period"]').value==='2025-11');
 await page.getByLabel('Evidence source').selectOption('archive');
 await page.waitForFunction(()=>document.querySelector('[aria-label="Reporting period"]').value==='2026-06');
 await page.getByRole('button',{name:'Switch to dark mode'}).click();await page.screenshot({path:'qa/combined/overview-dark.png',fullPage:true});
 await page.getByRole('button',{name:'Switch to light mode'}).click();
 for(const width of [884,783,390]){
  await page.setViewportSize({width,height:776});
  for(const [label,route] of [['National overview','overview'],['County profiles','county'],['Trends & persistent needs','trends'],['Change analysis','compare'],['Needs drivers','drivers'],['Data explorer','data'],['Publications & downloads','publications'],['Methodology & sources','about']]){
   await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(120);await page.mouse.move(60,0);
   reports.push({route,width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
   if(['overview','county'].includes(route)||width===390)await page.screenshot({path:'qa/combined/'+route+'-'+width+'.png',fullPage:true});
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.ok(reports.every(r=>!r.overflow),JSON.stringify(reports.filter(r=>r.overflow)));
 await fs.writeFile('qa/combined/results.json',JSON.stringify({errors,requests,reports,interactionChecks:'passed'},null,2));
 console.log('PASS all routes, responsive widths, source switching, indicators, county search, comparisons, CSV/PDF downloads, map layers and themes.');
}finally{await browser.close();}
