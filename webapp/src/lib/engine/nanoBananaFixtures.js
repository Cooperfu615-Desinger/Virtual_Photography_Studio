import { createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { naturalFixtureLocks } from './midjourneyNaturalFixtures.js';

export const NANO_BANANA_CARD_FRAMINGS = Object.freeze([
  '半臉傾斜特寫',
  '頭部主導近景',
  '中景鏡頭 (Medium Shot)',
  '牛仔中景 (Cowboy Shot)',
  '全身鏡頭 (Full Body Shot)',
]);

export const nanoBananaFixtureLocks = naturalFixtureLocks;

export function generateNanoBananaFixture(fixture) {
  return generatePrompts(1, fixture.locks, [], {
    ...fixture.runtimeOptions,
    random: createSeededRandom(fixture.seed),
  })[0];
}

// The six existing text outputs and all existing public prompt metadata are
// independent of the newly added Nano Banana field. Runtime IDs/dates are omitted.
export function protectedNanoBananaOutputs(prompt) {
  const extra = id => prompt.extraPrompts?.find(item => item.id === id)?.text ?? null;
  return {
    grokPrompt: prompt.grokPrompt,
    zImagePrompt: prompt.zImagePrompt,
    midjourneyPrompt: prompt.midjourneyPrompt,
    chestUpPortraitPrompt: extra('chest-up-portrait'),
    chestUpMjPortraitPrompt: extra('chest-up-mj-portrait'),
    fullBodyCharacterPrompt: extra('full-body-character'),
    extraPrompts: prompt.extraPrompts,
    selection: prompt.selection,
    structured: prompt.structured,
    summary: prompt.summary,
    summaryFields: prompt.summaryFields,
  };
}

export function nanoBananaFixtures() {
  const controls = getLockControls();
  const options = key => controls.find(control => control.key === key)?.options ?? [];
  const effectiveOptions = key => options(key).filter(option =>
    !['none', 'random', 'outfit-preset-none'].includes(option.id) && !['全無', '隨機'].includes(option.zh));
  const fixtures = [];
  const add = (id, selections, runtimeOptions, metadata = {}) => fixtures.push({
    id, seed: `nano-banana-protected:${id}`,
    locks: naturalFixtureLocks({ subjectCount: '1', ...selections }),
    ...(runtimeOptions ? { runtimeOptions } : {}),
    ...metadata,
  });
  const full = { byZh: '全身鏡頭 (Full Body Shot)' };

  for (const card of CHARACTER_PROFILE_OPTIONS.filter(option => option.specialSubject === 'character-profile')) {
    for (const mode of ['full-default', 'selected-layers']) {
      for (const framing of NANO_BANANA_CARD_FRAMINGS) {
        add(`card:${card.id}:${mode}:${framing}`, {
          characterProfileId: card.id,
          characterCardWardrobeMode: mode,
          characterCardWardrobeLayerIds: mode === 'selected-layers' ? ['top'] : [],
          pantsId: { byZh: '直筒牛仔褲' }, shoesId: { byZh: '樂福鞋' },
          framingId: { byZh: framing },
        }, undefined, { kind: 'card', cardId: card.id });
      }
    }
  }
  for (const face of options('facialFeaturesId')) {
    add(`generic-face:${face.id}`, {
      facialFeaturesId: face.id, bodyTypeId: { byZh: '高挑時裝模特' }, framingId: full,
    }, undefined, { kind: 'generic-face', faceId: face.id });
  }
  for (const set of effectiveOptions('fixedCompositionSetId')) {
    add(`fixed:${set.id}`, { fixedCompositionSetId: set.id, framingId: full }, undefined, { kind: 'fixed' });
  }
  for (const subject of effectiveOptions('specialSubjectId')) {
    add(`dedicated:${subject.id}`, { specialSubjectId: subject.id, framingId: full }, undefined, { kind: 'dedicated' });
  }
  for (const [id, a, b] of [
    ['different', '冷感高級臉', '甜美可愛臉'],
    ['same', '韓系偶像臉', '韓系偶像臉'],
    ['first-only', '混血立體臉', '全無'],
    ['second-only', '全無', '日系清透臉'],
  ]) {
    add(`duo:${id}`, {
      subjectCount: '2', facialFeaturesAId: { byZh: a }, facialFeaturesBId: { byZh: b },
      bodyTypeAId: { byZh: '高挑時裝模特' }, bodyTypeBId: { byZh: '小隻精緻身形' },
      framingId: full,
    }, undefined, { kind: 'duo' });
  }
  for (const [id, identity] of [
    ['geometry', 'An adult woman with a long oval face, close-set dark brown eyes, a straight narrow nose and a thin upper lip'],
    ['legacy', 'An adult woman with an oval face, a small rounded chin and shoulder-length black hair'],
  ]) add(`custom:${id}`, { framingId: full }, { characterProfilePrompt: identity }, { kind: 'custom' });
  for (const surface of ['lying-bed-surface', 'lying-tatami-surface', 'lying-dry-bathtub']) {
    add(`supine:${surface}`, {
      poseBaseId: 'lying', poseOrientationId: 'lying-supine',
      poseArrangementId: 'lying-body-natural-stretch', poseAnchorId: surface, framingId: full,
    }, undefined, { kind: 'canonical-pose' });
  }
  add('canonical:standing', {
    poseBaseId: 'standing', poseArrangementId: 'standing-natural', framingId: full,
  }, undefined, { kind: 'canonical-pose' });
  add('canonical:sitting-mirror', {
    poseBaseId: 'sitting', poseArrangementId: 'sitting-leg-cross', poseAnchorId: 'sitting-bed',
    posePropId: 'selfie-mirror-phone-visible', framingId: full,
  }, undefined, { kind: 'canonical-pose' });
  for (const key of ['outfitPresetId', 'specialOutfitId', 'dressId']) {
    const option = effectiveOptions(key)[0];
    if (option) add(`wardrobe:${key}:${option.id}`, { [key]: option.id, framingId: full }, undefined, { kind: 'wardrobe' });
  }
  for (let index = 0; index < 12; index += 1) {
    add(`seeded:${index}`, { subjectCount: index % 3 === 0 ? '2' : '1' }, undefined, { kind: 'seeded' });
  }
  return fixtures;
}
