import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { CHARACTER_PROFILE_OPTIONS } from './engine/characterProfiles.js';
import {
  buildCharacterCardPromptBundle,
  buildCharacterCardSavedCard,
  buildPage1LocksFromCharacterCardVariant,
  CHARACTER_CARD_LAYER_KEYS,
  createEmptyCharacterCardVariant,
  getCharacterCardOptions,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
  resolveCharacterCard,
} from './characterCardLab.js';

const EXPECTED_NONE_LOCK_IDS = {
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
  eyewearId: 'wardrobe:眼鏡-eyewear:全無:0',
  eyewearColorId: 'wardrobe:眼鏡配色-eyewear-color:全無:0',
  eyewearPlacementId: 'none',
  earringsId: 'wardrobe:耳環-earrings:全無:0',
  neckAccessoryId: 'wardrobe:頸部-neck-accessories:全無:0',
};

function nonNoneOptionId(controlKey) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.id !== 'random' && entry.zh !== '全無');
  assert.ok(option, `Expected non-none option in ${controlKey}`);
  return option.id;
}

function wardrobeIds(prompt) {
  return prompt.structured.Wardrobe.map((item) => item.id || '');
}

function hasNonNoneWardrobePrefix(prompt, prefix) {
  return wardrobeIds(prompt).some((id) => id.startsWith(prefix) && !id.includes(':全無:'));
}

test('character card options are read from PAGE1 character profile control', () => {
  const cards = getCharacterCardOptions(getLockControls());

  assert.equal(cards.length, 17);
  assert.equal(cards[0].id, 'character-rika');
  assert.equal(cards[0].label, '11_Rika');
  assert.match(cards[0].identityAndBody, /soft doll-like indie-girl facial features/i);
  assert.match(cards[0].baseHair, /glossy natural black long wavy hair/i);
  assert.equal(cards[0].defaultWardrobeLayers.top.label, '上身');
  assert.match(cards[0].defaultWardrobeLayers.top.prompt, /cropped white short-sleeve baby tee/i);
  assert.equal(cards[0].defaultWardrobeLayers.bottom.label, '下身');
  assert.match(cards[0].defaultWardrobeLayers.bottom.prompt, /low-rise light-wash blue jeans/i);
  assert.equal(cards[0].defaultWardrobeLayers.neckAccessory.label, '脖子飾品');
  assert.match(cards[0].defaultWardrobeLayers.neckAccessory.prompt, /beaded choker necklace/i);
});

test('all formal character profiles expose separated facial signatures and preserve the legacy identity field', () => {
  const profiles = CHARACTER_PROFILE_OPTIONS.filter((option) => option.specialSubject === 'character-profile');
  assert.equal(profiles.length, 17);

  for (const option of profiles) {
    const profile = option.profile;
    for (const key of [
      'facialGeometry',
      'eyeSignature',
      'noseSignature',
      'mouthSignature',
      'skinSignature',
      'makeup',
      'body',
      'distinctiveFeatures',
    ]) {
      assert.ok(profile[key], `${option.id} must provide ${key}`);
    }
    assert.equal(profile.identityAndBody, profile.legacyIdentityAndBody, `${option.id} must retain the legacy identity string`);
    assert.notEqual(profile.facialGeometry, profile.skinSignature, `${option.id} face and skin must be separate`);
    assert.notEqual(profile.facialGeometry, profile.makeup, `${option.id} face and makeup must be separate`);
    assert.notEqual(profile.skinSignature, profile.makeup, `${option.id} skin and makeup must be separate`);
    assert.equal(profile.distinctiveFeatures.split(',').filter(Boolean).length, 4, `${option.id} must have four compact identity anchors`);
  }
});

test('formal cards preserve permanent identity anchors in PAGE2 and compact PAGE1 prompts', () => {
  const cards = getCharacterCardOptions(getLockControls());

  for (const card of cards) {
    const anchors = card.distinctiveFeatures.split(',').map((value) => value.trim()).filter(Boolean);
    const bundle = buildCharacterCardPromptBundle(cards, {
      characterProfileId: card.id,
      outputMode: 'pure-character',
    });
    const bundleText = bundle.outputs.map((output) => output.value).join('\n');

    for (const anchor of anchors) {
      assert.match(bundleText, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `${card.id} PAGE2 output lost ${anchor}`);
    }

    for (const wardrobeMode of ['full-default', 'selected-layers']) {
      const [page1Prompt] = generatePrompts(1, {
        ...createEmptyLocks(),
        characterProfileId: card.id,
        characterCardWardrobeMode: wardrobeMode,
        characterCardWardrobeLayerIds: [],
      });
      const promptOutputs = {
        Gpt: page1Prompt.grokPrompt,
        AI: page1Prompt.midjourneyPrompt,
        'Grok/Z-Image': page1Prompt.zImagePrompt,
      };

      for (const anchor of anchors) {
        const anchorPattern = new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        for (const [outputLabel, outputText] of Object.entries(promptOutputs)) {
          assert.match(outputText, anchorPattern, `${card.id} ${wardrobeMode} ${outputLabel} prompt lost ${anchor}`);
        }
      }
    }
  }
});

