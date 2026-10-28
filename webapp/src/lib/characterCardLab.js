import { getCharacterWardrobeLayers } from './engine/characterWardrobeSources.js';
export const CHARACTER_CARD_LAYER_KEYS = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'headAccessory',
  'eyewear',
  'earrings',
  'neckAccessory',
  'wristAccessory',
  'ring',
  'waistAccessory',
];

export const CHARACTER_CARD_LAYER_LABELS = {
  top: '上身',
  bottom: '下身',
  dress: '連身',
  outerwear: '外套',
  shoes: '鞋子',
  headAccessory: '頭飾',
  eyewear: '眼鏡',
  earrings: '耳環',
  neckAccessory: '脖子飾品',
  wristAccessory: '手部飾品',
  ring: '戒指',
  waistAccessory: '腰部飾品',
};

export const EYEWEAR_MODE_OPTIONS = [
  { id: 'default', label: '預設' },
  { id: 'glasses-on', label: '戴眼鏡' },
  { id: 'glasses-off', label: '不戴眼鏡' },
];

const DEFAULT_EYEWEAR_LAYER = {
  key: 'eyewear',
  label: CHARACTER_CARD_LAYER_LABELS.eyewear,
  prompt: 'natural thin-frame eyeglasses with transparent lenses, worn normally on the face',
};

const CHARACTER_CARD_EXTENSIONS = {
  'character-rika': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    disabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-rika'),
  },
  'character-48g': {
    hairTags: ['medium', 'lob', 'straight', 'bangs', 'black-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-48g'),
  },
  'character-philippa': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'dip-dye'],
    wardrobeLayers: getCharacterWardrobeLayers('character-philippa'),
  },
  'character-lily': {
    hairTags: ['long', 'wavy', 'bangs', 'red-hair', 'dyed'],
    wardrobeLayers: getCharacterWardrobeLayers('character-lily'),
  },
  'character-hinata': {
    hairTags: ['bob', 'medium', 'wavy', 'dyed', 'center-part'],
    wardrobeLayers: getCharacterWardrobeLayers('character-hinata'),
  },
  'character-rin': {
    hairTags: ['short', 'bob', 'curly', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-rin'),
  },
  'character-sakura': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair', 'pink-streaks'],
    wardrobeLayers: getCharacterWardrobeLayers('character-sakura'),
  },
  'character-sui': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-sui'),
  },
  'character-yuri': {
    hairTags: ['long', 'straight', 'bangs', 'black-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-yuri'),
  },
  'character-hina': {
    hairTags: ['short', 'bob', 'bangs', 'dyed'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-hina'),
  },
  'character-yuna': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-yuna'),
  },
  'character-eleanor': {
    hairTags: ['long', 'wavy', 'black-hair', 'center-part'],
    wardrobeLayers: getCharacterWardrobeLayers('character-eleanor'),
  },
  'character-olivia': {
    hairTags: ['long', 'wavy', 'brown-hair', 'center-part'],
    wardrobeLayers: getCharacterWardrobeLayers('character-olivia'),
  },
  'character-jiwoo': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'dyed', 'highlight-streaks'],
    wardrobeLayers: getCharacterWardrobeLayers('character-jiwoo'),
  },
  'character-chihiro': {
    hairTags: ['long', 'wavy', 'dyed', 'center-part'],
    wardrobeLayers: getCharacterWardrobeLayers('character-chihiro'),
  },
  'character-koto': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-koto'),
  },
  'character-mei': {
    hairTags: ['long', 'wavy', 'dyed', 'center-part', 'ombre'],
    wardrobeLayers: getCharacterWardrobeLayers('character-mei'),
  },
  'character-rei': {
    hairTags: ['long', 'black-hair', 'center-part', 'updo'],
    enabledHairVariants: ['low-ponytail', 'high-ponytail', 'half-up', 'loose-bun'],
    wardrobeLayers: getCharacterWardrobeLayers('character-rei'),
  },
  'character-amy': {
    hairTags: ['long', 'straight', 'bangs', 'brown-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-amy'),
  },
  'character-jiyoo': {
    hairTags: ['long', 'straight', 'black-hair', 'center-part'],
    wardrobeLayers: getCharacterWardrobeLayers('character-jiyoo'),
  },
  'character-yui': {
    hairTags: ['short', 'bob', 'bangs', 'blonde', 'center-part'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-yui'),
  },
  'character-nana': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-nana'),
  },
  'character-emily': {
    hairTags: ['long', 'black-hair', 'center-part', 'updo'],
    enabledHairVariants: ['low-ponytail', 'high-ponytail', 'half-up', 'loose-bun'],
    wardrobeLayers: getCharacterWardrobeLayers('character-emily'),
  },
  'character-shiori': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair'],
    wardrobeLayers: getCharacterWardrobeLayers('character-shiori'),
  },
  'character-natsuki': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-natsuki'),
  },
  'character-minji': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-minji'),
  },
  'character-manami': {
    hairTags: ['short', 'bob', 'bangs', 'black-hair', 'dyed', 'highlight-streaks'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-manami'),
  },
  'character-grace': {
    hairTags: ['long', 'straight', 'bangs', 'black-hair', 'updo'],
    wardrobeLayers: getCharacterWardrobeLayers('character-grace'),
  },
  'character-kaori': {
    hairTags: ['medium', 'bob', 'straight', 'black-hair', 'center-part'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: getCharacterWardrobeLayers('character-kaori'),
  },
  'character-soyeon': {
    hairTags: ['medium', 'bob', 'straight', 'bangs', 'black-hair', 'updo'],
    wardrobeLayers: getCharacterWardrobeLayers('character-soyeon'),
  },
  'character-bora': {
    hairTags: ['medium-long', 'medium', 'wavy', 'bangs', 'brown-hair', 'updo'],
    enabledHairVariants: ['low-ponytail', 'half-up', 'loose-bun'],
    wardrobeLayers: getCharacterWardrobeLayers('character-bora'),
  },
  'character-seulgi': {
    hairTags: ['medium', 'wavy', 'bangs', 'brown-hair'],
    enabledHairVariants: ['half-up', 'loose-bun'],
    wardrobeLayers: getCharacterWardrobeLayers('character-seulgi'),
  },
  'character-miku': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'updo'],
    enabledHairVariants: ['low-ponytail', 'high-ponytail', 'twin-tails', 'half-up', 'loose-bun'],
    wardrobeLayers: getCharacterWardrobeLayers('character-miku'),
  },
};

