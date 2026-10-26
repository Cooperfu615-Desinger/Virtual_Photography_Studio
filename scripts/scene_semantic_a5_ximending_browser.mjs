// Actual local UI acceptance in isolated browser storage; no provider submissions.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson } from './lib/catalogBaseline.mjs';
import { getLockControls, getSceneDependentOptions } from '../webapp/src/lib/engine.js';
import { naturalFixtureLocks, CRT_MIDJOURNEY_SELECTIONS } from '../webapp/src/lib/engine/midjourneyNaturalFixtures.js';
import { prepareImmutableRuntimeLibrary } from '../webapp/src/lib/engine/runtimeCache.js';
import { A5_XIMENDING_REVIEW as r, preXimendingDatabase, withPreXimendingReplayRoot } from './lib/a5XimendingHistoricalReplay.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.argv[2] || '/tmp/vps-ximending-browser'); await mkdir(out, { recursive: true });
const report = readJson(resolve(process.argv[3] || 'Docs/reports/scene-semantic-a5-ximending-2026-10-26/acceptance.json.gz'));
const oldCard = report.savedCards[0].raw;
const expectedStorage = await withPreXimendingReplayRoot(async directory => {
  const c = await import(pathToFileURL(join(directory, 'webapp/src/features/saved-cards/cardCodec.js')).href);
  return c.serializeFavoritePrompt(c.deserializeFavoritePrompt(oldCard));
});
const previous = prepareImmutableRuntimeLibrary(preXimendingDatabase()), controls = getLockControls();
const id = (k, zh) => controls.find(x => x.key === k).options.find(x => x.zh === zh).id;
const browser = await chromium.launch({ headless: true }), checks = [], errors = [], externalPosts = [], screenshots = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message)); page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    await context.route('**/*', async route => {
      if (route.request().method() === 'POST' && !route.request().url().startsWith('http://127.0.0.1:')) { externalPosts.push(route.request().url()); await route.abort(); }
      else await route.continue();
    });
    const btn = name => page.getByRole('button', { name, exact: true });
    const values = () => page.locator('.prompt-preview-textarea').evaluateAll(es => es.map(e => e.value));
    const choose = async (locator, value) => {
      await locator.evaluate((el, value) => {
        if (el.disabled) throw Error('disabled select'); const option = [...el.options].find(x => x.value === value);
        if (!option || option.disabled) throw Error('unavailable option');
        el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value); assert.equal(await locator.inputValue(), value);
    };
    const health = async label => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, label);
      assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && !e.naturalWidth)), false, label);
      checks.push(width + ': ' + label);
    };
    const openD = async () => { await btn('Prompt 工作台').click(); if (!await page.locator('.scene-location-trigger').isVisible()) await page.getByRole('button', { name: /^D 場景環境/ }).click(); };
    const captureProfile = () => page.evaluate(() => JSON.parse(localStorage.getItem('vps.locks')).observationCapture);
    await context.addInitScript(raw => {
      if (!localStorage.getItem('ximending-old-card-seeded')) {
        localStorage.setItem('vps.favorites', JSON.stringify([raw])); localStorage.setItem('ximending-old-card-seeded', 'true');
      }
    }, oldCard);
    await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1'); await btn('自訂附加').waitFor();
    await btn('Saved Cards').click(); await page.locator('.prompt-card').first().waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('vps.favorites'))[0]), expectedStorage);
    await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click(); await openD();
    await health('old JSON card retains source text and baseline codec normalization');
    for (const crop of ['全身鏡頭 (Full Body Shot)', '牛仔中景 (Cowboy Shot)', '胸上特寫']) {
      const locks = naturalFixtureLocks({ ...CRT_MIDJOURNEY_SELECTIONS, locationId: r.id, sceneAttributeId: 'outdoor', framingId: { byZh: crop }, lightingId: { byZh: '全無' }, lightDirectionId: { byZh: '全無' } });
      await page.evaluate(locks => localStorage.setItem('vps.locks', JSON.stringify(locks)), locks);
      await page.reload(); await btn('自訂附加').waitFor(); await openD();
      await page.locator('.scene-location-trigger').click(); await page.getByRole('searchbox', { name: '搜尋場景' }).fill(r.source.zh);
      await page.locator('[data-scene-location-option]').filter({ hasText: r.source.zh }).click();
      const ambient = page.getByRole('combobox', { name: '環境光條件', exact: true });
      const subject = page.getByRole('combobox', { name: '光線表現', exact: true });
      const expected = getSceneDependentOptions(previous, locks);
      assert.deepEqual(await ambient.locator('option').evaluateAll(es => es.map(e => e.value).filter(Boolean)), expected.lightingOptions.map(x => x.id));
      assert.deepEqual(await subject.locator('option').evaluateAll(es => es.map(e => e.value).filter(Boolean)), expected.lightDirectionOptions.map(x => x.id));
      assert.ok((await page.locator('.scene-location-trigger').getAttribute('aria-label')).includes('西門町'));
      await btn('隨機生成').click(); await page.waitForTimeout(300);
      const text = await values(); assert.equal(text.length, 6); assert.ok(text.every(Boolean)); assert.match(text[0], /Ximending/);
      await health(crop + ': scene picker, original ordered ambient/subject pools and six outputs');
      await btn('加入最愛').click(); await page.waitForFunction(() => JSON.parse(localStorage.getItem('vps.favorites') || '[]').length > 1);
      await page.reload(); await btn('Saved Cards').click();
      await page.locator('.prompt-card').filter({ hasText: '西門町' }).first().getByRole('button', { name: '套用目前預覽', exact: true }).click();
      await openD(); assert.equal(await ambient.inputValue(), id('lightingId', '全無')); await health(crop + ': saved, reloaded and applied');
      await choose(ambient, ''); await choose(subject, ''); await btn('隨機生成').click(); await page.waitForTimeout(250);
      assert.equal((await values()).length, 6); await health(crop + ': randomized ambient and subject light');
      if (crop === '全身鏡頭 (Full Body Shot)') {
        await page.locator('.scene-editor').scrollIntoViewIfNeeded(); const file = width + '-ximending-scene.png';
        await page.screenshot({ path: join(out, file), fullPage: true }); screenshots.push(file);
      }
    }
    await page.getByRole('button', { name: /^B 神情姿態/ }).click(); await page.getByRole('button', { name: /^站姿/ }).click();
    await page.getByRole('button', { name: /自然站姿/ }).first().click(); await btn('隨機生成').click(); await page.waitForTimeout(250);
    assert.match((await values())[0], /She stands in a relaxed neutral posture/); await health('integrated natural standing with Ximending');
    assert.equal(await btn('觀察式抓拍').isDisabled(), true);
    await page.getByRole('button', { name: /^E 攝影成像/ }).click();
    await page.locator('[data-photography-field="framingId"]').getByTitle('全身鏡頭 (Full Body Shot)', { exact: true }).click();
    await btn('隨機生成').click(); await page.waitForTimeout(250);
    assert.equal(await btn('觀察式抓拍').isEnabled(), true);
    await health('chest crop correctly disables capture; selecting full body enables it');
    const reference = (await values())[5];
    await btn('觀察式抓拍').click(); await choose(page.getByRole('combobox', { name: '人物來源', exact: true }), 'full-body');
    await page.waitForFunction(() => Boolean(JSON.parse(localStorage.getItem('vps.locks')).observationCapture?.importedPerson));
    const snapshot = (await captureProfile()).importedPerson; assert.equal(snapshot.fullBodyPrompt, reference);
    for (let i = 0; i < 3; i++) { await btn('重抽隨機項目').last().click(); assert.deepEqual((await captureProfile()).importedPerson, snapshot); }
    await health('full-body import and three capture rerolls retain person/wardrobe');
    await btn('回一般拍攝調整').click(); await btn('隨機生成').click(); await page.waitForTimeout(250);
    const replacement = (await values())[5]; await btn('觀察式抓拍').click();
    assert.deepEqual((await captureProfile()).importedPerson, snapshot);
    await btn('重新匯入').click(); assert.equal((await captureProfile()).importedPerson.fullBodyPrompt, replacement);
    await health('new candidate retains imported person until explicit reimport');
    const file = width + '-ximending-capture.png'; await page.screenshot({ path: join(out, file), fullPage: true }); screenshots.push(file);
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  await writeFile(join(out, 'results.json'), JSON.stringify({ viewports: [[1440, 1000], [390, 900]], checks, errors, externalPosts, screenshots }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: checks.length, screenshots: screenshots.length, errors, externalPosts }));
} finally { await browser.close(); }
