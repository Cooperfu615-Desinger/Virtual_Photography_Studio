// Isolated actual browser interactions; preserve user storage and never call providers.
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
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/a2-paired-capture-browser'),own=resolve(root,'Docs/reports/paired-capture-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');await mkdir(out,{recursive:true});
const report=readJson(resolve(process.argv[3]||'/tmp/a2-paired-capture-acceptance/baseline-and-saved.json.gz'));
const row=report.saved.find(r=>r.name.startsWith('pants:'));assert.ok(row);
const controls=getLockControls(),options=k=>controls.find(c=>c.key===k).options,palettes=options('topBottomPaletteId').filter(o=>o.topColor&&o.bottomColor);
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
  const health=async label=>{await page.locator('.workspace-loading').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const shot=async(label,selector)=>{const file=width+'-'+label+'.png';await page.screenshot({path:join(out,file),fullPage:true});screenshots.push(file);if(selector){const detail=width+'-'+label+'-detail.png';await page.locator(selector).first().screenshot({path:join(out,detail)});screenshots.push(detail);}};
  const seed=async input=>{await page.evaluate(input=>localStorage.setItem('vps.locks',JSON.stringify(input)),input);await page.reload();await btn('自訂附加').waitFor();if(await btn('隨機生成').count()&&!await btn('隨機生成').isDisabled())await btn('隨機生成').click();};
  const garments=async()=>{await page.getByRole('button',{name:/C 穿搭設定/}).click();await btn('上下身單件').click();};
  const choose=async(id,keyboard=false)=>{const option=options('topBottomPaletteId').find(o=>o.id===id);await btn('選擇特殊上下身配色').click();const dialog=page.getByRole('dialog');let item;if(option.topColor){await dialog.getByPlaceholder('搜尋中文或英文顏色名稱').fill(option.zh);item=dialog.locator('.wardrobe-picker-pair-option');assert.equal(await item.count(),1);}else item=dialog.getByRole('button',{name:option.zh,exact:true});if(keyboard){await item.focus();await page.keyboard.press('Enter');}else await item.click();await page.waitForFunction(id=>JSON.parse(localStorage.getItem('vps.locks')).topBottomPaletteId===id,id);};
  const enter=async()=>{await page.getByRole('button',{name:/A 人物設定/}).click();await btn('觀察式抓拍').click();};
  const person=async()=>(await locks()).observationCapture.importedPerson;
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();
  await seed({...row.locks,topBottomPaletteId:'none'});await garments();
  await page.getByRole('button',{name:palettes[0].zh,exact:true}).click();assert.equal((await locks()).topBottomPaletteId,palettes[0].id);
  await health('actual quick palette selection retains top and bottom garments');
  await choose(palettes[1].id,true);const reference=(await values())[5];assert.ok(reference.toLowerCase().includes(palettes[1].topColor.en));assert.ok(reference.toLowerCase().includes(palettes[1].bottomColor.en));
  await health('full palette picker keyboard selection shows both source colors');await shot('paired-standard','.wardrobe-editor-card--palette');
  await enter();await page.locator('.capture-source-row select').selectOption('full-body');await page.locator('.capture-person-summary').waitFor();
  let frozen=await person();assert.equal(frozen.selection.topBottomPaletteId,palettes[1].id);assert.deepEqual(frozen.wardrobeColors.topBottomPalette,palettes[1]);assert.equal(Object.hasOwn(frozen.wardrobeColors.topColor,'id'),false);assert.ok((await values()).includes(reference));
  assert.equal(await btn('重新匯入').isDisabled(),false);await health('first import accepts paired swatches with no new IDs');await shot('paired-import','.capture-person-summary');
  for(let i=0;i<3;i++){await btn('重抽隨機項目').first().click();assert.deepEqual(await person(),frozen);assert.ok((await values()).includes(reference));}
  await health('capture rerolls preserve entire imported person and original full-body reference');
  await page.locator('.capture-source-row select').selectOption('card');assert.deepEqual(await person(),frozen);
  await page.locator('.capture-source-row select').selectOption('full-body');assert.deepEqual(await person(),frozen);await health('source switching retains stored imported person');
  await btn('回一般拍攝調整').click();await garments();await choose(palettes.at(-1).id);await enter();assert.deepEqual(await person(),frozen);
  await btn('重新匯入').focus();await page.keyboard.press('Enter');frozen=await person();assert.equal(frozen.selection.topBottomPaletteId,palettes.at(-1).id);await health('new ordinary palette replaces source only after explicit reimport');await shot('paired-reimport','.capture-person-summary');
  const texts=await values(),previews=page.locator('.prompt-preview-card').filter({has:page.locator('.prompt-preview-textarea')});assert.equal(texts.length,6);
  for(let i=0;i<6;i++){await previews.nth(i).getByRole('button').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),texts[i]);}await health('all six capture outputs copy exactly');
  await btn('加入最愛').click();await btn('Saved Cards').click();let card=page.locator('.prompt-card').first();await card.waitFor();
  const download=page.waitForEvent('download');await card.getByTitle('Download Markdown',{exact:true}).click();const md=await readFile(await(await download).path(),'utf8'),parsed=parseExportedMarkdownPrompt(md,controls,'single');
  assert.deepEqual(parsed.selection.observationCapture.importedPerson,frozen);
  const zipDownload=page.waitForEvent('download');await btn('Download').click();const zipBytes=await readFile(await(await zipDownload).path()),zip=await JSZip.loadAsync(zipBytes);
  const exported=await Promise.all(Object.values(zip.files).filter(f=>!f.dir&&f.name.endsWith('.md')).map(async f=>parseExportedMarkdownPrompt(await f.async('string'),controls,'zip')));
  assert.ok(exported.some(p=>JSON.stringify(p.selection.observationCapture.importedPerson)===JSON.stringify(frozen)));
  await page.locator('input[type=file]').setInputFiles({name:'capture-pair.zip',mimeType:'application/zip',buffer:zipBytes});await page.waitForTimeout(250);
  card=page.locator('.prompt-card').first();await card.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.deepEqual(await person(),frozen);assert.deepEqual(await values(),texts);
  await page.reload();await btn('自訂附加').waitFor();assert.deepEqual(await person(),frozen);assert.deepEqual(await values(),texts);
  await health('actual single and ZIP downloads, ZIP import, saved apply and reload preserve source and six outputs');await shot('paired-restored','.capture-person-summary');
  await btn('Saved Cards').click();await page.locator('input[type=file]').setInputFiles({name:'capture-pair.md',mimeType:'text/markdown',buffer:Buffer.from(md)});await page.waitForTimeout(250);await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();assert.deepEqual(await person(),frozen);await health('single Markdown import and apply preserve paired capture');
  await btn('回一般拍攝調整').click();await garments();await btn('解除配色').click();assert.equal((await locks()).topBottomPaletteId,'none');await enter();await btn('重新匯入').click();assert.equal((await person()).wardrobeColors.topBottomPalette,null);await health('remove palette retains existing no-palette capture');
  await btn('回一般拍攝調整').click();await garments();await choose('random');await enter();await btn('重新匯入').click();frozen=await person();assert.equal(frozen.rawSelection.topBottomPaletteId,'random');assert.ok(palettes.some(p=>p.id===frozen.selection.topBottomPaletteId));
  for(let i=0;i<2;i++){await btn('重抽隨機項目').first().click();assert.deepEqual(await person(),frozen);}await health('random palette resolves once while dormant ordinary random remains');await shot('paired-random','.capture-person-summary');
  await seed({...row.locks,captureMode:'observation',observationCapture:{...resolveCapture({seed:31}).profile,personSource:'full-body'}});await btn('觀察式抓拍啟用中').click();assert.equal(await btn('重新匯入').isDisabled(),true);assert.equal(await btn('加入最愛').isDisabled(),true);await health('missing source keeps import and save disabled');await shot('paired-empty','.capture-person');
  const dress=report.saved.find(r=>r.name.startsWith('dress:'));assert.ok(dress);await seed(dress.locks);assert.equal((await locks()).topBottomPaletteId,'none');await health('legacy dress palette reload limitation remains deferred');
  for(const [i,workspace]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
   await btn(workspace).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));await health('workspace: '+workspace);await page.evaluate(()=>window.scrollTo(0,0));await shot('workspace-'+i);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);await writeFile(join(out,'results.json'),JSON.stringify({viewports:[[1440,1000],[390,900]],checks,screenshots,errors,externalPosts},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,screenshots:screenshots.length,errors,externalPosts}));
}catch(error){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(out,'failure.png'),fullPage:true});await writeFile(join(out,'failure-body.txt'),await p.locator('body').innerText());}await writeFile(join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors,externalPosts},null,2));throw error;}finally{await browser.close();}
