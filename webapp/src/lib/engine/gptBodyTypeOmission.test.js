import assert from 'node:assert/strict';
import test from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildRestoreLocks, parseLocksFromStandardPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';
import { BODY_TYPE_CATALOG_V2 } from './bodyTypeCatalogFixtures.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { restoreGptIndependentBodySource } from './bodyTypeLegacyTestSupport.js';
import {
  assertFullBodyCharacterBody,
  assertFullBodyCharacterHasNoBody,
  countBodySource,
  stripFullBodyCharacterBodySource,
} from './fullBodyCharacterBodyTestSupport.js';
import { polishPublicPromptText } from './publicPromptPolish.js';
// Public prompt polish (publicPromptPolish.js) capitalizes sentence starts. A
// catalog source keeps every word; accept only its exact polished letter case.
const sourceForms = (source) => [...new Set([source, polishPublicPromptText(source), source[0] + polishPublicPromptText(source).slice(1)])];
const includesSource = (text, source) => sourceForms(source).some(form => text.includes(form));

const controls = getLockControls();
const option = (key, zh) => controls.find(control => control.key === key).options.find(item => item.zh === zh).id;
const allNoneLocks = () => {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(item => item.zh === '全無' || item.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  return { ...locks, subjectCount: '1', framingId: option('framingId', '全身鏡頭 (Full Body Shot)') };
};
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('gpt-body-type-omission-v1') })[0];
const extra = (prompt, id) => prompt.extraPrompts.find(item => item.id === id)?.text || '';
// Main GPT and GPT chest-up omit the standalone body. The full-body character
// reference keeps it under the approved 2026-10-14 exception.
const gptOutputs = prompt => [prompt.grokPrompt, extra(prompt, 'chest-up-portrait')];
const fullBody = prompt => extra(prompt, 'full-body-character');
const allGptOutputs = prompt => [...gptOutputs(prompt), fullBody(prompt)];
const otherOutputs = prompt => [prompt.zImagePrompt];

test('all six independent body selections keep main/chest GPT equal to none and add only the body to full-body', () => {
  for (const framing of ['臉部特寫', '胸上特寫', '中景鏡頭 (Medium Shot)', '全身鏡頭 (Full Body Shot)']) {
    const base = { ...allNoneLocks(), framingId: option('framingId', framing) };
    const none = generate(base);
    for (const body of BODY_TYPE_CATALOG_V2) {
      const prompt = generate({ ...base, bodyTypeId: body.id });
      assert.deepEqual(gptOutputs(prompt), gptOutputs(none), `${body.zh}/${framing}: only independent body text is omitted`);
      assertFullBodyCharacterBody(prompt, body.en, `${body.zh}/${framing}`);
      assert.equal(fullBody(stripFullBodyCharacterBodySource(prompt)), fullBody(none),
        `${body.zh}/${framing}: full-body differs from none only by the inserted body sentence`);
      assert.equal(prompt.selection.bodyTypeId, body.id);
      assert.ok(prompt.structured.Character.some(item => item.id === body.id && item.en === body.en));
      for (const text of otherOutputs(prompt)) assert.ok(includesSource(text, body.en), `${body.zh}/${framing}: other output retains the complete source`);
      for (const text of gptOutputs(prompt)) {
        assert.match(text, /20-year-old adult woman/);
        assert.doesNotMatch(text, /cup bust|bust–waist–hip|height \d|soft flesh bulges/i);
      }
      assert.match(fullBody(prompt), /20-year-old adult woman/);
    }
  }
});

test('GPT omission and the full-body body exception leave selected clothing, main canonical pose and the chest pose unchanged', () => {
  const base = {
    ...allNoneLocks(), topId: option('topId', '棉質細肩背心'), pantsId: option('pantsId', '直筒牛仔褲'),
    poseBaseId: 'standing', poseArrangementId: 'standing-natural',
  };
  const none = generate(base);
  for (const body of BODY_TYPE_CATALOG_V2) {
    const prompt = generate({ ...base, bodyTypeId: body.id });
    assert.deepEqual(gptOutputs(prompt), gptOutputs(none));
    assertFullBodyCharacterBody(prompt, body.en, body.zh);
    assert.equal(fullBody(stripFullBodyCharacterBodySource(prompt)), fullBody(none), `${body.zh}: full-body adds only the body`);
    const canonicalPose = prompt.structured.Character.find(item => item.meta?.tags?.includes('pose_composer'))?.en;
    assert.ok(canonicalPose);
    assert.ok(prompt.grokPrompt.includes(canonicalPose));
    assert.match(extra(prompt, 'chest-up-portrait'), /standing pose with a relaxed upright posture/);
    assert.match(extra(prompt, 'full-body-character'), /cotton camisole top/);
    assert.match(extra(prompt, 'full-body-character'), /Straight-leg jeans/);
    assert.match(extra(prompt, 'chest-up-portrait'), /4:5/);
    assert.match(extra(prompt, 'full-body-character'), /9:16/);
  }
});

