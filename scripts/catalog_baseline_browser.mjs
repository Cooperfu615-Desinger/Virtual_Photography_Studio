// Local-only acceptance; new browser context + development simulation, never a provider call.
// PLAYWRIGHT_MODULE may point to a preinstalled Playwright module; no installation is performed.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const JSZip = createRequire(new URL('../webapp/package.json', import.meta.url))('jszip');
import { readJson } from './lib/catalogBaseline.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1';
if (!/^http:\/\/127\.0\.0\.1:\d+\/Virtual_Photography_Studio\/\?dllAcceptance=1$/.test(url)) throw new Error('local acceptance URL required');
const out = resolve(process.argv[3] || '/tmp/catalog-a-browser');
await mkdir(out, { recursive: true });
const corpus = readJson(new URL('../webapp/src/lib/engine/catalogBaseline/corpus.json.gz', import.meta.url).pathname);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const checks = [], errors = [], externalPosts = [], screenshots = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await context.route('**/*', async route => {
  const request = route.request();
  if (request.method() === 'POST' && !request.url().startsWith('http://127.0.0.1:')) {
    externalPosts.push(request.url()); await route.abort();
  } else await route.continue();
});
const btn = name => page.getByRole('button', { name, exact: true });
const values = () => page.locator('.prompt-preview-textarea').evaluateAll(elements => elements.map(e => e.value));
async function health(label) {
  await page.locator('.workspace-loading').waitFor({ state: 'hidden' });
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.workspace-loading').count(), 0, `${label}: workspace still loading`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, `${label}: overflow`);
  for (const img of await page.locator('img').all()) await img.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
  assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && e.naturalWidth === 0)), false, `${label}: broken image`);
  checks.push(label);
}
const dllState = () => page.evaluate(async () => (await import('/Virtual_Photography_Studio/src/lib/dllWorkspaceRuntime.js')).dllWorkspace.getSnapshot());
try {
  await page.goto(url); await btn('自訂附加').waitFor();
  await btn('Saved Cards').click(); await health('empty Saved Cards');
  assert.equal(await page.locator('.prompt-card').count(), 0);
  // Fixed historical JSON is installed only into this new browser's local storage.
  await context.addInitScript(payload => {
    if (!localStorage.getItem('catalog-a-seeded')) {
      localStorage.setItem('vps.favorites', JSON.stringify([payload]));
      localStorage.setItem('catalog-a-seeded', 'true');
    }
  }, corpus.savedPayloads.raw);
  await page.reload(); await btn('Saved Cards').click();
  await page.locator('.prompt-card').waitFor();
  const preserved = await page.evaluate(async () => {
    const { deserializeFavoritePrompt } = await import('/Virtual_Photography_Studio/src/features/saved-cards/cardCodec.js');
    return JSON.parse(localStorage.getItem('vps.favorites')).map(deserializeFavoritePrompt);
  });
  assert.equal(preserved[0].extraPrompts.find(x => x.id === 'chest-up-mj-portrait').text, '  Historical MJ chest.\nDo not rewrite.  ');
  await page.locator('.prompt-card').getByRole('button', { name: '套用目前預覽', exact: true }).click();
  await btn('Prompt 工作台').click(); await btn('隨機生成').click(); await health('legacy card reload / restore / regenerate');
  await btn('角色建模').click(); await btn('下一頁').click(); await btn('上一頁').click();
  await btn('匯回 PAGE1').click(); await btn('Prompt 工作台').click();
  await btn('隨機生成').click(); assert.equal((await values()).length, 6); checks.push('character card apply to PAGE1');
  await btn('觀察式抓拍').click(); await btn('重抽隨機項目').last().click(); await health('observation capture generation');
  await btn('一般拍攝').click(); await btn('隨機生成').click();
  await btn('場景建模').click();
  await page.locator('.location-mode-field select').selectOption('tokyo-shibuya-scramble-crossing');
  await health('scene field and outputs');
  await btn('Prompt 工作台').click(); await page.getByRole('button', { name: /^D 場景環境/ }).click();
  await page.getByRole('button', { name: '場景建模匯入', exact: true }).click();
  await btn('套用 PAGE3 空景架構').click(); await btn('隨機生成').click();
  assert.ok((await values())[0].includes('Shibuya')); checks.push('scene architecture applied to PAGE1');
  await btn('加入最愛').click();
  await btn('Saved Cards').click(); await health('saved new prompt');
  const beforeImport = await page.locator('.prompt-card').count();
  const zip = new JSZip(); zip.file('prompt_catalog-markdown-import.md', corpus.savedPayloads.markdown);
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  await btn('Import').click();
  await page.locator('input[type=file]').setInputFiles({ name: 'catalog-baseline.zip', mimeType: 'application/zip', buffer });
  await page.waitForFunction(count => document.querySelectorAll('.prompt-card').length === count + 1, beforeImport);
  await health('fixed historical Markdown ZIP import creates one new card');
  assert.equal(await page.locator('.prompt-card').count(), beforeImport + 1);
  await btn('Prompt 工作台').click();
  for (const [width, height] of [[1440, 1000], [390, 900]]) {
    await page.setViewportSize({ width, height });
    await btn('Prompt 工作台').click(); await btn('自訂附加').waitFor();
    if (await btn('自訂附加').getAttribute('aria-pressed') !== 'true') await btn('自訂附加').click();
    await page.getByRole('textbox', { name: '自訂攝影備註' }).fill('Soft light.\n保留場景。');
    await btn('四張多機位').click();
    const shown = await values(); assert.equal(shown.length, 6);
    const cards = page.locator('.prompt-preview-card').filter({ has: page.locator('.prompt-preview-textarea') });
    for (let i = 0; i < shown.length; i++) {
      await cards.nth(i).getByRole('button').click();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), shown[i]);
    }
    checks.push(`${width}: all six previews equal clipboard with appendices`);
    await btn('開啟完整版').click(); await page.locator('#dll-full-prompt').waitFor();
    if (await btn('帶入Prompt 工作台來源').isVisible()) {
      page.once('dialog', dialog => dialog.accept()); await btn('帶入Prompt 工作台來源').click();
    }
    const sources = page.locator('.dll-source-choices button');
    for (let i = 0; i < shown.length; i++) { await sources.nth(i).click(); assert.equal(await page.locator('#dll-full-prompt').inputValue(), shown[i]); }
    const draft = (await dllState()).draft;
    await page.reload(); await btn('DLL_PIC Pro').click(); await page.locator('#dll-full-prompt').waitFor();
    assert.deepEqual((await dllState()).draft.sources, draft.sources);
    checks.push(`${width}: explicit DLL transfer and isolated draft reload`);
    for (const [index, workspace] of ['Prompt 工作台', '角色建模', '場景建模', 'DLL_PIC Pro', 'Saved Cards'].entries()) {
      await btn(workspace).click(); await health(`${width}: ${workspace}`); await page.evaluate(() => window.scrollTo(0, 0));
      const file = `${width}-${index + 1}.png`; await page.screenshot({ path: `${out}/${file}`, fullPage: true }); screenshots.push(file);
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  await writeFile(`${out}/results.json`, JSON.stringify({ url, viewports: [[1440, 1000], [390, 900]], checks, errors, externalPosts, screenshots }, null, 2));
  console.log(JSON.stringify({ passed: checks.length, errors, externalPosts }));
} catch (error) {
  await page.screenshot({ path: `${out}/failure.png` });
  await writeFile(`${out}/failure.json`, JSON.stringify({ checks, errors, externalPosts, error: error.message, visibleText: (await page.locator('body').innerText()).slice(-7000) }, null, 2));
  console.error(error); process.exitCode = 1;
} finally { await browser.close(); }
