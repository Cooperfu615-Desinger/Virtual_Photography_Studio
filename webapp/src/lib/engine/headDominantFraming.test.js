import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createEmptyLocks,
  createSeededRandom,
  generatePrompts,
  getLockControls,
} from '../engine.js';
import {
  HEAD_DOMINANT_FRAMING_ID,
  HEAD_DOMINANT_FRAMING_ZH,
  headDominantAngleAllowed,
  isHeadDominantFraming,
  prepareHeadDominantAngleControl,
} from './headDominantFraming.js';
import { createCompositionVisibilityProjection } from './compositionVisibilityContract.js';
import { buildPage1MainFramingControl } from './fixedFramingMainPrompt.js';
import { buildWorkspaceSummary } from '../page1WorkspaceSummary.js';
import {
  deserializeFavoritePrompt,
  parseLocksFromStandardPrompt,
  serializeFavoritePrompt,
} from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const control = key => controls.find(entry => entry.key === key);
const option = (key, zh) => {
  const found = control(key)?.options.find(entry => entry.zh === zh);
  assert.ok(found, `Missing ${key}/${zh}`);
  return found;
};
const allowedAngleLabels = new Set(['全無', '高位俯視鏡頭', '平視高度鏡頭', '正上方俯視鏡頭']);
const realAllowedAngleLabels = new Set([...allowedAngleLabels].filter(label => label !== '全無'));
const mainTexts = prompt => [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt];
const extra = (prompt, id) => prompt.extraPrompts.find(entry => entry.id === id)?.text || '';
const allTexts = prompt => [...mainTexts(prompt), ...prompt.extraPrompts.map(entry => entry.text)];
const section = (text, label) => text.split(`${label}:\n`)[1]?.split('\n\n')[0] || '';

function fixture(values = {}) {
  const locks = { ...createEmptyLocks(), subjectCount: '1', aspectRatio: '4:5' };
  for (const entry of controls) {
    const none = entry.options.find(item => ['全無', '無額外表情'].includes(item.zh));
    if (none) locks[entry.key] = none.id;
  }
  for (const [key, zh] of Object.entries({
    framingId: HEAD_DOMINANT_FRAMING_ZH,
    angleId: '高位俯視鏡頭',
    orbitId: '正面 0 度',
    topId: '落肩 T 恤',
    pantsId: '直筒牛仔褲',
    poseBaseId: '站姿',
    poseArrangementId: '自然站姿',
    poseHandId: '單手摸下巴',
    poseHeadId: '頭部微微側傾',
    locationId: '室內：更衣室 / 試衣間',
    lensId: '魚眼鏡頭 Fisheye',
    ...values,
  })) locks[key] = option(key, zh).id;
  return locks;
}

function generate(locks, seed = 'head-dominant-framing-v1') {
  return generatePrompts(1, locks, [], { random: createSeededRandom(seed) })[0];
}

test('head-dominant framing appends a stable selectable identity and shares chest visibility', () => {
  const framing = option('framingId', HEAD_DOMINANT_FRAMING_ZH);
  assert.equal(framing.id, 'camera:景別構圖-framing:頭部主導近景:10');
  assert.equal(framing.id, HEAD_DOMINANT_FRAMING_ID);
  assert.equal(isHeadDominantFraming(framing), true);
  assert.equal(isHeadDominantFraming(option('framingId', '胸上特寫')), false);
  const prepared = buildPage1MainFramingControl(control('framingId'));
  assert.ok(prepared.options.some(entry => entry.id === framing.id && !entry.disabled));
  assert.equal(createCompositionVisibilityProjection(framing).bucket, 'chestUp');
  for (const [zh, index] of [['半臉傾斜特寫', 1], ['胸上特寫', 5], ['全臉傾斜特寫', 9]]) {
    assert.ok(option('framingId', zh).id.endsWith(`:${index}`), `${zh}: existing source position`);
  }
});

