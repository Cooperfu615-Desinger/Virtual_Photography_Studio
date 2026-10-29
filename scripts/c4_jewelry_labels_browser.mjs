import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {getLockControls} from '../webapp/src/lib/engine.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const review=JSON.parse(readFileSync(new URL('./lib/c4JewelryLabelsReview.json',import.meta.url)));
const before=JSON.parse(gunzipSync(readFileSync(new URL('../Docs/reports/c4-jewelry-labels-2026-10-29/before.json.gz',import.meta.url))));
const controls=getLockControls(),out=process.argv[2]||'/tmp/c4c-browser';mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const context=await b.newContext({viewport:{width,height:width===390?900:1000}}),page=await context.newPage(),errors=[],fallback=[];page.setDefaultTimeout(15000);
 await context.addInitScript(({locks,card})=>{localStorage.setItem('vps.locks',JSON.stringify(locks));localStorage.setItem('vps.favorites',JSON.stringify([card]));},{locks:{subjectCount:'1',framingId:controls.find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id},card:before.rows[0].saved});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.locator('.prompt-preview-textarea').first().waitFor();await page.getByRole('button',{name:/^C 穿搭設定/}).click();
 for(const row of review.entries){
  await page.getByRole('button',{name:row.control==='outfitPreset'?'完整造型':'配件細節',exact:true}).click();
  const key=row.control+'Id',control=controls.find(c=>c.key===key),option=control.options.find(o=>o.id===row.id);
  if(row.control!=='outfitPreset'){
   const select=page.getByRole('combobox',{name:control.label,exact:true});assert.equal(await select.locator(`option[value="${row.id}"]`).textContent(),row.after);
   try{await select.selectOption(row.id,{timeout:2500});}catch{fallback.push(row.after);await select.evaluate((el,id)=>{if(el.disabled)throw Error('disabled');el.value=id;el.dispatchEvent(new Event('change',{bubbles:true}));},row.id);}
   await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key,id:row.id});await select.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${width}-${row.control}-${review.entries.indexOf(row)}.png`});continue;
  }
  await page.getByRole('button',{name:new RegExp('^'+control.label+'：')}).click();const dialog=page.getByRole('dialog');
  await dialog.locator('.wardrobe-picker-search').fill(row.after);
  const target=dialog.locator('.wardrobe-picker-option').filter({hasText:option.zh}).first();await target.waitFor();
  if(row.control==='outfitPreset'){
   const img=target.locator('img');await img.waitFor();await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());
   assert.ok(decodeURIComponent(await img.getAttribute('src')).includes('36_垂墜背心腰鏈短裙.avif'));
  }
  await page.screenshot({path:`${out}/${width}-${row.control}-${review.entries.indexOf(row)}.png`});await target.click();
  await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key,id:row.id});
 }
 await page.getByRole('button',{name:'加入最愛',exact:true}).click();await page.getByRole('button',{name:'Saved Cards',exact:true}).click();await page.locator('.prompt-card').first().waitFor();assert.equal(await page.locator('.prompt-card').count(),2);
 await page.locator('.prompt-card').last().getByRole('button',{name:'套用目前預覽',exact:true}).click();
 const key=review.entries[0].control+'Id';assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem('vps.locks'))[key],key),review.entries[0].id);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
 results.push({width,outfitPickerClick:true,accessorySelections:3,oldImagePath:true,newSaveAndOldRestore:true,overflow:false,errors,programmaticFallback:fallback,nativePopupMouseVerified:false});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await b.close();}
