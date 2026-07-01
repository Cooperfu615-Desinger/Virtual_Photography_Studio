import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from './engine.js';
import {
  buildCharacterCardPromptBundle,
  buildCharacterCardSavedCard,
  CHARACTER_CARD_LAYER_KEYS,
  createEmptyCharacterCardVariant,
  getCharacterCardOptions,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
  resolveCharacterCard,
} from './characterCardLab.js';

test('character card options are read from PAGE1 character profile control', () => {
  const cards = getCharacterCardOptions(getLockControls());

  assert.ok(cards.length >= 10);
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
    includedWardrobeLayers: ['top', 'bottom', 'missing-layer'],
    outputMode: 'included-wardrobe',
  }, cards);

  assert.equal(normalized.characterProfileId, 'character-rika');
  assert.equal(normalized.hairVariantId, 'low-ponytail');
  assert.deepEqual(normalized.includedWardrobeLayers, ['top', 'bottom']);
  assert.equal(normalized.outputMode, 'included-wardrobe');

  const empty = createEmptyCharacterCardVariant(cards);
  assert.equal(empty.characterProfileId, 'character-rika');
  assert.equal(empty.hairVariantId, 'default');
  assert.deepEqual(empty.includedWardrobeLayers, CHARACTER_CARD_LAYER_KEYS.filter((key) => resolveCharacterCard(cards, 'character-rika').defaultWardrobeLayers[key]));
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
  firstRead[0].referenceImages.push('mutated-reference');
  firstRead[0].hairTags.push('mutated-tag');
  firstRead[0].enabledHairVariants.push('mutated-enabled');
  firstRead[0].disabledHairVariants.push('mutated-disabled');

  const secondRead = getCharacterCardOptions(getLockControls());
  assert.equal(secondRead[0].referenceImages.includes('mutated-reference'), false);
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