test('high-similarity character pairs keep distinct facial geometry anchors', () => {
  const profiles = Object.fromEntries(CHARACTER_PROFILE_OPTIONS
    .filter((option) => option.profile)
    .map((option) => [option.id, option.profile]));
  const contrasts = [
    ['character-jiwoo', 'character-koto', /heart-oval/i, /balanced oval|shallow double lids/i],
    ['character-yuna', 'character-chihiro', /short rounded chin/i, /long refined oval-heart|slightly close-set/i],
    ['character-sakura', 'character-lily', /very large wide-set blue round eyes/i, /long heart-oval|hazel almond/i],
    ['character-yuri', 'character-hina', /broad soft oval|rounded jaw/i, /near-round oval|full low cheeks/i],
    ['character-olivia', 'character-mei', /warm light-olive skin|firm angled jaw/i, /high cheekbones|angular jaw|brick-red/i],
  ];

  for (const [leftId, rightId, leftPattern, rightPattern] of contrasts) {
    assert.match(profiles[leftId].distinctiveFeatures, leftPattern, `${leftId} should retain its contrast anchor`);
    assert.match(profiles[rightId].distinctiveFeatures, rightPattern, `${rightId} should retain its contrast anchor`);
    assert.notEqual(profiles[leftId].facialGeometry, profiles[rightId].facialGeometry);
    assert.notEqual(profiles[leftId].eyeSignature, profiles[rightId].eyeSignature);
  }
});

test('new character cards expose detailed identity hair and wardrobe layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const newCardIds = [
    'character-yuna',
    'character-eleanor',
    'character-olivia',
    'character-jiwoo',
    'character-chihiro',
    'character-koto',
    'character-mei',
  ];

  for (const id of newCardIds) {
    const card = cards.find((entry) => entry.id === id);
    assert.ok(card, `Expected ${id}`);
    assert.match(card.identityAndBody, /eyes/i);
    assert.match(card.identityAndBody, /nose/i);
    assert.match(card.identityAndBody, /lips/i);
    assert.ok(card.identityAndBody.length > 500, `Expected detailed identity description for ${id}`);
    assert.ok(card.baseHair.length > 100, `Expected detailed hair description for ${id}`);
    assert.match(card.primaryReferenceImage, /\.avif$/i);
  }

  const yuna = cards.find((card) => card.id === 'character-yuna');
  assert.match(yuna.identityAndBody, /rounded almond warm gray-brown eyes/i);
  assert.match(yuna.defaultWardrobeLayers.neckAccessory.prompt, /over-ear headphones/i);

  const eleanor = cards.find((card) => card.id === 'character-eleanor');
  assert.match(eleanor.identityAndBody, /obsidian-black swept horns/i);
  assert.match(eleanor.identityAndBody, /arcane linework tattoos/i);
  assert.equal(eleanor.defaultWardrobeLayers.headAccessory, undefined);

  const olivia = cards.find((card) => card.id === 'character-olivia');
  assert.match(olivia.baseHair, /open center part/i);
  assert.match(olivia.defaultWardrobeLayers.headAccessory.prompt, /black baseball cap/i);
});

test('hair variants use shared compatibility plus per-card overrides', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rika = cards.find((card) => card.id === 'character-rika');
  const hina = cards.find((card) => card.id === 'character-hina');
  const rikaVariants = getCompatibleHairVariants(rika);
  const hinaVariants = getCompatibleHairVariants(hina);

  assert.ok(rikaVariants.some((variant) => variant.id === 'low-ponytail'));
  assert.ok(rikaVariants.some((variant) => variant.id === 'highlight-streaks'));
  assert.equal(rikaVariants.some((variant) => variant.id === 'slicked-back-wet-look'), false);
  assert.ok(hinaVariants.some((variant) => variant.id === 'slicked-back-wet-look'));
  assert.equal(hinaVariants.some((variant) => variant.id === 'twin-tails'), false);
});

test('variant normalization keeps only valid card layers and hair variants', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const normalized = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    eyewearMode: 'glasses-on',
    includedWardrobeLayers: ['top', 'bottom', 'missing-layer'],
    outputMode: 'included-wardrobe',
  }, cards);

  assert.equal(normalized.characterProfileId, 'character-rika');
  assert.equal(normalized.hairVariantId, 'low-ponytail');
  assert.equal(normalized.eyewearMode, 'glasses-on');
  assert.deepEqual(normalized.includedWardrobeLayers, ['top', 'bottom', 'eyewear']);
  assert.equal(normalized.outputMode, 'included-wardrobe');

  const empty = createEmptyCharacterCardVariant(cards);
  assert.equal(empty.characterProfileId, 'character-rika');
  assert.equal(empty.hairVariantId, 'default');
  assert.equal(empty.eyewearMode, 'default');
  assert.deepEqual(empty.includedWardrobeLayers, CHARACTER_CARD_LAYER_KEYS.filter((key) => resolveCharacterCard(cards, 'character-rika').defaultWardrobeLayers[key]));
});

