import assert from 'node:assert/strict';
import { test } from 'node:test';
import review from '../../../scripts/lib/b3CharacterWardrobeReview.json' with { type: 'json' };
import { validateCharacterWardrobeSources } from '../../../scripts/lib/b3CharacterWardrobeChecks.mjs';
import { CHARACTER_WARDROBE_SOURCES as sources, getCharacterWardrobeLayers, getCharacterWardrobeText } from './engine/characterWardrobeSources.js';
import { CHARACTER_PROFILE_OPTIONS } from './engine/characterProfiles.js';
import { getCharacterCardOptions } from './characterCardLab.js';
const cards = getCharacterCardOptions([{ key: 'characterProfileId', options: CHARACTER_PROFILE_OPTIONS }]);
test('all 33 profiles and 134 layer maps equal the reviewed pre-move data, including order', () => {
  for (const old of review.cards) {
    const card = cards.find(x => x.id === old.id);
    assert.equal(JSON.stringify(card.sourceOption), JSON.stringify(old.option));
    assert.equal(JSON.stringify(card.defaultWardrobeLayers), JSON.stringify(old.layers));
  }
  assert.deepEqual(validateCharacterWardrobeSources(sources, CHARACTER_PROFILE_OPTIONS, cards, review), { cards: 33, layers: 134, shared: 118, reviewedDifferences: 16 });
});
test('source registry cannot be mutated and each layer consumer gets a fresh map', () => {
  assert.throws(() => { sources['character-rika'].layers.top = 'changed'; }, TypeError);
  const first = getCharacterWardrobeLayers('character-rika'); first.top = 'changed';
  assert.notEqual(getCharacterWardrobeLayers('character-rika').top, 'changed');
  assert.throws(() => getCharacterWardrobeLayers('unknown'));
  assert.throws(() => getCharacterWardrobeText('character-rika', 'identityAndBody'));
});
test('guard rejects missing owners, foreign references, changed variants and duplicated shared strings', () => {
  for (const mode of ['missing-card', 'missing-layer', 'foreign', 'text', 'literal', 'recipe', 'difference']) {
    const copy = structuredClone(sources), r = structuredClone(review);
    if (mode === 'missing-card') delete copy['character-rika'];
    if (mode === 'missing-layer') delete copy['character-rika'].layers.top;
    if (mode === 'foreign') copy['character-rika'].profile.outfit[0] = { characterId: 'character-hina', layer: 'top' };
    if (mode === 'text') copy['character-yui'].layers.shoes = 'bare feet';
    if (mode === 'literal') copy['character-rika'].profile.outfit[0] = copy['character-rika'].layers.top;
    if (mode === 'recipe') copy['character-rika'].profile.outfit.reverse();
    if (mode === 'difference') r.rows.find(x => x.characterId === 'character-yui' && x.layer === 'shoes').kind = 'shared';
    assert.throws(() => validateCharacterWardrobeSources(copy, CHARACTER_PROFILE_OPTIONS, cards, r), mode);
  }
});
