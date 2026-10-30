import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.argv[2]||'/tmp/c3-browser';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [1440,390]){
 const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await context.route('**/*',r=>r.request().method()==='POST'?r.abort():r.continue());
 await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/B.*神情/}).click();
 const grid=page.getByRole('group',{name:'姿勢選擇'});await grid.waitFor();
 for(const menu of ['全無','隨機','任意']){await grid.getByRole('button',{name:menu,exact:true}).click();assert.ok((await page.locator('.specified-action-summary .specified-action-card-description').innerText()).trim());}
 let cards=0;
 for(const category of ['站姿','蹲姿','坐姿','跪姿','躺姿','上身互動']){
  await grid.getByRole('button',{name:new RegExp('^'+category)}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();
  const descriptions=await dialog.locator('.specified-action-card-description').allTextContents();assert.ok(descriptions.length>0);assert.ok(descriptions.every(x=>x.trim()));cards+=descriptions.length;
  await dialog.locator('.specified-action-card').first().click();assert.ok((await page.locator('.specified-action-summary .specified-action-card-description').innerText()).trim());
 }
 await grid.getByRole('button',{name:'全無',exact:true}).click();
 assert.ok((await page.locator('body').innerText()).includes('需先選擇動作'));
 for(const key of ['poseBaseId','poseOrientationId','poseArrangementId','poseHandId','posePropId','poseHeadId','poseAnchorId'])assert.equal(await page.locator(`select[id="${key}"]`).count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
 await page.screenshot({path:`${out}/${width}-none.png`,fullPage:true});
 await grid.getByRole('button',{name:/^站姿/}).click();await page.screenshot({path:`${out}/${width}-standing-dialog.png`,fullPage:true});await page.getByRole('dialog').screenshot({path:`${out}/${width}-dialog-detail.png`});
 assert.equal(cards,54);assert.deepEqual(errors,[]);results.push({width,cards,menuStates:3,selectedCategories:6,disabledHands:true,retiredControlsAbsent:true,overflow:false,errors});await context.close();
}await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));console.log(results);}finally{await browser.close();}
