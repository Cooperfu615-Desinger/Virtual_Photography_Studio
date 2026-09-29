import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { deserializeFavoritePrompt, parseLocksFromStandardPrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const oldId = 'wardrobe:褲裝-pants:蕾絲內褲:7';
const oldSource = 'low-rise lace panties, lingerie bottoms, delicate lace texture, close-fitting hip line, compact lower-body structure';
const option = (key, zh) => {
  const found = controls.find(c => c.key === key)?.options.find(o => o.zh === zh);
  assert.ok(found, `${key}/${zh}`);
  return found;
};
function generate(overrides = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1' };
  for (const control of controls) {
    const none = control.options?.find(o => o.zh === '全無');
    if (none) locks[control.key] = none.id;
  }
  return generatePrompts(1, { ...locks, pantsId: oldId,
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
    bottomColorId: option('bottomColorId', '黑色').id, ...overrides,
  }, [], { random: createSeededRandom('cotton-briefs-v1') })[0];
}

test('cotton briefs replace the existing option without changing single/duo IDs or list position', () => {
  const single = option('pantsId', '棉質低腰三角褲');
  assert.equal(single.id, oldId);
  assert.match(single.en, /low-rise cotton briefs/);
  assert.match(single.en, /triangular front panel/);
  assert.doesNotMatch(single.en, /lace|thong|sheer/i);
  assert.equal(controls.find(c => c.key === 'pantsId').options[7].id, oldId);
  assert.equal(option('pantsAId', '棉質低腰三角褲').id, oldId);
  assert.equal(option('pantsBId', '棉質低腰三角褲').id, oldId);
  assert.ok(!controls.find(c => c.key === 'pantsId').options.some(o => o.zh === '蕾絲內褲'));
});

test('all six outputs respect cotton material and the existing crop projection', () => {
  const prompt = generate();
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt,
    prompt.extraPrompts.find(p => p.id === 'full-body-character').text]) {
    assert.match(text, /black low-rise cotton briefs/);
    assert.doesNotMatch(text, /lace panties|delicate lace texture/);
  }
  for (const id of ['chest-up-portrait', 'chest-up-mj-portrait']) {
    assert.doesNotMatch(prompt.extraPrompts.find(p => p.id === id).text, /cotton briefs|lace panties/);
  }
  assert.match(prompt.summary, /棉質低腰三角褲/);
  assert.equal(prompt.selection.pantsId, oldId);
});

test('historical saved selections and standard English imports resolve to cotton briefs', () => {
  assert.equal(normalizeLocks({ ...createEmptyLocks(), pantsId: oldId }).pantsId, oldId);
  assert.equal(parseLocksFromStandardPrompt(`Wardrobe:\n${oldSource}`, controls).locks.pantsId, oldId);
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt(generate()));
  assert.equal(restored.selection.pantsId, oldId);
  assert.match(generate(restored.selection).grokPrompt, /cotton briefs/);
});

test('renamed cotton briefs retain the same-person garter pairing and independent duo selection', () => {
  const paired = generate({ legwearId: option('legwearId', '膝上蕾絲吊帶襪').id });
  assert.match(paired.grokPrompt, /cotton briefs/);
  assert.match(paired.grokPrompt, /a separate lace garter belt worn over the bottoms/);
  const duo = generate({ subjectCount: '2', pantsAId: oldId,
    pantsBId: option('pantsBId', '直筒牛仔褲').id });
  assert.match(duo.grokPrompt, /cotton briefs/);
  assert.match(duo.grokPrompt, /straight-leg jeans/);
  assert.equal(duo.selection.pantsAId, oldId);
});
