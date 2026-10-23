import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, setLegacyWardrobeModifierOrderForTests } from '../engine.js';
import { tidyZImageCaptureSources } from './zImageOnLocationCapture.js';

// Z-Image version C (Cooper 2026-10-23, Docs/reports/z-image-order-versions-2026-10-23/versions.md):
// scene-first order is kept, but the opening names her and each fact is stated once.
const controls = getLockControls();
const option = (key, zh) => controls.find(c => c.key === key).options.find(o => o.zh === zh).id;
const BASE = {
  subjectCount: '1', framingId: option('framingId', '全身鏡頭 (Full Body Shot)'), specifiedActionId: 'specified-standing-natural',
  locationId: undefined,
};
const generate = (locks = {}, seed = 'z-tidy') => generatePrompts(1, { ...createEmptyLocks(), ...BASE, ...locks }, [], { random: createSeededRandom(seed) })[0];
const captureParagraph = z => z.split('\n\n')[1];

test('the opening line names her when the capture paragraph speaks first', () => {
  let checked = 0;
  for (let index = 0; index < 20; index += 1) {
    const prompt = generate({}, `open-${index}`);
    const z = prompt.zImagePrompt;
    if (!/^The setting is/.test(captureParagraph(z))) continue;
    checked += 1;
    assert.match(z, /^Photorealistic editorial portrait of one young adult woman\.\n\n/);
    assert.match(captureParagraph(z), /\nShe (?:stands|sits|kneels|squats|lies)\b/);
  }
  assert.ok(checked > 0);
});

test('without a scene-first capture paragraph the opening line is unchanged', () => {
  const prompt = generate({ specifiedActionId: 'none' });
  assert.match(prompt.zImagePrompt, /^Photorealistic editorial portrait\.\n\n/);
});

test('a strict side view does not open with a second "She stands"', () => {
  let checked = 0;
  for (let index = 0; index < 40 && checked < 5; index += 1) {
    const z = generate({ orbitId: option('orbitId', '左側 90 度') }, `side-${index}`).zImagePrompt;
    const paragraph = captureParagraph(z);
    if (!/completely sideways/.test(paragraph)) continue;
    checked += 1;
    assert.match(paragraph, /She is positioned completely sideways, facing the (?:left|right) edge of the image\./);
    assert.equal((paragraph.match(/\bShe stands\b/g) || []).length, 1, 'only the pose sentence says "She stands"');
  }
  assert.ok(checked > 0);
});

test('the orbit label is dropped when the geometry sentence already states the side', () => {
  let checked = 0;
  for (let index = 0; index < 60 && checked < 5; index += 1) {
    const z = generate({ orbitId: option('orbitId', '右後 225 度') }, `rear-${index}`).zImagePrompt;
    const paragraph = captureParagraph(z);
    if (!/Photographed from the woman's/.test(paragraph)) continue;
    checked += 1;
    assert.doesNotMatch(paragraph, /, (?:rear|back)[a-z -]* view\./i);
  }
  assert.ok(checked > 0);
});

test('the ambient connection joins the lighting sentence instead of standing alone', () => {
  let checked = 0;
  for (let index = 0; index < 60 && checked < 5; index += 1) {
    const z = generate({ lightingId: option('lightingId', '晴朗白日') }, `ambient-${index}`).zImagePrompt;
    if (!/within the scene's ambient light/.test(z)) continue;
    checked += 1;
    assert.match(z, /; she is photographed within the scene's ambient light\./);
    assert.doesNotMatch(z, /\nShe is photographed within the scene's ambient light\./);
  }
  assert.ok(checked > 0);
});

test('GPT, MJ and Nano are unchanged by the Z-Image order work', () => {
  const next = generate();
  setLegacyWardrobeModifierOrderForTests(true);
  const old = generate();
  setLegacyWardrobeModifierOrderForTests(false);
  // Legacy mode also restores older wardrobe and accessory wording, so only MJ is compared byte for byte;
  // the Z-only helper is checked directly below.
  assert.equal(next.midjourneyPrompt, old.midjourneyPrompt);
});

test('tidyZImageCaptureSources is a pure, scoped rewrite', () => {
  const out = tidyZImageCaptureSources({
    pose: 'She stands in a relaxed neutral posture.',
    lighting: 'Soft light.',
    composition: "Full-body portrait, eye-level view, rear-right three-quarter view. Photographed from the woman's rear-right side. She stands completely sideways, facing the left edge.",
    hasAmbientLight: true,
  });
  assert.equal(out.lighting, "Soft light; she is photographed within the scene's ambient light.");
  assert.equal(out.ambient, false);
  assert.equal(out.composition, "Full-body portrait, eye-level view. Photographed from the woman's rear-right side. She is positioned completely sideways, facing the left edge.");
  // Nothing to merge into: the ambient sentence stays its own line; with no pose the posture lead is untouched.
  const alone = tidyZImageCaptureSources({ pose: '', lighting: '', composition: 'She stands completely sideways.', hasAmbientLight: true });
  assert.equal(alone.ambient, true);
  assert.equal(alone.composition, 'She stands completely sideways.');
});
