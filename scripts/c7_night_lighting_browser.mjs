import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as engine from '../webapp/src/lib/engine.js';
import {NIGHT_SCENE,DAY_LIGHTS,fixtures} from './lib/c7NightLightingFixtures.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../Docs/reports/c7-night-lighting-2026-10-31/before.json.gz',import.meta.url))));
const {base,controls,menu}=fixtures(engine),none=menu.lightingOptions.find(o=>o.zh==='全無').id;
const out=process.argv[2]||'/tmp/c7-night-browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000}}),page=await context.newPage(),errors=[],fallback=[];page.setDefaultTimeout(20000);
 const locks={...base,lightingId:none,locationId:controls.find(c=>c.key==='locationId').options.find(o=>o.zh==='全無').id};
 await context.addInitScript(({locks,card})=>{localStorage.setItem('vps.locks',JSON.stringify(locks));localStorage.setItem('vps.favorites',JSON.stringify([card]));},{locks,card:baseline.saved});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();
 await page.getByRole('button',{name:/^D 場景環境/}).click();await page.locator('.scene-location-trigger').click();
 const dialog=page.getByRole('dialog');await dialog.getByRole('searchbox').fill('夜間家庭派對');await dialog.getByRole('button',{name:'室內：夜間家庭派對',exact:true}).click();
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).locationId===id,NIGHT_SCENE);
 const select=page.getByRole('combobox',{name:controls.find(c=>c.key==='lightingId').label,exact:true});
 assert.deepEqual((await select.locator('option').evaluateAll(es=>es.map(e=>e.value))).filter(id=>id&&id!=='random'),menu.lightingOptions.map(o=>o.id));
 async function choose(id){
  try{await select.selectOption(id,{timeout:2500});}catch{fallback.push(id);await select.evaluate((el,id)=>{const opt=[...el.options].find(o=>o.value===id);if(el.disabled||!opt||opt.disabled)throw Error('unavailable');el.value=id;el.dispatchEvent(new Event('change',{bubbles:true}));},id);}
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).lightingId===id,id);
 }
 async function save(){
  const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites')).length);
  await page.getByRole('button',{name:'加入最愛',exact:true}).click();
  await page.waitForFunction(n=>JSON.parse(localStorage.getItem('vps.favorites')).length===n+1,count);
  return page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))[0]);
 }
 for(const id of DAY_LIGHTS){await choose(id);assert.equal((await save()).l.lightingId,id);}
 await select.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-manual.png`});
 await choose(none);assert.equal((await save()).l.lightingId,none);
 await choose('');const randomChoices=[];
 for(let i=0;i<10;i++){
  const prior=await page.locator('.prompt-preview-textarea').first().inputValue();
  await page.getByRole('button',{name:'隨機生成',exact:true}).click();
  await page.waitForFunction(old=>document.querySelector('.prompt-preview-textarea').value!==old,prior);
  const saved=await save();assert.equal(saved.l.locationId,NIGHT_SCENE);assert.ok(saved.l.lightingId);assert.notEqual(saved.l.lightingId,none);assert.equal(DAY_LIGHTS.includes(saved.l.lightingId),false);randomChoices.push(saved.l.lightingId);
 }
 assert.equal(await page.locator('.prompt-preview-textarea').count(),6);
 await select.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-random.png`});
 await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').last().waitFor();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))),old=stored.find(c=>c.i===baseline.saved.i);
 assert.deepEqual({...old,l:null},{...baseline.saved,l:null});for(const [k,v]of Object.entries(baseline.saved.l))assert.deepEqual(old.l[k],v);
 await page.locator('.prompt-card').last().getByRole('button',{name:'套用目前預覽',exact:true}).click();
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).lightingId===id,DAY_LIGHTS[0]);
 assert.equal((await save()).l.lightingId,DAY_LIGHTS[0]);
 await page.screenshot({path:`${out}/${width}-restored.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
 results.push({width,height:width===390?900:1000,manualDaylight:6,nonePreserved:true,randomChoices,oldPublicTextAndSelectionsPreserved:true,oldManualDaylightRestored:true,outputs:6,errors,overflow:false,programmaticFallback:fallback,nativePopupMouseVerified:false});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await browser.close();}
