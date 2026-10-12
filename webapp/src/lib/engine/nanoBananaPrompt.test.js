import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getLockControls } from '../engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { NANO_BANANA_FACIAL_FEATURES, nanoBananaFacialDescription } from './nanoBananaFacialFeatures.js';
import {
  effectiveNanoBananaFacialSources,
  nanoBananaFacialFeaturesFixtures,
  normalizedNanoBananaFacialText,
} from './nanoBananaFacialFeaturesFixtures.js';
import {
  generateNanoBananaFixture,
  nanoBananaFixtureLocks,
  nanoBananaFixtures,
  protectedNanoBananaOutputs,
} from './nanoBananaFixtures.js';

const fixtures = nanoBananaFixtures();
const generated = fixtures.map(fixture => ({ fixture, prompt: generateNanoBananaFixture(fixture) }));
const baseline = JSON.parse(readFileSync(new URL('./nanoBananaProtectedBaseline.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(JSON.stringify(value) ?? 'undefined').digest('hex');
const cards = CHARACTER_PROFILE_OPTIONS.filter(option => option.specialSubject === 'character-profile');
const controlOptions = key => getLockControls().find(control => control.key === key)?.options ?? [];
const text = ({ fixture, prompt }) => {
  assert.equal(typeof prompt.nanoBananaPrompt, 'string', `${fixture.id}: missing Nano Banana output`);
  assert.ok(prompt.nanoBananaPrompt.trim(), `${fixture.id}: empty Nano Banana output`);
  return prompt.nanoBananaPrompt;
};
const count = (value, source) => value.split(source).length - 1;

test('Nano Banana preserves all six legacy texts, extra prompts, selections, structured data and summaries', () => {
  assert.equal(fixtures.length, 382);
  assert.equal(baseline.length, fixtures.length);
  for (let index = 0; index < generated.length; index += 1) {
    const { fixture, prompt } = generated[index];
    assert.equal(fixture.id, baseline[index].id);
    assert.equal(fixture.seed, baseline[index].seed);
    const protectedFields = protectedNanoBananaOutputs(prompt);
    assert.deepEqual(Object.keys(protectedFields), Object.keys(baseline[index].fields));
    for (const [field, value] of Object.entries(protectedFields)) {
      assert.equal(hash(value), baseline[index].fields[field], `${fixture.id}: ${field} changed`);
    }
  }
});

test('every PAGE1 mode has natural Nano Banana paragraphs without MJ parameters or internal control prose', () => {
  assert.deepEqual(new Set(fixtures.map(fixture => fixture.kind)), new Set([
    'card', 'generic-face', 'fixed', 'dedicated', 'duo', 'custom', 'canonical-pose', 'wardrobe', 'seeded',
  ]));
  for (const item of generated) {
    const value = text(item);
    assert.doesNotMatch(value, /--(?:ar|v|raw|s|c|w|sd|hd)\b/i, item.fixture.id);
    assert.doesNotMatch(value, /Nano Banana|facialGeometry|eyeSignature|noseSignature|mouthSignature|characterCardWardrobe|selection-control|fallback guard|integrity guard/i, item.fixture.id);
    assert.doesNotMatch(value, /\bnone\b/i, `${item.fixture.id}: silent catalog sentinel leaked`);
    assert.doesNotMatch(value, /^(?:Image Type|Composition|Subject|Wardrobe|Location|Lighting|Lens & Imaging):\s*$/m, item.fixture.id);
  }
});

test('all 33 Character Cards retain full facial fields and permanent anchors once across wardrobe modes and crops', () => {
  assert.equal(cards.length, 33);
  assert.equal(generated.filter(item => item.fixture.kind === 'card').length, 330);
  for (const item of generated.filter(entry => entry.fixture.kind === 'card')) {
    const value = text(item);
    const card = cards.find(option => option.id === item.fixture.cardId);
    for (const field of ['facialGeometry', 'eyeSignature', 'noseSignature', 'mouthSignature', 'skinSignature', 'makeup']) {
      assert.ok(card.profile[field]?.trim(), `${card.id}: source ${field} exists`);
      assert.ok(value.includes(card.profile[field]), `${item.fixture.id}: full ${field} omitted or rewritten`);
    }
    assert.equal(count(value, card.profile.distinctiveFeatures), 1, `${item.fixture.id}: permanent identity anchors`);
    if (item.fixture.locks.framingId === controlOptions('framingId').find(option => option.zh === '全身鏡頭 (Full Body Shot)').id) {
      assert.ok(value.includes(card.profile.body), `${item.fixture.id}: full visible Character Card body`);
    }
  }
});

test('ordinary facial options use Nano-only anatomy while preserving shared source data and card identities', () => {
  const faces = controlOptions('facialFeaturesId');
  for (const item of generated.filter(entry => entry.fixture.kind === 'generic-face')) {
    const value = text(item);
    const face = faces.find(option => option.id === item.fixture.faceId);
    if (face.en !== 'none') {
      assert.ok(value.includes(nanoBananaFacialDescription(face)), `${item.fixture.id}: selected Nano face description`);
      assert.ok(!value.includes(face.en), `${item.fixture.id}: original generic prose is replaced only in Nano`);
      const selected = item.prompt.structured.Character.find(source => source.id === face.id);
      assert.equal(selected.en, face.en, `${item.fixture.id}: original resolved source remains intact`);
    }
    assert.doesNotMatch(value, /Character Profile Card|Permanent identity anchors|\bJiwoo\b|\bRika\b|\b48_G\b/i, item.fixture.id);
    for (const card of cards) {
      assert.ok(!value.includes(card.profile.facialGeometry), `${item.fixture.id}: unselected ${card.id} geometry`);
      assert.ok(!value.includes(card.profile.distinctiveFeatures), `${item.fixture.id}: unselected ${card.id} identity`);
    }
    const body = item.prompt.structured.Character.find(source => source.id === item.prompt.selection.bodyTypeId);
    assert.ok(value.includes(body.en), `${item.fixture.id}: full effective independent body source`);
    assert.ok(!item.prompt.grokPrompt.includes(body.en), `${item.fixture.id}: GPT-only body omission remains separate`);
  }
});

test('Character Card headwear and expression remain separate natural sentences', () => {
  const fixture = {
    id: 'card:headwear-expression', seed: 'nano-card-headwear-expression',
    locks: nanoBananaFixtureLocks({
      characterProfileId: cards[0].id,
      characterCardWardrobeMode: 'selected-layers', characterCardWardrobeLayerIds: ['top'],
      headAccessoryId: { byZh: '毛帽' }, expressionId: { byZh: '龐克挑釁吐舌' },
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
    }),
  };
  const prompt = generateNanoBananaFixture(fixture);
  const value = text({ fixture, prompt });
  assert.doesNotMatch(value, /\.\s*,/, 'completed source sentences are not joined by a comma');
  const headwear = prompt.structured.Wardrobe.find(item => item.id === prompt.selection.headAccessoryId);
  const expression = prompt.structured.Character.find(item => item.id === prompt.selection.expressionId);
  assert.ok(value.toLowerCase().includes(headwear.en.toLowerCase()), 'selected headwear source retained');
  assert.ok(value.toLowerCase().includes(expression.en.toLowerCase()), 'selected expression source retained');
});

test('Character Card accessories follow the selected crop while visible facewear is retained', () => {
  for (const [cardId, hidden] of [
    ['character-48g', 'small off-white shoulder bag with thin black strap'],
    ['character-rika', 'small silver ring keychain clipped to the front belt loop'],
  ]) {
    const generate = framing => generateNanoBananaFixture({
      seed: 'nano-final-review-accessories',
      locks: nanoBananaFixtureLocks({ characterProfileId: cardId,
        characterCardWardrobeMode: 'full-default', framingId: { byZh: framing },
      }),
    });
    const close = generate('半臉傾斜特寫').nanoBananaPrompt.toLowerCase();
    const full = generate('全身鏡頭 (Full Body Shot)').nanoBananaPrompt.toLowerCase();
    assert.ok(full.includes(hidden), `${cardId}: full-body accessory retained`);
    assert.ok(!close.includes(hidden), `${cardId}: hidden accessory omitted`);
  }
  const facewear = generateNanoBananaFixture({ seed: 'nano-visible-card-facewear',
    locks: nanoBananaFixtureLocks({ characterProfileId: 'character-rin',
      characterCardWardrobeMode: 'full-default', framingId: { byZh: '半臉傾斜特寫' },
    }),
  }).nanoBananaPrompt.toLowerCase();
  assert.ok(facewear.includes('signature thin rectangular brown-gold metal frame eyeglasses with transparent lenses'),
    'visible default Character Card facewear retained');
});

test('duo Nano faces and unchanged full body descriptions retain A/B ownership', () => {
  for (const item of generated.filter(entry => entry.fixture.kind === 'duo')) {
    const value = text(item);
    const first = value.search(/\b(?:first woman|woman A|subject A)\b/i);
    const second = value.search(/\b(?:second woman|woman B|subject B)\b/i);
    assert.ok(first >= 0 && second > first, `${item.fixture.id}: two ordered subject roles`);
    const roleText = { a: value.slice(first, second), b: value.slice(second) };
    for (const source of item.prompt.structured.Character.filter(source =>
      source.meta?.characterRole && (source.id.includes('facial-features') || source.id.includes('body-type')))) {
      if (source.en === 'none') continue;
      const expected = source.id.includes('facial-features') ? nanoBananaFacialDescription(source) : source.en;
      assert.ok(roleText[source.meta.characterRole].includes(expected), `${item.fixture.id}: ${source.meta.characterRole} ${source.zh}`);
    }
  }
});

test('duo wardrobe sources belong to the corresponding woman and silent facial selections are omitted', () => {
  const fixture = {
    id: 'duo:explicit-wardrobe', seed: 'nano-banana-explicit-wardrobe',
    locks: nanoBananaFixtureLocks({
      subjectCount: '2', topAId: { byZh: '襯衫' }, topBId: { byZh: '落肩 T 恤' },
      pantsAId: { byZh: '直筒牛仔褲' }, skirtBId: { byZh: '絲質長裙' },
      framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
    }),
  };
  const prompt = generateNanoBananaFixture(fixture);
  const value = text({ fixture, prompt });
  assert.doesNotMatch(value, /\bnone\b/i);
  const paragraphs = value.split('\n\n');
  const first = paragraphs.find(paragraph => /\bfirst woman\b/i.test(paragraph));
  const second = paragraphs.find(paragraph => /\bsecond woman\b/i.test(paragraph));
  assert.ok(first && second, 'distinct A/B narrative paragraphs');
  for (const [key, role, own, other] of [
    ['topAId', 'a', first, second], ['pantsAId', 'a', first, second],
    ['topBId', 'b', second, first], ['skirtBId', 'b', second, first],
  ]) {
    const source = prompt.structured.Wardrobe.find(item => item.id === `${prompt.selection[key]}:${role}`);
    assert.ok(source?.en, `${key}: shared resolved source exists`);
    assert.ok(own.includes(source.en), `${key}: full effective clothing source`);
    assert.ok(!other.includes(source.en), `${key}: clothing assigned to the other woman`);
  }
});

test('all SpecialOutfits use natural Nano Banana wardrobe prose at full, cowboy and close crops', () => {
  const outfits = controlOptions('specialOutfitId').filter(option =>
    !['none', 'random'].includes(option.id) && !['全無', '隨機'].includes(option.zh));
  assert.ok(outfits.length > 0, 'SpecialOutfit catalog is exercised');
  const failures = [];
  for (const outfit of outfits) {
    for (const framing of ['全身鏡頭 (Full Body Shot)', '牛仔中景 (Cowboy Shot)', '特寫鏡頭 (Close-Up)']) {
      const fixture = {
        id: `special-outfit:${outfit.id}:${framing}`,
        seed: `nano-banana-special-outfit:${outfit.id}:${framing}`,
        locks: nanoBananaFixtureLocks({
          subjectCount: '1', specialOutfitId: outfit.id, framingId: { byZh: framing },
        }),
      };
      const prompt = generateNanoBananaFixture(fixture);
      const value = text({ fixture, prompt });
      if (/\b(?:Full outfit|Headwear,\s*eyewear,\s*and\s*bag)\s*:/i.test(value)) {
        failures.push(`${outfit.zh}/${framing}: legacy wardrobe subheading`);
      }
      if (/\bShe wears\s+(?:She wears\b|Full outfit\s*:)/i.test(value)) {
        failures.push(`${outfit.zh}/${framing}: repeated or nested clothing lead`);
      }
      if (outfit.zh === '黑色波點頭巾透紗套裝') {
        assert.ok(value.includes('fitted black polka-dot headscarf'), `${fixture.id}: visible headwear retained`);
        if (framing === '全身鏡頭 (Full Body Shot)') {
          assert.ok(value.includes('black slouchy knee-high boots'), `${fixture.id}: footwear retained`);
          assert.ok(value.includes('black thin-strap shoulder bag'), `${fixture.id}: bag retained`);
        }
      }
    }
  }
  assert.equal(failures.length, 0, `${failures.length} failures across ${outfits.length * 3} cases:\n${failures.slice(0,10).join('\n')}`);
});

test('custom identities are preserved verbatim without card fallback or standalone body injection', () => {
  for (const item of generated.filter(entry => entry.fixture.kind === 'custom')) {
    const value = text(item);
    assert.ok(value.includes(item.fixture.runtimeOptions.characterProfilePrompt), item.fixture.id);
    assert.doesNotMatch(value, /Character Profile Card|Permanent identity anchors/i, item.fixture.id);
  }
});

test('ordinary standing, mirror-selfie and supine outputs preserve the complete canonical Pose Composer source', () => {
  for (const item of generated.filter(entry => entry.fixture.kind === 'canonical-pose')) {
    const value = text(item);
    const pose = item.prompt.structured.Character.find(source => source.meta?.tags?.includes('pose_composer'));
    assert.ok(pose?.en, `${item.fixture.id}: canonical source exists`);
    assert.ok(value.includes(pose.en), `${item.fixture.id}: canonical pose omitted or rewritten`);
    assert.equal(count(value, pose.en), 1, `${item.fixture.id}: canonical pose duplicated`);
  }
});

const facialFixtures = nanoBananaFacialFeaturesFixtures();
const facialGenerated = facialFixtures.map(fixture => ({ fixture, prompt: generateNanoBananaFixture(fixture) }));
const facialBaseline = JSON.parse(readFileSync(new URL('./nanoBananaFacialFeaturesProtectedBaseline.json', import.meta.url), 'utf8'));

test('Nano facial expansion preserves all other texts and data and changes only effective generic face phrases', () => {
  assert.equal(facialFixtures.length, 1078);
  assert.equal(facialBaseline.length, facialFixtures.length);
  for (let index = 0; index < facialGenerated.length; index += 1) {
    const { fixture, prompt } = facialGenerated[index];
    const before = facialBaseline[index];
    assert.equal(fixture.id, before.id);
    assert.equal(fixture.seed, before.seed);
    const fields = protectedNanoBananaOutputs(prompt);
    assert.deepEqual(Object.keys(fields), Object.keys(before.fields));
    for (const [field, value] of Object.entries(fields)) {
      assert.equal(hash(value), before.fields[field], `${fixture.id}: protected ${field} changed`);
    }
    assert.equal(hash(normalizedNanoBananaFacialText(prompt, fixture, NANO_BANANA_FACIAL_FEATURES)),
      before.nanoBananaPrompt, `${fixture.id}: Nano changed outside its effective generic face phrase`);
    if (before.unchangedNanoBananaPrompt) {
      assert.equal(hash(prompt.nanoBananaPrompt), before.unchangedNanoBananaPrompt,
        `${fixture.id}: excluded or silent Nano output changed`);
    }
  }
});

test('six Nano facial mappings retain the approved geometry and omit styling and permanent identities', () => {
  const faces = controlOptions('facialFeaturesId').filter(option => option.en !== 'none');
  assert.deepEqual(Object.keys(NANO_BANANA_FACIAL_FEATURES).sort(), faces.map(face => face.id).sort());
  const expected = {
    '韓系偶像臉': ['small refined oval face', 'almond eyes', 'straight brows', 'slender', 'softly shaped lips'],
    '日系清透臉': ['soft natural oval face', 'almond eyes', 'natural brows', 'small straight nose', 'softly defined lips'],
    '甜美可愛臉': ['soft natural oval face', 'round eyes', 'curved brows', 'small rounded nose', 'softly shaped lips'],
    '冷感高級臉': ['refined elongated oval face', 'upturned eyes', 'straight brows', 'defined bridge', 'sculpted lips'],
    '成熟性感臉': ['softly defined oval face', 'upturned eyes', 'arched brows', 'clear medium bridge', 'full shaped lips'],
    '混血立體臉': ['dimensional elongated oval face', 'deep-set round eyes', 'defined brows', 'high narrow bridge', 'sculpted lips'],
  };
  for (const face of faces) {
    const description = NANO_BANANA_FACIAL_FEATURES[face.id];
    const words = description.trim().split(/\s+/).length;
    assert.ok(words >= 40 && words <= 60, `${face.zh}: expected 40–60 words, got ${words}`);
    for (const phrase of expected[face.zh]) assert.ok(description.includes(phrase), `${face.zh}: ${phrase}`);
    assert.doesNotMatch(description, /\b(?:skin|complexion|freckles|mole|makeup|lipstick|eyeliner|blush|gloss|hair|hairstyle|gaze|smile|expression|pose|lighting|camera|film|childlike|baby|doll|seductive|sexy)\b/i, face.zh);
    assert.doesNotMatch(description, /\b(?:blue|gray|grey|hazel|brown|green|crimson|red|porcelain|olive)\b/i,
      `${face.zh}: eye color, complexion or lip styling`);
    for (const card of cards) {
      assert.ok(!description.includes(card.profile.facialGeometry), `${face.zh}: entire unselected card geometry`);
      assert.ok(!description.includes(card.profile.distinctiveFeatures), `${face.zh}: card identity anchors`);
      assert.ok(!description.toLowerCase().includes(card.zh.toLowerCase()), `${face.zh}: card name`);
    }
  }
  const japanese = nanoBananaFacialDescription(faces.find(face => face.zh === '日系清透臉'));
  const cute = nanoBananaFacialDescription(faces.find(face => face.zh === '甜美可愛臉'));
  assert.equal(japanese.split(',')[0], cute.split(',')[0], 'cute preserves the same natural oval outline');
  assert.doesNotMatch(cute, /soft rounded face|full cheeks|rounded chin|round face/i);
  const dimensional = nanoBananaFacialDescription(faces.find(face => face.zh === '混血立體臉'));
  assert.doesNotMatch(dimensional, /almond eyes/i);
});

test('Nano facial mapper handles canonical role IDs, silence, effective-source omission and unknown fallback', () => {
  const face = controlOptions('facialFeaturesId').find(option => option.zh === '韓系偶像臉');
  const before = JSON.stringify(face);
  const expected = NANO_BANANA_FACIAL_FEATURES[face.id];
  for (const suffix of ['', ':a', ':b']) {
    assert.equal(nanoBananaFacialDescription({ ...face, id: `${face.id}${suffix}` }), expected);
  }
  assert.equal(nanoBananaFacialDescription(face, ''), '', 'latent selected ID does not override omitted effective text');
  assert.equal(nanoBananaFacialDescription(), '');
  assert.equal(nanoBananaFacialDescription(null), '');
  assert.equal(nanoBananaFacialDescription(controlOptions('facialFeaturesId').find(option => option.zh === '全無')), '');
  assert.equal(nanoBananaFacialDescription({ id: 'unknown-face', en: 'authored legacy facial identity' }), 'authored legacy facial identity');
  assert.equal(nanoBananaFacialDescription({ id: 'unknown-face', en: 'unused' }, 'resolved fallback'), 'resolved fallback');
  assert.equal(JSON.stringify(face), before, 'mapper does not mutate shared catalog item');
});

test('Nano faces appear once in their own role across crops, all 49 duo combinations, fixed sets, outfits and poses', () => {
  assert.equal(facialGenerated.filter(item => item.fixture.kind === 'facial-crop').length, 77);
  assert.equal(facialGenerated.filter(item => item.fixture.kind === 'facial-duo').length, 49);
  for (const { fixture, prompt } of facialGenerated) {
    const value = prompt.nanoBananaPrompt;
    const sources = effectiveNanoBananaFacialSources(prompt, fixture);
    for (const source of sources) {
      const description = nanoBananaFacialDescription(source);
      const role = source.meta?.characterRole;
      const own = role ? value.split('\n\n').find(part =>
        part.includes(role === 'a' ? 'The first woman' : 'The second woman')) || '' : value;
      assert.equal(count(own, description), 1, `${fixture.id}: ${role || 'single'} face occurrence`);
      assert.ok(!own.includes(source.en), `${fixture.id}: old generic face prose leaked`);
    }
    assert.doesNotMatch(value, /\[nano-face:|\bnone\b/i, `${fixture.id}: internal marker or silent sentinel leaked`);
    if (fixture.kind.startsWith('facial-excluded-')) {
      assert.equal(sources.length, 0, `${fixture.id}: identity takeover remains excluded`);
      for (const description of Object.values(NANO_BANANA_FACIAL_FEATURES)) {
        assert.ok(!value.includes(description), `${fixture.id}: generic expansion injected into authored identity`);
      }
    }
  }
});
