import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from './engine.js';
import { randomizeLockKeys } from './page1SectionRandom.js';
import { buildRestoreLocks, buildMarkdownExport, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const option = (key, zh) => {
  const result = controls.find((control) => control.key === key)?.options.find((item) => item.zh === zh);
  assert.ok(result, `${key}: ${zh}`);
  return result;
};
const baseLocks = () => ({
  ...createEmptyLocks(), subjectCount: '1',
  nosePiercingId: option('nosePiercingId', '鼻中隔細環').id,
  lipPiercingId: option('lipPiercingId', '下唇不對稱雙環').id,
  expressionId: option('expressionId', '龐克挑釁吐舌').id,
  poseBaseId: 'standing', poseHandId: 'both-hands-rock-horns', posePropId: 'none',
});

test('selected facial piercings survive main outputs, derivatives and resolved selections', () => {
  for (const crop of ['全身鏡頭 (Full Body Shot)', '胸上特寫', '臉部特寫']) {
    const locks = { ...baseLocks(), framingId: option('framingId', crop).id };
    const [prompt] = generatePrompts(1, locks, [], { random: createSeededRandom('facial-piercing-v1') });
    for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, ...prompt.extraPrompts.map((entry) => entry.text)]) {
      assert.match(text, /silver septum ring/, crop);
      assert.match(text, /hoops placed asymmetrically along the lower lip/, crop);
      assert.doesNotMatch(text, /no nose piercing|no lip piercing/);
    }
    assert.match(prompt.summary, /鼻中隔細環/);
    assert.match(prompt.summary, /下唇不對稱雙環/);
    assert.equal(prompt.selection.nosePiercingId, locks.nosePiercingId);
    assert.equal(prompt.selection.lipPiercingId, locks.lipPiercingId);
    assert.match(prompt.zImagePrompt, /tongue extended clearly between parted lips/);
    if (crop === '全身鏡頭 (Full Body Shot)') assert.match(prompt.zImagePrompt, /index and little fingers extended/);
  }
});

test('piercings default and section randomization resolve to none', () => {
  const defaults = createEmptyLocks();
  for (const key of ['nosePiercingId', 'lipPiercingId']) {
    assert.equal(defaults[key], option(key, '全無').id);
    const randomized = randomizeLockKeys(baseLocks(), [key], defaults, controls);
    assert.equal(randomized[key], defaults[key]);
  }
  for (const prompt of generatePrompts(30, { ...defaults, poseBaseId: 'standing', poseHandId: 'random' }, [], { random: createSeededRandom('manual-only-punk') })) {
    assert.doesNotMatch(prompt.zImagePrompt, /septum|labret|hoop piercing|hoops placed asymmetrically|tongue extended clearly|rock-horns/);
  }
});

test('facial piercing selections survive Saved Cards and Markdown round trips', () => {
  const [prompt] = generatePrompts(1, baseLocks(), [], { random: createSeededRandom('piercing-restore') });
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  const imported = parseExportedMarkdownPrompt(buildMarkdownExport(prompt), controls, 'piercing-import');
  for (const result of [saved, imported]) {
    const locks = buildRestoreLocks(result.selection, controls);
    assert.equal(locks.nosePiercingId, prompt.selection.nosePiercingId);
    assert.equal(locks.lipPiercingId, prompt.selection.lipPiercingId);
    assert.equal(locks.expressionId, prompt.selection.expressionId);
    assert.equal(locks.poseHandId, prompt.selection.poseHandId);
  }
});