test('eyewear mode can force or suppress character-card eyewear layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const forcedEyewear = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    eyewearMode: 'glasses-on',
    includedWardrobeLayers: ['top'],
  }, cards);
  const suppressedEyewear = normalizeCharacterCardVariant({
    characterProfileId: 'character-yuri',
    eyewearMode: 'glasses-off',
    includedWardrobeLayers: ['top', 'eyewear', 'neckAccessory'],
  }, cards);
  const forcedBundle = buildCharacterCardPromptBundle(cards, forcedEyewear);
  const suppressedBundle = buildCharacterCardPromptBundle(cards, suppressedEyewear);
  const forcedText = forcedBundle.outputs.map((output) => output.value).join('\n');
  const suppressedText = suppressedBundle.outputs.map((output) => output.value).join('\n');

  assert.equal(forcedEyewear.eyewearMode, 'glasses-on');
  assert.ok(forcedEyewear.includedWardrobeLayers.includes('eyewear'));
  assert.match(forcedText, /thin-frame eyeglasses|transparent lenses/i);
  assert.equal(suppressedEyewear.eyewearMode, 'glasses-off');
  assert.deepEqual(suppressedEyewear.includedWardrobeLayers, ['top', 'neckAccessory']);
  assert.doesNotMatch(suppressedText, /round translucent brown acetate eyeglasses/i);
});

test('variant normalization treats null and malformed input as an empty variant', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const fallback = createEmptyCharacterCardVariant(cards);

  assert.deepEqual(normalizeCharacterCardVariant(null, cards), fallback);
  assert.deepEqual(normalizeCharacterCardVariant('not-a-variant', cards), fallback);
});

test('variant normalization de-dupes wardrobe layers into canonical card order', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const normalized = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    includedWardrobeLayers: ['neckAccessory', 'top', 'missing-layer', 'top', 'waistAccessory', 'bottom'],
  }, cards);

  assert.deepEqual(normalized.includedWardrobeLayers, ['top', 'bottom', 'neckAccessory', 'waistAccessory']);
});

test('variant normalization falls back from unknown card and incompatible hair variant ids', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const unknownCard = normalizeCharacterCardVariant({
    characterProfileId: 'missing-card',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
  }, cards);
  const incompatibleHair = normalizeCharacterCardVariant({
    characterProfileId: 'character-hina',
    hairVariantId: 'twin-tails',
    includedWardrobeLayers: ['top', 'bottom'],
  }, cards);

  assert.equal(unknownCard.characterProfileId, 'character-rika');
  assert.equal(unknownCard.hairVariantId, 'low-ponytail');
  assert.deepEqual(unknownCard.includedWardrobeLayers, ['top']);
  assert.equal(incompatibleHair.characterProfileId, 'character-hina');
  assert.equal(incompatibleHair.hairVariantId, 'default');
  assert.deepEqual(incompatibleHair.includedWardrobeLayers, ['top', 'bottom']);
});

test('character card options return shallow copies of mutable arrays', () => {
  const firstRead = getCharacterCardOptions(getLockControls());
  firstRead[0].hairTags.push('mutated-tag');
  firstRead[0].enabledHairVariants.push('mutated-enabled');
  firstRead[0].disabledHairVariants.push('mutated-disabled');

  const secondRead = getCharacterCardOptions(getLockControls());
  assert.equal(secondRead[0].hairTags.includes('mutated-tag'), false);
  assert.equal(secondRead[0].enabledHairVariants.includes('mutated-enabled'), false);
  assert.equal(secondRead[0].disabledHairVariants.includes('mutated-disabled'), false);
});

test('prompt bundle returns six copyable character-card outputs', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
    outputMode: 'included-wardrobe',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);

  assert.deepEqual(bundle.outputs.map((output) => output.id), [
    'gpt',
    'grok-z-image',
    'ai',
    'headshot',
    'four-view',
    'full-body-reference',
  ]);
  assert.match(bundle.outputs[0].value, /Character Profile Card:\n11_Rika/i);
  assert.match(bundle.outputs[0].value, /low ponytail/i);
  assert.match(bundle.outputs[0].value, /cropped white short-sleeve baby tee/i);
  assert.doesNotMatch(bundle.outputs[0].value, /low-rise light-wash blue jeans/i);
  assert.match(bundle.outputs[3].value, /headshot reference/i);
  assert.match(bundle.outputs[4].value, /front view/i);
  assert.match(bundle.outputs[5].value, /full-body character reference/i);
});

