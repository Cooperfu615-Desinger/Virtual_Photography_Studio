import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generatePrompts, getLockControls } from './engine.js';
import { naturalFixtureLocks } from './engine/midjourneyNaturalFixtures.js';
import { getReferencePersonPreview, hasReferencePersonPreview } from './referencePersonPreview.js';
import { buildPage1GenerationPromptCards, buildPage1DllPromptSources } from './page1PromptOutputs.js';
import { attachMidjourneySettingsToPrompt } from '../features/page1/midjourneyParameterState.js';
import { appendPromptInstruction, PROMPT_APPENDICES } from './promptAppendices.js';

const generate = overrides => generatePrompts(1, naturalFixtureLocks({ subjectCount: '1',
  framingId: { byZh: '全身鏡頭 (Full Body Shot)' },
  topId: { byZh: '領帶襯衫' }, bodyTypeId: { byZh: '高挑時裝模特' },
  poseBaseId: 'standing', poseArrangementId: 'standing-natural', ...overrides,
}), [], { random: () => 0.42 })[0];
const texts = prompt => buildPage1GenerationPromptCards(prompt).map(card => card.value);

test('reference variant removes appearance and wardrobe from all six outputs without mutating originals', () => {
  const prompt = generate({});
  const before = JSON.stringify(prompt);
  const dll = buildPage1DllPromptSources(prompt);
  assert.equal(hasReferencePersonPreview(prompt), true);
  const variant = getReferencePersonPreview(prompt);
  assert.equal(texts(variant).length, 6);
  for (const value of texts(variant)) {
    assert.match(value, /attached reference image/);
    assert.match(value, /adult person/);
    assert.doesNotMatch(value, /short soft black necktie|tall slender model|20-year-old|seductive stunning|She wears/);
  }
  for (const section of ['Composition', 'Pose and Composition', 'Scene', 'Lighting', 'Camera Look']) {
    const read = p => p.grokPrompt.split(`${section}:\n`)[1]?.split('\n\n')[0];
    assert.equal(read(variant), read(prompt), section);
  }
  assert.equal(JSON.stringify(prompt), before);
  assert.deepEqual(buildPage1DllPromptSources(prompt), dll);
  assert.equal(variant.selection, prompt.selection);
  assert.equal(hasReferencePersonPreview(JSON.parse(before)), false);
});

test('reference is unavailable for duo, cards, dedicated subjects and unknown previews', () => {
  for (const overrides of [{ subjectCount: '2' }, { characterProfileId: 'character-48g' }, { specialSubjectId: 'white-skeleton' }]) {
    const prompt = generate(overrides);
    assert.equal(hasReferencePersonPreview(prompt), false);
    assert.equal(getReferencePersonPreview(prompt), prompt);
  }
  assert.equal(hasReferencePersonPreview(null), false);
});

test('live MJ settings and all appendix templates compose with reference without altering source', () => {
  const prompt = attachMidjourneySettingsToPrompt(generate({}), { mjStylize: 321 });
  const variant = getReferencePersonPreview(prompt);
  assert.equal(variant.midjourneyPrompt.match(/ --v .*$/)?.[0], prompt.midjourneyPrompt.match(/ --v .*$/)?.[0]);
  for (const template of PROMPT_APPENDICES) {
    const text = appendPromptInstruction(variant.grokPrompt, template.id, { referencePerson: true });
    assert.match(text, /reference image/);
    assert.doesNotMatch(text, /same person, outfit, and setting described above/);
  }
});

test('all complete looks and fixed scenes support reference without restoring wardrobe', () => {
  for (const key of ['specialOutfitId', 'outfitPresetId', 'fixedCompositionSetId']) {
    const options = getLockControls().find(control => control.key === key).options;
    for (const option of options.filter(item => item.en && item.en !== 'none' && item.id !== 'random')) {
      const prompt = generate({ [key]: option.id });
      const variant = getReferencePersonPreview(prompt);
      assert.notEqual(variant, prompt, `${key}: ${option.id}`);
      for (const value of texts(variant)) {
        assert.match(value, /attached reference image/);
        assert.doesNotMatch(value, /Wardrobe:|Hair and body details:|She wears/);
      }
    }
  }
});

test('reference preserves expression, garment-dependent gesture, visible text and derived ratios', () => {
  const prompt = generate({ pantsId: { byZh: '直筒牛仔褲' }, poseHandId: 'hands-in-pockets',
    expressionId: { byZh: '柔和微笑' },
    zImageVisibleTextEnabled: true, zImageVisibleTextContent: 'REFERENCE QA',
    zImageVisibleTextLanguage: 'english', zImageVisibleTextPlacement: 'scene-wall-poster' });
  const variant = getReferencePersonPreview(prompt);
  assert.match(variant.grokPrompt, /both hands tucked into the two front pockets/);
  assert.match(variant.grokPrompt, /only if the relevant item exists in the reference image/);
  assert.match(variant.zImagePrompt, /REFERENCE QA/);
  assert.match(variant.extraPrompts.find(p => p.id === 'chest-up-portrait').text, /4:5/);
  assert.match(variant.extraPrompts.find(p => p.id === 'full-body-character').text, /9:16/);
  const expression = prompt.structured.Character.find(item => item.id.includes('expression'));
  assert.ok(expression);
  assert.ok(variant.grokPrompt.toLowerCase().includes(expression.en.toLowerCase()));
});

test('no random draw occurs when projecting or repeatedly toggling the same preview', () => {
  let draws = 0;
  const prompt = generatePrompts(1, naturalFixtureLocks({ subjectCount: '1' }), [], {
    random: () => { draws++; return 0.42; },
  })[0];
  const initialDraws = draws;
  const first = getReferencePersonPreview(prompt);
  assert.deepEqual(getReferencePersonPreview(prompt), first);
  assert.equal(draws, initialDraws);
  const custom = generatePrompts(1, naturalFixtureLocks({ subjectCount: '1' }), [], {
    characterProfilePrompt: 'An original adult character with silver hair', random: () => 0.42,
  })[0];
  assert.equal(hasReferencePersonPreview(custom), false);
});
