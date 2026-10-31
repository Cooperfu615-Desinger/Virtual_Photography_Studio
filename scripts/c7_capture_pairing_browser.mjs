import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as engine from '../webapp/src/lib/engine.js';
import {parseSavedCardsArchive} from '../webapp/src/features/saved-cards/savedCardArchive.js';
import {REPORT,fixtures,referenceAllows} from './lib/c7CaptureFixtures.mjs';
import {referenceAllows as colorAllows} from './lib/c7ColorFixtures.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../'+REPORT+'/before.json.gz',import.meta.url)))),m=fixtures(engine),opts=k=>m.controls.find(c=>c.key===k).options,by=(k,id)=>opts(k).find(x=>x.id===id);
const out=process.argv[2]||'/tmp/c7-final-browser';mkdirSync(out,{recursive:true});const results=[],browser=await chromium.launch({headless:true});
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000},acceptDownloads:true}),page=await context.newPage(),errors=[],fallback=[];page.setDefaultTimeout(20000);
 await context.addInitScript(({locks,card})=>{if(!localStorage.getItem('vps.locks'))localStorage.setItem('vps.locks',JSON.stringify(locks));if(!localStorage.getItem('vps.favorites'))localStorage.setItem('vps.favorites',JSON.stringify([card]));},{locks:{...m.base,locationId:m.sunflower,lightingId:m.winter},card:baseline.saved});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();
 async function save(){const n=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites')).length);await page.getByRole('button',{name:'加入最愛',exact:true}).click();await page.waitForFunction(n=>JSON.parse(localStorage.getItem('vps.favorites')).length===n+1,n);return page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))[0]);}
 async function load(patch){await page.evaluate(locks=>localStorage.setItem('vps.locks',JSON.stringify(locks)),{...m.base,...patch});await page.reload();await page.locator('.prompt-preview-textarea').first().waitFor();}
 const first=await save();assert.equal(first.l.locationId,m.sunflower);assert.equal(first.l.lightingId,m.winter);
 await page.screenshot({path:`${out}/${width}-manual-season.png`});
 // Exercise the actual scene select and preserve its complete visible options.
 await page.getByRole('button',{name:/^D 場景/}).click();
 const select=page.getByRole('combobox',{name:m.controls.find(c=>c.key==='lightingId').label,exact:true});
 assert.deepEqual((await select.locator('option').evaluateAll(es=>es.map(e=>e.value))).filter(Boolean),engine.getSceneDependentOptions([],{...m.base,locationId:m.sunflower,lightingId:m.winter}).lightingOptions.map(x=>x.id));
 assert.ok(await select.locator('option').evaluateAll((es,id)=>es.some(e=>e.value===id),m.winter));
 await select.scrollIntoViewIfNeeded();try{await select.selectOption('',{timeout:2500});}catch{fallback.push({key:'lightingId',id:''});await select.evaluate(el=>{if(el.disabled)throw Error('unavailable');el.value='';el.dispatchEvent(new Event('change',{bubbles:true}));});}
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('vps.locks')).lightingId==='');
 const randomCases=[];
 const scenarios=[{locationId:m.sunflower,lightingId:''},{locationId:'',lightingId:m.winter},{locationId:m.party,styleId:'',lightingId:'',filmId:''},{styleId:m.dayStyle,lightingId:'',lightDirectionId:'',filmId:''},{styleId:m.slow,lightingId:'',lightDirectionId:'',shutterId:'random',filmId:''},{styleId:'',shutterId:m.fast,lightDirectionId:m.high,lightingId:m.night,filmId:''}];
 for(const [index,patch]of scenarios.entries()){
  await load(patch);
  for(let i=0;i<6;i++){await page.getByRole('button',{name:'隨機生成',exact:true}).click();await page.waitForTimeout(100);const saved=await save(),s=saved.l,state={location:by('locationId',s.locationId),style:by('styleId',s.styleId)};
   for(const[k,v]of Object.entries(patch))if(v&&v!=='random')assert.equal(s[k],v);
   assert.ok(referenceAllows('ambient',by('lightingId',s.lightingId),state));assert.ok(referenceAllows('subject',by('lightDirectionId',s.lightDirectionId),state));assert.ok(referenceAllows('shutter',by('shutterId',s.shutterId),state));assert.ok(referenceAllows('location',state.location,{style:state.style}));assert.ok(colorAllows(state.style,by('filmId',s.filmId)));randomCases.push({index,location:s.locationId,style:s.styleId,ambient:s.lightingId,subject:s.lightDirectionId,shutter:s.shutterId,film:s.filmId});
  }
 }
 await page.screenshot({path:`${out}/${width}-random.png`});
 await load({styleId:m.slow,shutterId:m.fast,lightDirectionId:m.high});const manual=await save();assert.equal(manual.l.styleId,m.slow);assert.equal(manual.l.shutterId,m.fast);assert.equal(manual.l.lightDirectionId,m.high);await page.screenshot({path:`${out}/${width}-manual-style.png`});
 await load({});const none=await save();for(const k of ['styleId','lightingId','shutterId','lightDirectionId'])assert.equal(none.l[k],m.base[k]);assert.equal(await page.locator('.prompt-preview-textarea').count(),6);
 await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().waitFor();
 const old=await page.evaluate(id=>JSON.parse(localStorage.getItem('vps.favorites')).find(x=>x.i===id),baseline.saved.i);assert.deepEqual({...old,l:null},{...baseline.saved,l:null});
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).click();const download=await pending;assert.equal(await download.failure(),null);const zipPath=`${out}/${width}-cards.zip`;await download.saveAs(zipPath);const cards=await parseSavedCardsArchive(readFileSync(zipPath),m.controls),restored=cards.find(x=>x.id===baseline.saved.i);assert.ok(restored);assert.equal(restored.grokPrompt,baseline.saved.g);assert.equal(restored.selection.locationId,m.sunflower);assert.equal(restored.selection.lightingId,m.winter);await page.screenshot({path:`${out}/${width}-library.png`});
 const restoreContext=await browser.newContext({viewport:{width,height:width===390?900:1000}}),restorePage=await restoreContext.newPage();
 await restoreContext.addInitScript(({card,locks})=>{localStorage.setItem('vps.favorites',JSON.stringify([card]));localStorage.setItem('vps.locks',JSON.stringify(locks));},{card:baseline.saved,locks:m.base});
 restorePage.on('pageerror',e=>errors.push(e.message));restorePage.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await restorePage.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await restorePage.getByRole('button',{name:'Saved Cards',exact:true}).click();await restorePage.locator('.prompt-card').first().waitFor();assert.equal(await restorePage.locator('.prompt-card').count(),1);await restorePage.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();
 await restorePage.waitForFunction(({l,a})=>{const x=JSON.parse(localStorage.getItem('vps.locks'));return x.locationId===l&&x.lightingId===a;},{l:m.sunflower,a:m.winter});await restorePage.screenshot({path:`${out}/${width}-restored.png`});assert.equal(await restorePage.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);await restoreContext.close();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);results.push({width,height:width===390?900:1000,randomCases,manualConflictPreserved:true,nonePreserved:true,oldPublicTextAndSelectionPreserved:true,downloadCards:cards.length,outputs:6,errors,overflow:false,programmaticFallback:fallback,nativePopupMouseVerified:false});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