test('prompt override text is appended to every character-card output', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const overrideText = 'temporary supplemental character direction: add a tiny crescent moon cheek sticker';
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
    outputMode: 'included-wardrobe',
    promptOverrideText: overrideText,
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);

  assert.equal(bundle.outputs.length, 6);
  bundle.outputs.forEach((output) => {
    assert.match(output.value, /temporary supplemental character direction/i);
    assert.match(output.value, /tiny crescent moon cheek sticker/i);
  });
});

test('pure-character prompt keeps hair variant and excludes wardrobe layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: [],
    outputMode: 'pure-character',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);
  const combined = bundle.outputs.map((output) => output.value).join('\n');

  assert.match(combined, /soft doll-like indie-girl facial features/i);
  assert.match(combined, /low ponytail/i);
  assert.doesNotMatch(combined, /baby tee|jeans|sneakers|choker/i);
});

test('PAGE2 character card saved card stores six outputs', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
    outputMode: 'included-wardrobe',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);
  const card = buildCharacterCardSavedCard(cards, variant, bundle);
  const outputById = Object.fromEntries(bundle.outputs.map((output) => [output.id, output]));

  assert.equal(card.source, 'page2');
  assert.equal(card.sourceLabel, '角色卡');
  assert.equal(card.grokPrompt, outputById.gpt.value);
  assert.equal(card.zImagePrompt, outputById['grok-z-image'].value);
  assert.equal(card.midjourneyPrompt, outputById.ai.value);
  assert.equal(card.promptLabels.grok, 'GPT Prompt');
  assert.equal(card.promptLabels.midjourney, 'AI Prompt');
  assert.equal(card.promptLabels.zImage, 'Grok/Z-Image Prompt');
  assert.equal(card.summaryFields.wardrobe, '上身');
  assert.deepEqual(card.extraPrompts, [
    { id: 'headshot', label: 'Headshot Prompt', text: outputById.headshot.value },
    { id: 'four-view', label: 'Four-View Prompt', text: outputById['four-view'].value },
    { id: 'full-body-reference', label: 'Full-Body Reference Prompt', text: outputById['full-body-reference'].value },
  ]);
  assert.deepEqual(card.profile.includedWardrobeLayers, ['top']);
});

test('PAGE2 character card saved card tolerates partial and malformed bundle input', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rawVariant = {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
    outputMode: 'included-wardrobe',
  };
  const fallbackBundle = buildCharacterCardPromptBundle(cards, rawVariant);
  const fallbackById = Object.fromEntries(fallbackBundle.outputs.map((output) => [output.id, output]));

  let malformedCard = null;
  assert.doesNotThrow(() => {
    malformedCard = buildCharacterCardSavedCard(cards, rawVariant, {
      summary: null,
      variant: null,
      outputs: 'not-an-array',
    });
  });

  assert.equal(malformedCard.grokPrompt, fallbackById.gpt.value);
  assert.equal(malformedCard.zImagePrompt, fallbackById['grok-z-image'].value);
  assert.equal(malformedCard.midjourneyPrompt, fallbackById.ai.value);
  assert.equal(malformedCard.summaryFields.wardrobe, '上身');

  let partialCard = null;
  assert.doesNotThrow(() => {
    partialCard = buildCharacterCardSavedCard(cards, rawVariant, {
      card: null,
      summary: 'partial summary',
      variant: null,
      outputs: [
        { id: 'gpt', label: 'Custom GPT', value: 'custom gpt prompt' },
        { id: 'headshot', label: 'Custom Headshot', value: 'custom headshot prompt' },
      ],
    });
  });

  assert.equal(partialCard.grokPrompt, 'custom gpt prompt');
  assert.equal(partialCard.zImagePrompt, fallbackById['grok-z-image'].value);
  assert.equal(partialCard.midjourneyPrompt, fallbackById.ai.value);
  assert.deepEqual(partialCard.extraPrompts, [
    { id: 'headshot', label: 'Custom Headshot', text: 'custom headshot prompt' },
    { id: 'four-view', label: 'Four-View Prompt', text: fallbackById['four-view'].value },
    { id: 'full-body-reference', label: 'Full-Body Reference Prompt', text: fallbackById['full-body-reference'].value },
  ]);
});

test('pure-character saved card reports no wardrobe metadata or prompt text', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top', 'bottom', 'shoes', 'neckAccessory'],
    outputMode: 'pure-character',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);
  const card = buildCharacterCardSavedCard(cards, variant, bundle);
  const combined = [
    card.grokPrompt,
    card.zImagePrompt,
    card.midjourneyPrompt,
    ...card.extraPrompts.map((output) => output.text),
  ].join('\n');

  assert.equal(card.summaryFields.wardrobe, '純人物');
  assert.doesNotMatch(combined, /baby tee|jeans|sneakers|choker/i);
});

