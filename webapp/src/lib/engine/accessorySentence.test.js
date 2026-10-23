import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, setLegacyWardrobeModifierOrderForTests } from '../engine.js';

// Accessory v1 (Cooper 2026-10-23, Docs/reports/prompt-structure-review-2026-10-23/review.md §5–§6):
// an ordinary single subject's head, face and neck accessories are one "She wears …" sentence, item first.
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const FULL = option('framingId', '全身鏡頭 (Full Body Shot)');
const LOCKS = {
  subjectCount: '1', framingId: FULL,
  eyewearId: option('eyewearId', '粗框眼鏡'), eyewearColorId: option('eyewearColorId', '黑色'),
  earringsId: option('earringsId', '小型金屬耳環'), neckAccessoryId: option('neckAccessoryId', '金屬細頸圈'),
  headAccessoryId: option('headAccessoryId', '棒球帽'),
  eyewearPlacementId: option('eyewearPlacementId', '正常戴在臉上'),
};
const generate = (locks = LOCKS) => generatePrompts(1, { ...createEmptyLocks(), ...locks }, [], { random: createSeededRandom('accessory-v1') })[0];
const section = (prompt, name) => prompt.grokPrompt.match(new RegExp(`${name}:\\n([\\s\\S]*?)(?:\\n\\n|$)`))[1];
const chestUp = prompt => prompt.extraPrompts.find(e => e.id === 'chest-up-portrait').text;
const words = text => (text.toLowerCase().match(/[a-z0-9–-]+/g) || []).sort().join(' ');

test('GPT: one accessory sentence after the identity, item first, nothing written twice', () => {
  const prompt = generate();
  const subject = section(prompt, 'Subject');
  assert.match(subject, /^The subject is one 20-year-old adult [^.]*woman\. She wears baseball cap, [^.]*bold thick-frame glasses, black frame, worn normally on the face, lenses aligned over the eyes; small metallic earring detail, subtle understated jewelry styling; and slim metal choker detail, subtle close-fitting neck accent\./);
  assert.doesNotMatch(subject, /woman with /);
  assert.equal(subject.match(/baseball cap/gi).length, 1, 'the head accessory is part of the sentence, not a second fragment');
  assert.doesNotMatch(subject, /\. Baseball cap/);
  for (const text of [subject, section({ grokPrompt: chestUp(prompt) }, 'Subject')]) assert.equal((text.match(/She wears/g) || []).length, 1);
});

test('GPT keeps every word of the old text; the accessory change only restructures it', () => {
  const next = generate();
  setLegacyWardrobeModifierOrderForTests(true);
  const old = generate();
  setLegacyWardrobeModifierOrderForTests(false);
  const strip = text => words(text.replace(/\b(?:with|and|she|wears)\b/gi, ''));
  assert.equal(strip(next.grokPrompt), strip(old.grokPrompt));
  assert.equal(strip(chestUp(next)), strip(chestUp(old)));
});

test('Z-Image: accessories are their own sentence after the person chain, without filler', () => {
  const z = generate().zImagePrompt;
  assert.doesNotMatch(z, /woman with /);
  assert.match(z, /\. She wears baseball cap, [^.]*bold thick-frame glasses, black frame; small metallic earring detail; and slim metal choker detail\./);
  assert.doesNotMatch(z, /subtle understated jewelry styling|subtle close-fitting neck accent|worn normally on the face/);
});

test('Nano: one accessory sentence, no duplicated "expression", default placement dropped but a chosen one kept', () => {
  const nano = generate().nanoBananaPrompt;
  assert.equal((nano.match(/She wears baseball cap/g) || []).length, 1);
  assert.doesNotMatch(nano, /Her expression is [^,]*expression/);
  assert.match(nano, /She has an? [^,]*expression,/);
  assert.doesNotMatch(nano, /worn normally on the face|subtle understated jewelry styling/);
  const placed = generate({ ...LOCKS, eyewearPlacementId: option('eyewearPlacementId', '戴在頭頂') }).nanoBananaPrompt;
  assert.match(placed, /bold thick-frame glasses, black frame, resting on top of the head/);
});

test('Midjourney is untouched by the accessory change', () => {
  const next = generate().midjourneyPrompt;
  setLegacyWardrobeModifierOrderForTests(true);
  const old = generate().midjourneyPrompt;
  setLegacyWardrobeModifierOrderForTests(false);
  assert.equal(next, old);
});

test('face close-ups still carry the accessory sentence; no accessories means no sentence', () => {
  const close = generate({ ...LOCKS, framingId: option('framingId', '特寫鏡頭 (Close-Up)') });
  assert.match(section(close, 'Subject'), /She wears baseball cap/);
  // A face-detail crop drops the cap exactly as before but keeps the face and neck accessories.
  const detail = generate({ ...LOCKS, framingId: option('framingId', '臉部特寫') });
  assert.match(section(detail, 'Subject'), /She wears bold thick-frame glasses/);
  assert.doesNotMatch(section(detail, 'Subject'), /baseball cap/);
  const noAccessories = Object.fromEntries(['eyewearId', 'earringsId', 'neckAccessoryId', 'headAccessoryId', 'headphonesId', 'faceCoveringId', 'nosePiercingId', 'lipPiercingId']
    .map(key => [key, option(key, '全無')]));
  const none = generate({ subjectCount: '1', framingId: FULL, ...noAccessories });
  assert.doesNotMatch(section(none, 'Subject'), /She wears/);
});