export const HAIR_VARIANT_OPTIONS = [
  { id: 'default', label: '保留預設髮型', compatibleTags: [], prompt: 'keep the original character hair identity unchanged' },
  { id: 'low-ponytail', label: '低馬尾', compatibleTags: ['long', 'medium-long'], prompt: 'keep the original hair identity, gather the hair length into a loose low ponytail while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'high-ponytail', label: '高馬尾', compatibleTags: ['long'], prompt: 'keep the original hair identity, tie the hair into a high ponytail with natural volume while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'twin-tails', label: '雙馬尾', compatibleTags: ['long'], prompt: 'keep the original hair identity, style the length into loose twin tails while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'half-up', label: '半綁髮', compatibleTags: ['long', 'medium', 'lob'], prompt: 'keep the original hair identity, pull the upper hair into a soft half-up style while leaving the remaining length visible' },
  { id: 'loose-bun', label: '鬆散髮髻', compatibleTags: ['long', 'medium-long'], prompt: 'keep the original hair identity, gather the hair into a loose relaxed bun with natural loose strands around the face' },
  { id: 'tucked-behind-ears', label: '耳後收整', compatibleTags: ['short', 'bob', 'lob', 'medium'], prompt: 'keep the original hair identity, tuck part of the hair behind the ears while preserving length, bangs, color, and texture' },
  { id: 'outward-flipped-ends', label: '髮尾外翹', compatibleTags: ['short', 'bob', 'lob', 'medium'], prompt: 'keep the original hair identity, style the ends with a subtle outward flip and polished shape' },
  { id: 'slicked-back-wet-look', label: '油頭濕髮感', compatibleTags: ['short', 'bob'], prompt: 'keep the original hair identity, style the hair into a sleek wet-look swept-back finish while preserving the character hair color and cut length' },
  { id: 'highlight-streaks', label: '增加局部挑染', compatibleTags: ['long', 'medium', 'lob', 'bob', 'short'], prompt: 'keep the original hair identity, add subtle localized highlight streaks without changing the base hair color or haircut' },
  { id: 'hair-clips', label: '局部髮夾', compatibleTags: ['long', 'medium', 'lob', 'bob', 'short', 'bangs'], prompt: 'keep the original hair identity, add small understated hair clips near one side while preserving the original silhouette' },
];

function normalizeLayerMap(layerMap = {}) {
  return Object.fromEntries(
    CHARACTER_CARD_LAYER_KEYS
      .map((key) => {
        const prompt = String(layerMap[key] || '').trim();
        if (!prompt) return null;
        return [key, { key, label: CHARACTER_CARD_LAYER_LABELS[key], prompt }];
      })
      .filter(Boolean)
  );
}

function copyArray(value) {
  return Array.isArray(value) ? [...value] : [];
}

function normalizeVariantInput(rawVariant) {
  return rawVariant && typeof rawVariant === 'object' && !Array.isArray(rawVariant) ? rawVariant : {};
}

function normalizeEyewearMode(value) {
  return EYEWEAR_MODE_OPTIONS.some((option) => option.id === value) ? value : 'default';
}

export function getEffectiveCharacterCardWardrobeLayers(card, variant = {}) {
  const layerMap = { ...(card?.defaultWardrobeLayers || {}) };
  const eyewearMode = normalizeEyewearMode(variant.eyewearMode);

  if (eyewearMode === 'glasses-on' && !layerMap.eyewear) {
    layerMap.eyewear = { ...DEFAULT_EYEWEAR_LAYER };
  }
  if (eyewearMode === 'glasses-off') {
    delete layerMap.eyewear;
  }

  return layerMap;
}

export function getCharacterCardOptions(lockControls = []) {
  const control = lockControls.find((item) => item.key === 'characterProfileId');
  return (control?.options || [])
    .filter((option) => option.specialSubject === 'character-profile')
    .map((option) => {
      const extension = CHARACTER_CARD_EXTENSIONS[option.id] || {};
      return {
        id: option.id,
        label: option.zh,
        sourceOption: option,
        identityAndBody: option.profile?.identityAndBody || '',
        legacyIdentityAndBody: option.profile?.legacyIdentityAndBody || option.profile?.identityAndBody || '',
        facialGeometry: option.profile?.facialGeometry || '',
        eyeSignature: option.profile?.eyeSignature || '',
        noseSignature: option.profile?.noseSignature || '',
        mouthSignature: option.profile?.mouthSignature || '',
        skinSignature: option.profile?.skinSignature || '',
        makeup: option.profile?.makeup || '',
        body: option.profile?.body || '',
        distinctiveFeatures: option.profile?.distinctiveFeatures || '',
        // Legacy aliases now point to their corresponding structured fields.
        face: option.profile?.facialGeometry || '',
        skin: option.profile?.skinSignature || '',
        baseHair: option.profile?.hair || '',
        photographicDirection: option.profile?.photographicDirection || '',
        primaryReferenceImage: option.meta?.referenceImage || '',
        hairTags: copyArray(extension.hairTags),
        enabledHairVariants: copyArray(extension.enabledHairVariants),
        disabledHairVariants: copyArray(extension.disabledHairVariants),
        defaultWardrobeLayers: normalizeLayerMap(extension.wardrobeLayers),
      };
    });
}

export function resolveCharacterCard(cards, id) {
  return cards.find((card) => card.id === id) || cards[0] || null;
}

export function getCompatibleHairVariants(card) {
  if (!card) return HAIR_VARIANT_OPTIONS.filter((variant) => variant.id === 'default');
  const tags = new Set(card.hairTags || []);
  const enabled = new Set(card.enabledHairVariants || []);
  const disabled = new Set(card.disabledHairVariants || []);
  return HAIR_VARIANT_OPTIONS.filter((variant) => {
    if (disabled.has(variant.id)) return false;
    if (variant.id === 'default' || enabled.has(variant.id)) return true;
    return variant.compatibleTags.some((tag) => tags.has(tag));
  });
}

export function createEmptyCharacterCardVariant(cards = []) {
  const card = cards[0] || null;
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, { eyewearMode: 'default' });
  return {
    characterProfileId: card?.id || '',
    hairVariantId: 'default',
    eyewearMode: 'default',
    includedWardrobeLayers: card ? Object.keys(layerMap) : [],
    promptOverrideText: '',
    outputMode: 'included-wardrobe',
  };
}

