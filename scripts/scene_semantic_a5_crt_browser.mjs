// Actual UI acceptance in isolated storage. No provider submission is allowed.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, outputStates } from './lib/catalogBaseline.mjs';
import { A5_CRT_REVIEW as r, withPreCrtReplayRoot } from './lib/a5CrtHistoricalReplay.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=resolve(process.argv[2] || '/tmp/vps-crt-browser');await mkdir(out,{recursive:true});
const report=readJson(resolve(process.argv[3] || 'Docs/reports/scene-semantic-a5-crt-2026-10-26/acceptance.json.gz'));
const oldCard=report.savedCards[0].raw;
const expectedStorage=await withPreCrtReplayRoot(async directory=>{const c=await import(pathToFileURL(join(directory,'webapp/src/features/saved-cards/cardCodec.js')).href);return c.serializeFavoritePrompt(c.deserializeFavoritePrompt(oldCard));});
const browser=await chromium.launch({headless:true});const checks=[],errors=[],externalPosts=[],screenshots=[];
try {
 for(const [width,height] of [[1440,1000],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
  const btn=name=>page.getByRole('button',{name,exact:true}),values=()=>page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
  const choose=async(locator,value)=>{await locator.evaluate((el,value)=>{if(el.disabled)throw Error('disabled select');const o=[...el.options].find(x=>x.value===value);if(!o||o.disabled)throw Error('unavailable option');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);assert.equal(await locator.inputValue(),value);};
  const health=async label=>{assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const openD=async()=>{await btn('Prompt 工作台').click();if(!await page.locator('.scene-location-trigger').isVisible())await page.getByRole('button',{name:/^D 場景環境/}).click();};
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();
  const controls=await page.evaluate(async()=> (await import('/Virtual_Photography_Studio/src/lib/engine.js')).getLockControls());const id=(k,zh)=>controls.find(x=>x.key===k).options.find(x=>x.zh===zh).id;
  await context.addInitScript(raw=>{if(!localStorage.getItem('crt-old-card-seeded')){localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('crt-old-card-seeded','true');}},oldCard);await page.reload();await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();
  const decoded=await page.evaluate(async()=>{const c=await import('/Virtual_Photography_Studio/src/features/saved-cards/cardCodec.js');return c.deserializeFavoritePrompt(JSON.parse(localStorage.getItem('vps.favorites'))[0]);});
  assert.equal(decoded.selection.locationId,r.id);const persisted=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))[0]);assert.deepEqual(persisted,expectedStorage);
  await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await openD();await health('pre-CRT JSON card retains old text and existing baseline storage normalization');
  for(const crop of ['全身鏡頭 (Full Body Shot)','牛仔中景 (Cowboy Shot)','胸上特寫']){
   await page.evaluate(async crop=>{const f=await import('/Virtual_Photography_Studio/src/lib/engine/midjourneyNaturalFixtures.js');const locks=f.naturalFixtureLocks({...f.CRT_MIDJOURNEY_SELECTIONS,framingId:{byZh:crop},lightingId:{byZh:'全無'},lightDirectionId:{byZh:'全無'}});localStorage.setItem('vps.locks',JSON.stringify(locks));},crop);
   await page.reload();await btn('自訂附加').waitFor();await openD();
   const ambient=page.getByRole('combobox',{name:'環境光條件',exact:true}),subject=page.getByRole('combobox',{name:'光線表現',exact:true});
   assert.ok((await page.locator('.scene-location-trigger').getAttribute('aria-label')).includes('CRT'));
   assert.equal((await ambient.locator('option').evaluateAll(es=>es.map(e=>e.value).filter(Boolean))).length,19);
   const opts=await subject.locator('option').evaluateAll(es=>es.map(e=>e.value));assert.ok(opts.includes(id('lightDirectionId','窗格投影光')));
   assert.equal(opts.includes(id('lightDirectionId','百葉窗條紋投影光')),crop!=='全身鏡頭 (Full Body Shot)');
   await choose(subject,id('lightDirectionId','窗格投影光'));await btn('隨機生成').click();await page.waitForTimeout(350);
   const texts=await values();assert.equal(texts.length,6);assert.ok(texts.every(Boolean));assert.match(texts[0],/CRT/);assert.match(texts[0],/bikini/i);
   await health(crop+': reviewed ambient/subject pools, manual swimsuit and six outputs');
   await choose(ambient,id('lightingId','室內陰雨昏暗天光'));assert.equal(await subject.inputValue(),'');assert.ok(!(await subject.locator('option').evaluateAll(es=>es.map(e=>e.value))).includes(id('lightDirectionId','窗格投影光')));await health(crop+': dark ambient excludes and clears window light');
   await choose(ambient,id('lightingId','全無'));await choose(subject,id('lightDirectionId','窗格投影光'));await btn('隨機生成').click();await page.waitForTimeout(250);await btn('加入最愛').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('vps.favorites')||'[]').length>1);await page.reload();await btn('Saved Cards').click();
   const cards=page.locator('.prompt-card').filter({hasText:'CRT'});await cards.first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await openD();assert.equal(await subject.inputValue(),id('lightDirectionId','窗格投影光'));await health(crop+': window-light card reload and apply');
   if(crop==='全身鏡頭 (Full Body Shot)'){await page.locator('.scene-editor').scrollIntoViewIfNeeded();const file=width+'-crt-light.png';await page.screenshot({path:out+'/'+file,fullPage:true});screenshots.push(file);}
  }
  // Use the visible existing pose flow; no retired composer controls are reintroduced.
  await page.getByRole('button',{name:/^B 神情姿態/}).click();await page.getByRole('button',{name:/^站姿/}).click();await page.getByRole('button',{name:/自然站姿/}).first().click();await btn('隨機生成').click();await page.waitForTimeout(250);assert.match((await values())[0],/She stands in a relaxed neutral posture/);await health('integrated natural standing with CRT');
  await page.evaluate(async()=>{const locks=JSON.parse(localStorage.getItem('vps.locks'));locks.topId='';locks.pantsId='';locks.outerwearId='';locks.outerwearFitId='';locks.outerwearPatternId='';locks.outerwearOpeningId='';locks.outerwearStylingId='';localStorage.setItem('vps.locks',JSON.stringify(locks));});await page.reload();await btn('Prompt 工作台').click();await btn('隨機生成').click();await page.waitForTimeout(300);assert.equal((await values()).length,6);await health('random garments and automatic outerwear generate successfully');
  const file=width+'-crt-output.png';await page.screenshot({path:out+'/'+file,fullPage:true});screenshots.push(file);
  assert.equal(Object.keys(outputStates(decoded)).length,6);await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);
 await writeFile(out+'/results.json',JSON.stringify({viewports:[[1440,1000],[390,900]],checks,errors,externalPosts,screenshots},null,2)+'\n');console.log(JSON.stringify({passed:checks.length,screenshots:screenshots.length,errors,externalPosts}));
} finally {await browser.close();}
