// A5 local-only browser acceptance. Uses a new isolated context; external POST is blocked.
// Verify native enabled states, then dispatch input/change; selectOption reported enabled options as disabled.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out=resolve(process.argv[2] || '/tmp/vps-a5-browser-targeted');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();const errors=[],externalPosts=[],checks=[],screenshots=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
const btn=name=>page.getByRole('button',{name,exact:true});
const labels=['戶外：倫敦排屋街道','戶外：清澈海灣岩岸','戶外：草地與樹木'];
async function choose(locator,value){await locator.evaluate((el,value)=>{if(el.disabled)throw Error('disabled select');const option=[...el.options].find(o=>o.value===value);if(!option||option.disabled)throw Error('missing/disabled option');el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);assert.equal(await locator.inputValue(),value);}
async function openD(){await btn('Prompt 工作台').click();if(!await page.locator('.scene-location-trigger').isVisible()) await page.getByRole('button',{name:/^D 場景環境/}).click();}
async function selectScene(label){await page.locator('.scene-location-trigger').click();await page.getByRole('searchbox',{name:'搜尋場景'}).fill(label);await page.locator('[data-scene-location-option]').filter({hasText:label}).click();}
const values=()=>page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
async function health(label){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label+' overflow');assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label+' images');checks.push(label);}
try{
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();
 const runtime=await page.evaluate(async()=>{const e=await import('/Virtual_Photography_Studio/src/lib/engine.js');const c=e.getLockControls();return {controls:c.map(x=>({key:x.key,label:x.label,options:x.options.map(o=>({id:o.id,zh:o.zh}))}))};});
 const option=(key,label)=>runtime.controls.find(c=>c.key===key).options.find(o=>o.zh===label).id;
 for(const [width,height] of [[1440,1000],[390,900]]){
  await page.setViewportSize({width,height});
  await page.evaluate(async()=>{const e=await import('/Virtual_Photography_Studio/src/lib/engine.js');const c=e.getLockControls();const locks={...e.createEmptyLocks(),subjectCount:'1',specifiedActionId:'none',framingId:c.find(x=>x.key==='framingId').options.find(x=>x.zh==='全身鏡頭 (Full Body Shot)').id};for(const x of c){if(x.key==='framingId')continue;const none=x.options.find(o=>o.zh==='全無');if(none)locks[x.key]=none.id;}localStorage.setItem('vps.locks',JSON.stringify(locks));});await page.reload();await btn('自訂附加').waitFor();await openD();const attr=page.getByRole('combobox',{name:'場景屬性',exact:true});assert.equal(await attr.evaluate(e=>e.matches(':disabled')),false);await choose(attr,'outdoor');assert.equal(await attr.inputValue(),'outdoor');
  for(const [index,label] of labels.entries()){
   await selectScene(label);
   const light=page.getByRole('combobox',{name:'環境光條件',exact:true});
   const actual=await light.locator('option').evaluateAll(es=>es.map(e=>({id:e.value,text:e.textContent})));
   assert.equal(actual.filter(o=>o.id).length,index===0?19:17);
   for(const city of ['城市夜間混合光','城市高彩度夜色']) assert.equal(actual.some(o=>o.text.includes(city)),index===0);
   await choose(light,option('lightingId','晴朗白日'));await btn('隨機生成').click();await page.waitForTimeout(500);
   const text=await values();assert.equal(text.length,6);assert.ok(text.every(Boolean));
   const screenshot=`${width}-${index+1}.png`;await page.locator('.scene-editor').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+screenshot,fullPage:true});screenshots.push(screenshot);await health(`${width}/${label}: pool, daylight, six outputs`);
   await btn('加入最愛').click();await page.waitForFunction(label=>JSON.parse(localStorage.getItem('vps.favorites')||'[]').some(x=>x.s?.includes(label)),label);await btn('Saved Cards').click();
   const payload=await page.evaluate(async(id)=>{const codec=await import('/Virtual_Photography_Studio/src/features/saved-cards/cardCodec.js');return JSON.parse(localStorage.getItem('vps.favorites')).map(codec.deserializeFavoritePrompt).find(p=>p.selection.locationId===id);},option('locationId',label));
   assert.ok(payload,label+' persisted selection');assert.equal(payload.selection.lightingId,option('lightingId','晴朗白日'));
   await page.reload();await btn('Saved Cards').click();
   const card=page.locator('.prompt-card').filter({hasText:label}).first();await card.getByRole('button',{name:'套用目前預覽',exact:true}).click();await openD();
   assert.ok((await page.locator('.scene-location-trigger').getAttribute('aria-label')).includes(label));assert.equal(await light.inputValue(),option('lightingId','晴朗白日'));
   await btn('隨機生成').click();await page.waitForTimeout(500);assert.equal((await values()).length,6);await health(`${width}/${label}: Saved Cards reload and restore`);
   await choose(light,'');await btn('隨機生成').click();await page.waitForTimeout(500);await health(`${width}/${label}: random light`);
  }
  await selectScene(labels[0]);await choose(page.getByRole('combobox',{name:'環境光條件',exact:true}),option('lightingId','城市夜間混合光'));await selectScene(labels[1]);assert.equal(await page.getByRole('combobox',{name:'環境光條件',exact:true}).inputValue(),'');await health(`${width}: changing to natural scene clears incompatible city light`);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);
 await writeFile(out+'/results.json',JSON.stringify({checks,errors,externalPosts,screenshots},null,2));console.log(JSON.stringify({passed:checks.length,errors,externalPosts}));
}finally{await browser.close();}