test('three main outputs retain the head scale, body context and authored scene while omitting lower garments', () => {
  const prompt = generate(fixture());
  const source = option('framingId', HEAD_DOMINANT_FRAMING_ZH).en.toLowerCase();
  for (const text of mainTexts(prompt)) {
    assert.ok(text.toLowerCase().includes(source), 'complete new framing source survives renderer assembly');
    assert.match(text, /head-dominant close portrait/i);
    assert.match(text, /50[–-]60%/);
    assert.match(text, /upper torso and arms/i);
    assert.match(text, /recognizable scene/i);
    assert.match(text, /fitting room/i);
    assert.match(text, /dropped-shoulder t-shirt/i);
    assert.doesNotMatch(text, /straight-leg jeans|head-to-toe figure/i);
  }
  assert.equal(prompt.selection.pantsId, option('pantsId', '直筒牛仔褲').id);
  assert.match(extra(prompt, 'full-body-character'), /straight-leg jeans/i);
});

test('only high, eye-level, top-down and explicit silence remain selectable for the new framing', () => {
  const locks = fixture();
  const prepared = prepareHeadDominantAngleControl(control('angleId'), locks, controls);
  for (const angle of control('angleId').options) {
    const allowed = allowedAngleLabels.has(angle.zh);
    assert.equal(headDominantAngleAllowed(angle), allowed, angle.zh);
    assert.equal(prepared.options.find(entry => entry.id === angle.id).disabled === true, !allowed, angle.zh);
  }
  for (const zh of allowedAngleLabels) {
    const selected = { ...locks, angleId: option('angleId', zh).id };
    const prompt = generate(selected);
    assert.equal(prompt.selection.angleId, selected.angleId, zh);
    assert.notEqual(prepareHeadDominantAngleControl(control('angleId'), selected, controls).closureDisplayValue, option('angleId', '全無').id, zh);
  }
});

test('incompatible explicit camera angles are silent but remain stored and restore outside the new framing', () => {
  const forbiddenAngles = control('angleId').options.filter(angle => !allowedAngleLabels.has(angle.zh));
  const forbiddenPublicWords = /worm.?s-eye|bird.?s-eye|shoulder-level view|waist-level view|knee-level view|floor level|floor-level|dutch angle|tilted frame/i;
  for (const angle of forbiddenAngles) {
    const locks = { ...fixture(), angleId: angle.id };
    const prompt = generate(locks);
    const prepared = prepareHeadDominantAngleControl(control('angleId'), locks, controls);
    assert.equal(prepared.closureDisplayValue, option('angleId', '全無').id, angle.zh);
    assert.equal(prompt.selection.angleId, angle.id, `${angle.zh}: latent selection survives generation`);
    for (const text of mainTexts(prompt)) assert.doesNotMatch(text, forbiddenPublicWords, angle.zh);
    assert.ok(!JSON.stringify(prompt.summaryFields).includes(angle.zh), `${angle.zh}: effective generation summary`);
    assert.ok(!JSON.stringify(buildWorkspaceSummary(locks, controls)).includes(angle.zh), `${angle.zh}: effective workspace summary`);
    const restoredLocks = { ...prompt.selection, framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id };
    const restored = generate(restoredLocks);
    assert.equal(restored.selection.angleId, angle.id, `${angle.zh}: other framing restores stored angle`);
    const restoredControl = prepareHeadDominantAngleControl(control('angleId'), restoredLocks, controls);
    assert.notEqual(restoredControl.options.find(entry => entry.id === angle.id).disabled, true, angle.zh);
    assert.notEqual(restoredControl.closureDisplayValue, option('angleId', '全無').id, angle.zh);
  }
});

test('seeded random camera resolution stays inside the three real allowed angles', () => {
  const locks = { ...fixture(), angleId: '' };
  const seen = new Set();
  for (let index = 0; index < 64; index += 1) {
    const prompt = generate(locks, `head-dominant-angle-random-${index}`);
    const selected = control('angleId').options.find(angle => angle.id === prompt.selection.angleId);
    assert.ok(selected && realAllowedAngleLabels.has(selected.zh), selected?.zh || prompt.selection.angleId);
    seen.add(selected.zh);
  }
  assert.ok(seen.has('高位俯視鏡頭'));
  assert.ok(seen.has('平視高度鏡頭'));
});

