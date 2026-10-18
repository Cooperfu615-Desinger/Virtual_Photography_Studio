import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { parseLocksFromStandardPrompt } from '../../features/saved-cards/cardCodec.js';
import database from '../../data/database.json' with { type: 'json' };
import { MIDJOURNEY_ITEM_NAMES } from './midjourneyItemNames.js';
import { CREW_NECK_TEE_ADDED_ALIASES, restorePreCrewNeckTeeText } from './crewNeckTeeTestSupport.js';

// Approved 2026-10-18: Z-Image drew `dropped-shoulder … low shoulder seam` as an
// off-shoulder top, so 落肩 T 恤 now describes only a crew-neck cotton tee and
// leaves width to the separate Top Fit control. ID and zh label are unchanged.
const NEW_SOURCE = 'crew-neck t-shirt, washed cotton jersey, relaxed upper-body proportion';
const NEW_UNDERBUST = 'crew-neck t-shirt, washed cotton jersey';
const controls = getLockControls();
const control = key => controls.find(c => c.key === key);
const option = (key, zh) => {
  const found = control(key)?.options.find(o => o.zh === zh);
  assert.ok(found, `${key}/${zh}`);
  return found;
};
const tee = option('topId', '落肩 T 恤');
const generate = (locks, seed = 'crew-neck-tee') => generatePrompts(1, {
  ...createEmptyLocks(), subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none',
  framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id, topId: tee.id, ...locks,
}, [], { random: createSeededRandom(seed) })[0];
const outputs = prompt => ({
  gpt: prompt.grokPrompt, z: prompt.zImagePrompt, mj: prompt.midjourneyPrompt, nano: prompt.nanoBananaPrompt,
  ...Object.fromEntries(prompt.extraPrompts.map(entry => [entry.id, entry.text])),
});
const SHOULDER_WORDING = /dropped-shoulder|low shoulder seam|off-shoulder/i;

test('catalog source, underbust base and MJ name describe a crew-neck tee without shoulder or width wording', () => {
  assert.equal(tee.id, 'wardrobe:上身-tops:落肩-t-恤:5');
  assert.equal(tee.en, NEW_SOURCE);
  const stored = JSON.stringify(database).includes(`"baseEn":"${NEW_UNDERBUST}"`)
    || JSON.stringify(database).includes(`"baseEn": "${NEW_UNDERBUST}"`);
  assert.ok(stored, 'underbust base uses the crew-neck source');
  assert.equal(MIDJOURNEY_ITEM_NAMES[tee.id], 'crew-neck t-shirt');
  for (const text of [tee.en, NEW_UNDERBUST, MIDJOURNEY_ITEM_NAMES[tee.id]]) {
    assert.doesNotMatch(text, SHOULDER_WORDING);
    assert.doesNotMatch(text, /oversized|boxy|loose/i, 'width belongs to Top Fit');
  }
  assert.deepEqual(tee.meta?.legacyPromptAliases, [...CREW_NECK_TEE_ADDED_ALIASES]);
});

test('every output names the crew-neck tee and never the old shoulder wording', () => {
  const prompt = generate({});
  for (const [name, text] of Object.entries(outputs(prompt))) {
    assert.match(text, /crew-neck t-shirt/i, name);
    assert.doesNotMatch(text, SHOULDER_WORDING, name);
  }
  assert.match(prompt.midjourneyPrompt, /\ba crew-neck t-shirt\b/);
});

test('Top Fit alone sets width: tight and underbust-cropped fits keep the tee source free of loose wording', () => {
  for (const fit of ['緊身', '合身', 'oversize', '短版緊身']) {
    const prompt = generate({ topFitId: option('topFitId', fit).id }, `crew-neck-tee-${fit}`);
    assert.match(prompt.grokPrompt, /crew-neck t-shirt, washed cotton jersey/, fit);
    assert.doesNotMatch(prompt.grokPrompt, /oversized crew-neck|loose boxy/i, fit);
    assert.equal((prompt.grokPrompt.match(/oversized/gi) || []).length <= 1, true, `${fit}: oversized appears at most once`);
  }
});

test('duo roles render the same crew-neck source', () => {
  const prompt = generatePrompts(1, {
    ...createEmptyLocks(), subjectCount: '2', topAId: tee.id, topBId: tee.id,
    framingId: option('framingId', '全身鏡頭 (Full Body Shot)').id,
  }, [], { random: createSeededRandom('crew-neck-tee-duo') })[0];
  for (const text of [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt, prompt.nanoBananaPrompt]) {
    assert.match(text, /crew-neck t-shirt/i);
    assert.doesNotMatch(text, SHOULDER_WORDING);
  }
});

test('old and new English both import to the unchanged 落肩 T 恤 ID, not another tee', () => {
  for (const alias of [...CREW_NECK_TEE_ADDED_ALIASES, NEW_SOURCE]) {
    const { locks } = parseLocksFromStandardPrompt(`Wardrobe:\nShe wears ${alias}. Straight-leg jeans.`, controls);
    assert.equal(locks.topId, tee.id, alias);
  }
  const prompt = generate({});
  assert.equal(parseLocksFromStandardPrompt(prompt.grokPrompt, controls).locks.topId, tee.id);
});

test('main MJ vocabulary keeps the source crew-neck T-shirt in the argyle-vest special outfit', () => {
  const special = option('specialOutfitId', '菱格背心黑寬短褲長襪造型');
  assert.match(special.en, /white crew-neck T-shirt/);
  const prompt = generate({ topId: '', specialOutfitId: special.id }, 'crew-neck-tee-special');
  assert.match(prompt.midjourneyPrompt, /\ba crew-neck T-shirt\b/);
  assert.match(restorePreCrewNeckTeeText(prompt.midjourneyPrompt, 'midjourneyPrompt'), /\ba T-shirt\b/);
  assert.equal(restorePreCrewNeckTeeText(special.en, 'grokPrompt'), special.en, 'other fields keep the source');
});

test('test inverse restores exactly the previous wording', () => {
  assert.equal(restorePreCrewNeckTeeText(`She wears ${NEW_SOURCE}.`), `She wears ${CREW_NECK_TEE_ADDED_ALIASES[0]}.`);
  assert.equal(restorePreCrewNeckTeeText(`She wears ${NEW_UNDERBUST}.`), `She wears ${CREW_NECK_TEE_ADDED_ALIASES[1]}.`);
  assert.equal(restorePreCrewNeckTeeText('She wears a crew-neck t-shirt and jeans.'), 'She wears a dropped-shoulder t-shirt and jeans.');
  assert.equal(restorePreCrewNeckTeeText('Crew-neck t-shirt, washed cotton jersey.'), 'Dropped-shoulder t-shirt, washed cotton jersey, low shoulder seam.');
  assert.equal(restorePreCrewNeckTeeText('a simple opaque crew-neck top'), 'a simple opaque crew-neck top');
});
