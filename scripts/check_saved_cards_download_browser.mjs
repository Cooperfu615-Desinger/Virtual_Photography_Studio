import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const require=createRequire(root+'/webapp/package.json');const JSZip=require('jszip');
const {createEmptyLocks}=await import(root+'/webapp/src/lib/engine.js');
const {serializeFavoritePrompt}=await import(root+'/webapp/src/features/saved-cards/cardCodec.js');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const raw=Array.from({length:131},(_,i)=>({id:`test-${i}`,source:'page1',date:'2026-10-28T00:00:00.000Z',summary:`Test card ${i}`,selection:{...createEmptyLocks(),...(i===0?{captureMode:'observation',locationId:'unknown-old-location'}:{})},grokPrompt:`GPT original ${i}`,midjourneyPrompt:`AI original ${i}`,zImagePrompt:`Z original ${i}`,structured:{},extraPrompts:[]}));
const stored=raw.map(serializeFavoritePrompt);const out=process.argv[2] || '/tmp/saved-download-browser';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
try {for(const width of [1440,390]) {
 const context=await browser.newContext({viewport:{width,height:width===390?900:1000},acceptDownloads:true});
 await context.addInitScript(items=>{localStorage.setItem('vps.favorites',JSON.stringify(items));localStorage.setItem('vps.pageMode','page4');},stored);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.route('**/savedCardArchive-*.js',async route=>{await new Promise(r=>setTimeout(r,600));await route.continue()});
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');
 await page.getByRole('button',{name:'Download',exact:true}).waitFor();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).click();
 await page.getByRole('button',{name:'Preparing…',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Preparing…',exact:true}).isDisabled(),true);
 const file=await download; const zip=await JSZip.loadAsync(await readFile(await file.path()));
 assert.equal(Object.keys(zip.files).filter(n=>n.endsWith('.md')).length,131);
 const backup=JSON.parse(await zip.file('saved-cards-backup.json').async('string'));
 assert.equal(backup.items.length,131);assert.equal(backup.items[0].selection.locationId,'unknown-old-location');
 for(let i=0;i<131;i++){assert.equal(backup.items[i].grokPrompt,raw[i].grokPrompt);assert.equal(backup.items[i].id,raw[i].id)}
 await page.getByText('已送出 131 筆收藏的下載', {exact:false}).waitFor();
 const single=page.waitForEvent('download');await page.getByTitle('Download Markdown',{exact:true}).first().click();
 assert.ok((await readFile(await (await single).path(),'utf8')).startsWith('<!-- VPStudio Saved Card Backup:'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/${width}.png`,fullPage:false});assert.deepEqual(errors,[]);results.push({width,zipRecords:131,singleBackup:true,loading:true,errors});await context.close();
}
// A failed dynamic import must show a message and release the button, without page errors.
for (const width of [1440,390]) {
const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(items=>{localStorage.setItem('vps.favorites',JSON.stringify(items));localStorage.setItem('vps.pageMode','page4');},stored);
const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
await page.route('**/savedCardArchive-*.js',route=>route.abort());await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.getByRole('button',{name:'Download',exact:true}).click();
await page.getByText('下載失敗，收藏仍保留在本頁。請勿重新整理，請稍後重試。',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Download',exact:true}).isEnabled(),true);assert.deepEqual(pageErrors,[]);results.push({width,errorState:true,pageErrors});await context.close();
}
const emptyContext=await browser.newContext();const emptyPage=await emptyContext.newPage();
await emptyPage.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await emptyPage.getByRole('button',{name:'Saved Cards',exact:true}).click();
assert.equal(await emptyPage.getByRole('button',{name:'Download',exact:true}).isDisabled(),true);results.push({emptyDisabled:true});await emptyContext.close();
await writeFile(out+'/results.json',JSON.stringify(results,null,2));console.log(results);
}finally{await browser.close()}
