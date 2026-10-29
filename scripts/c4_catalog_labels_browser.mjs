import {getLockControls} from '../webapp/src/lib/engine.js';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const review=JSON.parse(readFileSync(new URL('./lib/c4CatalogLabelsReview.json',import.meta.url)));
const before=JSON.parse(gunzipSync(readFileSync(new URL('../Docs/reports/c4-catalog-labels-2026-10-29/before.json.gz',import.meta.url))));
const out=process.argv[2]||'/tmp/c4b-browser';mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const c=await b.newContext({viewport:{width,height:width===390?900:1000}}),p=await c.newPage(),errors=[],fallback=[];
 await c.addInitScript(locks=>localStorage.setItem('vps.locks',JSON.stringify(locks)),{subjectCount:'1',framingId:getLockControls().find(c=>c.key==='framingId').options.find(o=>o.zh==='全身鏡頭 (Full Body Shot)').id});
 await c.addInitScript(card=>localStorage.setItem('vps.favorites',JSON.stringify([card])),before.rows[0].saved);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await p.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await p.locator('.prompt-preview-textarea').first().waitFor();
 const choose=async(label,id)=>{const el=p.getByRole('combobox',{name:label,exact:true});try{await el.selectOption(id,{timeout:2000});}catch{fallback.push(label);await el.evaluate((e,value)=>{assertEnabled(e);function assertEnabled(x){if(x.disabled)throw Error('disabled control');}e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}));},id);}assert.equal(await el.inputValue(),id);};
 for(const row of review.entries.slice(0,6)){
  const select=p.getByRole('combobox',{name:'髮型輪廓',exact:true});assert.equal(await select.locator(`option[value="${row.id}"]`).textContent(),row.after);
  assert.equal(await select.getByRole('option',{name:row.before,exact:true}).count(),0);await choose('髮型輪廓',row.id);
 }
 await choose('整理狀態','character:髮絲整理狀態-hair-styling-state:濕髮分束:1');
 writeFileSync(`${out}/${width}-wet.txt`,await p.locator('.prompt-preview-textarea').first().inputValue());
 await p.waitForFunction(()=>document.querySelector('.prompt-preview-textarea')?.value.toLowerCase().includes('sleek wet finish'));
 await choose('整理狀態','character:髮絲整理狀態-hair-styling-state:強烈風感:3');
 await p.getByRole('combobox',{name:'髮型輪廓',exact:true}).scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${width}-hair.png`});
 await p.getByRole('button',{name:/^D 場景環境/}).click();
 const forest=review.entries[6];await p.locator('.scene-location-trigger').click();await p.getByRole('searchbox',{name:'搜尋場景'}).fill('森林步道');await p.getByRole('button',{name:forest.after,exact:true}).click();assert.equal(await p.locator('.scene-location-trigger span').textContent(),forest.after);
 await p.locator('.scene-location-trigger').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${width}-forest.png`});
 await p.getByRole('button',{name:'加入最愛',exact:true}).click();await p.getByRole('button',{name:'Saved Cards',exact:true}).click();await p.locator('.prompt-card').first().waitFor();assert.equal(await p.locator('.prompt-card').count(),2);
 // Apply the oldest pre-change card; public text remains stored and selections use permanent IDs.
 await p.locator('.prompt-card').last().getByRole('button',{name:'套用目前預覽',exact:true}).click();await p.getByRole('button',{name:/^A 人物設定/}).click();
 assert.equal(await p.getByRole('combobox',{name:'髮型輪廓',exact:true}).inputValue(),review.entries[0].id);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);assert.deepEqual(errors,[]);
 results.push({width,labels:7,stylingSwitch:true,oldCardRestore:true,errors,programmaticFallback:fallback,nativePopupMouseVerified:false});await c.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await b.close();}
