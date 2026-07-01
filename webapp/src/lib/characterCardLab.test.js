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

  assert.equal(card.source, 'page2');
  assert.equal(card.sourceLabel, '角色卡');
  assert.equal(card.promptLabels.grok, 'GPT Prompt');
  assert.equal(card.promptLabels.midjourney, 'AI Prompt');
  assert.equal(card.promptLabels.zImage, 'Grok/Z-Image Prompt');
  assert.equal(card.extraPrompts.length, 3);
  assert.deepEqual(card.profile.includedWardrobeLayers, ['top']);
});
