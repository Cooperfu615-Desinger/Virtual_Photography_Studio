import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as engine from '../webapp/src/lib/engine.js';
import {parseSavedCardsArchive} from '../webapp/src/features/saved-cards/savedCardArchive.js';
import {REPORT,fixtures,referenceAllows} from './lib/c7ColorFixtures.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../'+REPORT+'/before.json.gz',import.meta.url)))),m=fixtures(engine),opts=k=>m.controls.find(c=>c.key===k).options;
const out=process.argv[2]||'/tmp/c7-color-browser';mkdirSync(out,{recursive:true});const results=[],browser=await chromium.launch({headless:true});
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000},acceptDownloads:true}),page=await context.newPage(),errors=[],fallback=[];page.setDefaultTimeout(20000);
 await context.addInitScript(({locks,card})=>{localStorage.setItem('vps.locks',JSON.stringify(locks));localStorage.setItem('vps.favorites',JSON.stringify([card]));},{locks:{...m.base,styleId:m.colorStyle,filmId:m.monoFilm},card:baseline.saved});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();
 await page.getByRole('button',{name:/^E 攝影成像/}).click();
 const selects=Object.fromEntries(['styleId','filmId'].map(k=>[k,page.getByRole('combobox',{name:m.controls.find(c=>c.key===k).label,exact:true})]));
 for(const k of ['styleId','filmId'])assert.deepEqual((await selects[k].locator('option').evaluateAll(es=>es.map(e=>e.value))).filter(Boolean),opts(k).map(o=>o.id));
 async function choose(key,id){
  await selects[key].scrollIntoViewIfNeeded();try{await selects[key].selectOption(id,{timeout:2500});}catch{fallback.push({key,id});await selects[key].evaluate((el,id)=>{const o=[...el.options].find(x=>x.value===id);if(el.disabled||!o||o.disabled)throw Error('unavailable');el.value=id;el.dispatchEvent(new Event('change',{bubbles:true}));},id);}
  await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key,id});await page.waitForTimeout(100);
 }
 async function save(){const n=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites')).length);await page.getByRole('button',{name:'加入最愛',exact:true}).click();await page.waitForFunction(n=>JSON.parse(localStorage.getItem('vps.favorites')).length===n+1,n);return page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))[0]);}
 const first=await save();assert.equal(first.l.styleId,m.colorStyle);assert.equal(first.l.filmId,m.monoFilm);assert.match(first.g,/vivid.*color/i);assert.match(first.g,/monochrome/i);
 await selects.filmId.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-manual-conflict.png`});
 const randomCases=[];
 for(const [styleId,filmId]of [[m.monoStyle,''],['',m.monoFilm],[m.colorStyle,''],['',m.colorFilm],['','']]){
  await choose('styleId',styleId);await choose('filmId',filmId);
  for(let i=0;i<8;i++){await page.getByRole('button',{name:'隨機生成',exact:true}).click();await page.waitForTimeout(100);const saved=await save();
   if(styleId)assert.equal(saved.l.styleId,styleId);if(filmId)assert.equal(saved.l.filmId,filmId);
   assert.ok(referenceAllows(opts('styleId').find(x=>x.id===saved.l.styleId),opts('filmId').find(x=>x.id===saved.l.filmId)));randomCases.push({style:saved.l.styleId,film:saved.l.filmId});
  }
 }
 await selects.filmId.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-random.png`});
 for(const key of ['styleId','filmId'])await choose(key,opts(key).find(x=>x.zh==='全無').id);const none=await save();for(const key of ['styleId','filmId'])assert.equal(none.l[key],opts(key).find(x=>x.zh==='全無').id);
 assert.equal(await page.locator('.prompt-preview-textarea').count(),6);
 await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().waitFor();
 const old=await page.evaluate(id=>JSON.parse(localStorage.getItem('vps.favorites')).find(x=>x.i===id),baseline.saved.i);assert.deepEqual({...old,l:null},{...baseline.saved,l:null});
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).click();const download=await downloadPromise;assert.equal(await download.failure(),null);const zipPath=`${out}/${width}-cards.zip`;await download.saveAs(zipPath);
 const restored=await parseSavedCardsArchive(readFileSync(zipPath),m.controls),oldRestored=restored.find(x=>x.id===baseline.saved.i);assert.ok(oldRestored);assert.equal(oldRestored.grokPrompt,baseline.saved.g);assert.equal(oldRestored.selection.styleId,m.colorStyle);assert.equal(oldRestored.selection.filmId,m.monoFilm);
 await page.screenshot({path:`${out}/${width}-library.png`});
 // The oldest card may be on a later page; reduce the library to the preserved
 // original record in this isolated context, then exercise the ordinary restore.
 await page.evaluate(card=>localStorage.setItem('vps.favorites',JSON.stringify([card])),baseline.saved);await page.reload();await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();
 await page.waitForFunction(({s,f})=>{const x=JSON.parse(localStorage.getItem('vps.locks'));return x.styleId===s&&x.filmId===f;},{s:m.colorStyle,f:m.monoFilm});
 assert.equal((await save()).l.filmId,m.monoFilm);await page.screenshot({path:`${out}/${width}-restored.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
 results.push({width,height:width===390?900:1000,manualConflictPreserved:true,randomCases,nonePreserved:true,downloadCards:restored.length,oldPublicTextAndSelectionPreserved:true,oldConflictRestored:true,outputs:6,errors,overflow:false,programmaticFallback:fallback,nativePopupMouseVerified:false});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));}finally{await browser.close();}
