// Local browser acceptance for the fifteen reviewed scenes; no external generation.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createEmptyLocks, getLockControls, getSceneDependentOptions } from '../webapp/src/lib/engine.js';
import { prepareImmutableRuntimeLibrary } from '../webapp/src/lib/engine/runtimeCache.js';
import { A5_COMMERCIAL_REVIEW as review, preCommercialDatabase } from './lib/a5CommercialHistoricalReplay.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.argv[2] || '/tmp/vps-commercial-browser'); await mkdir(out, { recursive: true });
const controls = getLockControls(), previous = prepareImmutableRuntimeLibrary(preCommercialDatabase());
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const full = option('framingId', '全身鏡頭 (Full Body Shot)'), none = option('lightingId', '全無');
const expected = Object.fromEntries(review.entries.map(row => [row.id, getSceneDependentOptions(previous, { ...createEmptyLocks(), subjectCount: '1', framingId: full, locationId: row.id, sceneAttributeId: row.afterTags.includes('indoor') ? 'indoor' : 'outdoor', lightingId: none }).lightingOptions.map(x => x.id)]));
const browser = await chromium.launch({ headless: true }), context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] }), page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [], externalPosts = [], checks = [], screenshots = [];
page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
await context.route('**/*', async route => { if (route.request().method() === 'POST' && !route.request().url().startsWith('http://127.0.0.1:')) { externalPosts.push(route.request().url()); await route.abort(); } else await route.continue(); });
const btn = name => page.getByRole('button', { name, exact: true });
const values = () => page.locator('.prompt-preview-textarea').evaluateAll(es => es.map(e => e.value));
async function choose(locator, value) {
  await locator.evaluate((el, value) => {
    if (el.disabled) throw Error('disabled select'); const option = [...el.options].find(o => o.value === value);
    if (!option || option.disabled) throw Error('missing/disabled option');
    el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  assert.equal(await locator.inputValue(), value);
}
async function openD() { await btn('Prompt 工作台').click(); if (!await page.locator('.scene-location-trigger').isVisible()) await page.getByRole('button', { name: /^D 場景環境/ }).click(); }
async function health(label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, label + '/overflow');
  assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && !e.naturalWidth)), false, label + '/images');
  checks.push(label);
}
try {
  await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1'); await btn('自訂附加').waitFor();
  for (const [width, height] of [[1440, 1000], [390, 900]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(async () => {
      const e = await import('/Virtual_Photography_Studio/src/lib/engine.js'), c = e.getLockControls(), locks = { ...e.createEmptyLocks(), subjectCount: '1', specifiedActionId: 'none', framingId: c.find(x => x.key === 'framingId').options.find(x => x.zh === '全身鏡頭 (Full Body Shot)').id };
      for (const control of c) { if (control.key === 'framingId') continue; const none = control.options.find(x => x.zh === '全無'); if (none) locks[control.key] = none.id; }
      localStorage.setItem('vps.locks', JSON.stringify(locks));
    });
    await page.reload(); await btn('自訂附加').waitFor(); await openD();
    for (const [index, row] of review.entries.entries()) {
      await choose(page.getByRole('combobox', { name: '場景屬性', exact: true }), row.afterTags.includes('indoor') ? 'indoor' : 'outdoor');
      await page.locator('.scene-location-trigger').click(); await page.getByRole('searchbox', { name: '搜尋場景' }).fill(row.zh);
      await page.locator('[data-scene-location-option]').filter({ hasText: row.zh }).click();
      const light = page.getByRole('combobox', { name: '環境光條件', exact: true });
      assert.deepEqual(await light.locator('option').evaluateAll(es => es.map(e => e.value).filter(Boolean)), expected[row.id], row.zh + '/ordered ambient IDs');
      await choose(light, none); await btn('隨機生成').click(); await page.waitForTimeout(400);
      const outputs = await values(); assert.equal(outputs.length, 6); assert.ok(outputs.every(Boolean));
      await health(width + '/' + row.zh + ': selected scene, ordered candidates and six outputs');
      await btn('加入最愛').click();
      await page.waitForFunction(label => JSON.parse(localStorage.getItem('vps.favorites') || '[]').some(x => x.s?.includes(label)), row.zh);
      await btn('Saved Cards').click();
      const stored = await page.evaluate(async id => { const codec = await import('/Virtual_Photography_Studio/src/features/saved-cards/cardCodec.js'); return JSON.parse(localStorage.getItem('vps.favorites')).map(codec.deserializeFavoritePrompt).find(p => p.selection.locationId === id); }, row.id);
      assert.equal(stored.selection.locationId, row.id); assert.equal(stored.selection.lightingId, none);
      await page.reload(); await btn('Saved Cards').click();
      await page.locator('.prompt-card').filter({ hasText: row.zh }).first().getByRole('button', { name: '套用目前預覽', exact: true }).click(); await openD();
      assert.ok((await page.locator('.scene-location-trigger').getAttribute('aria-label')).includes(row.zh)); assert.equal(await light.inputValue(), none);
      await health(width + '/' + row.zh + ': Saved Cards persisted, reloaded and applied');
      await choose(light, ''); await btn('隨機生成').click(); await page.waitForTimeout(400); assert.equal((await values()).length, 6);
      await health(width + '/' + row.zh + ': random ambient');
      if ([0, 5, 8, 14].includes(index)) { await page.locator('.scene-editor').scrollIntoViewIfNeeded(); const file = width + '-' + index + '.png'; await page.screenshot({ path: out + '/' + file, fullPage: true }); screenshots.push(file); }
    }
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  await writeFile(out + '/results.json', JSON.stringify({ url: page.url(), viewports: [[1440,1000],[390,900]], reviewed: review.entries.map(x => ({ id: x.id, decision: x.decision })), checks, errors, externalPosts, screenshots }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: checks.length, errors, externalPosts, screenshots: screenshots.length }));
} finally { await browser.close(); }