test('saved card ignores malformed bundle variant fields over pure-character raw variant', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rawVariant = {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: [],
    outputMode: 'pure-character',
  };
  const card = buildCharacterCardSavedCard(cards, rawVariant, {
    variant: {
      includedWardrobeLayers: null,
      outputMode: '',
    },
    outputs: 'not-an-array',
  });
  const combined = [
    card.grokPrompt,
    card.zImagePrompt,
    card.midjourneyPrompt,
    ...card.extraPrompts.map((output) => output.text),
  ].join('\n');

  assert.equal(card.profile.outputMode, 'pure-character');
  assert.deepEqual(card.profile.includedWardrobeLayers, []);
  assert.equal(card.summaryFields.wardrobe, '純人物');
  assert.doesNotMatch(combined, /baby tee|jeans|sneakers|choker/i);
});

test('saved card ignores semantically invalid bundle character and hair ids', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rawVariant = {
    characterProfileId: 'character-hina',
    hairVariantId: 'slicked-back-wet-look',
    includedWardrobeLayers: [],
    outputMode: 'pure-character',
  };
  const card = buildCharacterCardSavedCard(cards, rawVariant, {
    variant: {
      characterProfileId: 'missing-card',
      hairVariantId: 'twin-tails',
    },
    outputs: 'not-an-array',
  });
  const combined = [
    card.grokPrompt,
    card.zImagePrompt,
    card.midjourneyPrompt,
    ...card.extraPrompts.map((output) => output.text),
  ].join('\n');

  assert.equal(card.profile.characterProfileId, 'character-hina');
  assert.equal(card.profile.hairVariantId, 'slicked-back-wet-look');
  assert.equal(card.profile.outputMode, 'pure-character');
  assert.equal(card.summaryFields.characterDna, '37_Hina');
  assert.equal(card.summaryFields.wardrobe, '純人物');
  assert.match(combined, /37_Hina/i);
  assert.match(combined, /sleek wet-look swept-back finish/i);
  assert.doesNotMatch(combined, /11_Rika|keep the original character hair identity unchanged|sage-mint green|short shorts|bare feet/i);
});

test('saved card trims valid bundle character and hair ids before writing them back', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rawVariant = {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: [],
    outputMode: 'pure-character',
  };
  const card = buildCharacterCardSavedCard(cards, rawVariant, {
    variant: {
      characterProfileId: ' character-hina ',
      hairVariantId: ' slicked-back-wet-look ',
    },
    outputs: 'not-an-array',
  });
  const combined = [
    card.grokPrompt,
    card.zImagePrompt,
    card.midjourneyPrompt,
    ...card.extraPrompts.map((output) => output.text),
  ].join('\n');

  assert.equal(card.profile.characterProfileId, 'character-hina');
  assert.equal(card.profile.hairVariantId, 'slicked-back-wet-look');
  assert.equal(card.summaryFields.characterDna, '37_Hina');
  assert.equal(card.summaryFields.wardrobe, '純人物');
  assert.match(combined, /37_Hina/i);
  assert.match(combined, /sleek wet-look swept-back finish/i);
  assert.doesNotMatch(combined, /11_Rika|keep the original character hair identity unchanged|sage-mint green|short shorts|bare feet/i);
});

test('structured apply clears PAGE1 same-layer choices only for included card layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const prevLocks = {
    ...createEmptyLocks(),
    skirtId: 'wardrobe:裙裝-skirts:denim-mini',
    shoesId: 'wardrobe:鞋款-shoes:heels',
    neckAccessoryId: 'wardrobe:頸部配件-neck-accessories:thin-necklace',
    locationId: 'scene:anything',
    poseId: 'pose:anything',
  };
  const nextLocks = buildPage1LocksFromCharacterCardVariant(prevLocks, {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top', 'bottom'],
  }, cards);

  assert.equal(nextLocks.subjectCount, '1');
  assert.equal(nextLocks.characterProfileId, 'character-rika');
  assert.equal(nextLocks.characterCardHairVariantId, 'low-ponytail');
  assert.equal(nextLocks.characterCardWardrobeMode, 'selected-layers');
  assert.deepEqual(nextLocks.characterCardWardrobeLayerIds, ['top', 'bottom']);
  assert.equal(nextLocks.topId, EXPECTED_NONE_LOCK_IDS.topId);
  assert.equal(nextLocks.pantsId, EXPECTED_NONE_LOCK_IDS.pantsId);
  assert.equal(nextLocks.skirtId, EXPECTED_NONE_LOCK_IDS.skirtId);
  assert.equal(nextLocks.shoesId, 'wardrobe:鞋款-shoes:heels');
  assert.equal(nextLocks.neckAccessoryId, 'wardrobe:頸部配件-neck-accessories:thin-necklace');
  assert.equal(nextLocks.locationId, 'scene:anything');
  assert.equal(nextLocks.poseId, 'pose:anything');
});

