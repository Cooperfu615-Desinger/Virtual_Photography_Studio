import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {getLockControls,createEmptyLocks} from '../webapp/src/lib/engine.js';
import review from './lib/c2WaistReview.json' with {type:'json'};
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const before=JSON.parse(gunzipSync(readFileSync(new URL('../Docs/reports/c2-waist-2026-10-30/before.json.gz',import.meta.url))));
const controls=getLockControls(),out=process.argv[2]||'/tmp/c2-waist-browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000}}),page=await context.newPage(),errors=[],fallback=[];page.setDefaultTimeout(15000);
 const locks=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)locks[c.key]=n.id;}
 locks.framingId=controls.find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id;
 await context.addInitScript(({locks,card})=>{localStorage.setItem('vps.locks',JSON.stringify(locks));localStorage.setItem('vps.favorites',JSON.stringify([card]));},{locks,card:before.rows[0].saved});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();await page.getByRole('button',{name:/^C 穿搭設定/}).click();await page.getByRole('button',{name:'配件細節',exact:true}).click();
 const select=page.getByRole('combobox',{name:controls.find(c=>c.key==='waistAccessoryId').label,exact:true});
 for(const [i,row]of review.entries.entries()){
  assert.equal(await select.locator(`option[value="${row.id}"]`).textContent(),row.original.zh);
  try{await select.selectOption(row.id,{timeout:2500});}catch{fallback.push(row.original.zh);await select.evaluate((el,id)=>{if(el.disabled||el.querySelector(`option[value="${id}"]`).disabled)throw Error('disabled option');el.value=id;el.dispatchEvent(new Event('change',{bubbles:true}));},row.id);}
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).waistAccessoryId===id,row.id);
  await page.waitForFunction(en=>[...document.querySelectorAll('.prompt-preview-textarea')].some(el=>el.value.toLowerCase().includes(en.toLowerCase())),row.after);
  assert.equal(await page.locator('.prompt-preview-textarea').count(),6);
  await select.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-${i}.png`});
 }
 await page.getByRole('button',{name:'加入最愛',exact:true}).click();await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().waitFor();assert.equal(await page.locator('.prompt-card').count(),2);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites')));const old=stored.find(c=>c.i===before.rows[0].saved.i),expected=before.rows[0].saved;assert.deepEqual({...old,l:null},{...expected,l:null});for(const [key,value]of Object.entries(expected.l))assert.deepEqual(old.l[key],value);const addedDefaultKeys=Object.keys(old.l).filter(k=>!Object.hasOwn(expected.l,k));
 await page.locator('.prompt-card').last().getByRole('button',{name:'套用目前預覽',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks')).waistAccessoryId),review.entries[0].id);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
 results.push({width,height:width===390?900:1000,selections:5,publicSourceVerified:5,outputs:6,newSaveAndOldRestore:true,oldPublicTextAndExistingSelectionsUnchanged:true,addedDefaultKeys,overflow:false,errors,programmaticFallback:fallback,nativePopupMouseVerified:false});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await browser.close();}
