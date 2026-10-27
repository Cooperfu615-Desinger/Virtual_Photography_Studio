// Real UI interactions in disposable browser contexts. No user storage or provider calls.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJson} from './lib/catalogBaseline.mjs';
import {getLockControls} from '../webapp/src/lib/engine.js';
import {parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),out=resolve(process.argv[2]||'/tmp/a2-legacy-dress-browser'),own=resolve(root,'Docs/reports/legacy-dress-restore-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');await mkdir(out,{recursive:true});
const data=readJson(resolve(process.argv[3]||'/tmp/a2-legacy-dress-acceptance/baseline-and-saved.json.gz'));
const dressRows=data.saved.filter(r=>r.locks.dressId?.startsWith('wardrobe:連身-dresses:')&&!r.locks.dressId.includes(':全無:'));
const row=dressRows[0],other=dressRows[1];assert.ok(row&&other);
const controls=getLockControls(),options=k=>controls.find(c=>c.key===k).options,palette=options('topBottomPaletteId').find(o=>o.id===row.locks.topBottomPaletteId);
const browser=await chromium.launch({headless:true}),checks=[],errors=[],externalPosts=[],screenshots=[];
try {
 for(const [width,height]of [[1440,1000],[390,900]]) {
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.setDefaultTimeout(18000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
  const btn=name=>page.getByRole('button',{name,exact:true}),locks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks')));
  const values=()=>page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
  const health=async label=>{await page.locator('.workspace-loading').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const shot=async(label,selector)=>{const file=width+'-'+label+'.png';await page.screenshot({path:join(out,file),fullPage:true});screenshots.push(file);if(selector){const detail=width+'-'+label+'-detail.png';await page.locator(selector).first().screenshot({path:join(out,detail)});screenshots.push(detail);}};
  const seed=async input=>{await page.evaluate(input=>localStorage.setItem('vps.locks',JSON.stringify(input)),input);await page.reload();await btn('自訂附加').waitFor();await btn('隨機生成').click();};
  const wardrobe=async()=>{await page.getByRole('button',{name:/C 穿搭設定/}).click();await btn('完整造型').click();};
  const choose=async(key,id)=>{const c=controls.find(c=>c.key===key),o=c.options.find(o=>o.id===id);await page.getByRole('button',{name:new RegExp('^'+c.label+'：')}).click();const dialog=page.getByRole('dialog');const target=key.includes('Color')&&id!=='none'?dialog.getByRole('button',{name:`${o.zh} (${o.en||''})`,exact:true}):id==='none'?dialog.getByRole('button',{name:'全無',exact:true}):dialog.locator('.wardrobe-picker-option').filter({hasText:o.zh}).first();await target.click();await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem('vps.locks'))[key]===id,{key,id});};
  const assertPair=async()=>{assert.equal((await locks()).topBottomPaletteId,palette.id);const texts=await values();assert.ok(texts[0].includes(palette.topColor.en));assert.ok(texts[0].includes(palette.bottomColor.en));assert.ok(texts[5].includes(palette.bottomColor.en));};
  await context.addInitScript(raw=>{if(!localStorage.getItem('a2-legacy-dress-seeded')){localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('a2-legacy-dress-seeded','true');}},row.raw);
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();
  await btn('Saved Cards').click();let card=page.locator('.prompt-card').first();await card.getByRole('button',{name:'Gpt',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),row.raw.g);
  await card.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();await assertPair();await wardrobe();
  await page.getByText('保留的連身配色：',{exact:false}).waitFor();assert.ok((await page.locator('.legacy-dress-palette').innerText()).includes(palette.topColor.zh));await health('old structured card applies exact palette and visible retained-state notice');await shot('retained','.wardrobe-editor-card--dress');
  await btn('上下身單件').click();assert.equal(await btn('選擇特殊上下身配色').isDisabled(),true);await health('separate palette picker stays disabled under dress takeover');await wardrobe();
  await btn('解除連身舊配色').focus();await page.keyboard.press('Enter');assert.equal((await locks()).topBottomPaletteId,'none');assert.equal((await locks()).dressId,row.locks.dressId);assert.equal(await page.locator('.legacy-dress-palette').count(),0);await health('keyboard release removes only legacy palette and removes notice');await shot('released','.wardrobe-editor-card--dress');
  await seed(row.locks);await wardrobe();await choose('dressColorId','red');assert.equal((await locks()).topBottomPaletteId,'none');assert.ok((await values())[0].includes('red'));await health('explicit dress swatch releases pair and reaches regenerated prompt');
  await seed({...row.locks,dressColorId:'red'});await wardrobe();await choose('dressColorId','red');assert.equal((await locks()).topBottomPaletteId,'none');await health('reselecting the same swatch also releases pair');
  await seed(row.locks);await wardrobe();await choose('dressId',other.locks.dressId);assert.equal((await locks()).topBottomPaletteId,'none');await health('changing dress releases its previous palette');
  await seed(row.locks);await wardrobe();await choose('dressId',row.locks.dressId);assert.equal((await locks()).topBottomPaletteId,'none');await health('reselecting the same dress is an explicit replacement');
  await seed(row.locks);await wardrobe();await btn('鞋襪與外層').click();await choose('shoesColorId','white');await assertPair();await health('unrelated wardrobe color update keeps dress pair');
  await btn('套用目前預覽').click();await page.reload();await btn('自訂附加').waitFor();await assertPair();await wardrobe();await health('preview apply and actual reload retain palette');await shot('reloaded','.wardrobe-editor-card--dress');
  const texts=await values(),previews=page.locator('.prompt-preview-card').filter({has:page.locator('.prompt-preview-textarea')});assert.equal(texts.length,6);
  for(let i=0;i<6;i++){await previews.nth(i).getByRole('button').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),texts[i]);}await health('all six displayed outputs copy exactly');
  await btn('加入最愛').click();await btn('Saved Cards').click();card=page.locator('.prompt-card').first();
  const dl=page.waitForEvent('download');await card.getByTitle('Download Markdown',{exact:true}).click();const md=await readFile(await(await dl).path(),'utf8'),parsed=parseExportedMarkdownPrompt(md,controls,'single');assert.equal(parsed.selection.topBottomPaletteId,palette.id);assert.equal(parsed.grokPrompt,texts[0]);
  const zd=page.waitForEvent('download');await btn('Download').click();const zipBytes=await readFile(await(await zd).path()),zip=await JSZip.loadAsync(zipBytes);const exported=await Promise.all(Object.values(zip.files).filter(f=>!f.dir&&f.name.endsWith('.md')).map(async f=>parseExportedMarkdownPrompt(await f.async('string'),controls,'zip')));assert.ok(exported.some(p=>p.grokPrompt===texts[0]&&p.selection.topBottomPaletteId===palette.id));
  for(const [name,mime,buffer]of [['legacy-dress.zip','application/zip',zipBytes],['legacy-dress.md','text/markdown',Buffer.from(md)]]) {
   await page.locator('input[type=file]').setInputFiles({name,mimeType:mime,buffer});await page.waitForTimeout(250);let imported;
   for(const candidate of await page.locator('.prompt-card').all()){await candidate.getByRole('button',{name:'Gpt',exact:true}).click();if(await page.evaluate(()=>navigator.clipboard.readText())===texts[0]){imported=candidate;break;}}
   assert.ok(imported);await imported.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();await assertPair();assert.deepEqual(await values(),texts);await health('actual import/apply and original outputs: '+name);await btn('Saved Cards').click();
  }
  await btn('Prompt 工作台').click();await page.reload();await btn('自訂附加').waitFor();await assertPair();await health('imported and re-saved card survives reload');
  await wardrobe();await page.getByTitle('清空可清除欄位；必要欄位會保留預設值。',{exact:true}).click();assert.equal((await locks()).topBottomPaletteId,'none');await health('section clear releases legacy pair');
  await seed(row.locks);await wardrobe();await page.locator('.page1-section-random-btn').filter({hasText:'本頁設為隨機'}).click();assert.equal((await locks()).topBottomPaletteId,'none');await health('section random cannot carry legacy pair into a new outfit');
  await seed(row.locks);await btn('全部全無').click();assert.equal((await locks()).topBottomPaletteId,'none');await health('global clear keeps existing scope');
  const duo={...row.locks,subjectCount:'2',dressAId:row.locks.dressId,dressBId:other.locks.dressId,dressAColorId:'red',dressBColorId:'blue',topBottomPaletteAId:'none',topBottomPaletteBId:'none'};
  await seed(duo);await wardrobe();assert.equal(await page.locator('.legacy-dress-palette').count(),0);await choose('dressAColorId','white');assert.equal((await locks()).dressBColorId,'blue');assert.equal((await locks()).dressBId,duo.dressBId);await choose('dressBColorId','black');assert.equal((await locks()).dressAColorId,'white');await health('duo A/B color changes remain isolated and no single notice appears');await shot('duo','.wardrobe-editor-card--dress');
  await seed(row.locks);await page.getByRole('button',{name:/A 人物設定/}).click();await btn('觀察式抓拍').click();await page.locator('.capture-source-row select').selectOption('full-body');await page.locator('.capture-person-summary').waitFor();const frozen=(await locks()).observationCapture.importedPerson;assert.equal(frozen.selection.topBottomPaletteId,palette.id);
  await wardrobe();assert.equal(await btn('解除連身舊配色').isDisabled(),true);await health('capture source retains pair and disables editing owned wardrobe');await shot('capture-disabled','.wardrobe-editor-card--dress');
  await page.getByRole('button',{name:/A 人物設定/}).click();await btn('觀察式抓拍啟用中').click();for(let i=0;i<2;i++){await btn('重抽隨機項目').first().click();assert.deepEqual((await locks()).observationCapture.importedPerson,frozen);}
  await btn('回一般拍攝調整').click();await wardrobe();await assertPair();await btn('解除連身舊配色').click();await page.getByRole('button',{name:/A 人物設定/}).click();await btn('觀察式抓拍').click();assert.deepEqual((await locks()).observationCapture.importedPerson,frozen);await btn('重新匯入').click();assert.equal((await locks()).observationCapture.importedPerson.wardrobeColors.topBottomPalette,null);await health('ordinary release cannot change frozen capture until explicit reimport');await shot('capture-reimport','.capture-person-summary');
  for(const [i,workspace]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()) {
   await btn(workspace).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));await health('workspace: '+workspace);await page.evaluate(()=>window.scrollTo(0,0));await shot('workspace-'+i);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);await writeFile(join(out,'results.json'),JSON.stringify({viewports:[[1440,1000],[390,900]],checks,screenshots,errors,externalPosts},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,screenshots:screenshots.length,errors,externalPosts}));
}catch(error){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(out,'failure.png'),fullPage:true});await writeFile(join(out,'failure-body.txt'),await p.locator('body').innerText());}await writeFile(join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors,externalPosts},null,2));throw error;}finally{await browser.close();}
