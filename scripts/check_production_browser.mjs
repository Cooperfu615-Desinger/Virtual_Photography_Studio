import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:5175/Virtual_Photography_Studio/';
const out=process.argv[3]||'/tmp/b3-production-smoke';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const errors=[],checks=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000},permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await context.route('**/*',async r=>{if(r.request().method()==='POST'&&!r.request().url().startsWith('http://127.0.0.1'))await r.abort();else await r.continue()});
 await page.goto(url,{waitUntil:'networkidle'});
 for(const [i,name]of ['Prompt 工作台','角色建模','場景建模','DLL_PIC Pro','DLL_VIDEO Pro','Saved Cards'].entries()){
  await page.getByRole('button',{name,exact:true}).click();await page.locator('.workspace-loading').waitFor({state:'hidden'});
  if(i===0){await page.locator('.prompt-preview-textarea').first().waitFor();assert.equal(await page.locator('.prompt-preview-textarea').count(),6)}
  if(i===1){await page.locator('.character-card-option').first().click();assert.equal(await page.getByRole('button',{name:/^Copy /}).count(),6);for(const button of await page.getByRole('button',{name:/^Copy /}).all()){await button.click();assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).trim())}}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false,name);
  assert.ok((await page.locator('body').innerText()).length>100);
  for(const img of await page.locator('img').all())await img.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${out}/${width}-${i}.png`,fullPage:true});checks.push(`${width}:${name}`);
 }
 await context.close();
}assert.deepEqual(errors,[]);await writeFile(`${out}/results.json`,JSON.stringify({passed:true,url,checks,errors},null,2));console.log({passed:true,checks:checks.length});}finally{await browser.close()}
