import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildResolvedLocalDetailBundle } from './localDetailResolvedAdapter.js';
import { sanitizeStoredPrompt } from '../../features/saved-cards/cardCodec.js';

const controls = getLockControls();
function locksFor(overrides = {}) {
  const locks = createEmptyLocks();
  for (const c of controls) {
    const item = c.options?.find((o) => o.zh === '全無');
    if (item) locks[c.key] = item.id;
  }
  for (const [key, zh] of Object.entries(overrides)) {
    const option = controls.find((c) => c.key === key)?.options.find((o) => o.zh === zh);
    assert.ok(option, `${key}/${zh}`);
    locks[key] = option.id;
  }
  return locks;
}
const generate = (overrides) => generatePrompts(1, locksFor(overrides), [], { random: createSeededRandom('local-runtime-focused') })[0];

test('pre-integration baseline: original results and random consumption remain byte-identical', () => {
  // Captured before importing the local adapter into engine.js. Excludes only
  // runtime ID/date and the newly added internal bundle, not selections/text.
  const baselines = {
    1: [651, '96260a598a7f2126ca353a08f1b77b0114fbe0795f0357dfaa7b5dd1b3b3d273'],
    2: [677, 'ff2c7fd04cc8d95a028597fcfd66fc2b580c7e3cb528b356b1703ce06ac8ba7e'],
  };
  for (const subjectCount of ['1', '2']) {
    let calls = 0;
    const random = createSeededRandom('local-runtime-baseline');
    const output = generatePrompts(20, { ...createEmptyLocks(), subjectCount }, [], { random: () => { calls++; return random(); } });
    const legacy = output.map((p) => Object.fromEntries(Object.entries(p)
      .filter(([key]) => !['id', 'date', 'localDetailPrompts'].includes(key))));
    assert.equal(calls, baselines[subjectCount][0]);
    assert.equal(createHash('sha256').update(JSON.stringify(legacy)).digest('hex'), baselines[subjectCount][1]);
    for (const p of output) {
      assert.ok(p.localDetailPrompts);
      if (subjectCount === '2') assert.deepEqual(p.localDetailPrompts, {});
      assert.ok(!p.extraPrompts.some((e) => e.id === 'local-detail'), 'not a seventh UI/storage entry yet');
    }
  }
});

test('same generation retains unprojected garment and resolved color in a face crop', () => {
  const p = generate({ topId: '高領連身上衣', topColorId: '白色', facialFeaturesId: '甜美可愛臉', framingId: '局部五官特寫' });
  assert.doesNotMatch(p.zImagePrompt, /continuous torso line/);
  const abdomen = p.localDetailPrompts['abdomen-navel'];
  assert.equal(abdomen.status, 'ready');
  assert.match(abdomen.text, /smooth stretch or ribbed fabric in white/);
  assert.match(p.localDetailPrompts.eyes.text, /bright round eyes/);
  assert.equal(abdomen.coverage.navelPosition, 'covered');
  assert.ok(Object.isFrozen(p.localDetailPrompts.eyes));
});

test('runtime normalized dress label retains narrow opening and visible piercing', () => {
  const p = generate({ dressId: '連身：短版｜亮面乳膠拉鏈洋裝', dressColorId: '紅色', waistAccessoryId: '肚臍環' });
  const result = p.localDetailPrompts['abdomen-navel'];
  assert.equal(result.status, 'ready');
  assert.match(result.text, /vertical strip of bare skin/);
  assert.match(result.text, /navel piercing/);
  assert.match(result.text, /glossy latex in red/);
  assert.doesNotMatch(result.text, /full-body|mini dress|cleavage/);
});

test('runtime preset normalized label and primary color do not expose hidden piercing', () => {
  const p = generate({ outfitPresetId: '套裝：亮面乳膠束帶', outfitPresetPrimaryColorId: '紅色', waistAccessoryId: '肚臍環' });
  const result = p.localDetailPrompts['abdomen-navel'];
  assert.equal(result.status, 'ready');
  assert.match(result.text, /opaque mirror-polished latex in red/);
  assert.doesNotMatch(result.text, /diamond|navel piercing/);
});

test('runtime open shirt preserves the inner bodysuit coverage', () => {
  const p = generate({ topId: '高領連身上衣', outerwearId: '長版襯衫', outerwearOpeningId: '敞開穿',
    outerwearStylingId: '正常穿著', waistAccessoryId: '肚臍環' });
  const result = p.localDetailPrompts['abdomen-navel'];
  assert.equal(result.status, 'ready');
  assert.equal(result.coverage.navelPosition, 'covered');
  assert.doesNotMatch(result.text, /diamond|bare skin/);
});

test('unknown effective styling remains unavailable instead of silently using normal coverage', () => {
  const p = generate({ topId: '高領連身上衣', outerwearId: '長版襯衫', outerwearOpeningId: '敞開穿', outerwearStylingId: '雙肩露出' });
  assert.equal(p.localDetailPrompts['abdomen-navel'].status, 'needs-source-review');
});

