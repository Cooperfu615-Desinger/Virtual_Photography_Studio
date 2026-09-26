import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, getLockControls, normalizeLocks, generatePrompts, createSeededRandom } from './engine.js';
import { prepareAccessoryControl } from './engine/accessoryPolicy.js';
import { SECTION_SUBPANELS } from '../features/page1/page1Schema.js';
const controls = getLockControls();
const option = (key, zh) => { const item = controls.find((c) => c.key === key)?.options.find((o) => o.zh === zh); assert.ok(item, `${key}: ${zh}`); return item; };
test('separate catalogs preserve legacy IDs, color ownership and conflict normalization', () => {
  const audio = option('headphonesId', '耳罩式耳機（戴在頭上）');
  assert.ok(audio.id.startsWith('wardrobe:頭部配件-head-accessories:'));
  assert.ok(!controls.find((c) => c.key === 'headAccessoryId').options.some((o) => /耳機|口罩|防毒/.test(o.zh)));
  const migrated = normalizeLocks({ headAccessoryId: audio.id, headAccessoryColorId: 'red' });
  assert.equal(migrated.headphonesId, audio.id);
  assert.equal(migrated.headAccessoryColorId, 'none');
  const mask = option('faceCoveringId', '黑色口罩');
  const conflict = normalizeLocks({ faceCoveringId: mask.id, nosePiercingId: option('nosePiercingId', '鼻中隔細環').id });
  assert.equal(conflict.nosePiercingId, option('nosePiercingId', '全無').id);
  const ui = prepareAccessoryControl(controls.find((c) => c.key === 'headphonesId'), { headAccessoryId: option('headAccessoryId', '棒球帽').id });
  assert.ok(ui.options.find((o) => o.id === audio.id).disabled);
  assert.ok(!ui.options.find((o) => o.zh === '有線耳機').disabled);
});

test('headphone and face-covering colors are independent active swatch controls in the requested order', () => {
  const expected = ['headphonesId', 'headphonesColorId', 'faceCoveringId', 'faceCoveringColorId'];
  const controlsInPanel = SECTION_SUBPANELS.wardrobe.find((panel) => panel.id === 'accessories').keys;
  assert.deepEqual(controlsInPanel.slice(0, 4), expected);
  for (const key of ['headphonesColorId', 'faceCoveringColorId', 'headphonesAColorId', 'faceCoveringAColorId', 'headphonesBColorId', 'faceCoveringBColorId']) {
    const control = controls.find((entry) => entry.key === key);
    assert.ok(control, `${key} exists`);
    assert.equal(control.compatibilityOnly, undefined, `${key} is visible and active`);
    assert.ok(control.options.some((color) => color.zh === '紅色'), `${key} uses the garment color swatches`);
  }
});

test('selected headphone and face-covering colors reach prompt text and resolved selection', () => {
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '1',
    headphonesId: option('headphonesId', '耳罩式耳機（戴在頭上）').id,
    headphonesColorId: 'red',
    faceCoveringId: option('faceCoveringId', '黑色口罩').id,
    faceCoveringColorId: 'dark-blue',
  };
  const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('accessory-color-swatches') });
  const texts = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, ...prompt.extraPrompts.map((entry) => entry.text)];
  for (const text of texts) {
    assert.match(text, /red Marshall Major V on-ear headphones/i);
    assert.match(text, /dark blue disposable pleated face mask/i);
    assert.doesNotMatch(text, /black disposable pleated face mask/i);
  }
  assert.equal(prompt.selection.headphonesColorId, 'red');
  assert.equal(prompt.selection.faceCoveringColorId, 'dark-blue');
});

test('an explicit accessory color selects a matching accessory when its item is left random', () => {
  for (const [itemKey, colorKey] of [['headphonesId', 'headphonesColorId'], ['faceCoveringId', 'faceCoveringColorId']]) {
    const [prompt] = generatePrompts(1, {
      ...createEmptyLocks(),
      subjectCount: '1',
      [itemKey]: '',
      [colorKey]: 'red',
    }, [], { random: createSeededRandom(`accessory-color-only-${itemKey}`) });
    assert.ok(prompt.selection[itemKey] && !prompt.selection[itemKey].endsWith(':none'), `${itemKey} should resolve to an item`);
    assert.equal(prompt.selection[colorKey], 'red');
  }
});

