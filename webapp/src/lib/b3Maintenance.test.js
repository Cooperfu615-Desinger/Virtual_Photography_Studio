import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCharacterItemNameOwnership } from '../../../scripts/lib/b3MaintenanceChecks.mjs';
import { CHARACTER_WARDROBE_SOURCES } from './engine/characterWardrobeSources.js';
import { MIDJOURNEY_CARD_ITEM_NAMES } from './engine/midjourneyCardItemNames.js';
test('B3 MJ names cover exactly the authored character layers without conflating projection wording', () => {
  assert.deepEqual(validateCharacterItemNameOwnership(CHARACTER_WARDROBE_SOURCES, MIDJOURNEY_CARD_ITEM_NAMES), { characters: 33, layers: 134 });
});
test('B3 rejects missing/extra owners, missing/extra layers and empty names', () => {
  for (const change of [n => delete n['character-rika'], n => {n.unknown = {};},
    n => delete n['character-rika'].top, n => {n['character-rika'].unknown = 'shirt';},
    n => {n['character-rika'].top = ' ';}, n => {n['character-rika'].top = null;}]) {
    const names = structuredClone(MIDJOURNEY_CARD_ITEM_NAMES); change(names);
    assert.throws(() => validateCharacterItemNameOwnership(CHARACTER_WARDROBE_SOURCES, names));
  }
});
test('B3 accepts independently authored MJ wording without rewriting full source', () => {
  const names = structuredClone(MIDJOURNEY_CARD_ITEM_NAMES);
  names['character-rika'].top = 'reviewed compact name';
  assert.equal(validateCharacterItemNameOwnership(CHARACTER_WARDROBE_SOURCES, names).layers, 134);
});
