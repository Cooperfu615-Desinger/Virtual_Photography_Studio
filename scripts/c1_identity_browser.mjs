import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {getLockControls} from '../webapp/src/lib/engine.js';
import * as lab from '../webapp/src/lib/characterCardLab.js';
import {REPORT,review} from './lib/c1IdentityFixtures.mjs';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const baseline=JSON.parse(gunzipSync(readFileSync(new URL('../'+REPORT+'/before.json.gz',import.meta.url))));
const cards=lab.getCharacterCardOptions(getLockControls()),out=process.argv[2]||'/tmp/c1-browser';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try{for(const [width,height]of [[1440,1000],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
  const page=await context.newPage(),errors=[],checks=[];page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue();});
  await context.addInitScript(rows=>{if(!localStorage.getItem('c1-fixture')){localStorage.setItem('vps.favorites',JSON.stringify(rows.map(r=>r.raw)));localStorage.setItem('vps.pageMode','page2');localStorage.setItem('c1-fixture','1');}},baseline.saved);
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await page.getByRole('button',{name:'Copy GPT Prompt',exact:true}).waitFor();
  const btn=name=>page.getByRole('button',{name,exact:true});
  let expectedSaved=baseline.saved.length;
  async function saveAndWait(name){await btn(name).click();expectedSaved++;await page.waitForFunction(n=>JSON.parse(localStorage.getItem('vps.favorites')).length===n,expectedSaved);}
  async function health(name){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,name);checks.push(name);}
  async function copyAll(name){const v=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.page2Profile'))),bundle=lab.buildCharacterCardPromptBundle(cards,v);for(const o of bundle.outputs){await btn('Copy '+o.label).click();await page.waitForFunction(expected=>navigator.clipboard.readText().then(t=>t===expected),o.value);for(const a of bundle.card.distinctiveFeatures.split(', '))assert.ok(o.value.toLowerCase().includes(a.toLowerCase()));}await health(name);return bundle;}
  async function select(id){const c=cards.find(c=>c.id===id);while(await btn('上一頁').isEnabled())await btn('上一頁').click();for(let i=0;i<4;i++){const target=page.locator('.character-card-option').filter({hasText:c.label});if(await target.count()){await target.click();await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.page2Profile')).characterProfileId===id,id);return c;}await btn('下一頁').click();}throw Error('Missing card '+id);}
  for(const row of review.rows){
    const card=await select(row.id);await copyAll(row.id+' default six outputs');
    await page.screenshot({path:`${out}/${width}-${row.id}-default.png`,fullPage:true});
    for(const hair of lab.getCompatibleHairVariants(card)){await page.locator('.character-card-hair-grid button').filter({hasText:hair.label}).click();await copyAll(row.id+' hair '+hair.id);}
    for(const eye of lab.EYEWEAR_MODE_OPTIONS){await btn(eye.label).click();await copyAll(row.id+' eyewear '+eye.id);}
    await btn(lab.EYEWEAR_MODE_OPTIONS.find(o=>o.id==='glasses-off').label).click();
    while(await page.locator('.character-card-layer.active').count())await page.locator('.character-card-layer.active').first().click();
    const pure=await copyAll(row.id+' pure');assert.equal(pure.variant.outputMode,'pure-character');
    await page.locator('.character-card-layer').first().click();const one=await copyAll(row.id+' one layer');assert.equal(one.variant.includedWardrobeLayers.length,1);
    await page.screenshot({path:`${out}/${width}-${row.id}-variant.png`,fullPage:true});
    await btn('匯回 PAGE1').click();await page.locator('.prompt-preview-textarea').first().waitFor();
    await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).characterProfileId===id,row.id);
    const text=await page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));assert.equal(text.length,6);
    for(const s of text)for(const a of card.distinctiveFeatures.split(', '))assert.ok(s.toLowerCase().includes(a.toLowerCase()),row.id+':'+a);
    await health(row.id+' PAGE1 six outputs');await page.screenshot({path:`${out}/${width}-${row.id}-page1.png`,fullPage:true});
    await saveAndWait('加入最愛');await btn('角色建模').click();await btn('Copy GPT Prompt').waitFor();await copyAll(row.id+' PAGE2 state retained');await saveAndWait('加入 Saved Cards');await btn('角色建模').click();await btn('Copy GPT Prompt').waitFor();
  }
  await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites')));assert.equal(saved.length,baseline.saved.length+4);
  const fresh=saved.filter(c=>!baseline.saved.some(o=>o.raw.i===c.i));assert.equal(fresh.filter(c=>c.o==='page2').length,2);for(const raw of fresh){const id=raw.p?.characterProfileId||raw.l?.characterProfileId,c=cards.find(c=>c.id===id);assert.ok(c);for(const key of ['g','z','m'])for(const a of c.distinctiveFeatures.split(', '))assert.ok(raw[key].toLowerCase().includes(a.toLowerCase()));}
  for(const old of baseline.saved){const actual=saved.find(c=>c.i===old.raw.i);assert.deepEqual({...actual,l:null},{...old.raw,l:null});for(const[k,v]of Object.entries(old.raw.l||{}))assert.deepEqual(actual.l[k],v);}
  const pending=page.waitForEvent('download');await btn('Download').click();const download=await pending;assert.equal(await download.failure(),null);const path=`${out}/${width}-cards.zip`;await download.saveAs(path);
  const zip=await JSZip.loadAsync(readFileSync(path));for(const old of baseline.saved)assert.equal(await zip.file('prompt_'+old.raw.i+'.md').async('string'),old.markdown);
  await health('Saved Cards original text and ZIP');await page.screenshot({path:`${out}/${width}-saved.png`,fullPage:true});
  // Isolated old PAGE1 selection restore: original stored text stays old, preview regenerates current identity.
  const old=baseline.saved.find(r=>r.source==='page1'),restore=await browser.newContext({viewport:{width,height}}),rp=await restore.newPage();
  await restore.addInitScript(raw=>{localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('vps.pageMode','page4');},old.raw);
  rp.on('pageerror',e=>errors.push(e.message));rp.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await rp.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/');await rp.locator('.prompt-card').first().waitFor();await rp.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await rp.locator('.prompt-preview-textarea').first().waitFor();
  const restoredId=old.raw.l.characterProfileId,c=cards.find(c=>c.id===restoredId);for(const value of await rp.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value)))for(const a of c.distinctiveFeatures.split(', '))assert.ok(value.toLowerCase().includes(a.toLowerCase()));
  assert.equal(await rp.evaluate(()=>JSON.parse(localStorage.getItem('vps.favorites'))[0].g),old.raw.g);await rp.screenshot({path:`${out}/${width}-old-page1-restored.png`,fullPage:true});await restore.close();checks.push('Old PAGE1 selection reapplied; stored original unchanged');
  for(const [i,name]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
    await btn(name).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});await health('workspace '+name);
    for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${out}/${width}-workspace-${i}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);results.push({width,height,checks,errors,downloadCards:saved.length,originalCards:baseline.saved.length,overflow:false,allSixOutputsVerified:true,imageGenerationPerformed:false,nativePopupMouseVerified:false,page2LegacyImport:'deferred unchanged'});await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results));}
catch(e){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:`${out}/failure.png`,fullPage:true}).catch(()=>{});writeFileSync(`${out}/failure.txt`,await p.locator('body').innerText().catch(()=>''));}throw e;}
finally{await browser.close();}
