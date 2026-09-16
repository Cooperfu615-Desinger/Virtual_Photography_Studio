// Test-only compatibility bridge for immutable pre-bathroom snapshots.
// The production source intentionally adds a full mirror and post-shower
// humidity to this location. Historical camera/visibility matrices predate
// that wording, so reverse only the exact reviewed source here; never rewrite
// arbitrary imported or custom scene prose.

const NEW_GPT_PREFIX = 'The portrait takes place in slightly humid post-shower bathroom vanity, full wall-mounted mirror behind her above the sink facing the camera, sparse edge condensation with a clear central reflection';
const NEW_Z_PREFIX = 'The setting is slightly humid post-shower bathroom vanity, full wall-mounted mirror behind her above the sink facing the camera, sparse edge condensation with a clear central reflection';
const NEW_MJ_PREFIX = 'The setting is Slightly humid post-shower bathroom vanity';
const NEW_MJ_DETAILS = 'Full wall-mounted mirror behind her above the sink facing the camera, sparse edge condensation with a clear central reflection';

const LEGACY_GPT_SCENES = Object.freeze({
  half: 'The portrait takes place in bathroom vanity area, sink counter, faucet.',
  medium: 'The portrait takes place in bathroom vanity area, sink counter, faucet, mirror edge, tiled wall.',
  full: 'The portrait takes place in bathroom vanity area, sink counter, faucet, mirror edge, tiled wall, toiletry bottles, reflective cabinet surface, compact washroom corner.',
});

export function normalizeBathroomVanitySceneForLegacy(scene) {
  if (!scene || !scene.startsWith(NEW_GPT_PREFIX)) return scene;
  const match = scene.match(new RegExp(`^${NEW_GPT_PREFIX}(, sink counter and faucet, tiled wall(?:, toiletry bottles, reflective cabinet surface)?)?\\.\\s+The full mirror behind her accurately reflects [^.]+\\.$`));
  if (!match) return scene;
  const tail = match[1] || '';
  if (tail.includes('toiletry bottles')) return LEGACY_GPT_SCENES.full;
  if (tail.includes('tiled wall')) return LEGACY_GPT_SCENES.medium;
  return LEGACY_GPT_SCENES.half;
}

function normalizeGptScene(text) {
  return text.replace(/(Scene:\n)([^\n]+)(?=\n\n[A-Z][^\n]*:\n|$)/, (_, prefix, scene) => `${prefix}${normalizeBathroomVanitySceneForLegacy(scene)}`);
}

function normalizeZScene(text) {
  const pattern = new RegExp(`${NEW_Z_PREFIX}\\.\\s+The full mirror behind her accurately reflects [^.]+\\.`);
  return text.replace(pattern, 'The setting is bathroom vanity area, sink counter, faucet.');
}

function normalizeMjScene(text) {
  const pattern = new RegExp(`${NEW_MJ_PREFIX}\\.\\s+The full mirror behind her accurately reflects [^.]+\\.`);
  const normalized = text.replace(pattern, 'The setting is Bathroom vanity area.');
  const detailsPattern = new RegExp(`${NEW_MJ_DETAILS}(, sink counter and faucet)?\\.`);
  return normalized.replace(detailsPattern, (_, tail) => tail ? 'Sink counter, faucet, mirror edge.' : 'Sink counter, faucet.');
}

function normalizeChestUpGptScene(text) {
  return text.replace(new RegExp(`(Scene:\n)${NEW_GPT_PREFIX}\\.`), '$1The portrait takes place in bathroom vanity area, sink counter, faucet.');
}

function normalizeChestUpMjScene(text) {
  const pattern = new RegExp(`${NEW_MJ_PREFIX.replace('The setting is ', '')}, full wall-mounted mirror behind her above the sink facing the camera, sparse edge condensation with a clear central reflection(, sink counter and faucet)?\\.`);
  return text.replace(pattern, (_, tail) => `Bathroom vanity area, sink counter, faucet${tail ? ', mirror edge' : ''}.`);
}

export function normalizeBathroomVanityMirrorForLegacy(text, field = 'zImagePrompt') {
  if (!text) return text;
  if (field === 'grokPrompt') return normalizeGptScene(text);
  if (field === 'zImagePrompt') return normalizeZScene(text);
  if (field === 'midjourneyPrompt') return normalizeMjScene(text);
  if (field === 'chestUpPortraitPrompt') return normalizeChestUpGptScene(text);
  if (field === 'chestUpMjPortraitPrompt') return normalizeChestUpMjScene(text);
  return text;
}

export { LEGACY_GPT_SCENES };