test('structured apply treats pure-character variants as no wardrobe layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const prevLocks = {
    ...createEmptyLocks(),
    topId: 'wardrobe:上身-tops:cropped-tee',
    pantsId: 'wardrobe:褲裝-pants:wide-jeans',
    skirtId: 'wardrobe:裙裝-skirts:denim-mini',
    specialOutfitId: nonNoneOptionId('specialOutfitId'),
    locationId: 'scene:anything',
    poseId: 'pose:anything',
  };
  const nextLocks = buildPage1LocksFromCharacterCardVariant(prevLocks, {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top', 'bottom'],
    outputMode: 'pure-character',
  }, cards);

  assert.equal(nextLocks.characterProfileId, 'character-rika');
  assert.deepEqual(nextLocks.characterCardWardrobeLayerIds, []);
  assert.equal(nextLocks.topId, 'wardrobe:上身-tops:cropped-tee');
  assert.equal(nextLocks.pantsId, 'wardrobe:褲裝-pants:wide-jeans');
  assert.equal(nextLocks.skirtId, 'wardrobe:裙裝-skirts:denim-mini');
  assert.equal(nextLocks.specialOutfitId, prevLocks.specialOutfitId);
  assert.equal(nextLocks.locationId, 'scene:anything');
  assert.equal(nextLocks.poseId, 'pose:anything');
});

test('structured apply for top clears full-look and dress conflicts only', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const prevLocks = {
    ...createEmptyLocks(),
    topId: 'wardrobe:上身-tops:cropped-tee',
    topFitId: 'wardrobe:上身版型-top-fit:slim',
    dressId: nonNoneOptionId('dressId'),
    dressColorId: 'color:red',
    specialOutfitId: nonNoneOptionId('specialOutfitId'),
    outfitPresetId: nonNoneOptionId('outfitPresetId'),
    outfitPresetColorId: 'color:black',
    outfitPresetPrimaryColorId: 'color:white',
    outfitPresetContrastColorId: 'color:red',
    outfitPresetLockedPaletteId: 'palette:anything',
    completeLookPaletteId: 'palette:complete-look',
    topBottomPaletteId: 'palette:top-bottom',
    shoesId: 'wardrobe:鞋款-shoes:heels',
    neckAccessoryId: 'wardrobe:頸部配件-neck-accessories:thin-necklace',
    locationId: 'scene:anything',
    poseId: 'pose:anything',
  };
  const nextLocks = buildPage1LocksFromCharacterCardVariant(prevLocks, {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
  }, cards);

  assert.deepEqual(nextLocks.characterCardWardrobeLayerIds, ['top']);
  assert.equal(nextLocks.topId, EXPECTED_NONE_LOCK_IDS.topId);
  assert.equal(nextLocks.topFitId, EXPECTED_NONE_LOCK_IDS.topFitId);
  assert.equal(nextLocks.dressId, EXPECTED_NONE_LOCK_IDS.dressId);
  assert.equal(nextLocks.dressColorId, EXPECTED_NONE_LOCK_IDS.dressColorId);
  assert.equal(nextLocks.specialOutfitId, EXPECTED_NONE_LOCK_IDS.specialOutfitId);
  assert.equal(nextLocks.outfitPresetId, EXPECTED_NONE_LOCK_IDS.outfitPresetId);
  assert.equal(nextLocks.outfitPresetColorId, EXPECTED_NONE_LOCK_IDS.outfitPresetColorId);
  assert.equal(nextLocks.outfitPresetPrimaryColorId, EXPECTED_NONE_LOCK_IDS.outfitPresetPrimaryColorId);
  assert.equal(nextLocks.outfitPresetContrastColorId, EXPECTED_NONE_LOCK_IDS.outfitPresetContrastColorId);
  assert.equal(nextLocks.outfitPresetLockedPaletteId, EXPECTED_NONE_LOCK_IDS.outfitPresetLockedPaletteId);
  assert.equal(nextLocks.completeLookPaletteId, EXPECTED_NONE_LOCK_IDS.completeLookPaletteId);
  assert.equal(nextLocks.topBottomPaletteId, EXPECTED_NONE_LOCK_IDS.topBottomPaletteId);
  assert.equal(nextLocks.shoesId, 'wardrobe:鞋款-shoes:heels');
  assert.equal(nextLocks.neckAccessoryId, 'wardrobe:頸部配件-neck-accessories:thin-necklace');
  assert.equal(nextLocks.locationId, 'scene:anything');
  assert.equal(nextLocks.poseId, 'pose:anything');
});