test('eyes omit glasses on head and retain reviewed eyewear at eyes without inferring lens clarity', () => {
  const eyewear = controls.find((c) => c.key === 'eyewearId').options.find((o) => o.zh !== '全無');
  const placement = controls.find((c) => c.key === 'eyewearPlacementId').options.find((o) => o.zh !== '戴在頭頂');
  const p = generate({ facialFeaturesId: '甜美可愛臉', eyewearId: eyewear.zh, eyewearPlacementId: '戴在頭頂' });
  assert.equal(p.localDetailPrompts.eyes.status, 'ready');
  assert.doesNotMatch(p.localDetailPrompts.eyes.text, /glasses|frame.*glasses/);
  const worn = generate({ facialFeaturesId: '甜美可愛臉', eyewearId: eyewear.zh, eyewearPlacementId: placement.zh });
  assert.equal(worn.localDetailPrompts.eyes.status, 'ready');
  assert.ok(worn.localDetailPrompts.eyes.text.includes(eyewear.en));
  assert.doesNotMatch(worn.localDetailPrompts.eyes.text, /bright round eyes|transparent lenses/);
});

test('adapter rejects embedded owners and does not mutate or reroll a resolved snapshot', () => {
  const snapshot = { subjectCount: 1, imageType: 'watercolor-illustration',
    character: { facialFeatures: { zh: '甜美可愛臉', en: 'bright friendly eyes' } }, wardrobe: {},
    scene: 'ocean, wet skin', framing: 'full-body', pose: 'selfie', colors: {} };
  const before = JSON.stringify(snapshot);
  const result = buildResolvedLocalDetailBundle(snapshot);
  assert.match(result.eyes.text, /Watercolor/);
  assert.doesNotMatch(result.eyes.text, /ocean|wet skin|selfie|full-body/);
  assert.deepEqual(result, buildResolvedLocalDetailBundle({ ...snapshot, scene: 'bedroom', shoes: 'boots' }));
  assert.equal(JSON.stringify(snapshot), before);
  for (const subjectKind of ['character-profile', 'android']) {
    const blocked = buildResolvedLocalDetailBundle({ ...snapshot, subjectKind });
    assert.ok(Object.values(blocked).every((p) => p.status === 'needs-source-review' && p.text === ''));
  }
});

test('unreviewed complete-look palette does not leak a whole-outfit color direction into local text', () => {
  const p = generate({ dressId: '連身：短版｜亮面乳膠拉鏈洋裝', completeLookPaletteId: '黑白灰冷調' });
  assert.equal(p.localDetailPrompts['abdomen-navel'].status, 'needs-source-review');
});

test('runtime bundle stays outside the legacy saved-card payload until codec integration', () => {
  const p = generate({ topId: '高領連身上衣' });
  const saved = sanitizeStoredPrompt(p);
  assert.equal(Object.hasOwn(saved, 'localDetailPrompts'), false);
  assert.deepEqual(saved.extraPrompts, p.extraPrompts);
  assert.equal(saved.grokPrompt, p.grokPrompt);
});

test('actual selected lighting and image type retain only reviewed local sources', () => {
  const p = generate({ topId: '高領連身上衣', lightDirectionId: '高調亮光', imageTypePresetId: '水彩插畫' });
  const result = p.localDetailPrompts['abdomen-navel'];
  assert.match(result.text, /Watercolor detail illustration/);
  assert.match(result.text, /bright even exposure/);
  assert.doesNotMatch(result.text, /photorealistic|full-body|Scene:/i);
});

test('live resolved hair, lower-face mask and eye expression use the reviewed eye slice', () => {
  const p = generate({ facialFeaturesId: '甜美可愛臉', hairstyleId: '帥氣濕亮油頭',
    hairStylingStateId: '柔順自然', headAccessoryId: '黑色口罩', expressionId: '自然喜悅' });
  assert.equal(p.localDetailPrompts.eyes.status, 'ready');
  assert.match(p.localDetailPrompts.eyes.text, /eyes gently narrowed by the smile/);
  assert.doesNotMatch(p.localDetailPrompts.eyes.text, /mask|short hair|visible teeth/);
  const covered = generate({ facialFeaturesId: '甜美可愛臉', hairstyleId: '帥氣濕亮油頭',
    hairStylingStateId: '柔順自然', eyewearId: '眼布', expressionId: '自然喜悅' });
  assert.equal(covered.localDetailPrompts.eyes.coverage.eyes, 'covered');
  assert.match(covered.localDetailPrompts.eyes.text, /eye covering/);
  assert.doesNotMatch(covered.localDetailPrompts.eyes.text, /friendly|smile/);
});

test('live second-batch sources preserve structured identity, local fringe and actual eyewear color', () => {
  const face = generate({ facialFeaturesId: '冷感高級臉', hairstyleId: '柔波：中分',
    hairStylingStateId: '柔順自然', expressionId: '撒嬌生氣' }).localDetailPrompts.eyes;
  assert.match(face.text, /upturned eyes/);
  assert.match(face.text, /straight brows/);
  assert.match(face.text, /lightly furrowed brows/);
  assert.doesNotMatch(face.text, /oval face|pout|waves/);
  const glasses = generate({ facialFeaturesId: '冷感高級臉', hairstyleId: '不對稱濕感短鮑伯',
    hairStylingStateId: '濕髮分束', eyewearId: '太陽眼鏡', eyewearColorId: '金屬銀',
    eyewearPlacementId: '正常戴在臉上' }).localDetailPrompts.eyes;
  assert.match(glasses.text, /tinted lenses/);
  assert.match(glasses.text, /silver metal frame/);
  assert.match(glasses.text, /one side falling near the eye/);
  assert.doesNotMatch(glasses.text, /upturned eyes|straight brows/);
  const cloth = generate({ eyewearId: '眼布', eyewearColorId: '白色' }).localDetailPrompts.eyes;
  assert.match(cloth.text, /white elastic stretch-fabric eye covering/);
  assert.doesNotMatch(cloth.text, /black|white frame/);
});