export function normalizeCharacterCardVariant(rawVariant = {}, cards = []) {
  const variant = normalizeVariantInput(rawVariant);
  const fallback = createEmptyCharacterCardVariant(cards);
  const characterProfileId = resolveCharacterCard(cards, variant.characterProfileId)?.id || fallback.characterProfileId;
  const card = resolveCharacterCard(cards, characterProfileId);
  const hairVariants = getCompatibleHairVariants(card);
  const hairVariantId = hairVariants.some((hairVariant) => hairVariant.id === variant.hairVariantId)
    ? variant.hairVariantId
    : 'default';
  const eyewearMode = normalizeEyewearMode(variant.eyewearMode);
  const effectiveLayerMap = getEffectiveCharacterCardWardrobeLayers(card, { eyewearMode });
  const validLayers = new Set(Object.keys(effectiveLayerMap));
  const rawIncludedLayerSet = new Set(
    variant.outputMode === 'pure-character'
      ? []
      : Array.isArray(variant.includedWardrobeLayers)
        ? variant.includedWardrobeLayers
        : fallback.includedWardrobeLayers
  );
  if (eyewearMode === 'glasses-on') rawIncludedLayerSet.add('eyewear');
  if (eyewearMode === 'glasses-off') rawIncludedLayerSet.delete('eyewear');
  const includedWardrobeLayers = CHARACTER_CARD_LAYER_KEYS.filter((key) => validLayers.has(key) && rawIncludedLayerSet.has(key));
  const outputMode = variant.outputMode === 'pure-character' && includedWardrobeLayers.length === 0
    ? 'pure-character'
    : 'included-wardrobe';

  return {
    characterProfileId,
    hairVariantId,
    eyewearMode,
    includedWardrobeLayers,
    promptOverrideText: String(variant.promptOverrideText || ''),
    outputMode,
  };
}

