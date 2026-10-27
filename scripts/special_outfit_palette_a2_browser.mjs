// Isolated browser context, actual picker/export/import flows; never call paid providers.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJson} from './lib/catalogBaseline.mjs';
import {getLockControls} from '../webapp/src/lib/engine.js';
import {parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import {resolveCapture} from '../webapp/src/lib/observationCaptureMode.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/a2-special-palette-browser');
const own=resolve(root,'Docs/reports/special-outfit-palette-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');await mkdir(out,{recursive:true});
const report=readJson(resolve(process.argv[3]||'/tmp/a2-special-palette-acceptance/baseline-and-saved.json.gz'));
const controls=getLockControls(),options=k=>controls.find(c=>c.key===k).options;
const row=report.saved.find(r=>r.locks.specialOutfitId.includes('紅色亮面膠帶')&&r.locks.completeLookPaletteId==='silver-metallic');assert.ok(row);
const other=report.saved.find(r=>r.locks.specialOutfitId!==row.locks.specialOutfitId&&r.locks.completeLookPaletteId==='silver-metallic');assert.ok(other);
const browser=await chromium.launch({headless:true}),checks=[],errors=[],externalPosts=[],screenshots=[];
try{
 for(const [width,height]of [[1440,1000],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.setDefaultTimeout(18000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
  const btn=name=>page.getByRole('button',{name,exact:true});
  const locks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks')));
  const values=()=>page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
  const health=async label=>{await page.getByText('載入工作區…',{exact:true}).waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const shot=async label=>{
   const file=width+'-'+label+'.png';await page.screenshot({path:join(out,file),fullPage:true});screenshots.push(file);
   const selector=['single-selected','takeover'].includes(label)?'.wardrobe-single-grid':label==='duo'?'.wardrobe-editor-card--special':label==='capture'?'.capture-person-summary':null;
   if(selector)for(const [i,target]of (await page.locator(selector).all()).entries()){const detail=width+'-'+label+'-detail-'+i+'.png';await target.screenshot({path:join(out,detail)});screenshots.push(detail);}
  };
  const seed=async input=>{await page.evaluate(input=>localStorage.setItem('vps.locks',JSON.stringify(input)),input);await page.reload();await btn('自訂附加').waitFor();await btn('隨機生成').click();};
  const wardrobe=async()=>{await page.getByRole('button',{name:/C 穿搭設定/}).click();await btn('完整造型').click();};
  const choose=async(key,id,keyboard=false)=>{
   const control=controls.find(c=>c.key===key),option=control.options.find(o=>o.id===id);assert.ok(option);
   await page.getByRole('button',{name:new RegExp('^'+control.label+'：')}).click();
   const dialog=page.getByRole('dialog');
   const button=key.startsWith('completeLookPalette')?dialog.getByRole('button',{name:option.en,exact:true}):dialog.locator('.wardrobe-picker-option').filter({hasText:option.zh}).first();
   if(keyboard){await button.focus();await page.keyboard.press('Enter');}else await button.click();
   await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key,id});
  };
  await context.addInitScript(raw=>{if(!localStorage.getItem('a2-special-palette-seeded')){localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('a2-special-palette-seeded','true');}},row.raw);
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();
  await btn('Saved Cards').click();let card=page.locator('.prompt-card').first();await card.waitFor();
  await card.getByRole('button',{name:'Gpt',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),row.raw.g);
  await card.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.equal((await locks()).completeLookPaletteId,'silver-metallic');await health('old saved card applies silver palette and preserves original text');
  await seed({...row.locks,completeLookPaletteId:'none'});await wardrobe();
  for(const id of ['silver-metallic','black-red-street','none','silver-metallic']){
   await choose('completeLookPaletteId',id,id==='black-red-street');const text=(await values())[5];
   if(id==='none')assert.doesNotMatch(text,/outfit palette:/);else assert.ok(text.includes('outfit palette: '+options('completeLookPaletteId').find(o=>o.id===id).en));
   await health('manual palette '+id+' stays selected and updates full-body output');
  }
  await shot('single-selected');
  await choose('specialOutfitId',other.locks.specialOutfitId);assert.equal((await locks()).completeLookPaletteId,'silver-metallic');
  for(const key of ['topId','pantsId','outerwearId','shoesId','headAccessoryId'])assert.equal((await locks())[key],options(key).find(o=>o.zh==='全無')?.id||'');
  await health('switch special outfit keeps palette and wardrobe takeover');await shot('takeover');
  await btn('套用目前預覽').click();assert.equal((await locks()).completeLookPaletteId,'silver-metallic');await page.reload();await btn('自訂附加').waitFor();assert.equal((await locks()).completeLookPaletteId,'silver-metallic');await wardrobe();
  await health('preview apply then reload retains palette');
  const texts=await values(),previews=page.locator('.prompt-preview-card').filter({has:page.locator('.prompt-preview-textarea')});assert.equal(texts.length,6);
  for(let n=0;n<6;n++){await previews.nth(n).getByRole('button').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),texts[n]);}
  await health('all six displayed outputs copy exactly');await btn('加入最愛').click();await btn('Saved Cards').click();card=page.locator('.prompt-card').first();await card.waitFor();
  const download=page.waitForEvent('download');await card.getByTitle('Download Markdown',{exact:true}).click();const md=await readFile(await(await download).path(),'utf8'),parsed=parseExportedMarkdownPrompt(md,controls,'single');
  assert.equal(parsed.grokPrompt,texts[0]);assert.equal(parsed.selection.completeLookPaletteId,'silver-metallic');
  const zipDownload=page.waitForEvent('download');await btn('Download').click();const zipBytes=await readFile(await(await zipDownload).path()),zip=await JSZip.loadAsync(zipBytes);
  const exported=await Promise.all(Object.values(zip.files).filter(f=>!f.dir&&f.name.endsWith('.md')).map(async f=>parseExportedMarkdownPrompt(await f.async('string'),controls,'zip')));
  assert.ok(exported.some(p=>p.grokPrompt===parsed.grokPrompt&&p.selection.completeLookPaletteId==='silver-metallic'));
  await page.locator('input[type=file]').setInputFiles({name:'palette-roundtrip.zip',mimeType:'application/zip',buffer:zipBytes});
  await page.waitForTimeout(250);let imported=null;
  for(const candidate of await page.locator('.prompt-card').all()){await candidate.getByRole('button',{name:'Gpt',exact:true}).click();if(await page.evaluate(()=>navigator.clipboard.readText())===texts[0]){imported=candidate;break;}}
  assert.ok(imported);await imported.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.equal((await locks()).completeLookPaletteId,'silver-metallic');assert.deepEqual(await values(),texts);
  await health('actual single and ZIP export/import/apply preserve selected palette and outputs');await shot('restored');
  await wardrobe();await page.getByTitle('清空可清除欄位；必要欄位會保留預設值。',{exact:true}).click();assert.equal((await locks()).completeLookPaletteId,'none');await health('section clear does not resurrect palette');
  await seed(row.locks);await wardrobe();await page.locator('.page1-section-random-btn').filter({hasText:'本頁設為隨機'}).click();assert.equal((await locks()).completeLookPaletteId,'none');await health('section random retains existing palette reset');
  await seed(row.locks);await btn('全部全無').click();assert.equal((await locks()).completeLookPaletteId,'none');await health('global clear still clears palette');
  const duo={...row.locks,subjectCount:'2',specialOutfitAId:row.locks.specialOutfitId,specialOutfitBId:other.locks.specialOutfitId,completeLookPaletteAId:'black-red-street',completeLookPaletteBId:'silver-metallic'};
  await seed(duo);await wardrobe();const bBefore=(await locks()).specialOutfitBId;
  await choose('completeLookPaletteAId','cream-neutral');assert.equal((await locks()).completeLookPaletteBId,'silver-metallic');assert.equal((await locks()).specialOutfitBId,bBefore);
  await choose('completeLookPaletteBId','green-utility');assert.equal((await locks()).completeLookPaletteAId,'cream-neutral');await health('duo A/B pickers keep independent palettes');await shot('duo');
  const standard={...row.locks,observationCapture:{...resolveCapture({seed:41}).profile,personSource:'full-body',importedPerson:row.imported}};
  await seed(standard);await wardrobe();await choose('completeLookPaletteId','black-red-street');await page.getByRole('button',{name:/A 人物設定/}).click();await btn('觀察式抓拍').click();await page.locator('.capture-person-summary').waitFor();
  assert.deepEqual((await locks()).observationCapture.importedPerson,row.imported);assert.ok((await values()).includes(row.imported.fullBodyPrompt));
  await btn('重新匯入').focus();await page.keyboard.press('Enter');const fresh=(await locks()).observationCapture.importedPerson;assert.equal(fresh.selection.completeLookPaletteId,'black-red-street');assert.notEqual(fresh.fullBodyPrompt,row.imported.fullBodyPrompt);
  for(let i=0;i<2;i++){await btn('重抽隨機項目').first().click();assert.deepEqual((await locks()).observationCapture.importedPerson,fresh);assert.ok((await values()).includes(fresh.fullBodyPrompt));}
  await health('capture keeps old snapshot until explicit reimport, then preserves new palette through rerolls');await shot('capture');
  const captureTexts=await values();await btn('加入最愛').click();await page.reload();await btn('Saved Cards').click();await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.deepEqual((await locks()).observationCapture.importedPerson,fresh);assert.deepEqual(await values(),captureTexts);await health('captured card save reload and restore preserve source and outputs');
  for(const [i,workspace]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
   await btn(workspace).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));await health('workspace: '+workspace);await page.evaluate(()=>window.scrollTo(0,0));await shot('workspace-'+i);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);await writeFile(join(out,'results.json'),JSON.stringify({viewports:[[1440,1000],[390,900]],checks,screenshots,errors,externalPosts},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,screenshots:screenshots.length,errors,externalPosts}));
}catch(error){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(out,'failure.png'),fullPage:true});await writeFile(join(out,'failure-body.txt'),await p.locator('body').innerText());}await writeFile(join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors,externalPosts},null,2));throw error;}finally{await browser.close();}
