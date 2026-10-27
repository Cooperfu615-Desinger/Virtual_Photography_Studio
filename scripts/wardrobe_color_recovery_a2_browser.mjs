// Real import/apply flows in isolated browser storage; no provider generation.
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { resolve, join } from 'node:path';
import { getLockControls, createEmptyLocks, generatePrompts, createSeededRandom } from '../webapp/src/lib/engine.js';
import { buildMarkdownExport } from '../webapp/src/features/saved-cards/cardCodec.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=resolve(process.argv[2]||'/tmp/a2-recovery-browser');mkdirSync(out,{recursive:true});
const archived=JSON.parse(gunzipSync(readFileSync('Docs/reports/wardrobe-control-a2-outfits-2026-10-27/acceptance/baseline-and-saved.json.gz')));
const old=archived.saved.find(x=>x.id.includes('西裝長褲'));
const controls=getLockControls(),opt=(key,term)=>controls.find(c=>c.key===key).options.find(x=>x.zh.includes(term));
const empty=createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無'||o.id==='none');if(n)empty[c.key]=n.id;}
const duoLocks={...empty,subjectCount:'2',framingId:opt('framingId','全身鏡頭').id,outfitPresetAId:opt('outfitPresetAId','粉紅哥德').id,outfitPresetBId:opt('outfitPresetBId','鏈條緞面').id,outfitPresetAPrimaryColorId:'light-blue',outfitPresetAContrastColorId:'white',outfitPresetBPrimaryColorId:'red',outfitPresetBContrastColorId:'black'};
const duo=generatePrompts(1,duoLocks,[],{random:createSeededRandom('a2-recovery-browser')})[0];duo.summary='A2 recovery duo';
const cap=generatePrompts(1,old.oldCaptureLocks,[],{random:createSeededRandom('a2-recovery-capture')})[0];cap.summary='A2 recovery capture';
const zip=new JSZip();zip.file('prompt_recovery-single.md',old.markdown.replace(/\*\*Summary:\*\*[^\n]*/,'**Summary:** A2 recovery single'));zip.file('prompt_recovery-duo.md',buildMarkdownExport(duo));zip.file('prompt_recovery-capture.md',buildMarkdownExport(cap));
const buffer=await zip.generateAsync({type:'nodebuffer'}),browser=await chromium.launch({headless:true});
const checks=[],errors=[],externalPosts=[],screenshots=[];
try{
 for(const [width,height] of [[1440,1000],[390,900]]){
  const context=await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',async route=>{if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')){externalPosts.push(route.request().url());await route.abort();}else await route.continue();});
  await context.addInitScript(raw=>{if(!localStorage.getItem('a2-recovery-seed')){localStorage.setItem('vps.favorites',JSON.stringify([raw]));localStorage.setItem('a2-recovery-seed','1');}},old.raw);
  const button=name=>page.getByRole('button',{name,exact:true}),locks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vps.locks')));
  const health=async label=>{await page.getByText('載入工作區…',{exact:true}).waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,label);assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false,label);checks.push(width+': '+label);};
  const shot=async name=>{
   const y=await page.evaluate(()=>window.scrollY);
   for(const img of await page.locator('img:visible').all()) {await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
   await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(300);
   const file=width+'-'+name+'.png';await page.screenshot({path:join(out,file),fullPage:true});screenshots.push(file);
  };
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1');await button('自訂附加').waitFor();
  await button('Saved Cards').click();await page.locator('.prompt-card').first().waitFor();
  await page.locator('.prompt-card').first().getByRole('button',{name:'Gpt',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),old.raw.g);await health('existing JSON card public text unchanged');
  await page.locator('input[type=file]').setInputFiles({name:'a2-recovery.zip',mimeType:'application/zip',buffer});
  const card=label=>page.locator('.prompt-card').filter({hasText:label});await card('A2 recovery single').waitFor();await shot('zip-import');
  for(const [label,expected,text] of [['single',{outfitPresetId:old.id,outfitPresetPrimaryColorId:'none',outfitPresetContrastColorId:'none'},old.raw.g],['duo',Object.fromEntries(['outfitPresetAId','outfitPresetBId','outfitPresetAPrimaryColorId','outfitPresetAContrastColorId','outfitPresetBPrimaryColorId','outfitPresetBContrastColorId'].map(k=>[k,duoLocks[k]])),duo.grokPrompt]]){
   await card('A2 recovery '+label).getByRole('button',{name:'Gpt',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),text);
   await card('A2 recovery '+label).getByRole('button',{name:'套用目前預覽',exact:true}).click();await button('Prompt 工作台').click();
   const restored=await locks();for(const [key,value] of Object.entries(expected).filter(([key])=>/^outfitPreset(?:[AB]?(?:PrimaryColor|ContrastColor)|[AB]?)Id$/.test(key)))assert.equal(restored[key],value,label+':'+key);
   await page.getByRole('button',{name:/C 穿搭設定/}).click();
   await health(label+' ZIP apply preserves source and recovers colors');await shot(label+'-applied');
   const colorButtons=page.getByRole('button',{name:/套裝主色：/});await colorButtons.first().scrollIntoViewIfNeeded();
   const detail=width+'-'+label+'-colors.png';await page.screenshot({path:join(out,detail)});screenshots.push(detail);
   await button('隨機生成').click();await page.waitForTimeout(200);
   const actual=await page.locator('.prompt-preview-textarea').first().inputValue();if(label==='single')assert.doesNotMatch(actual,/primary garment color red|secondary garment color red/);else{assert.match(actual,/main fabric color set to light blue/);assert.match(actual,/primary garment color red/);}
   await button('加入最愛').click();await page.reload();await button('自訂附加').waitFor();for(const [key,value] of Object.entries(expected).filter(([key])=>/^outfitPreset(?:[AB]?(?:PrimaryColor|ContrastColor)|[AB]?)Id$/.test(key)))assert.equal((await locks())[key],value,label+':reload:'+key);
   await health(label+' regenerate save reload');await button('Saved Cards').click();
  }
  await card('A2 recovery capture').getByRole('button',{name:'套用目前預覽',exact:true}).click();await button('Prompt 工作台').click();assert.deepEqual((await locks()).observationCapture,cap.selection.observationCapture);await health('capture Markdown metadata remains authoritative');await shot('capture');
  await button('回填 Prompt').click();await page.locator('.prompt-import-textarea').fill('');assert.equal(await button('確認回填').isDisabled(),true);
  await page.locator('.prompt-import-textarea').fill(duo.grokPrompt);await button('確認回填').click();
  for(const k of ['outfitPresetAPrimaryColorId','outfitPresetAContrastColorId','outfitPresetBPrimaryColorId','outfitPresetBContrastColorId'])assert.equal((await locks())[k],duoLocks[k]);await health('paste GPT uses same role-aware recovery');await shot('paste-duo');
  await button('回填 Prompt').click();await page.locator('.prompt-import-textarea').fill('unrecoverable input');await button('確認回填').click();await page.getByText('沒有解析到可回填的標準欄位',{exact:true}).waitFor();await button('取消').click();await health('unrecoverable input does not apply random colors');
  for(const [i,name] of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){await button(name).click();await health(name);await shot('workspace-'+i);}
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);
 writeFileSync(join(out,'results.json'),JSON.stringify({checks,errors,externalPosts,screenshots},null,2)+'\n');console.log(JSON.stringify({checks:checks.length,screenshots:screenshots.length,errors,externalPosts}));
}catch(error){writeFileSync(join(out,'failure.json'),JSON.stringify({message:error.message,stack:error.stack,checks,errors},null,2));throw error;}finally{await browser.close();}
