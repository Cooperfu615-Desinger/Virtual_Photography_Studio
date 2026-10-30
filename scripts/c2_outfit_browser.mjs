import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {getLockControls,createEmptyLocks} from '../webapp/src/lib/engine.js';
import review from './lib/c2OutfitReview.json' with {type:'json'};
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const before=JSON.parse(gunzipSync(readFileSync(new URL('../Docs/reports/c2-outfit-tails-2026-10-30/before.json.gz',import.meta.url))));
const controls=getLockControls(),control=controls.find(c=>c.key==='outfitPresetId'),changed=review.entries.find(r=>r.decision==='trim');
const oldRow=before.rows.find(r=>r.input.subjectCount==='1'&&r.input.outfitPresetId===changed.id&&r.input.framingId.endsWith('full-body-shot:8')&&r.outputs.grokPrompt.includes(changed.before));assert.ok(oldRow);
const out=process.argv[2]||'/tmp/c2-outfit-browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);
 const locks=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)locks[c.key]=n.id;}
 locks.framingId=controls.find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id;
 await context.addInitScript(({locks,card})=>{localStorage.setItem('vps.locks',JSON.stringify(locks));localStorage.setItem('vps.favorites',JSON.stringify([card]));},{locks,card:oldRow.saved});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();await page.getByRole('button',{name:/^C 穿搭設定/}).click();await page.getByRole('button',{name:'完整造型',exact:true}).click();
 for(const row of review.entries){
  const label=control.options.find(o=>o.id===row.id).zh;
  await page.getByRole('button',{name:/^套裝：/}).click();const dialog=page.getByRole('dialog');await dialog.locator('input').fill(label);
  const option=dialog.locator('.wardrobe-picker-option').filter({has:page.getByText(label,{exact:true})});assert.equal(await option.count(),1);assert.equal(await option.isEnabled(),true);
  if(row.decision==='trim'){await option.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-picker.png`});}
  await option.click();await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).outfitPresetId===id,row.id);
  await page.waitForFunction(en=>[...document.querySelectorAll('.prompt-preview-textarea')].some(el=>el.value.toLowerCase().includes(en.toLowerCase())),row.after);
  assert.equal(await page.locator('.prompt-preview-textarea').count(),6);
  if(row.decision==='trim'){await page.getByRole('button',{name:/^套裝：/}).scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-selected.png`});}
 }
 await page.getByRole('button',{name:/^套裝：/}).click();const dialog=page.getByRole('dialog');await dialog.locator('input').fill('no-match-c2-outfit-2026');assert.equal(await dialog.locator('.wardrobe-picker-option').count(),0);await dialog.locator('input').press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.getByRole('button',{name:'加入最愛',exact:true}).click();await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().waitFor();assert.equal(await page.locator('.prompt-card').count(),2);
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))),old=stored.find(c=>c.i===oldRow.saved.i),expected=oldRow.saved;assert.deepEqual({...old,l:null},{...expected,l:null});for(const [k,v]of Object.entries(expected.l))assert.deepEqual(old.l[k],v);const addedDefaultKeys=Object.keys(old.l).filter(k=>!Object.hasOwn(expected.l,k));
 await page.locator('.prompt-card').last().getByRole('button',{name:'套用目前預覽',exact:true}).click();await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).outfitPresetId===id,changed.id);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);await page.screenshot({path:`${out}/${width}-restored.png`});
 results.push({width,height:width===390?900:1000,selections:20,publicSourceVerified:20,outputs:6,emptySearchAndEscape:true,newSaveAndOldRestore:true,oldPublicTextAndExistingSelectionsUnchanged:true,addedDefaultKeys,overflow:false,errors,programmaticSelectionFallback:false,nativePopupMouseVerified:'not applicable: custom image picker clicked directly'});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await browser.close();}
