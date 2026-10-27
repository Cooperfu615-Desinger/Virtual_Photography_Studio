// Keep ordinary output payloads unchanged. Only an explicit capture import
// persists the resolved full-body source (not a reconstruction from prose).
const fullBodySources = new WeakMap();
const IDENTITY_KEYS = new Set(['bodyTypeId', 'facialFeaturesId', 'skinDetailsId', 'hairstyleId', 'hairStylingStateId', 'hairColorId']);
const WARDROBE_KEY = /^(?:specialOutfit|completeLookPalette|outfitPreset|top|dress|pants|skirt|bottom|outerwear|legwear|shoes|headphones|faceCovering|headAccessory|eyewear|earrings|nosePiercing|lipPiercing|neckAccessory|wristAccessory|ring|waistAccessory).*Id$/;
export const isImportedPersonKey = key => IDENTITY_KEYS.has(key) || WARDROBE_KEY.test(key) && !/[AB](?:Color|Pattern|Fit|Opening|Styling)?Id$/.test(key);
const copy = value => JSON.parse(JSON.stringify(value));
const selectionOnly = value => Object.fromEntries(Object.entries(value || {}).filter(([key, entry]) =>
  isImportedPersonKey(key) && (typeof entry === 'string' || Array.isArray(entry) && entry.every(id => typeof id === 'string'))));
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const sourceItem = item => record(item) && typeof item.id === 'string' && typeof item.en === 'string' && record(item.meta);

// An ID-less swatch is valid only when it is the exact resolved leaf of the
// same role's paired palette. Keep the established ID-bearing path unchanged.
const paletteLeaf = value => record(value)
  && Object.keys(value).every(key => ['zh', 'en', 'hex'].includes(key))
  && typeof value.zh === 'string' && Boolean(value.zh.trim())
  && typeof value.en === 'string' && Boolean(value.en.trim())
  && (!Object.hasOwn(value, 'hex') || typeof value.hex === 'string' && /^#[a-f0-9]{6}$/i.test(value.hex));

function wardrobeColorSource(key, item, colors) {
  if (item === null || record(item) && typeof item.id === 'string') return true;
  if (!paletteLeaf(item)) return false;
  const match = key.match(/^(top|dress|bottom|outfitPreset)([AB]?)(Color|PrimaryColor|ContrastColor)$/);
  if (!match || match[1] !== 'outfitPreset' && match[3] !== 'Color') return false;
  const palette = colors[`topBottomPalette${match[2]}`];
  if (!record(palette) || typeof palette.id !== 'string' || !palette.id.trim()
    || ['none', 'random'].includes(palette.id)) return false;
  const source = palette[match[1] === 'bottom' || match[3] === 'ContrastColor' ? 'bottomColor' : 'topColor'];
  return paletteLeaf(source) && ['zh', 'en', 'hex'].every(field =>
    Object.hasOwn(item, field) === Object.hasOwn(source, field) && item[field] === source[field]);
}

export function normalizeImportedPerson(value) {
  if (!record(value) || value.version !== 1 || typeof value.fullBodyPrompt !== 'string' || !value.fullBodyPrompt.trim()
    || !Array.isArray(value.character) || !value.character.every(sourceItem)
    || !Array.isArray(value.wardrobe) || !value.wardrobe.every(sourceItem)
    || !record(value.wardrobeColors) || !record(value.selection) || !record(value.rawSelection)) return null;
  if (!Object.entries(value.wardrobeColors).every(([key, item]) => wardrobeColorSource(key, item, value.wardrobeColors))) return null;
  return copy({ version: 1, character: value.character, wardrobe: value.wardrobe, wardrobeColors: value.wardrobeColors,
    selection: selectionOnly(value.selection), rawSelection: selectionOnly(value.rawSelection), fullBodyPrompt: value.fullBodyPrompt });
}

export function registerFullBodyImportSource(prompt, { character, wardrobe, wardrobeColors, locks }) {
  const fullBodyPrompt = prompt.extraPrompts.find(entry => entry.id === 'full-body-character')?.text;
  const snapshot = normalizeImportedPerson({ version: 1, character, wardrobe, wardrobeColors: copy(wardrobeColors),
    selection: prompt.selection, rawSelection: locks, fullBodyPrompt });
  if (snapshot) fullBodySources.set(prompt.structured, snapshot);
}

export function getFullBodyImportSource(prompt) {
  const source = prompt?.structured && fullBodySources.get(prompt.structured);
  return source ? copy(source) : null;
}

export function prepareCaptureEntry(profile, standardPrompt) {
  return { ...profile, availablePerson: getFullBodyImportSource(standardPrompt) };
}

export function importCapturePerson(profile) {
  return { ...profile, personSource: 'full-body', importedPerson: normalizeImportedPerson(profile.availablePerson) || normalizeImportedPerson(profile.importedPerson) };
}

export function activeImportedPerson(locks) {
  return locks.captureMode === 'observation' && locks.observationCapture?.personSource === 'full-body'
    ? normalizeImportedPerson(locks.observationCapture.importedPerson) : null;
}

export function importedPersonLocks(person) {
  return { ...person.selection, subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none',
    characterCardHairVariantId: 'default', characterCardEyewearMode: 'default', characterCardWardrobeMode: 'full-default',
    characterCardWardrobeLayerIds: [], characterCardPromptOverride: '' };
}