test('duo GPT omits both independently selected body sources while Z and AI preserve role order', () => {
  const base = { ...allNoneLocks(), subjectCount: '2' };
  const none = generate(base);
  for (const [index, body] of BODY_TYPE_CATALOG_V2.entries()) {
    const other = BODY_TYPE_CATALOG_V2[(index + 1) % BODY_TYPE_CATALOG_V2.length];
    const prompt = generate({ ...base, bodyTypeAId: body.id, bodyTypeBId: other.id });
    assert.equal(prompt.grokPrompt, none.grokPrompt, `${body.zh}/${other.zh}: GPT omission`);
    assert.match(prompt.grokPrompt, /Two 20-year-old adult women/);
    assert.equal(prompt.selection.bodyTypeAId, body.id);
    assert.equal(prompt.selection.bodyTypeBId, other.id);
    for (const text of [prompt.zImagePrompt]) {
      assert.ok(text.includes(body.en));
      assert.ok(text.includes(other.en));
      assert.ok(text.indexOf(body.en) < text.indexOf(other.en));
    }
  }
});

test('all character cards preserve their own body and permanent identity sources in GPT', () => {
  for (const card of CHARACTER_PROFILE_OPTIONS.filter(item => item.profile?.body)) {
    const base = { ...allNoneLocks(), characterProfileId: card.id };
    const none = generate(base);
    const selected = generate({ ...base, bodyTypeId: BODY_TYPE_CATALOG_V2[0].id });
    assert.deepEqual(allGptOutputs(selected), allGptOutputs(none), `${card.zh}: independent Body Type must not change the card`);
    assertFullBodyCharacterHasNoBody(selected, BODY_TYPE_CATALOG_V2.map(item => item.en), card.zh);
    for (const text of [selected.grokPrompt, extra(selected, 'full-body-character')]) {
      assert.ok(includesSource(text, card.profile.body), `${card.zh}: card body`);
      assert.ok(includesSource(text, card.profile.distinctiveFeatures), `${card.zh}: permanent identity`);
    }
    const chest = extra(selected, 'chest-up-portrait');
    assert.ok(includesSource(chest, card.profile.bodyProjection.chestUp), `${card.zh}: card chest body projection`);
    assert.ok(includesSource(chest, card.profile.distinctiveFeatures), `${card.zh}: chest permanent identity`);
  }
});

test('Saved Cards restore omitted body IDs while old GPT text still imports and new GPT text does not invent them', () => {
  for (const body of BODY_TYPE_CATALOG_V2) {
    const prompt = generate({ ...allNoneLocks(), bodyTypeId: body.id });
    const restored = deserializeFavoritePrompt(serializeFavoritePrompt(prompt));
    assert.equal(buildRestoreLocks(restored.selection, controls).bodyTypeId, body.id);
    const old = parseLocksFromStandardPrompt(`Subject:\nThe subject is one 20-year-old Japanese or Korean female portrait subject. ${body.en}.`, controls);
    assert.equal(old.locks.bodyTypeId, body.id);
    const current = parseLocksFromStandardPrompt(prompt.grokPrompt, controls);
    assert.ok(!current.locks.bodyTypeId, `${body.zh}: body-free GPT cannot restore the omitted selection`);
  }
});

test('historical GPT inverse uses only the selected ordinary body and keeps none, card and nonmatching text unchanged', () => {
  const body = BODY_TYPE_CATALOG_V2[0];
  const prompt = generate({ ...allNoneLocks(), bodyTypeId: body.id });
  const restored = restoreGptIndependentBodySource(prompt);
  for (const text of allGptOutputs(restored)) assert.ok(includesSource(text, body.en));
  // Full-body already renders the body; the inverse must not insert it twice.
  assert.equal(fullBody(restored), fullBody(prompt));
  assert.equal(countBodySource(fullBody(restored), body.en), 1);
  assert.deepEqual(otherOutputs(restored), otherOutputs(prompt));
  assert.deepEqual(restored.selection, prompt.selection);
  assert.deepEqual(restored.structured, prompt.structured);
  assert.deepEqual(restoreGptIndependentBodySource(restored), restored);

  const none = generate(allNoneLocks());
  assert.deepEqual(restoreGptIndependentBodySource(none), none);
  const card = generate({ ...allNoneLocks(), characterProfileId: 'character-hinata' });
  assert.deepEqual(restoreGptIndependentBodySource(card), card);
  const foreign = {
    ...prompt,
    grokPrompt: 'Subject:\nA different identity with arbitrary proportions.',
    extraPrompts: prompt.extraPrompts.map(item => ({ ...item, text: 'No matching ordinary subject.' })),
  };
  assert.deepEqual(restoreGptIndependentBodySource(foreign), foreign);
  const special = {
    ...prompt,
    structured: { ...prompt.structured, Character: prompt.structured.Character.map(item => item.id === 'base-character-1'
      ? { ...item, meta: { ...item.meta, tags: [...item.meta.tags, 'special_subject'] } } : item) },
  };
  assert.deepEqual(restoreGptIndependentBodySource(special), special);
});