function cleanSentence(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function selectedHairVariant(card, variant) {
  return getCompatibleHairVariants(card).find((item) => item.id === variant.hairVariantId)
    || HAIR_VARIANT_OPTIONS[0];
}

function selectedLayers(card, variant) {
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, variant);
  const included = new Set(variant.includedWardrobeLayers || []);
  if (variant.outputMode === 'pure-character') return [];
  return CHARACTER_CARD_LAYER_KEYS
    .filter((key) => included.has(key) && layerMap[key])
    .map((key) => layerMap[key]);
}

function buildLayerText(layers) {
  return layers.map((layer) => `${layer.label}: ${layer.prompt}`).join('\n');
}

function normalizePromptOverrideText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function characterAdultIdentity(card) {
  return String(card.identityAndBody || '').replace(/\s+/g, ' ').trim()
    .match(/^a\s+20-year-old\s+adult\s+[^,]*?\bwoman\b/i)?.[0] || '';
}

function buildCharacterIdentityText(card, hairVariant) {
  const structuredIdentityLines = [
    `Facial geometry:\n${cleanSentence(card.facialGeometry)}`,
    `Eye signature:\n${cleanSentence(card.eyeSignature)}`,
    `Nose signature:\n${cleanSentence(card.noseSignature)}`,
    `Mouth signature:\n${cleanSentence(card.mouthSignature)}`,
    `Skin signature:\n${cleanSentence(card.skinSignature)}`,
    `Makeup:\n${cleanSentence(card.makeup)}`,
    `Body:\n${cleanSentence(card.body)}`,
    `Permanent identity anchors:\n${cleanSentence(card.distinctiveFeatures)}`,
  ].filter((line) => !line.endsWith(':\n'));

  return [
    `Character Profile Card:\n${card.label}`,
    ...(structuredIdentityLines.length > 0
      ? [
        ...(characterAdultIdentity(card) ? [cleanSentence(characterAdultIdentity(card).replace(/^a /i, 'A '))] : []),
        ...structuredIdentityLines,
      ]
      : [`Identity and body:\n${cleanSentence(card.identityAndBody)}`]),
    `Hair:\n${cleanSentence(`${card.baseHair}, ${hairVariant.prompt}`)}`,
    `Photographic direction:\n${cleanSentence(card.photographicDirection || 'photorealistic editorial portrait, coherent facial identity, natural photographic detail')}`,
  ].join('\n\n');
}

