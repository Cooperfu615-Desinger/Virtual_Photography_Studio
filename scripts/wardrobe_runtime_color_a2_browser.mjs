// Fresh local browser storage; no provider calls or user-session storage mutations.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJson} from './lib/catalogBaseline.mjs';
import {getLockControls} from '../webapp/src/lib/engine.js';
import {parseExportedMarkdownPrompt,parseLocksFromStandardPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {resolveCapture} from '../webapp/src/lib/observationCaptureMode.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/a2-runtime-browser');
const own=resolve(root,'Docs/reports/wardrobe-runtime-color-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');await mkdir(out,{recursive:true});
const report=readJson(resolve(process.argv[3]||'Docs/reports/wardrobe-runtime-color-a2-2026-10-27/acceptance/baseline-and-saved.json.gz'));
const old=report.saved.find(r=>r.key==='outfitPresetId'&&r.palette==='black-red-street');assert.ok(old);
const subjects=[['specialOutfitId','none'],['specialOutfitId','silver-metallic'],['outfitPresetId','black-red-street'],['dressId','cream-neutral']].map(([k,p])=>report.saved.find(r=>r.key===k&&r.palette===p));
const leak=/complete outfit palette direction|shift the complete outfit palette|preserving garment structure|primary garment color|secondary garment color|coordinated top-to-bottom palette/i;
const controls=getLockControls(),option=(k,label)=>controls.find(c=>c.key===k).options.find(o=>o.zh.includes(label));
const browser=await chromium.launch({headless:true}),checks=[],errors=[],externalPosts=[],screenshots=[];
try{
 for(const [width,height]of [[1440,1000],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
  const btn=name=>page.getByRole('button',{name,exact:true});
  const values=()=>page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
  const locks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks')));
  const health=async label=>{await page.getByText('載入工作區…',{exact:true}).waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const shot=async label=>{if(/^(?:runtime|duo)/.test(label))await page.locator('.prompt-preview-textarea').evaluateAll(es=>es.forEach(e=>{e.scrollTop=e.scrollHeight;}));const file=width+'-'+label+'.png';await page.screenshot({path:join(out,file),fullPage:true});screenshots.push(file);};
  const seed=async input=>{await page.evaluate(input=>localStorage.setItem('vps.locks',JSON.stringify(input)),input);await page.reload();await btn('自訂附加').waitFor();await btn('隨機生成').click();await page.waitForTimeout(250);};
  await context.addInitScript(raw=>{if(!localStorage.getItem('a2-runtime-seeded')){localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('a2-runtime-seeded','true');}},old.raw);
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();
  await page.locator('.prompt-card').first().getByRole('button',{name:'Gpt',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),old.raw.g);assert.match(old.raw.g,leak);
  const dl=page.waitForEvent('download');await page.locator('.prompt-card').first().getByTitle('Download Markdown',{exact:true}).click();const md=await readFile(await(await dl).path(),'utf8');
  assert.equal(parseExportedMarkdownPrompt(md,controls,'old-browser').grokPrompt,old.raw.g);const zip=new JSZip();zip.file('old-runtime.md',md);
  await page.locator('input[type=file]').setInputFiles({name:'old-runtime.zip',mimeType:'application/zip',buffer:await zip.generateAsync({type:'nodebuffer'})});
  await page.locator('.prompt-card').first().getByRole('button',{name:'Gpt',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),old.raw.g);await health('old saved text copy, single Markdown and ZIP preserve original');
  await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();for(const t of await values())assert.doesNotMatch(t,leak);await health('apply old selections regenerates new runtime wording');
  for(const [i,row]of subjects.entries()){
   await seed(row.locks);const texts=await values();assert.equal(texts.length,6);for(const t of texts)assert.doesNotMatch(t,leak);
   if(row.palette!=='none')assert.match(texts[0],/outfit palette:/);
   if(row.key==='outfitPresetId'){assert.match(texts[0],/primary garment in light blue/);assert.match(texts[0],/secondary garment in white/);}
   if(row.key==='dressId'){assert.equal((await locks()).topBottomPaletteId,'none','existing UI separates/full-look exclusivity');assert.doesNotMatch(texts[0],/dress palette from top to bottom:/);}
   const cards=page.locator('.prompt-preview-card').filter({has:page.locator('.prompt-preview-textarea')});for(let n=0;n<6;n++){await cards.nth(n).getByRole('button').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),texts[n]);}
   await cards.first().scrollIntoViewIfNeeded();await health(row.key+' '+row.palette+': generated and six copied outputs');await shot('runtime-'+i);
   await btn('加入最愛').click();await page.reload();await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();
   const download=page.waitForEvent('download');await page.locator('.prompt-card').first().getByTitle('Download Markdown',{exact:true}).click();const currentMd=await readFile(await(await download).path(),'utf8'),parsed=parseExportedMarkdownPrompt(currentMd,controls,'new-browser');
   assert.equal(parsed.selection[row.key],row.locks[row.key]);assert.equal(parsed.selection.completeLookPaletteId,row.palette);assert.equal(parsed.grokPrompt,texts[0]);
   await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();
   if(row.key==='specialOutfitId'){assert.equal((await locks()).completeLookPaletteId,'none','known reset remains');for(const t of await values())assert.doesNotMatch(t,/outfit palette:/);}
   else{assert.equal((await locks()).completeLookPaletteId,row.palette);assert.deepEqual(await values(),texts);}
   await health(row.key+': new snapshot save, reload, download and apply; known special reset separated');
  }
  const legacyDress=subjects.find(r=>r.key==='dressId'),legacyZip=new JSZip();legacyZip.file('split-dress.md',legacyDress.newMarkdown);
  await btn('Saved Cards').click();await page.locator('input[type=file]').setInputFiles({name:'split-dress.zip',mimeType:'application/zip',buffer:await legacyZip.generateAsync({type:'nodebuffer'})});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('vps.favorites')||'[]').some(p=>/dress palette from top to bottom:/.test(p.g||'')));
  let areaCard=null;
  for(const card of await page.locator('.prompt-card').all()){await card.getByRole('button',{name:'Gpt',exact:true}).click();if(/dress palette from top to bottom: upper\/main dress area/.test(await page.evaluate(()=>navigator.clipboard.readText()))){areaCard=card;break;}}
  assert.ok(areaCard,'imported split-dress snapshot is visible');
  await health('legacy split-dress snapshot retains its new area wording exactly');await shot('legacy-dress-areas');
  await areaCard.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.equal((await locks()).topBottomPaletteId,'none','existing full-look exclusivity on apply');await health('legacy split-dress apply preserves existing UI exclusivity');
  const duo={...old.locks,subjectCount:'2',outfitPresetAId:option('outfitPresetAId','鏈條緞面').id,outfitPresetBId:option('outfitPresetBId','鏈條緞面').id,outfitPresetAPrimaryColorId:'red',outfitPresetAContrastColorId:'white',outfitPresetBPrimaryColorId:'light-blue',outfitPresetBContrastColorId:'black',completeLookPaletteAId:'black-red-street',completeLookPaletteBId:'silver-metallic'};
  await seed(duo);const dtexts=await values();for(const t of dtexts)assert.doesNotMatch(t,leak);const recovered=parseLocksFromStandardPrompt(dtexts[0],controls).locks;for(const key of ['outfitPresetAPrimaryColorId','outfitPresetAContrastColorId','outfitPresetBPrimaryColorId','outfitPresetBContrastColorId'])assert.equal(recovered[key],duo[key]);await health('duo A/B retain distinct primary and contrast colors');await shot('duo-colors');
  const capture={...old.locks,captureMode:'observation',observationCapture:{...resolveCapture({seed:41}).profile,personSource:'full-body',importedPerson:old.oldImport}};
  await page.evaluate(input=>localStorage.setItem('vps.locks',JSON.stringify(input)),capture);await page.reload();await btn('Prompt 工作台').click();await page.locator('.capture-person-summary').waitFor();
  for(let i=0;i<2;i++){await btn('重抽隨機項目').first().click();assert.deepEqual((await locks()).observationCapture.importedPerson,old.oldImport);}
  assert.ok((await values()).includes(old.oldImport.fullBodyPrompt));assert.match(old.oldImport.fullBodyPrompt,leak);await health('old captured full-body reference remains verbatim through rerolls');
  await btn('回一般拍攝調整').click();await btn('隨機生成').click();await btn('觀察式抓拍').click();assert.deepEqual((await locks()).observationCapture.importedPerson,old.oldImport);
  await btn('重新匯入').focus();await page.keyboard.press('Enter');const fresh=(await locks()).observationCapture.importedPerson;assert.doesNotMatch(fresh.fullBodyPrompt,leak);assert.notEqual(fresh.fullBodyPrompt,old.oldImport.fullBodyPrompt);await btn('重抽隨機項目').first().click();assert.deepEqual((await locks()).observationCapture.importedPerson,fresh);await health('explicit reimport adopts new wording; next reroll keeps snapshot');await shot('capture-reimport');
  const captured=await values();await btn('加入最愛').click();await page.reload();await btn('Saved Cards').click();await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.deepEqual((await locks()).observationCapture.importedPerson,fresh);assert.deepEqual(await values(),captured);await health('capture save reload and restore preserve full state');
  for(const [i,workspace]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
   await btn(workspace).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));await health('workspace: '+workspace);await page.evaluate(()=>window.scrollTo(0,0));await shot('workspace-'+i);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);await writeFile(join(out,'results.json'),JSON.stringify({viewports:[[1440,1000],[390,900]],checks,screenshots,errors,externalPosts},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,screenshots:screenshots.length,errors,externalPosts}));
}catch(error){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(out,'failure.png'),fullPage:true});await writeFile(join(out,'failure-body.txt'),await p.locator('body').innerText());}await writeFile(join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors,externalPosts},null,2));throw error;}finally{await browser.close();}
