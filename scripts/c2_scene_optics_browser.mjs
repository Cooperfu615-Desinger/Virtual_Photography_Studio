import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {getLockControls,createEmptyLocks} from '../webapp/src/lib/engine.js';
import review from './lib/c2SceneOpticsReview.json' with {type:'json'};
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const before=JSON.parse(gunzipSync(readFileSync(new URL('../Docs/reports/c2-scene-optics-2026-10-30/before.json.gz',import.meta.url)))),controls=getLockControls();
const oldRows=review.changes.map(r=>{const row=before.rows.find(x=>x.id===r.id&&x.input.subjectCount==='1'&&x.input.framingId.endsWith('full-body-shot:8')&&x.input.angleId.endsWith('平視高度鏡頭:2')&&x.outputs.grokPrompt.toLowerCase().includes(r.before.toLowerCase()));assert.ok(row);return row;});
const out=process.argv[2]||'/tmp/c2-scene-optics-browser';mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000}}),page=await context.newPage(),errors=[],fallback=[];page.setDefaultTimeout(20000);
 const locks=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)locks[c.key]=n.id;}
 locks.framingId=controls.find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id;
 await context.addInitScript(({locks,cards})=>{localStorage.setItem('vps.locks',JSON.stringify(locks));localStorage.setItem('vps.favorites',JSON.stringify(cards));},{locks,cards:oldRows.map(r=>r.saved)});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();
 for(const [i,row]of review.changes.entries()){
  if(row.key==='locationId'){
   await page.getByRole('button',{name:/^D 場景環境/}).click();await page.locator('.scene-location-trigger').click();const dialog=page.getByRole('dialog');await dialog.getByRole('searchbox').fill(row.zh);await page.screenshot({path:`${out}/${width}-scene-picker.png`});await dialog.getByRole('button',{name:row.zh,exact:true}).click();
  }else{
   await page.getByRole('button',{name:/^E /}).click();const select=page.getByRole('combobox',{name:'光學效果',exact:true});
   for(const zh of ['玻璃前景折射','稜鏡折射 Prism Refraction'])assert.equal(await select.locator('option').filter({hasText:zh}).count(),0);
   try{await select.selectOption(row.id,{timeout:2500});}catch{fallback.push(row.zh);await select.evaluate((el,id)=>{if(el.disabled||!el.querySelector(`option[value="${id}"]`)||el.querySelector(`option[value="${id}"]`).disabled)throw Error('unavailable option');el.value=id;el.dispatchEvent(new Event('change',{bubbles:true}));},row.id);}
   await select.scrollIntoViewIfNeeded();
  }
  await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key:row.key,id:row.id});
  await page.waitForFunction(en=>[...document.querySelectorAll('.prompt-preview-textarea')].some(el=>el.value.toLowerCase().includes(en.toLowerCase())),row.after);
  assert.equal(await page.locator('.prompt-preview-textarea').count(),6);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);await page.screenshot({path:`${out}/${width}-${i}.png`});
 }
 await page.locator('.scene-location-trigger').click();await page.getByRole('searchbox',{name:'搜尋場景'}).fill('c2-no-matching-location');assert.equal(await page.locator('[data-scene-location-option]').count(),0);await page.getByRole('searchbox',{name:'搜尋場景'}).press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.getByRole('button',{name:'加入最愛',exact:true}).click();await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().waitFor();assert.equal(await page.locator('.prompt-card').count(),4);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))),defaults=[];
 for(const r of oldRows){const old=stored.find(c=>c.i===r.saved.i),expected=r.saved;assert.deepEqual({...old,l:null},{...expected,l:null});for(const [k,v]of Object.entries(expected.l))assert.deepEqual(old.l[k],v);defaults.push(Object.keys(old.l).filter(k=>!Object.hasOwn(expected.l,k)));}
 for(const [i,row]of review.changes.entries()){
  await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').nth(i+1).getByRole('button',{name:'套用目前預覽',exact:true}).click();await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key:row.key,id:row.id});
 }
 assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);await page.screenshot({path:`${out}/${width}-restored.png`});
 results.push({width,height:width===390?900:1000,selections:3,outputs:6,hiddenOptionsAbsent:true,scenePickerClicked:true,emptySearchEscape:true,newSaveAndOldRestore:3,oldPublicTextUnchanged:true,addedDefaultKeys:defaults,errors,overflow:false,programmaticFallback:fallback,nativePopupMouseVerified:false});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await browser.close();}