test('duo accessories keep independently selected A/B colors', () => {
  const locks = {
    ...createEmptyLocks(),
    subjectCount: '2',
    headphonesAId: option('headphonesAId', '耳罩式耳機（戴在頭上）').id,
    headphonesAColorId: 'red',
    faceCoveringAId: option('faceCoveringAId', '黑色口罩').id,
    faceCoveringAColorId: 'dark-blue',
    headphonesBId: option('headphonesBId', '耳罩式耳機（掛在脖子上）').id,
    headphonesBColorId: 'white',
    faceCoveringBId: option('faceCoveringBId', '防毒面具（3M 6200）').id,
    faceCoveringBColorId: 'neon-green',
  };
  const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('duo-accessory-color-swatches') });
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt]) {
    assert.match(text, /red Marshall Major V on-ear headphones/i);
    assert.match(text, /dark blue disposable pleated face mask/i);
    assert.match(text, /white Marshall Major V on-ear headphones/i);
    assert.match(text, /neon green 3M 6200 reusable half-face respirator/i);
  }
  assert.equal(prompt.selection.headphonesAColorId, 'red');
  assert.equal(prompt.selection.faceCoveringAColorId, 'dark-blue');
  assert.equal(prompt.selection.headphonesBColorId, 'white');
  assert.equal(prompt.selection.faceCoveringBColorId, 'neon-green');
});
test('wired audio survives six outputs with crop-aware continuous concealed cable', () => {
  const locks = { ...createEmptyLocks(), subjectCount: '1', headphonesId: option('headphonesId', '有線耳機').id, framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id };
  const [p] = generatePrompts(1, locks, [], { random: createSeededRandom('accessory-separation') });
  for (const text of [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, ...p.extraPrompts.map((x) => x.text)]) assert.match(text, /continuous cable/);
  assert.match(p.grokPrompt, /end is concealed/);
  for (const extra of p.extraPrompts.filter((x) => x.id?.includes('chest'))) { assert.match(extra.text, /lower frame edge/); assert.doesNotMatch(extra.text, /waist or the hip/); }
  assert.equal(p.selection.headphonesId, locks.headphonesId);
});

test('explicit headphone and piercing locks constrain random accessories, including duo roles', () => {
  const headAudio = option('headphonesId', '耳罩式耳機（戴在頭上）').id;
  for (const subjectCount of ['1', '2']) {
    const locks = { ...createEmptyLocks(), subjectCount };
    for (const suffix of subjectCount === '2' ? ['A', 'B'] : ['']) {
      locks[`headphones${suffix}Id`] = headAudio;
      locks[`headAccessory${suffix}Id`] = '';
    }
    for (const p of generatePrompts(25, locks, [], { random: createSeededRandom(`head-audio-${subjectCount}`) })) {
      for (const suffix of subjectCount === '2' ? ['A', 'B'] : ['']) {
        assert.equal(p.selection[`headphones${suffix}Id`], headAudio);
        assert.doesNotMatch(p.selection[`headAccessory${suffix}Id`] || '', /帽|皇冠|兔耳髮箍|女僕頭飾|頭巾/);
      }
    }
  }
  const piercing = option('nosePiercingId', '鼻中隔細環').id;
  for (const p of generatePrompts(25, { ...createEmptyLocks(), subjectCount: '1', faceCoveringId: '', nosePiercingId: piercing }, [], { random: createSeededRandom('piercing-lock') })) {
    assert.equal(p.selection.nosePiercingId, piercing);
    assert.equal(p.selection.faceCoveringId, option('faceCoveringId', '全無').id);
  }
});

test('Saved Cards and Markdown migrate legacy audio and preserve original saved text', async () => {
  const { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt, parseLocksFromStandardPrompt } = await import('../features/saved-cards/cardCodec.js');
  const audio = option('headphonesId', '有線耳機');
  const [p] = generatePrompts(1, { ...createEmptyLocks(), headphonesId: audio.id, subjectCount: '1' }, [], { random: createSeededRandom('accessory-restore') });
  const imported = parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'new-audio');
  assert.equal(imported.selection.headphonesId, audio.id);
  assert.equal(parseLocksFromStandardPrompt('wired earphones with visible cable, lightweight in-ear audio accessory', controls).locks.headphonesId, audio.id);
  const legacy = { ...p, selection: { ...createEmptyLocks(), headAccessoryId: option('faceCoveringId', '黑色口罩').id, headAccessoryColorId: 'red', nosePiercingId: option('nosePiercingId', '鼻中隔細環').id } };
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(legacy));
  assert.equal(restored.selection.faceCoveringColorId, 'red');
  assert.equal(restored.selection.headAccessoryColorId, 'none');
  assert.equal(restored.selection.nosePiercingId, option('nosePiercingId', '全無').id);
  assert.equal(restored.accessoryRestoreNotices.length, 1);
  assert.equal(restored.grokPrompt, legacy.grokPrompt);

  const mask = option('faceCoveringId', '黑色口罩');
  const [colored] = generatePrompts(1, {
    ...createEmptyLocks(),
    subjectCount: '1',
    headphonesId: audio.id,
    headphonesColorId: 'red',
    faceCoveringId: mask.id,
    faceCoveringColorId: 'dark-blue',
  }, [], { random: createSeededRandom('accessory-color-card-restore') });
  const restoredColors = deserializeFavoritePrompt(serializeFavoritePrompt(colored));
  assert.equal(restoredColors.selection.headphonesColorId, 'red');
  assert.equal(restoredColors.selection.faceCoveringColorId, 'dark-blue');
});

test('randomizing accessories resets accessory colors and keeps piercings manual', async () => {
  const { randomizeLockKeys } = await import('./page1SectionRandom.js');
  const next = randomizeLockKeys({ ...createEmptyLocks(), headphonesColorId: 'red', faceCoveringColorId: 'red', nosePiercingId: option('nosePiercingId', '鼻中隔細環').id }, ['headphonesId', 'faceCoveringId', 'nosePiercingId'], createEmptyLocks(), controls);
  assert.equal(next.headphonesId, '');
  assert.equal(next.faceCoveringId, '');
  assert.equal(next.headphonesColorId, 'none');
  assert.equal(next.faceCoveringColorId, 'none');
  assert.equal(next.nosePiercingId, option('nosePiercingId', '全無').id);
});
