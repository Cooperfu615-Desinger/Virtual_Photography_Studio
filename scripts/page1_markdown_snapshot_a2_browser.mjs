// Exercise real downloads/imports in isolated storage, with all provider POSTs blocked.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { resolve, join } from 'node:path';
import { createEmptyLocks, getLockControls, generatePrompts, createSeededRandom } from '../webapp/src/lib/engine.js';
import { buildMarkdownExport, parseExportedMarkdownPrompt, deserializeFavoritePrompt, serializeFavoritePrompt } from '../webapp/src/features/saved-cards/cardCodec.js';
import JSZip from '../webapp/node_modules/jszip/lib/index.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = resolve(process.argv[2] || '/tmp/a2-markdown-browser'); mkdirSync(out, { recursive: true });
const controls = getLockControls(), opt = (key, term) => controls.find(c => c.key === key).options.find(o => o.zh.includes(term));
const empty = createEmptyLocks(); for (const c of controls) { const n = c.options.find(o => o.zh === '全無' || o.id === 'none'); if (n) empty[c.key] = n.id; }
const make = (summary, locks) => ({ ...generatePrompts(1, { ...empty, subjectCount: '1', ...locks }, [], { random: createSeededRandom(summary) })[0], id: summary, summary });
const standard = make('A2 snapshot single', { topId: opt('topId', '棉質細肩背心').id, pantsId: opt('pantsId', '牛仔').id, topBottomPaletteId: 'white-black', framingId: opt('framingId', '特寫鏡頭').id });
const duo = make('A2 snapshot duo', { subjectCount: '2', outfitPresetAId: opt('outfitPresetAId', '粉紅哥德').id, outfitPresetBId: opt('outfitPresetBId', '鏈條緞面').id, outfitPresetAPrimaryColorId: 'light-blue', outfitPresetAContrastColorId: 'white', outfitPresetBPrimaryColorId: 'red', outfitPresetBContrastColorId: 'black' });
const archived = JSON.parse(gunzipSync(readFileSync('Docs/reports/wardrobe-control-a2-outfits-2026-10-27/acceptance/baseline-and-saved.json.gz')));
const capture = make('A2 snapshot capture', archived.saved[0].oldCaptureLocks);
const browser = await chromium.launch({ headless: true });
const checks = [], screenshots = [], errors = [], externalPosts = [];
try {
  for (const [width, height] of [[1440, 1000], [390, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, permissions: ['clipboard-read', 'clipboard-write'] });
    await context.addInitScript(cards => { if (!localStorage.getItem('a2-snapshot-seed')) { localStorage.setItem('vps.favorites', JSON.stringify(cards)); localStorage.setItem('a2-snapshot-seed', '1'); } }, [standard, duo, capture].map(serializeFavoritePrompt));
    await context.route('**/*', async route => { if (route.request().method() === 'POST' && !route.request().url().startsWith('http://127.0.0.1:')) { externalPosts.push(route.request().url()); await route.abort(); } else await route.continue(); });
    const page = await context.newPage(); page.setDefaultTimeout(25000);
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const button = name => page.getByRole('button', { name, exact: true });
    const card = summary => page.locator('.prompt-card').filter({ hasText: summary });
    const health = async label => { await page.getByText('載入工作區…', { exact: true }).waitFor({ state: 'hidden' }); await page.evaluate(() => document.fonts.ready); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, label); assert.equal(await page.locator('img').evaluateAll(es => es.some(e => e.complete && !e.naturalWidth)), false, label); checks.push(width + ': ' + label); };
    const shot = async name => { const y = await page.evaluate(() => window.scrollY); for (const img of await page.locator('img:visible').all()) { await img.scrollIntoViewIfNeeded(); await img.evaluate(el => el.decode()); } await page.evaluate(y => window.scrollTo(0, y), y); const file = width + '-' + name + '.png'; await page.screenshot({ path: join(out, file), fullPage: true }); screenshots.push(file); };
    const saved = async () => (await page.evaluate(() => JSON.parse(localStorage.getItem('vps.favorites')))).map(deserializeFavoritePrompt);
    await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1'); await button('自訂附加').waitFor();
    await button('Saved Cards').click(); await card(standard.summary).waitFor();
    const archivePending = page.waitForEvent('download'); await button('Download').click();
    const exportedArchive = await JSZip.loadAsync(readFileSync(await (await archivePending).path()));
    const originalCards = await saved();
    for (const file of Object.values(exportedArchive.files).filter(file => file.name.endsWith('.md'))) {
      const parsed = parseExportedMarkdownPrompt(await file.async('string'), controls, 'zip-download');
      const original = originalCards.find(p => p.summary === parsed.summary);
      assert.ok(original); assert.deepEqual(parsed.selection, original.selection); assert.deepEqual(parsed.extraPrompts, original.extraPrompts);
    }
    await health('actual ZIP download preserves all selections and derived outputs');

    for (const original of [standard, duo, capture]) {
      const stored = (await saved()).find(p => p.summary === original.summary);
      const pending = page.waitForEvent('download'); await card(original.summary).getByTitle('Download Markdown', { exact: true }).click();
      const download = await pending, md = readFileSync(await download.path(), 'utf8');
      assert.equal(md.split('\n')[0], buildMarkdownExport(stored).split('\n')[0]);
      const imported = parseExportedMarkdownPrompt(md, controls, 'browser-single');
      assert.deepEqual(imported.selection, stored.selection); assert.deepEqual(imported.extraPrompts, stored.extraPrompts);
      const zip = new JSZip(); zip.file('prompt_download-' + original.id + '.md', md.replace('**Summary:** ' + original.summary, '**Summary:** imported ' + original.summary));
      await page.locator('input[type=file]').setInputFiles({ name: 'single-download.zip', mimeType: 'application/zip', buffer: await zip.generateAsync({ type: 'nodebuffer' }) });
      const importedCard = card('imported ' + original.summary); await importedCard.waitFor();
      for (const [label, text] of [['Gpt', stored.grokPrompt], ...stored.extraPrompts.map(e => [e.label, e.text])]) {
        await importedCard.getByRole('button', { name: label, exact: true }).click(); assert.equal(await page.evaluate(() => navigator.clipboard.readText()), text);
      }
      await health(original.summary + ' single download / ZIP import / original output copy');
      await importedCard.getByRole('button', { name: '套用目前預覽', exact: true }).click(); await button('Prompt 工作台').click();
      const locks = await page.evaluate(() => JSON.parse(localStorage.getItem('vps.locks')));
      if (original === standard) assert.equal(locks.topBottomPaletteId, 'white-black');
      if (original === duo) for (const key of ['outfitPresetAPrimaryColorId', 'outfitPresetAContrastColorId', 'outfitPresetBPrimaryColorId', 'outfitPresetBContrastColorId']) assert.equal(locks[key], stored.selection[key]);
      if (original === capture) assert.deepEqual(locks.observationCapture, stored.selection.observationCapture);
      await health(original.summary + ' apply'); await shot(original.id.replaceAll(' ', '-'));
      await button(original === capture ? '重抽隨機項目' : '隨機生成').last().click(); await button('加入最愛').click(); await page.reload(); await button('自訂附加').waitFor();
      if (original === standard) assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('vps.locks')).topBottomPaletteId), 'white-black');
      await button('Saved Cards').click(); await importedCard.waitFor();
      const after = (await saved()).find(p => p.summary === 'imported ' + original.summary); assert.deepEqual(after.extraPrompts, stored.extraPrompts); assert.equal(after.grokPrompt, stored.grokPrompt);
      await health(original.summary + ' generate / save / reload retains imported original');
    }
    const before = JSON.stringify(await saved()); const bad = new JSZip(); bad.file('a-valid.md', buildMarkdownExport(standard)); bad.file('z-bad.md', buildMarkdownExport(standard).replace('"version":1', '"version":999'));
    await page.locator('input[type=file]').setInputFiles({ name: 'bad.zip', mimeType: 'application/zip', buffer: await bad.generateAsync({ type: 'nodebuffer' }) });
    await page.getByText('ZIP 格式錯誤，無法匯入 Favorites', { exact: true }).waitFor(); assert.equal(JSON.stringify(await saved()), before); await health('invalid metadata rejects entire import without changing favorites'); await shot('invalid');
    for (const [i, name] of ['Prompt 工作台', '角色建模', '場景建模', 'DLL_PIC Pro', 'DLL_VIDEO Pro', 'Saved Cards'].entries()) { await button(name).click(); await health(name); await shot('workspace-' + i); }
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalPosts, []);
  writeFileSync(join(out, 'results.json'), JSON.stringify({ checks, screenshots, errors, externalPosts }, null, 2) + '\n');
  console.log(JSON.stringify({ checks: checks.length, screenshots: screenshots.length, errors, externalPosts }));
} catch (error) { writeFileSync(join(out, 'failure.json'), JSON.stringify({ error: error.message, stack: error.stack, checks, errors }, null, 2)); throw error; }
finally { await browser.close(); }
