import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLockControls } from './engine.js';
import { buildCharacterCardPromptBundle, buildCharacterCardSavedCard, createEmptyCharacterCardVariant, getCharacterCardOptions } from './characterCardLab.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';

const cards = getCharacterCardOptions(getLockControls());
const identity = c => c.identityAndBody.split(' with ')[0];
const output = (bundle, id) => bundle.outputs.find(o => o.id === id).value;
for (const mode of ['default', 'pure', 'one-layer']) test(`PAGE2 preserves source adult identity and four anchors: ${mode}`, () => {
  assert.equal(cards.length, 33);
  for (const card of cards) {
    const variant = createEmptyCharacterCardVariant([card]);
    if (mode === 'pure') variant.outputMode = 'pure-character';
    if (mode === 'one-layer') variant.includedWardrobeLayers = variant.includedWardrobeLayers.slice(0, 1);
    const bundle = buildCharacterCardPromptBundle(cards, variant);
    for (const id of ['gpt', 'grok-z-image']) {
      const text = output(bundle, id), lead = identity(card);
      assert.equal(text.toLowerCase().split(lead.toLowerCase()).length - 1, 1, card.id + ':' + id);
      for (const anchor of card.distinctiveFeatures.split(', ')) assert.ok(text.includes(anchor), anchor);
      if (card.id === 'character-eleanor') assert.match(text, /adult demonic woman/);
    }
    assert.ok(output(bundle, 'gpt').indexOf('adult') < output(bundle, 'gpt').indexOf('Facial geometry:'));
  }
});

test('PAGE2 does not invent adult identity for absent or unrecognized sources', () => {
  for (const source of ['', 'a woman with familiar facial features', 'source unknown']) {
    const card = { ...cards[0], identityAndBody: source };
    const bundle = buildCharacterCardPromptBundle([card], createEmptyCharacterCardVariant([card]));
    for (const id of ['gpt', 'grok-z-image']) assert.doesNotMatch(output(bundle, id), /20-year-old adult/);
  }
  assert.deepEqual(buildCharacterCardPromptBundle([], {}), { card: null, variant: createEmptyCharacterCardVariant([]), outputs: [], summary: '' });
});

test('PAGE2 legacy unstructured identity remains complete and is not duplicated in GPT', () => {
  const card = { ...cards[0] };
  for (const key of ['facialGeometry','eyeSignature','noseSignature','mouthSignature','skinSignature','makeup','body','distinctiveFeatures']) card[key] = '';
  const bundle = buildCharacterCardPromptBundle([card], createEmptyCharacterCardVariant([card]));
  assert.ok(output(bundle, 'gpt').includes('Identity and body:\n' + card.identityAndBody));
  assert.equal(output(bundle, 'gpt').split(identity(card)).length - 1, 1);
  assert.equal(output(bundle, 'grok-z-image').split(identity(card)).length - 1, 1);
});

test('PAGE2 never rewrites supplied saved public outputs or structured variant', () => {
  const variant = createEmptyCharacterCardVariant(cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);
  const legacy = structuredClone(bundle);
  legacy.outputs = legacy.outputs.map(o => ({ ...o, value: 'Historical public text for ' + o.id }));
  const frozen = structuredClone(legacy);
  const saved = buildCharacterCardSavedCard(cards, variant, legacy);
  assert.equal(saved.grokPrompt, 'Historical public text for gpt');
  assert.equal(saved.zImagePrompt, 'Historical public text for grok-z-image');
  assert.deepEqual(saved.profile, variant);
  assert.deepEqual(legacy, frozen);
  const decoded = deserializeFavoritePrompt(serializeFavoritePrompt(saved));
  assert.equal(decoded.grokPrompt, saved.grokPrompt);
  assert.equal(decoded.zImagePrompt, saved.zImagePrompt);
});
