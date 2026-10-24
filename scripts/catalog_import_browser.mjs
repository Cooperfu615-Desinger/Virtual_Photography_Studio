// Isolated local acceptance for the A addendum; never submit provider requests.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { readJson } from './lib/catalogBaseline.mjs';
const JSZip = createRequire(new URL('../webapp/package.json', import.meta.url))('jszip');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1';
if (!/^http:\/\/127\.0\.0\.1:\d+\/Virtual_Photography_Studio\/\?dllAcceptance=1$/.test(url)) throw new Error('local simulation URL required');
const out = resolve(process.argv[3] || '/tmp/catalog-import-browser'); await mkdir(out, { recursive: true });
const corpus = readJson(new URL('../webapp/src/lib/engine/catalogBaseline/revisions/2f56438/corpus.json.gz', import.meta.url).pathname);
const frozen = readJson(new URL('../webapp/src/lib/engine/catalogBaseline/revisions/2f56438/outputs.json.gz', import.meta.url).pathname);
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], externalPosts = [], screenshots = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, permissions: ['clipboard-read', 'clipboard-write'] });
    await context.route('**/*', async route => {
      if (route.request().method() === 'POST' && !route.request().url().startsWith('http://127.0.0.1:')) { externalPosts.push(route.request().url()); await route.abort(); } else await route.continue();
    });
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const btn = name => page.getByRole('button', { name, exact: true });
    const locks = () => page.evaluate(() => JSON.parse(localStorage.getItem('vps.locks')));
    const outputs = () => page.locator('.prompt-preview-textarea').evaluateAll(es => es.map(e => e.value));
    const health = async name => {
      await page.getByText('載入工作區…', { exact: true }).waitFor({ state: 'hidden' });
      await page.evaluate(() => document.fonts.ready);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), name);
      assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && e.naturalWidth === 0)), false, name);
      checks.push(`${width}: ${name}`);
    };
    const shot = async name => { const file = `${width}-${name}.png`; await page.screenshot({ path: `${out}/${file}`, fullPage: true }); screenshots.push(file); };
    await page.goto(url); await btn('一般拍攝').waitFor();
    await page.getByRole('button', { name: /^E 攝影成像/ }).click(); await btn('中景鏡頭 (Medium Shot)').click();
    await btn('觀察式抓拍').click(); await page.locator('.capture-source-row select').selectOption('full-body');
    await page.locator('.capture-person-summary').waitFor();
    const first = (await locks()).observationCapture.importedPerson; assert.ok(first?.fullBodyPrompt);
    const summary = await page.locator('.capture-person-summary').innerText();
    for (let i = 0; i < 3; i++) { await btn('重抽隨機項目').first().click(); assert.deepEqual((await locks()).observationCapture.importedPerson, first); assert.equal(await page.locator('.capture-person-summary').innerText(), summary); }
    await health('full-body import / three rerolls preserve complete person');
    await page.locator('.capture-source-row select').selectOption('card');
    await page.locator('.capture-person-fields select').selectOption({ index: 1 });
    await page.locator('.capture-person-fields select').selectOption({ index: 0 });
    await page.locator('.capture-source-row select').selectOption('full-body');
    assert.deepEqual((await locks()).observationCapture.importedPerson, first); checks.push(`${width}: card source switch preserves import`);
    await btn('回一般拍攝調整').click(); await btn('隨機生成').click(); await btn('觀察式抓拍').click();
    assert.deepEqual((await locks()).observationCapture.importedPerson, first);
    await btn('重新匯入').focus(); await page.keyboard.press('Enter');
    const updated = (await locks()).observationCapture.importedPerson; assert.notDeepEqual(updated, first);
    const six = await outputs(); assert.equal(six.length, 6); assert.ok(six.includes(updated.fullBodyPrompt));
    await health('explicit reimport by keyboard'); await shot('capture-import');
    await page.reload(); await page.locator('.capture-person-summary').waitFor();
    assert.deepEqual((await locks()).observationCapture.importedPerson, updated); assert.deepEqual(await outputs(), six);
    await btn('加入最愛').click(); await btn('Saved Cards').click(); await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click();
    await page.locator('.capture-person-summary').waitFor(); assert.deepEqual((await locks()).observationCapture.importedPerson, updated); assert.deepEqual(await outputs(), six);
    checks.push(`${width}: browser JSON storage / reload / Saved Card restore preserves six outputs`);
    // Restore a frozen, committed-source Markdown record through the actual archive UI.
    await btn('Saved Cards').click(); const count = await page.locator('.prompt-card').count();
    const zip = new JSZip(); zip.file('prompt_a-alignment-import.md', corpus.savedPayloads['dressed-markdown']);
    await btn('Import').click(); await page.locator('input[type=file]').setInputFiles({ name: 'catalog-import.zip', mimeType: 'application/zip', buffer: await zip.generateAsync({ type: 'nodebuffer' }) });
    await page.waitForFunction(n => document.querySelectorAll('.prompt-card').length === n + 1, count);
    const expected = frozen.saved['dressed-markdown'].regenerated;
    const target = page.locator('.prompt-card').first(); // archive merge prepends imported cards
    await target.getByRole('button', { name: '套用目前預覽', exact: true }).click(); await page.locator('.capture-person-summary').waitFor();
    assert.deepEqual((await locks()).observationCapture.importedPerson, expected.selection.observationCapture.importedPerson);
    assert.deepEqual(await outputs(), [expected.grokPrompt, expected.zImagePrompt, expected.midjourneyPrompt, expected.nanoBananaPrompt, ...expected.extraPrompts.map(x => x.text)]);
    await health('frozen Markdown ZIP import / restore retains six outputs'); await shot('markdown-restored');
    for (const workspace of ['Prompt 工作台', '角色建模', '場景建模', 'DLL_PIC Pro', 'Saved Cards']) {
      await btn(workspace).click(); await health(workspace);
    }
    // A separate isolated page exercises the missing-source state without touching real user data.
    await page.evaluate(() => { const l = JSON.parse(localStorage.getItem('vps.locks')); l.captureMode = 'observation'; l.observationCapture = { personSource: 'full-body', seed: 1 }; localStorage.setItem('vps.locks', JSON.stringify(l)); });
    await page.reload(); await btn('Prompt 工作台').click(); await btn('重新匯入').waitFor();
    assert.equal(await btn('重新匯入').isDisabled(), true); assert.equal(await btn('加入最愛').isDisabled(), true);
    await health('missing-source disabled state'); await shot('missing-source'); await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  await writeFile(`${out}/results.json`, JSON.stringify({ url, viewports: [[1440, 1000], [390, 900]], checks, errors, externalPosts, screenshots }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, errors, externalPosts }));
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) {
    await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
    await writeFile(`${out}/failure-body.txt`, await page.locator('body').innerText());
  }
  await writeFile(`${out}/failure.json`, JSON.stringify({ checks, errors, externalPosts, error: error.stack }, null, 2));
  console.error(error); process.exitCode = 1;
} finally { await browser.close(); }
