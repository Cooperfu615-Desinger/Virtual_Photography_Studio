import { getLockControls } from '../engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { nanoBananaFixtures, nanoBananaFixtureLocks } from './nanoBananaFixtures.js';

const facialPrefix = 'character:五官特徵-facial-features:';
const canonicalId = id => String(id || '').replace(/:(?:a|b)$/, '');
const hasIdentity = id => Boolean(id && id !== 'none');

export function nanoBananaFacialFeaturesFixtures() {
  const controls = getLockControls();
  const options = key => controls.find(control => control.key === key)?.options ?? [];
  const concrete = key => options(key).filter(option => !['none', 'random'].includes(option.id)
    && !['全無', '隨機'].includes(option.zh));
  const faces = options('facialFeaturesId');
  const fixtures = nanoBananaFixtures();
  const add = (id, selections, runtimeOptions, metadata = {}) => fixtures.push({
    id: `facial:${id}`, seed: `nano-banana-facial:${id}`,
    locks: nanoBananaFixtureLocks({ subjectCount: '1', ...selections }),
    ...(runtimeOptions ? { runtimeOptions } : {}), ...metadata,
  });
  const full = { byZh: '全身鏡頭 (Full Body Shot)' };

  for (const face of faces) for (const framing of options('framingId')) {
    add(`crop:${face.id}:${framing.id}`, { facialFeaturesId: face.id, framingId: framing.id },
      undefined, { kind: 'facial-crop', faceId: face.id });
  }
  for (const first of faces) for (const second of faces) {
    add(`duo:${first.id}:${second.id}`, {
      subjectCount: '2', facialFeaturesAId: first.id, facialFeaturesBId: second.id, framingId: full,
    }, undefined, { kind: 'facial-duo', faceAId: first.id, faceBId: second.id });
  }
  for (const face of concrete('facialFeaturesId')) {
    for (const [id, identity] of [
      ['geometry', 'An adult woman with a long oval face, close-set dark brown eyes, a straight narrow nose and a thin upper lip'],
      ['legacy', 'An adult woman with an oval face, a small rounded chin and shoulder-length black hair'],
    ]) add(`custom:${face.id}:${id}`, { facialFeaturesId: face.id, framingId: full },
      { characterProfilePrompt: identity }, { kind: 'facial-excluded-custom' });
    for (const special of concrete('specialSubjectId')) {
      add(`dedicated:${special.id}:${face.id}`, { specialSubjectId: special.id,
        facialFeaturesId: face.id, framingId: full }, undefined, { kind: 'facial-excluded-dedicated' });
    }
    for (const card of CHARACTER_PROFILE_OPTIONS.filter(option => option.specialSubject === 'character-profile')) {
      for (const mode of ['full-default', 'selected-layers']) {
        add(`card:${card.id}:${mode}:${face.id}`, { characterProfileId: card.id,
          characterCardWardrobeMode: mode, characterCardWardrobeLayerIds: mode === 'selected-layers' ? ['top'] : [],
          facialFeaturesId: face.id, framingId: full }, undefined, { kind: 'facial-excluded-card' });
      }
    }
    for (const fixed of concrete('fixedCompositionSetId')) {
      add(`fixed:${fixed.id}:${face.id}`, { fixedCompositionSetId: fixed.id,
        facialFeaturesId: face.id, framingId: full }, undefined, { kind: 'facial-fixed' });
    }
    for (const outfit of concrete('specialOutfitId').slice(0, 3)) {
      add(`outfit:${outfit.id}:${face.id}`, { specialOutfitId: outfit.id,
        facialFeaturesId: face.id, framingId: full }, undefined, { kind: 'facial-outfit' });
    }
    for (const [id, pose] of [
      ['standing', { poseBaseId: 'standing', poseArrangementId: 'standing-natural' }],
      ['mirror', { poseBaseId: 'sitting', poseArrangementId: 'sitting-leg-cross', poseAnchorId: 'sitting-bed', posePropId: 'selfie-mirror-phone-visible' }],
      ...['lying-bed-surface', 'lying-tatami-surface', 'lying-dry-bathtub'].map(surface => [surface,
        { poseBaseId: 'lying', poseOrientationId: 'lying-supine', poseArrangementId: 'lying-body-natural-stretch', poseAnchorId: surface }]),
    ]) add(`pose:${id}:${face.id}`, { ...pose, facialFeaturesId: face.id, framingId: full },
      undefined, { kind: 'facial-pose' });
  }
  return fixtures;
}

// Resolve source ownership from public data, never from latent identity locks.
export function effectiveNanoBananaFacialSources(prompt, fixture) {
  const selection = prompt.selection || {};
  if (hasIdentity(selection.characterProfileId) || hasIdentity(selection.specialSubjectId)
    || (selection.subjectCount !== '2' && fixture.runtimeOptions?.characterProfilePrompt)) return [];
  return (prompt.structured?.Character || []).filter(source => source.id?.startsWith(facialPrefix)
    && source.en && source.en !== 'none' && source.zh !== '全無');
}

export function normalizedNanoBananaFacialText(prompt, fixture, descriptions = {}) {
  let value = prompt.nanoBananaPrompt;
  const seen = new Set();
  for (const source of effectiveNanoBananaFacialSources(prompt, fixture)) {
    const id = canonicalId(source.id);
    if (seen.has(id)) continue;
    seen.add(id);
    const marker = `[nano-face:${id}]`;
    const mapped = descriptions[id];
    if (mapped && value.includes(mapped)) {
      value = value.split(mapped).join(marker);
      value = value.replace(`Her facial features include ${marker}`, `Her facial features are ${marker}`);
    } else value = value.split(source.en).join(marker);
  }
  return value;
}
