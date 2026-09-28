// Test-only compatibility bridge for immutable pre-bathroom snapshots.
// Reverse only the exact reviewed bathroom source and mirror block; never
// rewrite arbitrary imported or custom scene prose.

const NEW_LOCATION_EN = 'a frequently used and lived-in bathroom vanity with a large wall-mounted mirror above the sink';
const NEW_LOCATION_MJ = `${NEW_LOCATION_EN[0].toUpperCase()}${NEW_LOCATION_EN.slice(1)}`;
const NEW_MIRROR_TEXT = 'The mirror clearly reflects the same woman from a physically consistent angle, with matching appearance, outfit, and pose. The reflection shows her front when her back faces the camera, her back when her front faces the camera, and a corresponding side view at side angles. Light post-shower condensation gathers around the mirror edges while the center stays clear. Her skin and hair are damp; her clothing looks visibly soaked while retaining its original sheerness and coverage. Show the full mirror frame whenever the selected crop allows.';

const LEGACY_GPT_SCENES = Object.freeze({
  half: 'The portrait takes place in bathroom vanity area, sink counter, faucet.',
  medium: 'The portrait takes place in bathroom vanity area, sink counter, faucet, mirror edge, tiled wall.',
  full: 'The portrait takes place in bathroom vanity area, sink counter, faucet, mirror edge, tiled wall, toiletry bottles, reflective cabinet surface, compact washroom corner.',
});

const LEGACY_GPT_SCENE_BY_FRAMING = Object.freeze({
  'camera:景別構圖-framing:半臉傾斜特寫:1': LEGACY_GPT_SCENES.half,
  'camera:景別構圖-framing:中景鏡頭-medium-shot:6': LEGACY_GPT_SCENES.medium,
  'camera:景別構圖-framing:全身鏡頭-full-body-shot:8': LEGACY_GPT_SCENES.full,
});

export function normalizeBathroomVanitySceneForLegacy(scene, selection = {}) {
  const expected = `The portrait takes place in ${NEW_LOCATION_EN}. ${NEW_MIRROR_TEXT}`;
  if (!scene || scene !== expected) return scene;
  return LEGACY_GPT_SCENE_BY_FRAMING[selection?.framingId] || scene;
}

function normalizeGptScene(text, selection) {
  return text.replace(/(Scene:\n)([^\n]+)(?=\n\n[A-Z][^\n]*:\n|$)/,
    (_, prefix, scene) => `${prefix}${normalizeBathroomVanitySceneForLegacy(scene, selection)}`);
}

function normalizeZScene(text) {
  const current = `The setting is ${NEW_LOCATION_EN}. ${NEW_MIRROR_TEXT}`;
  return text.replace(current, 'The setting is bathroom vanity area, sink counter, faucet.');
}

function normalizeMjScene(text) {
  const current = `The setting is ${NEW_LOCATION_MJ}. ${NEW_MIRROR_TEXT}`;
  if (!text.includes(current)) return text;
  const normalized = text.replace(current, 'The setting is Bathroom vanity area.');
  const wardrobeSentence = normalized.match(/\bWearing [^.]*\./)?.[0];
  return wardrobeSentence
    ? normalized.replace(wardrobeSentence, `${wardrobeSentence} Sink counter, faucet, mirror edge.`)
    : normalized;
}

function normalizeChestUpGptScene(text) {
  const current = `The portrait takes place in ${NEW_LOCATION_EN}. ${NEW_MIRROR_TEXT}`;
  return text.replace(`Scene:\n${current}`, 'Scene:\nThe portrait takes place in bathroom vanity area, sink counter, faucet.');
}

function normalizeChestUpMjScene(text) {
  const current = `The setting is ${NEW_LOCATION_MJ}. ${NEW_MIRROR_TEXT}`;
  return text.replace(current, 'The setting is Bathroom vanity area, sink counter, faucet, mirror edge.');
}

export function normalizeBathroomVanityMirrorForLegacy(text, field = 'zImagePrompt', selection = {}) {
  if (!text) return text;
  if (field === 'grokPrompt') return normalizeGptScene(text, selection);
  if (field === 'zImagePrompt') return normalizeZScene(text);
  if (field === 'midjourneyPrompt') return normalizeMjScene(text);
  if (field === 'chestUpPortraitPrompt') return normalizeChestUpGptScene(text);
  if (field === 'chestUpMjPortraitPrompt') return normalizeChestUpMjScene(text);
  return text;
}

export { LEGACY_GPT_SCENES };
