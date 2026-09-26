import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, getLockControls, normalizeLocks, generatePrompts, createSeededRandom } from './engine.js';
import { prepareAccessoryControl } from './engine/accessoryPolicy.js';
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
});

test('randomizing accessories resets legacy-only color overrides and keeps piercings manual', async () => {
  const { randomizeLockKeys } = await import('./page1SectionRandom.js');
  const next = randomizeLockKeys({ ...createEmptyLocks(), headphonesColorId: 'red', faceCoveringColorId: 'red', nosePiercingId: option('nosePiercingId', '鼻中隔細環').id }, ['headphonesId', 'faceCoveringId', 'nosePiercingId'], createEmptyLocks(), controls);
  assert.equal(next.headphonesId, '');
  assert.equal(next.faceCoveringId, '');
  assert.equal(next.headphonesColorId, 'none');
  assert.equal(next.faceCoveringColorId, 'none');
  assert.equal(next.nosePiercingId, option('nosePiercingId', '全無').id);
});
