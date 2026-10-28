import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {getLockControls} from '../webapp/src/lib/engine.js';
import * as lab from '../webapp/src/lib/characterCardLab.js';
import {createSavedCardsArchive} from '../webapp/src/features/saved-cards/savedCardArchive.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/vps-b3-wardrobe/browser');
assert.ok(!out.startsWith(root)||out.startsWith(join(root,'Docs/reports/b3-character-wardrobe-2026-10-28/')), 'Protect historical reports');
await mkdir(out,{recursive:true});
const data=JSON.parse(gunzipSync(await readFile(process.argv[3]||'/tmp/vps-b3-wardrobe/acceptance/baseline.json.gz'))),old=data.saved.find(x=>x.cardId==='character-rika');
const cards=lab.getCharacterCardOptions(getLockControls()),browser=await chromium.launch({headless:true}),checks=[],errors=[],posts=[],shots=[];
try{for(const [width,height]of[[1440,1000],[390,900]]){
 const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1:')){posts.push(r.request().url());await r.abort();}else await r.continue();});
 const clipboard=async expected=>{await page.waitForFunction(async value=>(await navigator.clipboard.readText())===value,expected);};
 const btn=n=>page.getByRole('button',{name:n,exact:true});
 const health=async name=>{await page.locator('.workspace-loading').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,name);checks.push(width+':'+name);};
 const shot=async name=>{for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await page.evaluate(()=>window.scrollTo(0,0));const path=width+'-'+name+'.png';await page.screenshot({path:join(out,path),fullPage:true});shots.push(path);};
 const current=async()=>lab.buildCharacterCardPromptBundle(cards,await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.page2Profile'))));
 const copyAll=async name=>{const bundle=await current();for(const o of bundle.outputs){await btn('Copy '+o.label).click();await clipboard(o.value);}await health(name);return bundle;};
 await context.addInitScript(row=>{if(!localStorage.getItem('page2-adult-test')){localStorage.setItem('vps.favorites',JSON.stringify([row.raw]));localStorage.setItem('vps.page2Profile',JSON.stringify(row.variant));localStorage.setItem('vps.pageMode','page2');localStorage.setItem('page2-adult-test','1');}},old);
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('Copy GPT Prompt').waitFor();await copyAll('default six copy outputs');await shot('page2-default');
 await page.locator('.character-card-hair-grid button').nth(1).click();await copyAll('hair variant preserves source identity');
 for(const mode of lab.EYEWEAR_MODE_OPTIONS){await btn(mode.label).click();await copyAll('eyewear '+mode.id);}
 await btn(lab.EYEWEAR_MODE_OPTIONS.find(x=>x.id==='glasses-off').label).click();
 while(await page.locator('.character-card-layer.active').count())await page.locator('.character-card-layer.active').first().click();
 assert.equal((await current()).variant.outputMode,'pure-character');await copyAll('pure character');
 await page.locator('.character-card-layer').first().click();await copyAll('one clothing layer');
 await page.getByText('進階 Override',{exact:true}).click();await page.locator('.page2-prompt-textarea').fill('steady neutral expression');await copyAll('temporary direction');await shot('page2-variant');
 await btn('匯回 PAGE1').click();await btn('自訂附加').waitFor();const locks=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks')));assert.equal(locks.characterProfileId,'character-rika');assert.equal(locks.characterCardPromptOverride,'steady neutral expression');assert.equal(locks.characterCardWardrobeLayerIds.length,1);assert.equal(await page.locator('.prompt-preview-textarea').count(),6);await health('PAGE1 import retains identity and selected layer');
 await btn('角色建模').click();await copyAll('PAGE2 state survives PAGE1 round trip');const expected=await current();await btn('加入 Saved Cards').click();await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();
 const newest=page.locator('.prompt-card').first(),legacy=page.locator('.prompt-card').last();
 await newest.getByRole('button',{name:'GPT Prompt',exact:true}).click();await clipboard(expected.outputs.find(x=>x.id==='gpt').value);
 await legacy.getByRole('button',{name:'GPT Prompt',exact:true}).click();await clipboard(old.prompt.grokPrompt);await legacy.getByRole('button',{name:'Z-Image Prompt',exact:true}).click();await clipboard(old.prompt.zImagePrompt);await health('new saved text and legacy original text');
 const dl=page.waitForEvent('download');await legacy.getByTitle('Download Markdown',{exact:true}).click();const md=await readFile(await(await dl).path(),'utf8');assert.deepEqual([...md.matchAll(/```text\n([\s\S]*?)\n```/g)].map(x=>x[1]),[old.prompt.grokPrompt,old.prompt.midjourneyPrompt,old.prompt.zImagePrompt,...old.prompt.extraPrompts.map(x=>x.text)]);await writeFile(join(out,width+'-old-card.md'),md);await health('old Markdown six public texts exact');
 const zip=await createSavedCardsArchive([old.prompt],0,'nodebuffer');const before=await page.evaluate(()=>localStorage.getItem('vps.favorites'));
 await page.locator('input[type=file]').setInputFiles({name:'page2-old.zip',mimeType:'application/zip',buffer:zip});await page.getByText('ZIP 格式錯誤，無法匯入 Favorites',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('vps.favorites')),before);await health('existing PAGE2 ZIP rejection leaves favorites intact');await shot('saved-original-and-import-limit');
 await page.reload();await page.locator('.prompt-card').first().waitFor();await page.locator('.prompt-card').last().getByRole('button',{name:'GPT Prompt',exact:true}).click();await clipboard(old.prompt.grokPrompt);await health('reload keeps old public text');
 for(const id of ['character-amy','character-kaori','character-yui']) {
  const variant=lab.createEmptyCharacterCardVariant([cards.find(c=>c.id===id)]);
  await page.evaluate(v=>{localStorage.setItem('vps.page2Profile',JSON.stringify(v));localStorage.setItem('vps.pageMode','page2');},variant);
  await page.reload();await btn('Copy GPT Prompt').waitFor();const name=id.split('-')[1];const role=page.locator('.character-card-option').filter({hasText:new RegExp(name,'i')});while(!await role.count())await btn('下一頁').click();await role.click();await copyAll('reviewed wardrobe difference '+id);await shot(id);
  while(await page.locator('.character-card-layer.active').count())await page.locator('.character-card-layer.active').first().click();
  await copyAll('reviewed difference pure '+id);
 }
 await btn('角色建模').click();while(await btn('上一頁').isEnabled())await btn('上一頁').click();while(!await page.locator('.character-card-option').filter({hasText:'Eleanor'}).count())await btn('下一頁').click();await page.locator('.character-card-option').filter({hasText:'Eleanor'}).click();await copyAll('Eleanor demonic identity');await btn('Copy GPT Prompt').click();await clipboard((await current()).outputs.find(x=>x.id==='gpt').value);assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/adult demonic woman/);await shot('eleanor');
 for(const [i,name]of['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
  await btn(name).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await health('workspace '+name);await page.evaluate(()=>window.scrollTo(0,0));await shot('workspace-'+i);
 }
 await context.close();
}assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);await writeFile(join(out,'results.json'),JSON.stringify({passed:true,viewports:[[1440,1000],[390,900]],checks,screenshots:shots,errors,externalPosts:posts},null,2)+'\n');console.log({checks:checks.length,screenshots:shots.length,errors});
}catch(e){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(out,'failure.png'),fullPage:true});await writeFile(join(out,'failure-body.txt'),await p.locator('body').innerText());}throw e;}finally{await browser.close();}
