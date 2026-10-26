// Focused browser smoke for the existing integrated pose path, using a reviewed scene.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.argv[2] || '/tmp/vps-commercial-pose-browser'); await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], externalPosts = [], checks = [], screenshots = [];
try {
  for (const [width,height] of [[1440,1000],[390,900]]) {
    const context = await browser.newContext({ viewport: {width,height} }), page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if(e.type()==='error') errors.push(e.text()); });
    await context.route('**/*', async route => { if(route.request().method()==='POST'&&!route.request().url().startsWith('http://127.0.0.1:')) { externalPosts.push(route.request().url()); await route.abort(); } else await route.continue(); });
    const btn = name => page.getByRole('button',{name,exact:true});
    await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1'); await btn('自訂附加').waitFor();
    await page.evaluate(async () => {
      const e=await import('/Virtual_Photography_Studio/src/lib/engine.js'), c=e.getLockControls(), locks={...e.createEmptyLocks(),subjectCount:'1'};
      for(const control of c){const none=control.options.find(o=>o.zh==='全無');if(none)locks[control.key]=none.id;}
      locks.framingId=c.find(x=>x.key==='framingId').options.find(x=>x.zh.includes('全身')).id;
      locks.sceneAttributeId='indoor'; locks.locationId=c.find(x=>x.key==='locationId').options.find(x=>x.zh==='室內：臥室窗邊').id;
      localStorage.setItem('vps.locks',JSON.stringify(locks));
    });
    await page.reload(); await page.getByRole('button',{name:/^B 神情姿態/}).click();
    await page.getByRole('button',{name:/^站姿/}).click();
    const action=page.getByRole('button',{name:/自然站姿/}).first(); await action.click();
    await btn('隨機生成').click(); await page.waitForTimeout(500);
    const texts=await page.locator('.prompt-preview-textarea').evaluateAll(es=>es.map(e=>e.value));
    assert.equal(texts.length,6);assert.ok(texts.every(Boolean));assert.ok(texts[0].includes('She stands in a relaxed neutral posture'));
    await page.getByText('Expression & Pose',{exact:true}).evaluate(el=>el.scrollIntoView({block:'start'}));const file=width+'-pose.png';await page.screenshot({path:out+'/'+file});screenshots.push(file);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth),false);
    assert.equal(await page.locator('img').evaluateAll(es=>es.some(e=>e.complete&&!e.naturalWidth)),false);
    checks.push(width+': existing natural standing action selected and six outputs generated in reviewed bedroom');
    await btn('加入最愛').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('vps.favorites')||'[]').length>0);
    await page.reload();await btn('Saved Cards').click();await page.locator('.prompt-card').first().getByRole('button',{name:'套用目前預覽',exact:true}).click();
    await btn('Prompt 工作台').click();await btn('隨機生成').click();await page.waitForTimeout(300);
    assert.ok((await page.locator('.prompt-preview-textarea').first().inputValue()).includes('She stands in a relaxed neutral posture'));
    checks.push(width+': pose and reviewed scene survive Saved Cards reload/apply'); await context.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(externalPosts,[]);
  await writeFile(out+'/results.json',JSON.stringify({checks,errors,externalPosts,screenshots},null,2)+'\n');
  console.log(JSON.stringify({passed:checks.length,errors,externalPosts}));
} finally { await browser.close(); }