test('new main camera distance is close while chest derivatives retain their own framing and distance policy', () => {
  for (const zh of ['高位俯視鏡頭', '正上方俯視鏡頭']) {
    const locks = fixture({ angleId: zh });
    const prompt = generate(locks);
    for (const text of mainTexts(prompt)) assert.doesNotMatch(text, /1\.5[–-]2 meters|1[–-]2 meters|3[–-]5 meters/);
    const chestGpt = extra(prompt, 'chest-up-portrait');
    const chestMj = extra(prompt, 'chest-up-mj-portrait');
    assert.match(section(chestGpt, 'Composition'), /4:5 aspect ratio.*Chest-up portrait/i);
    assert.match(chestMj, /Chest-up portrait/i);
    assert.match(chestMj, /--ar 4:5\b/);
    assert.match(chestGpt, zh === '高位俯視鏡頭' ? /1\.5[–-]2 meters/ : /1[–-]2 meters/);
    for (const text of [chestGpt, chestMj, extra(prompt, 'full-body-character')]) {
      assert.doesNotMatch(text, /head-dominant close portrait|50[–-]60%/i);
    }
    const ordinary = generate({ ...locks, framingId: option('framingId', '胸上特寫').id });
    // Older framings retain their own aerial compatibility policy. Compare
    // exact derived bytes only when both parents resolve the same angle.
    if (ordinary.selection.angleId === prompt.selection.angleId) {
      assert.equal(chestGpt, extra(ordinary, 'chest-up-portrait'), `${zh}: same resolved chest GPT`);
      assert.equal(chestMj, extra(ordinary, 'chest-up-mj-portrait'), `${zh}: same resolved chest MJ`);
    }
    assert.equal(extra(prompt, 'full-body-character'), extra(ordinary, 'full-body-character'), `${zh}: full reference independence`);
  }
});

test('top-down keeps selected head direction and lens without inventing an upward-looking pose', () => {
  for (const headZh of ['全無', '頭部微微側傾', '頭部微微後仰']) {
    const locks = fixture({ angleId: '正上方俯視鏡頭', poseHeadId: headZh });
    const prompt = generate(locks);
    assert.equal(prompt.selection.poseHeadId, locks.poseHeadId);
    assert.equal(prompt.selection.lensId, locks.lensId);
    for (const text of mainTexts(prompt)) {
      assert.match(text, /fisheye/i);
      if (headZh !== '全無') assert.ok(text.includes(option('poseHeadId', headZh).en), headZh);
      else assert.doesNotMatch(text, /chin (?:softly )?lifted|looking upward|head tilted (?:slightly )?backward/i);
    }
  }
  for (const lens of control('lensId').options.filter(entry => entry.zh !== '全無')) {
    const prompt = generate({ ...fixture({ angleId: '平視高度鏡頭' }), lensId: lens.id });
    assert.equal(prompt.selection.lensId, lens.id, lens.zh);
    assert.ok(prompt.grokPrompt.toLowerCase().includes(lens.en.toLowerCase()), `${lens.zh}: selected lens source`);
  }
});

test('Saved Cards and standard prompt import preserve the new framing and latent incompatible angle', () => {
  const locks = fixture({ angleId: '蟲眼視角鏡頭' });
  const prompt = generate(locks);
  const saved = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
  for (const key of ['framingId', 'angleId', 'lensId', 'poseHeadId', 'pantsId']) {
    assert.equal(saved.selection[key], locks[key], key);
  }
  assert.deepEqual(allTexts(saved), allTexts(prompt), 'stored public prompt text is preserved');
  const regenerated = generate(saved.selection);
  for (const key of ['framingId', 'angleId', 'lensId', 'poseHeadId', 'pantsId']) {
    assert.equal(regenerated.selection[key], saved.selection[key], `${key}: regenerated saved selection`);
  }
  for (const text of mainTexts(regenerated)) {
    assert.match(text, /head-dominant close portrait/i);
    assert.match(text, /50[–-]60%/);
    assert.doesNotMatch(text, /worm.?s-eye/i);
  }
  const restored = generate({ ...saved.selection, framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id });
  assert.match(restored.grokPrompt, /worm.?s-eye/i);
  for (const angle of realAllowedAngleLabels) {
    const allowed = generate(fixture({ angleId: angle }));
    for (const text of mainTexts(allowed)) {
      const parsed = parseLocksFromStandardPrompt(text, controls).locks;
      assert.equal(parsed.framingId, HEAD_DOMINANT_FRAMING_ID, 'new authored framing is recognized from public prompt text');
      assert.equal(parsed.angleId, option('angleId', angle).id, `${angle}: effective angle is recognized`);
    }
  }
});