export function buildCharacterCardPromptBundle(cards = [], rawVariant = {}) {
  const variant = normalizeCharacterCardVariant(rawVariant, cards);
  const card = resolveCharacterCard(cards, variant.characterProfileId);
  if (!card) return { card: null, variant, outputs: [], summary: '' };

  const hairVariant = selectedHairVariant(card, variant);
  const layers = selectedLayers(card, variant);
  const wardrobeText = buildLayerText(layers);
  const wardrobeBlock = wardrobeText ? `\n\nWardrobe layers:\n${wardrobeText}` : '';
  const promptOverrideText = normalizePromptOverrideText(variant.promptOverrideText);
  const promptOverrideBlock = promptOverrideText
    ? `\n\nTemporary character-card override:\n${cleanSentence(promptOverrideText)}`
    : '';
  const promptOverridePhrase = promptOverrideText
    ? `temporary character-card override, supplemental character direction: ${promptOverrideText}`
    : '';
  const identityText = buildCharacterIdentityText(card, hairVariant);
  const summary = `${card.label} / ${hairVariant.label}${layers.length ? ` / ${layers.map((layer) => layer.label).join('、')}` : ' / 純人物'}`;
  const gpt = [
    'Image Type:\nCreate a photorealistic character-card portrait reference.',
    `Subject:\n${identityText}${wardrobeBlock}${promptOverrideBlock}`,
    'Camera Look:\nclean realistic character reference, neutral production-ready detail, consistent identity, realistic facial proportions',
  ].join('\n\n');
  const grokZImage = cleanSentence([
    `Natural photorealistic character reference of ${card.label}`,
    characterAdultIdentity(card),
    card.distinctiveFeatures,
    card.skinSignature,
    card.body,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `wearing ${layers.map((layer) => layer.prompt).join(', ')}` : '',
    promptOverridePhrase,
    card.photographicDirection,
  ].filter(Boolean).join(', '));
  const ai = cleanSentence([
    `Photorealistic character reference of ${card.label}`,
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `wearing ${layers.map((layer) => layer.prompt).join(', ')}` : 'pure character identity and hair reference',
    promptOverridePhrase,
  ].filter(Boolean).join(', '));
  const headshot = cleanSentence([
    `headshot reference of ${card.label}`,
    'tight face-and-hair portrait, neutral clean background, consistent facial identity',
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    promptOverridePhrase,
    'clear skin texture, makeup, eyes, nose, lips, jawline, and hairline',
  ].filter(Boolean).join(', '));
  const fourView = cleanSentence([
    `four-view character reference sheet for ${card.label}`,
    'one image containing front view, left 45-degree view, side profile view, and back view',
    'same exact woman in every panel, matched facial proportions, consistent hair silhouette',
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `use the included wardrobe layers consistently: ${layers.map((layer) => layer.prompt).join(', ')}` : 'no clothing design emphasis, neutral shoulders and body reference',
    promptOverridePhrase,
  ].filter(Boolean).join(', '));
  const fullBody = cleanSentence([
    `full-body character reference of ${card.label}`,
    'neutral studio reference, clear standing full-body view, same exact identity',
    card.identityAndBody,
    `permanent identity anchors: ${card.distinctiveFeatures}`,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `included wardrobe layers: ${layers.map((layer) => layer.prompt).join(', ')}` : 'pure body and hair reference without fixed outfit design',
    promptOverridePhrase,
  ].filter(Boolean).join(', '));

  return {
    card,
    variant,
    summary,
    outputs: [
      { id: 'gpt', label: 'GPT Prompt', value: gpt },
      { id: 'grok-z-image', label: 'Z-Image Prompt', value: grokZImage },
      { id: 'ai', label: 'AI Prompt', value: ai },
      { id: 'headshot', label: 'Headshot Prompt', value: headshot },
      { id: 'four-view', label: 'Four-View Prompt', value: fourView },
      { id: 'full-body-reference', label: 'Full-Body Reference Prompt', value: fullBody },
    ],
  };
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizePromptOutput(output, fallbackOutput) {
  const label = String(output?.label || fallbackOutput.label || '');
  const value = String(output?.value || output?.text || fallbackOutput.value || '');
  return { id: fallbackOutput.id, label, value };
}

function mergePromptOutputs(fallbackOutputs, rawOutputs) {
  const outputMap = new Map(
    Array.isArray(rawOutputs)
      ? rawOutputs
        .filter((output) => isPlainObject(output) && typeof output.id === 'string')
        .map((output) => [output.id, output])
      : []
  );

  return fallbackOutputs.map((fallbackOutput) => (
    outputMap.has(fallbackOutput.id)
      ? normalizePromptOutput(outputMap.get(fallbackOutput.id), fallbackOutput)
      : fallbackOutput
  ));
}

function promptOutputById(outputs, id) {
  return outputs.find((output) => output.id === id) || null;
}

function buildWardrobeSummary(card, variant) {
  const layers = selectedLayers(card, variant);
  return layers.length ? layers.map((layer) => layer.label).join('、') : '純人物';
}

function mergeBundleVariantInput(rawVariant, bundleVariant, cards) {
  const merged = { ...normalizeVariantInput(rawVariant) };
  if (!isPlainObject(bundleVariant)) return merged;

  const bundleCharacterId = typeof bundleVariant.characterProfileId === 'string'
    ? bundleVariant.characterProfileId.trim()
    : '';
  if (bundleCharacterId && resolveCharacterCard(cards, bundleCharacterId)?.id === bundleCharacterId) {
    merged.characterProfileId = bundleCharacterId;
  }

  const effectiveCard = resolveCharacterCard(cards, merged.characterProfileId);
  const bundleHairId = typeof bundleVariant.hairVariantId === 'string'
    ? bundleVariant.hairVariantId.trim()
    : '';
  if (bundleHairId && getCompatibleHairVariants(effectiveCard).some((hairVariant) => hairVariant.id === bundleHairId)) {
    merged.hairVariantId = bundleHairId;
  }
  if (Array.isArray(bundleVariant.includedWardrobeLayers)) {
    merged.includedWardrobeLayers = bundleVariant.includedWardrobeLayers;
  }
  if (typeof bundleVariant.eyewearMode === 'string') {
    merged.eyewearMode = bundleVariant.eyewearMode;
  }
  if (typeof bundleVariant.promptOverrideText === 'string') {
    merged.promptOverrideText = bundleVariant.promptOverrideText;
  }
  if (bundleVariant.outputMode === 'pure-character' || bundleVariant.outputMode === 'included-wardrobe') {
    merged.outputMode = bundleVariant.outputMode;
  }

  return merged;
}

export function buildCharacterCardSavedCard(cards = [], rawVariant = {}, bundle = null) {
  const inputBundle = isPlainObject(bundle) ? bundle : {};
  const mergedRawVariant = mergeBundleVariantInput(rawVariant, inputBundle.variant, cards);
  const fallbackBundle = buildCharacterCardPromptBundle(cards, mergedRawVariant);
  const effectiveVariant = fallbackBundle.variant;
  const outputs = mergePromptOutputs(fallbackBundle.outputs, inputBundle.outputs);
  const card = fallbackBundle.card || (isPlainObject(inputBundle.card) ? inputBundle.card : null);
  const summary = String(inputBundle.summary || fallbackBundle.summary || '');
  const gpt = promptOutputById(outputs, 'gpt')?.value || '';
  const grokZImage = promptOutputById(outputs, 'grok-z-image')?.value || '';
  const ai = promptOutputById(outputs, 'ai')?.value || '';
  const extraPrompts = outputs
    .filter((output) => !['gpt', 'grok-z-image', 'ai'].includes(output.id))
    .map((output) => ({ id: output.id, label: output.label, text: output.value }));

  return {
    id: `page2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page2',
    sourceLabel: '角色卡',
    date: new Date().toISOString(),
    summary: `角色卡｜${summary}`,
    summaryFields: {
      characterDna: card?.label || '-',
      expressionPose: promptOutputById(outputs, 'headshot')?.label || '-',
      wardrobe: buildWardrobeSummary(card, effectiveVariant),
      sceneLook: '-',
    },
    midjourneyPrompt: ai,
    grokPrompt: gpt,
    zImagePrompt: grokZImage,
    promptLabels: {
      midjourney: 'AI Prompt',
      grok: 'GPT Prompt',
      zImage: 'Z-Image Prompt',
    },
    extraPrompts,
    selection: null,
    structured: {
      'Character Card': [
        { zh: card?.label || '角色卡', en: summary },
      ],
    },
    profile: { ...effectiveVariant },
  };
}

const PAGE1_FULL_LOOK_CLEAR_KEYS = [
  'specialOutfitId',
  'outfitPresetId',
  'outfitPresetColorId',
  'outfitPresetPrimaryColorId',
  'outfitPresetContrastColorId',
  'outfitPresetLockedPaletteId',
  'completeLookPaletteId',
  'topBottomPaletteId',
];

const PAGE1_TOP_CLEAR_KEYS = ['topId', 'topFitId', 'topStylingId', 'topColorId', 'topPatternId'];
const PAGE1_BOTTOM_CLEAR_KEYS = ['pantsId', 'skirtId', 'bottomFitId', 'bottomRiseId', 'bottomColorId', 'bottomPatternId'];
const PAGE1_DRESS_CLEAR_KEYS = ['dressId', 'dressColorId'];

const PAGE1_NONE_LOCK_IDS = {
  specialOutfitId: 'wardrobe:特殊穿搭-special-outfits:全無:0',
  outfitPresetId: 'outfit-preset-none',
  outfitPresetColorId: 'none',
  outfitPresetPrimaryColorId: 'none',
  outfitPresetContrastColorId: 'none',
  outfitPresetLockedPaletteId: 'none',
  completeLookPaletteId: 'none',
  topBottomPaletteId: 'none',
  dressId: 'wardrobe:連身-dresses:全無:0',
  dressColorId: 'none',
  topId: 'wardrobe:上身-tops:全無:0',
  topFitId: 'none',
  topStylingId: 'none',
  topColorId: 'none',
  topPatternId: 'wardrobe:上身圖案-top-surface-design:全無:0',
  pantsId: 'wardrobe:褲裝-pants:全無:0',
  skirtId: 'wardrobe:裙裝-skirts:全無:0',
  bottomFitId: 'none',
  bottomRiseId: 'none',
  bottomColorId: 'none',
  bottomPatternId: 'wardrobe:下身圖案-bottom-surface-design:全無:0',
  outerwearId: 'wardrobe:外套-outerwear:全無:0',
  outerwearFitId: 'wardrobe:外套版型-outerwear-fit:全無:0',
  outerwearColorId: 'none',
  outerwearPatternId: 'wardrobe:外套圖案-outerwear-surface-design:全無:0',
  outerwearOpeningId: 'wardrobe:外套開合-outerwear-opening:全無:0',
  outerwearStylingId: 'wardrobe:外套穿法-outerwear-styling:全無:0',
  shoesId: 'wardrobe:鞋款-shoes:全無:0',
  shoesColorId: 'none',
  headAccessoryId: 'wardrobe:頭部配件-head-accessories:全無:0',
  headAccessoryColorId: 'none',
  eyewearId: 'wardrobe:眼鏡-eyewear:全無:0',
  eyewearColorId: 'wardrobe:眼鏡配色-eyewear-color:全無:0',
  eyewearPlacementId: 'none',
  earringsId: 'wardrobe:耳環-earrings:全無:0',
  neckAccessoryId: 'wardrobe:頸部-neck-accessories:全無:0',
  waistAccessoryId: 'wardrobe:腰部配件-waist-accessories:全無:0',
};

const PAGE1_LAYER_CLEAR_KEYS = {
  top: [...PAGE1_TOP_CLEAR_KEYS, ...PAGE1_DRESS_CLEAR_KEYS, ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  bottom: [...PAGE1_BOTTOM_CLEAR_KEYS, ...PAGE1_DRESS_CLEAR_KEYS, ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  dress: [...PAGE1_DRESS_CLEAR_KEYS, ...PAGE1_TOP_CLEAR_KEYS, ...PAGE1_BOTTOM_CLEAR_KEYS, ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  outerwear: ['outerwearId', 'outerwearFitId', 'outerwearColorId', 'outerwearPatternId', 'outerwearOpeningId', 'outerwearStylingId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  shoes: ['shoesId', 'shoesColorId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  headAccessory: ['headAccessoryId', 'headAccessoryColorId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  eyewear: ['eyewearId', 'eyewearColorId', 'eyewearPlacementId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  earrings: ['earringsId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  neckAccessory: ['neckAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  wristAccessory: ['wristAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  ring: ['ringId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
  waistAccessory: ['waistAccessoryId', ...PAGE1_FULL_LOOK_CLEAR_KEYS],
};

const PAGE1_EYEWEAR_CLEAR_KEYS = PAGE1_LAYER_CLEAR_KEYS.eyewear;

export function buildPage1LocksFromCharacterCardVariant(prevLocks = {}, rawVariant = {}, cards = []) {
  const variant = normalizeCharacterCardVariant(rawVariant, cards);
  const appliedLayerIds = variant.outputMode === 'pure-character' ? [] : variant.includedWardrobeLayers;
  const next = {
    ...prevLocks,
    subjectCount: '1',
    specialSubjectId: 'none',
    characterProfileId: variant.characterProfileId,
    characterCardHairVariantId: variant.hairVariantId,
    characterCardEyewearMode: variant.eyewearMode,
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: [...appliedLayerIds],
    characterCardPromptOverride: variant.promptOverrideText,
  };

  appliedLayerIds.forEach((layerKey) => {
    (PAGE1_LAYER_CLEAR_KEYS[layerKey] || []).forEach((lockKey) => {
      next[lockKey] = PAGE1_NONE_LOCK_IDS[lockKey] ?? (Array.isArray(next[lockKey]) ? [] : '');
    });
  });

  if (variant.eyewearMode === 'glasses-off') {
    PAGE1_EYEWEAR_CLEAR_KEYS.forEach((lockKey) => {
      next[lockKey] = PAGE1_NONE_LOCK_IDS[lockKey] ?? (Array.isArray(next[lockKey]) ? [] : '');
    });
  }

  return next;
}