test('structured apply for accessory layers clears full-look conflicts and preserves non-conflicting PAGE1 choices', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const prevLocks = {
    ...createEmptyLocks(),
    specialOutfitId: nonNoneOptionId('specialOutfitId'),
    outfitPresetId: nonNoneOptionId('outfitPresetId'),
    outfitPresetColorId: 'color:black',
    outfitPresetPrimaryColorId: 'color:white',
    outfitPresetContrastColorId: 'color:red',
    outfitPresetLockedPaletteId: 'palette:anything',
    completeLookPaletteId: 'palette:complete-look',
    topBottomPaletteId: 'palette:top-bottom',
    topId: 'wardrobe:上身-tops:cropped-tee',
    shoesId: 'wardrobe:鞋款-shoes:heels',
    neckAccessoryId: 'wardrobe:頸部配件-neck-accessories:thin-necklace',
    locationId: 'scene:anything',
    poseId: 'pose:anything',
  };
  const nextLocks = buildPage1LocksFromCharacterCardVariant(prevLocks, {
    characterProfileId: 'character-yuri',
    hairVariantId: 'default',
    includedWardrobeLayers: ['neckAccessory', 'waistAccessory'],
  }, cards);

  assert.deepEqual(nextLocks.characterCardWardrobeLayerIds, ['neckAccessory', 'waistAccessory']);
  assert.equal(nextLocks.specialOutfitId, EXPECTED_NONE_LOCK_IDS.specialOutfitId);
  assert.equal(nextLocks.outfitPresetId, EXPECTED_NONE_LOCK_IDS.outfitPresetId);
  assert.equal(nextLocks.outfitPresetColorId, EXPECTED_NONE_LOCK_IDS.outfitPresetColorId);
  assert.equal(nextLocks.outfitPresetPrimaryColorId, EXPECTED_NONE_LOCK_IDS.outfitPresetPrimaryColorId);
  assert.equal(nextLocks.outfitPresetContrastColorId, EXPECTED_NONE_LOCK_IDS.outfitPresetContrastColorId);
  assert.equal(nextLocks.outfitPresetLockedPaletteId, EXPECTED_NONE_LOCK_IDS.outfitPresetLockedPaletteId);
  assert.equal(nextLocks.completeLookPaletteId, EXPECTED_NONE_LOCK_IDS.completeLookPaletteId);
  assert.equal(nextLocks.topBottomPaletteId, EXPECTED_NONE_LOCK_IDS.topBottomPaletteId);
  assert.equal(nextLocks.neckAccessoryId, EXPECTED_NONE_LOCK_IDS.neckAccessoryId);
  assert.equal(nextLocks.topId, 'wardrobe:上身-tops:cropped-tee');
  assert.equal(nextLocks.shoesId, 'wardrobe:鞋款-shoes:heels');
  assert.equal(nextLocks.locationId, 'scene:anything');
  assert.equal(nextLocks.poseId, 'pose:anything');
});

test('structured apply imports forced eyewear and clears PAGE1 eyewear when glasses are off', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const forcedLocks = buildPage1LocksFromCharacterCardVariant({
    ...createEmptyLocks(),
    eyewearId: 'wardrobe:眼鏡-eyewear:round-metal',
    eyewearColorId: 'wardrobe:眼鏡配色-eyewear-color:black',
    eyewearPlacementId: 'eyewear-placement:pushed-up',
    topId: 'wardrobe:上身-tops:cropped-tee',
  }, {
    characterProfileId: 'character-rika',
    hairVariantId: 'default',
    eyewearMode: 'glasses-on',
    includedWardrobeLayers: ['top'],
  }, cards);
  const noGlassesLocks = buildPage1LocksFromCharacterCardVariant({
    ...createEmptyLocks(),
    eyewearId: 'wardrobe:眼鏡-eyewear:round-metal',
    eyewearColorId: 'wardrobe:眼鏡配色-eyewear-color:black',
    eyewearPlacementId: 'eyewear-placement:pushed-up',
    shoesId: 'wardrobe:鞋款-shoes:heels',
  }, {
    characterProfileId: 'character-yuri',
    hairVariantId: 'default',
    eyewearMode: 'glasses-off',
    includedWardrobeLayers: ['top', 'eyewear'],
  }, cards);

  assert.equal(forcedLocks.characterCardEyewearMode, 'glasses-on');
  assert.deepEqual(forcedLocks.characterCardWardrobeLayerIds, ['top', 'eyewear']);
  assert.equal(forcedLocks.eyewearId, EXPECTED_NONE_LOCK_IDS.eyewearId);
  assert.equal(forcedLocks.eyewearColorId, EXPECTED_NONE_LOCK_IDS.eyewearColorId);
  assert.equal(forcedLocks.eyewearPlacementId, EXPECTED_NONE_LOCK_IDS.eyewearPlacementId);
  assert.equal(forcedLocks.topId, EXPECTED_NONE_LOCK_IDS.topId);
  assert.equal(noGlassesLocks.characterCardEyewearMode, 'glasses-off');
  assert.deepEqual(noGlassesLocks.characterCardWardrobeLayerIds, ['top']);
  assert.equal(noGlassesLocks.eyewearId, EXPECTED_NONE_LOCK_IDS.eyewearId);
  assert.equal(noGlassesLocks.eyewearColorId, EXPECTED_NONE_LOCK_IDS.eyewearColorId);
  assert.equal(noGlassesLocks.eyewearPlacementId, EXPECTED_NONE_LOCK_IDS.eyewearPlacementId);
  assert.equal(noGlassesLocks.shoesId, 'wardrobe:鞋款-shoes:heels');
});

