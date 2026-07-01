import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from './engine.js';
import {
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
