// Isolated local A2 acceptance. Never submits provider requests or touches user storage.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { readJson } from './lib/catalogBaseline.mjs';
import { A2_REVIEW } from './lib/a2DressControlHistoricalReplay.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.argv[2] || '/tmp/a2-browser'); await mkdir(out, { recursive: true });
const report = readJson(resolve(process.argv[3] || 'Docs/reports/wardrobe-control-a2-dresses-2026-10-26/baseline-and-saved.json.gz'));
const old = report.saved[0];
const subjects = [A2_REVIEW.rows[0], A2_REVIEW.rows.find(x => x.before.zh.includes('哥德')), A2_REVIEW.rows.find(x => /latex/.test(x.before.en))];
assert.ok(subjects.every(Boolean));
const leak = /controlled by dress color selection|contrast trim controlled by contrast palette/i;
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [], externalPosts = [], screenshots = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await context.route('**/*', async route => {
      if (route.request().method() === 'POST' && !route.request().url().startsWith('http://127.0.0.1:')) { externalPosts.push(route.request().url()); await route.abort(); }
      else await route.continue();
    });
    const btn = name => page.getByRole('button', { name, exact: true });
    const values = () => page.locator('.prompt-preview-textarea').evaluateAll(es => es.map(e => e.value));
    const locks = () => page.evaluate(() => JSON.parse(localStorage.getItem('vps.locks')));
    const health = async label => {
      await page.getByText('載入工作區…', { exact: true }).waitFor({ state: 'hidden' });
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, label);
      assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && !e.naturalWidth)), false, label);
      checks.push(width + ': ' + label);
    };
    const shot = async label => { const file = width + '-' + label + '.png'; await page.screenshot({ path: join(out, file), fullPage: true }); screenshots.push(file); };
    await context.addInitScript(raw => {
      if (!localStorage.getItem('a2-seeded')) { localStorage.setItem('vps.favorites', JSON.stringify([raw])); localStorage.setItem('a2-seeded', 'true'); }
    }, old.raw);
    await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1'); await btn('自訂附加').waitFor();
    await btn('Saved Cards').click(); await page.locator('.prompt-card').first().waitFor();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vps.favorites'))[0]);
    for (const [key, value] of Object.entries(old.raw)) {
      if (key !== 'l') assert.deepEqual(stored[key], value, 'old stored field: ' + key);
    }
    for (const [key, value] of Object.entries(old.raw.l)) assert.deepEqual(stored.l[key], value, 'old lock: ' + key);
    for (const [key, value] of Object.entries(stored.l)) if (!(key in old.raw.l)) assert.match(value, /(?:^none$|:none$|:\u5168\u7121:0$)/, 'existing empty-lock normalization: ' + key);
    await page.locator('.prompt-card').first().getByRole('button', { name: 'Gpt', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), old.raw.g);
    assert.match(old.raw.g, leak);
    await health('old saved prompt copied verbatim');
    await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click();
    await btn('Prompt 工作台').click();
    for (const text of await values()) assert.doesNotMatch(text, leak);
    await btn('隨機生成').click();
    await page.waitForFunction(() => !/controlled by dress color selection/i.test(document.querySelector('.prompt-preview-textarea')?.value || ''));
    for (const text of await values()) assert.doesNotMatch(text, leak);
    assert.equal((await locks()).dressId, old.id);
    await health('apply old ID and regenerate uses clean source');
    for (const [i, row] of subjects.entries()) {
      const input = { ...report.baseline.find(x => x.id === row.id).locks, outfitPresetId: 'wardrobe:\u5957\u88dd-outfit-presets:\u5168\u7121:0', dressId: row.id, dressColorId: i === 2 ? 'mirror-chrome-silver' : i ? 'light-blue' : 'none', outfitPresetPrimaryColorId: i === 2 ? 'mirror-chrome-silver' : i ? 'light-blue' : 'none' };
      await page.evaluate(input => localStorage.setItem('vps.locks', JSON.stringify(input)), input);
      await page.reload(); await btn('自訂附加').waitFor(); await btn('隨機生成').click(); await page.waitForTimeout(250);
      const texts = await values(); assert.equal(texts.length, 6);
      for (const text of texts) assert.doesNotMatch(text, leak);
      assert.equal((await locks()).dressColorId, input.dressColorId);
      if (i) assert.ok(texts[0].includes(i === 2 ? 'mirror-chrome silver' : 'light blue'));
      assert.ok(texts[0].toLowerCase().includes(row.after.en.split(', ')[0].toLowerCase()), row.before.zh);
      const cards = page.locator('.prompt-preview-card').filter({ has: page.locator('.prompt-preview-textarea') });
      for (let n = 0; n < 6; n++) { await cards.nth(n).getByRole('button').click(); assert.equal(await page.evaluate(() => navigator.clipboard.readText()), texts[n]); }
      await health(row.before.zh + ': clean six outputs and exact clipboard');
      await cards.first().scrollIntoViewIfNeeded(); await shot('dress-' + i);
      await btn('加入最愛').click(); await page.reload(); await btn('Saved Cards').click(); await page.locator('.prompt-card').first().waitFor();
      await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click(); await btn('Prompt 工作台').click();
      assert.deepEqual(await values(), texts); await health(row.before.zh + ': save reload restore');
    }
    // A historical imported snapshot stays frozen through rerolls until an explicit reimport.
    await page.evaluate(input => localStorage.setItem('vps.locks', JSON.stringify(input)), old.oldCaptureLocks);
    await page.reload(); await btn('Prompt 工作台').click(); await page.locator('.capture-person-summary').waitFor();
    await btn('重抽隨機項目').first().click();
    const imported = (await locks()).observationCapture.importedPerson;
    assert.deepEqual(imported, old.oldCaptureLocks.observationCapture.importedPerson);
    assert.match(imported.fullBodyPrompt, leak);
    for (let i = 0; i < 2; i++) { await btn('重抽隨機項目').first().click(); assert.deepEqual((await locks()).observationCapture.importedPerson, imported); }
    assert.ok((await values()).includes(imported.fullBodyPrompt));
    await health('old capture snapshot and reference preserved across rerolls');
    await btn('回一般拍攝調整').click(); await btn('隨機生成').click(); await btn('觀察式抓拍').click();
    assert.deepEqual((await locks()).observationCapture.importedPerson, imported);
    await btn('重新匯入').focus(); await page.keyboard.press('Enter');
    const fresh = (await locks()).observationCapture.importedPerson;
    assert.doesNotMatch(fresh.fullBodyPrompt, leak); assert.notEqual(fresh.fullBodyPrompt, imported.fullBodyPrompt);
    await btn('重抽隨機項目').first().click(); assert.deepEqual((await locks()).observationCapture.importedPerson, fresh);
    const six = await values(); assert.equal(six.length, 6);
    for (const text of six) assert.doesNotMatch(text, leak);
    assert.ok(six.includes(fresh.fullBodyPrompt));
    await health('explicit keyboard reimport uses new clean source; reroll retains it'); await shot('capture-reimport');
    await btn('加入最愛').click(); await page.reload(); await btn('Saved Cards').click(); await page.locator('.prompt-card').first().waitFor();
    await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click(); await btn('Prompt 工作台').click();
    assert.deepEqual((await locks()).observationCapture.importedPerson, fresh); assert.deepEqual(await values(), six);
    await health('new capture save reload and restore preserve full state');
    await btn('DLL_VIDEO Pro').click(); await page.locator('.video-workspace').waitFor();
    await health('video workspace opens after capture restore'); await shot('video-integration');
    if (width === 390) await btn('生成設定').click();
    await page.getByRole('combobox', { name: '選擇模型', exact: true }).selectOption('seedance25');
    assert.equal(await page.getByRole('combobox', { name: '選擇模型', exact: true }).inputValue(), 'seedance25');
    await btn('Prompt 工作台').click();
    assert.deepEqual((await locks()).observationCapture.importedPerson, fresh); assert.deepEqual(await values(), six);
    await health('video model selection and return preserve prompt and capture state');
    for (const [index, workspace] of ['Prompt 工作台', '角色建模', '場景建模', 'DLL_PIC Pro', 'Saved Cards'].entries()) {
      await btn(workspace).click(); await page.locator('.workspace-loading').waitFor({ state: 'hidden' });
      for (const img of await page.locator('img').all()) await img.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      await health('workspace navigation: ' + workspace); await page.evaluate(() => window.scrollTo(0, 0));
      await shot('workspace-' + (index + 1));
    }


    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  await writeFile(join(out, 'results.json'), JSON.stringify({ viewports: [[1440, 1000], [390, 900]], checks, screenshots, errors, externalPosts }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: checks.length, screenshots: screenshots.length, errors, externalPosts }));
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) { await page.screenshot({ path: join(out, 'failure.png'), fullPage: true }); await writeFile(join(out, 'failure-body.txt'), await page.locator('body').innerText()); }
  await writeFile(join(out, 'failure.json'), JSON.stringify({ error: error.message, stack: error.stack, checks, errors, externalPosts }, null, 2)); throw error;
} finally { await browser.close(); }