test('historical single inverse restores body after the complete adult and accessory sentence before other Subject fragments', () => {
  const body = BODY_TYPE_CATALOG_V2[0];
  const prompt = generate({ ...allNoneLocks(), bodyTypeId: body.id, facialFeaturesId: option('facialFeaturesId', '韓系偶像臉') });
  const adultLead = 'The subject is one 20-year-old adult woman';
  const accessorized = {
    ...prompt,
    grokPrompt: prompt.grokPrompt.replace(`${adultLead}.`, `${adultLead} with silver earrings measuring 1.5 cm.`),
  };
  const restored = restoreGptIndependentBodySource(accessorized);
  assert.ok(restored.grokPrompt.includes(`${adultLead} with silver earrings measuring 1.5 cm. ${polishPublicPromptText(body.en)}. Young beautiful Korean idol face`));
  assert.deepEqual(otherOutputs(restored), otherOutputs(accessorized));
});

test('historical duo inverse restores first Has sources and missing body-only roles without inventing none roles', () => {
  const bodyA = BODY_TYPE_CATALOG_V2[0];
  const bodyB = BODY_TYPE_CATALOG_V2[1];
  const base = { ...allNoneLocks(), subjectCount: '2', bodyTypeAId: bodyA.id, bodyTypeBId: bodyB.id };
  for (const overrides of [
    {},
    { topAId: option('topAId', '棉質細肩背心'), topBId: option('topBId', '棉質細肩背心') },
    { facialFeaturesAId: option('facialFeaturesAId', '韓系偶像臉'), facialFeaturesBId: option('facialFeaturesBId', '日系清透臉') },
    { specialOutfitAId: option('specialOutfitAId', '米色細肩背心蕾絲胸衣工裝寬褲造型') },
  ]) {
    const prompt = generate({ ...base, ...overrides });
    const restored = restoreGptIndependentBodySource(prompt);
    assert.ok(restored.grokPrompt.includes(`Woman 1:\nHas ${bodyA.en}`));
    assert.ok(restored.grokPrompt.includes(`Woman 2:\nHas ${bodyB.en}`));
    assert.ok(restored.grokPrompt.indexOf(bodyA.en) < restored.grokPrompt.indexOf(bodyB.en));
    assert.equal(restored.grokPrompt.split(bodyA.en).length - 1, 1);
    assert.equal(restored.grokPrompt.split(bodyB.en).length - 1, 1);
    assert.deepEqual(restoreGptIndependentBodySource(restored), restored);
    assert.deepEqual(otherOutputs(restored), otherOutputs(prompt));
    assert.deepEqual(restored.selection, prompt.selection);
    assert.deepEqual(restored.structured, prompt.structured);
  }
  const oneBody = generate({ ...base, bodyTypeAId: option('bodyTypeAId', '全無') });
  const restored = restoreGptIndependentBodySource(oneBody);
  assert.ok(!restored.grokPrompt.includes('Woman 1:'));
  assert.ok(restored.grokPrompt.includes(`Woman 2:\nHas ${bodyB.en}.`));
  const none = generate({ ...allNoneLocks(), subjectCount: '2' });
  assert.deepEqual(restoreGptIndependentBodySource(none), none);
});

test('full-body body inverse removes only the inserted sentence and leaves none, card, duo and special subjects unchanged', () => {
  const body = BODY_TYPE_CATALOG_V2[0];
  const prompt = generate({ ...allNoneLocks(), bodyTypeId: body.id });
  const stripped = stripFullBodyCharacterBodySource(prompt);
  assert.equal(countBodySource(fullBody(stripped), body.en), 0);
  assert.deepEqual({ ...stripped, extraPrompts: null }, { ...prompt, extraPrompts: null });
  assert.deepEqual(stripped.extraPrompts.filter(item => item.id !== 'full-body-character'),
    prompt.extraPrompts.filter(item => item.id !== 'full-body-character'));
  assert.deepEqual(stripFullBodyCharacterBodySource(stripped), stripped);
  for (const unchanged of [
    generate(allNoneLocks()),
    generate({ ...allNoneLocks(), characterProfileId: 'character-hinata', bodyTypeId: body.id }),
    generate({ ...allNoneLocks(), subjectCount: '2', bodyTypeAId: body.id, bodyTypeBId: body.id }),
  ]) assert.deepEqual(stripFullBodyCharacterBodySource(unchanged), unchanged);
  const special = {
    ...prompt,
    structured: { ...prompt.structured, Character: prompt.structured.Character.map(item => item.id === 'base-character-1'
      ? { ...item, meta: { ...item.meta, tags: [...item.meta.tags, 'special_subject'] } } : item) },
  };
  assert.deepEqual(stripFullBodyCharacterBodySource(special), special);
  const duplicated = {
    ...prompt,
    extraPrompts: prompt.extraPrompts.map(item => item.id === 'full-body-character'
      ? { ...item, text: `${item.text} ${body.en}.` } : item),
  };
  assert.throws(() => stripFullBodyCharacterBodySource(duplicated), /unexpected full-body Body Type placement/);
});
