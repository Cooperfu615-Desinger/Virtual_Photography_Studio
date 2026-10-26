// Isolated local UI: generated text, clipboard, saved restore and card capture; no provider calls.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createEmptyLocks, getLockControls } from '../webapp/src/lib/engine.js';
import { readJson } from './lib/catalogBaseline.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.argv[2] || '/tmp/a1-browser'); await mkdir(out, { recursive: true });
const report = readJson(resolve(process.argv[3] || 'Docs/reports/character-adult-identity-a1-2026-10-26/baseline-and-saved.json.gz'));
const oldCard = report.saved.find(x => x.id === 'character-rika').raw;
const controls = getLockControls(), full = controls.find(c => c.key === 'framingId').options.find(x => x.zh.startsWith('全身鏡頭')).id;
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
    const health = async label => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, label);
      assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && !e.naturalWidth)), false, label);
      checks.push(width + ': ' + label);
    };
    const screenshot = async label => { const file = `${width}-${label}.png`; await page.screenshot({ path: join(out, file), fullPage: true }); screenshots.push(file); };
    await context.addInitScript(raw => {
      if (!localStorage.getItem('a1-seeded')) { localStorage.setItem('vps.favorites', JSON.stringify([raw])); localStorage.setItem('a1-seeded', 'true'); }
    }, oldCard);
    await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1'); await btn('自訂附加').waitFor();
    await btn('Saved Cards').click(); await page.locator('.prompt-card').first().waitFor();
    const oldText = await page.evaluate(async () => {
      const { deserializeFavoritePrompt } = await import('/Virtual_Photography_Studio/src/features/saved-cards/cardCodec.js');
      return deserializeFavoritePrompt(JSON.parse(localStorage.getItem('vps.favorites'))[0]).grokPrompt;
    });
    assert.equal(oldText.includes('20-year-old adult'), false);
    await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click();
    await btn('Prompt 工作台').click(); await btn('隨機生成').click();
    await page.waitForFunction(() => document.querySelector('.prompt-preview-textarea')?.value.includes('20-year-old adult'));
    await health('old stored GPT retained; apply and regenerate restores adult source');
    for (const id of ['character-rika', 'character-eleanor']) {
      const locks = { ...createEmptyLocks(), characterProfileId: id, framingId: full };
      await page.evaluate(locks => localStorage.setItem('vps.locks', JSON.stringify(locks)), locks);
      await page.reload(); await btn('自訂附加').waitFor(); await btn('隨機生成').click(); await page.waitForTimeout(250);
      const texts = await values(); assert.equal(texts.length, 6);
      const identity = id === 'character-eleanor' ? 'A 20-year-old adult demonic woman.' : 'A 20-year-old adult East Asian woman.';
      for (const i of [0, 4, 5]) assert.equal(texts[i].split(identity).length - 1, 1);
      const cards = page.locator('.prompt-preview-card').filter({ has: page.locator('.prompt-preview-textarea') });
      for (let i = 0; i < texts.length; i++) { await cards.nth(i).getByRole('button').click(); assert.equal(await page.evaluate(() => navigator.clipboard.readText()), texts[i]); }
      await health(id + ': three GPT identities once; all six clipboards equal previews');
      await cards.first().scrollIntoViewIfNeeded(); await screenshot(id);
      await btn('加入最愛').click(); await page.reload(); await btn('Saved Cards').click(); await page.locator('.prompt-card').first().waitFor();
      await page.locator('.prompt-card').first().getByRole('button', { name: '套用目前預覽', exact: true }).click(); await btn('Prompt 工作台').click();
      assert.deepEqual(await values(), texts); await health(id + ': saved/reloaded/applied six texts unchanged');
      await btn('隨機生成').click(); await btn('觀察式抓拍').click(); await btn('重抽隨機項目').last().click();
      await page.waitForTimeout(250); const captureTexts = await values();
      for (const i of [0, 4, 5]) assert.equal(captureTexts[i].split(identity).length - 1, 1);
      await health(id + ': card capture reroll preserves adult identity');
      if (id === 'character-eleanor') await screenshot('capture');
      await btn('一般拍攝').click();
    }
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  await writeFile(join(out, 'results.json'), JSON.stringify({ viewports: [[1440, 1000], [390, 900]], checks, screenshots, errors, externalPosts }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: checks.length, screenshots: screenshots.length, errors, externalPosts }));
} catch (error) { await writeFile(join(out, 'failure.json'), JSON.stringify({ error: error.message, stack: error.stack, checks, errors, externalPosts }, null, 2)); throw error; }
finally { await browser.close(); }