test('structured apply for dress clears top bottom and full-look conflicts', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const prevLocks = {
    ...createEmptyLocks(),
    topId: 'wardrobe:上身-tops:cropped-tee',
    topFitId: 'wardrobe:上身版型-top-fit:slim',
    topColorId: 'color:white',
    pantsId: 'wardrobe:褲裝-pants:wide-jeans',
    skirtId: 'wardrobe:裙裝-skirts:denim-mini',
    bottomFitId: 'wardrobe:下身版型-bottom-fit:relaxed',
    bottomColorId: 'color:blue',
    specialOutfitId: nonNoneOptionId('specialOutfitId'),
    outfitPresetId: nonNoneOptionId('outfitPresetId'),
    completeLookPaletteId: 'palette:complete-look',
    topBottomPaletteId: 'palette:top-bottom',
    shoesId: 'wardrobe:鞋款-shoes:heels',
  };
  const nextLocks = buildPage1LocksFromCharacterCardVariant(prevLocks, {
    characterProfileId: 'character-philippa',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['dress'],
  }, cards);

  assert.deepEqual(nextLocks.characterCardWardrobeLayerIds, ['dress']);
  assert.equal(nextLocks.topId, EXPECTED_NONE_LOCK_IDS.topId);
  assert.equal(nextLocks.topFitId, EXPECTED_NONE_LOCK_IDS.topFitId);
  assert.equal(nextLocks.topColorId, EXPECTED_NONE_LOCK_IDS.topColorId);
  assert.equal(nextLocks.pantsId, EXPECTED_NONE_LOCK_IDS.pantsId);
  assert.equal(nextLocks.skirtId, EXPECTED_NONE_LOCK_IDS.skirtId);
  assert.equal(nextLocks.bottomFitId, EXPECTED_NONE_LOCK_IDS.bottomFitId);
  assert.equal(nextLocks.bottomColorId, EXPECTED_NONE_LOCK_IDS.bottomColorId);
  assert.equal(nextLocks.specialOutfitId, EXPECTED_NONE_LOCK_IDS.specialOutfitId);
  assert.equal(nextLocks.outfitPresetId, EXPECTED_NONE_LOCK_IDS.outfitPresetId);
  assert.equal(nextLocks.completeLookPaletteId, EXPECTED_NONE_LOCK_IDS.completeLookPaletteId);
  assert.equal(nextLocks.topBottomPaletteId, EXPECTED_NONE_LOCK_IDS.topBottomPaletteId);
  assert.equal(nextLocks.shoesId, 'wardrobe:鞋款-shoes:heels');
});

test('structured apply none-locks prevent random full-look conflicts in generated prompts', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rikaTopLocks = normalizeLocks(buildPage1LocksFromCharacterCardVariant({
    ...createEmptyLocks(),
    specialOutfitId: nonNoneOptionId('specialOutfitId'),
    outfitPresetId: nonNoneOptionId('outfitPresetId'),
    dressId: nonNoneOptionId('dressId'),
    completeLookPaletteId: 'random',
    topBottomPaletteId: 'random',
  }, {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
  }, cards));
  const rikaPrompts = generatePrompts(20, rikaTopLocks);

  rikaPrompts.forEach((prompt) => {
    assert.ok(wardrobeIds(prompt).includes('character-card-layer:character-rika:top'));
    assert.equal(hasNonNoneWardrobePrefix(prompt, 'wardrobe:套裝-outfit-presets:'), false);
    assert.equal(hasNonNoneWardrobePrefix(prompt, 'wardrobe:特殊穿搭-special-outfits:'), false);
    assert.equal(hasNonNoneWardrobePrefix(prompt, 'wardrobe:連身-dresses:'), false);
  });

  const philippaDressLocks = normalizeLocks(buildPage1LocksFromCharacterCardVariant({
    ...createEmptyLocks(),
    specialOutfitId: nonNoneOptionId('specialOutfitId'),
    outfitPresetId: nonNoneOptionId('outfitPresetId'),
    completeLookPaletteId: 'random',
  }, {
    characterProfileId: 'character-philippa',
    hairVariantId: 'default',
    includedWardrobeLayers: ['dress'],
  }, cards));
  const philippaPrompts = generatePrompts(10, philippaDressLocks);

  philippaPrompts.forEach((prompt) => {
    assert.ok(wardrobeIds(prompt).includes('character-card-layer:character-philippa:dress'));
    assert.equal(hasNonNoneWardrobePrefix(prompt, 'wardrobe:套裝-outfit-presets:'), false);
    assert.equal(hasNonNoneWardrobePrefix(prompt, 'wardrobe:特殊穿搭-special-outfits:'), false);
  });
});
