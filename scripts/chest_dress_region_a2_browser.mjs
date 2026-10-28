// Disposable browser state, real controls, no paid provider requests.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readJson} from './lib/catalogBaseline.mjs';
import {getLockControls} from '../webapp/src/lib/engine.js';
import {parseExportedMarkdownPrompt} from '../webapp/src/features/saved-cards/cardCodec.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url)),own=resolve(root,'Docs/reports/chest-dress-region-a2-2026-10-28'),out=resolve(process.argv[2]||'/tmp/a2-chest-dress-browser');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');await mkdir(out,{recursive:true});
const data=readJson(process.argv[3]||join(own,'baseline-and-saved.json.gz')),row=data.saved.find(r=>r.kind.startsWith('pair:'));
const controls=getLockControls(),options=k=>controls.find(c=>c.key===k).options,active=k=>options(k).filter(o=>o.id&&!['none','random'].includes(o.id)&&o.zh!=='全無');
const outputTexts=p=>[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,p.nanoBananaPrompt,...p.extraPrompts.map(x=>x.text)];
const oldChest=row.old.extraPrompts.find(x=>x.id==='chest-up-portrait').text;
const browser=await chromium.launch({headless:true}),checks=[],errors=[],externalPosts=[],screenshots=[];
try{
 for(const [width,height]of [[1440,1000],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']}),page=await context.newPage();page.setDefaultTimeout(18000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
  const btn=name=>page.getByRole('button',{name,exact:true}),locks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks'))),values=()=>page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
  const health=async label=>{await page.locator('.workspace-loading').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const shot=async label=>{const file=width+'-'+label+'.png';await page.screenshot({path:join(out,file),fullPage:true});screenshots.push(file);if(['chest-output','opaque','sheer'].includes(label)){const card=page.locator('.prompt-preview-card').filter({has:page.locator('.prompt-preview-textarea')}).nth(4);await card.locator('textarea').evaluate(e=>{e.scrollTop=e.scrollHeight;});const detail=width+'-'+label+'-detail.png';await card.screenshot({path:join(out,detail)});screenshots.push(detail);}};
  const seed=async input=>{await page.evaluate(input=>localStorage.setItem('vps.locks',JSON.stringify(input)),input);await page.reload();await btn('自訂附加').waitFor();await btn('隨機生成').click();};
  const assertUpper=async()=>{const texts=await values();assert.equal(texts.length,6);assert.match(texts[4],/upper\/main dress area in cherry blossom pink/);assert.doesNotMatch(texts[4],/lower hem or skirt area|cream yellow/);assert.match(texts[5],/lower hem or skirt area in cream yellow/);assert.equal((await locks()).topBottomPaletteId,'cherry-blossom-cream');};
  await context.addInitScript(raw=>{if(!localStorage.getItem('a2-chest-seeded')){localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('a2-chest-seeded','true');}},row.raw);
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await btn('自訂附加').waitFor();
  await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();const original=page.locator('.prompt-card').first();await original.getByRole('button',{name:'胸上特寫照',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),oldChest);await health('old Saved Card chest copies original unchanged');
  await original.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();await assertUpper();await health('applying old card regenerates visible upper area');
  const texts=await values(),previews=page.locator('.prompt-preview-card').filter({has:page.locator('.prompt-preview-textarea')});
  for(let i=0;i<6;i++){await previews.nth(i).getByRole('button').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),texts[i]);}await health('six displayed outputs copy exactly');await previews.nth(4).scrollIntoViewIfNeeded();await shot('chest-output');
  await page.getByRole('button',{name:/C 穿搭設定/}).click();await btn('完整造型').click();await page.locator('.legacy-dress-palette').waitFor();await health('retained paired state and release control remain available');await shot('retained-palette');
  await btn('加入最愛').click();await btn('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();const card=page.locator('.prompt-card').first();
  const dl=page.waitForEvent('download');await card.getByTitle('Download Markdown',{exact:true}).click();const md=await readFile(await(await dl).path(),'utf8'),parsed=parseExportedMarkdownPrompt(md,controls,'single');assert.deepEqual(outputTexts(parsed),texts);assert.equal(parsed.selection.topBottomPaletteId,'cherry-blossom-cream');await health('single Markdown download preserves all six outputs and snapshot');
  const zip=new JSZip();zip.file('prompt_chest.md',md);await page.locator('input[type=file]').setInputFiles({name:'chest-pair.zip',mimeType:'application/zip',buffer:await zip.generateAsync({type:'nodebuffer'})});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('vps.favorites')||'[]').some(x=>x.sf==='prompt_chest.md'||x.sourceFileName==='prompt_chest.md'||JSON.stringify(x).includes('prompt_chest.md')));
  let imported;for(const c of await page.locator('.prompt-card').all()){await c.getByRole('button',{name:'胸上特寫照',exact:true}).click();if(await page.evaluate(()=>navigator.clipboard.readText())===texts[4]){imported=c;break;}}assert.ok(imported);await imported.getByRole('button',{name:'套用目前預覽',exact:true}).click();await btn('Prompt 工作台').click();await assertUpper();assert.deepEqual(await values(),texts);await health('actual ZIP import and apply retain current chest and five outputs');
  await page.reload();await btn('自訂附加').waitFor();await assertUpper();await health('reload retains paired projection');
  for(const visible of [false,true]){
   const coat=active('outerwearId').find(o=>visible?o.meta?.outerwear?.closedInnerLayerVisibility==='through-fabric':o.en?.includes('blazer'));
   await seed({...row.locks,outerwearId:coat.id,outerwearOpeningId:'wardrobe:外套開合-outerwear-opening:fully-closed:5'});const t=await values();assert.equal(/upper\/main dress area/.test(t[4]),visible);assert.doesNotMatch(t[4],/lower hem or skirt area/);await health(visible?'closed sheer coat keeps visible inner upper color':'closed opaque coat hides inner upper color');await page.locator('.prompt-preview-textarea').nth(4).scrollIntoViewIfNeeded();await shot(visible?'sheer':'opaque');
  }
  await seed(row.locks);await page.getByRole('button',{name:/A 人物設定/}).click();await btn('觀察式抓拍').click();await page.locator('.capture-source-row select').selectOption('full-body');await page.locator('.capture-person-summary').waitFor();const frozen=(await locks()).observationCapture.importedPerson;assert.ok(frozen);await assertUpper();await health('capture imports full-body source and projects its visible upper region');
  await btn('觀察式抓拍啟用中').click();await btn('重抽隨機項目').first().click();assert.deepEqual((await locks()).observationCapture.importedPerson,frozen);const ct=await values();assert.match(ct[4],/upper\/main dress area in cherry blossom pink/);assert.equal(ct[5],frozen.fullBodyPrompt);await health('capture reroll preserves frozen full-body source');await shot('capture');
  for(const [i,workspace]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
   await btn(workspace).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));await health('workspace: '+workspace);await page.evaluate(()=>window.scrollTo(0,0));await shot('workspace-'+i);
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);await writeFile(join(out,'results.json'),JSON.stringify({viewports:[[1440,1000],[390,900]],checks,screenshots,errors,externalPosts},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,screenshots:screenshots.length,errors,externalPosts}));
}catch(error){for(const c of browser.contexts())for(const p of c.pages()){await p.screenshot({path:join(out,'failure.png'),fullPage:true});await writeFile(join(out,'failure-body.txt'),await p.locator('body').innerText());}await writeFile(join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors,externalPosts},null,2));throw error;}finally{await browser.close();}
