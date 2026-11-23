import assert from 'node:assert/strict';
import test from 'node:test';
import { getLockControls, normalizeLocks } from '../engine.js';
import { seatFixture } from './indoorSeatFixtures.js';
import { buildMarkdownExport, buildRestoreLocks, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';
import { withGrokImagineForSave } from '../grokImagineResult.js';
import { getReferencePersonPreview } from '../referencePersonPreview.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../../features/saved-cards/savedCardArchive.js';
import { buildPhotographyEditorModel } from '../../features/page1/photographyEditor.js';

const controls = getLockControls();
const frame = label => controls.find(control => control.key === 'framingId').options.find(option => option.zh === label).id;
const full = frame('全身鏡頭 (Full Body Shot)');
const medium = frame('中景鏡頭 (Medium Shot)');
const cowboy = frame('牛仔中景 (Cowboy Shot)');
const run = (locks = {}, framing = full) => seatFixture('室內：莫蘭迪灰背景', '自然坐姿', framing, locks);
const text = (cards, id = 'grok-imagine') => cards.find(card => card.id === id)?.value;
const choices = { subjectSizeId: 'small', subjectPlacementId: 'low' };

test('full-body size and position vary independently in Grok Imagine only', () => {
  const original = run();
  const low = run(choices);
  const tiny = run({ ...choices, subjectSizeId: 'tiny' });
  assert.match(text(low.cards), /one-third of the image height.*90%.*open space above/s);
  assert.match(text(tiny.cards), /one-fifth of the image height.*90%.*open space above/s);
  assert.match(text(run({ subjectPlacementId: 'left' }).cards), /left third.*open space on the right/);
  assert.match(text(run({ subjectPlacementId: 'right' }).cards), /right third.*open space on the left/);
  assert.match(text(run({ subjectPlacementId: 'center' }).cards), /Center her horizontally and vertically/);
  assert.match(text(run({ subjectSizeId: 'small' }).cards), /one-third of the image height/);
  assert.deepEqual(low.cards.filter(card => card.id !== 'grok-imagine'), original.cards.filter(card => card.id !== 'grok-imagine'));
  assert.equal(low.draws, original.draws);
  assert.deepEqual(low.prompt.selection, { ...original.prompt.selection, ...choices });
  assert.deepEqual(run({ subjectSizeId: '', subjectPlacementId: '' }).cards, original.cards);
  assert.equal(original.prompt.selection.subjectSizeId, undefined);
  assert.equal(normalizeLocks({ subjectSizeId: 'random', subjectPlacementId: 'bogus' }).subjectSizeId, undefined);
});

test('micro size and bottom placement combine without changing earlier choices or other outputs', () => {
  const original = run();
  const micro = run({ subjectSizeId: 'micro', subjectPlacementId: 'bottom' });
  assert.match(text(micro.cards), /one-tenth of the image height.*98%.*space above/s);
  assert.match(text(run({ subjectSizeId: 'tiny', subjectPlacementId: 'bottom' }).cards), /one-fifth of the image height.*98%/s);
  assert.match(text(run({ subjectSizeId: 'micro', subjectPlacementId: 'left' }).cards), /one-tenth of the image height.*left third/s);
  assert.doesNotMatch(text(run({ subjectPlacementId: 'bottom' }).cards), /occupies about/);
  assert.deepEqual(micro.cards.filter(card => card.id !== 'grok-imagine'), original.cards.filter(card => card.id !== 'grok-imagine'));
  assert.equal(micro.draws, original.draws);
  assert.deepEqual(micro.prompt.selection, { ...original.prompt.selection, subjectSizeId: 'micro', subjectPlacementId: 'bottom' });
});

test('medium and cowboy frame the visible portion at the selected size and lower corner', () => {
  for (const [framing, crop] of [[medium, 'at the waist'], [cowboy, 'just above her knees']]) {
    const original = run({}, framing);
    for (const [side, size, fraction] of [['left', 'tiny', 'one-fifth'], ['right', 'small', 'one-third']]) {
      const selection = { subjectSizeId: size, subjectPlacementId: `${side}-low` };
      const result = run(selection, framing);
      const output = text(result.cards);
      assert.ok(output.includes(`The bottom edge crops her ${crop}.`));
      assert.ok(output.includes(`occupies about ${fraction} of the image height`));
      assert.ok(output.includes(`lower ${side}`));
      assert.doesNotMatch(output, /complete figure, from head to footwear|90%|98%/);
      assert.deepEqual(result.cards.filter(card => card.id !== 'grok-imagine'), original.cards.filter(card => card.id !== 'grok-imagine'));
      assert.deepEqual(result.prompt.selection, { ...original.prompt.selection, ...selection });
      assert.equal(result.draws, original.draws);
    }
    assert.deepEqual(run({ subjectSizeId: 'micro' }, framing).cards, original.cards);
    assert.match(text(run({ subjectPlacementId: 'left-low' }, framing).cards), /lower left/);
    assert.doesNotMatch(text(run({ subjectPlacementId: 'left-low' }, framing).cards), /of the image height/);
  }
  assert.deepEqual(run({ subjectPlacementId: 'right-low' }).cards, run().cards);
});

test('full-body reference, other crops and excluded subject modes retain their own framing', () => {
  for (const [overrides, framing] of [
    [{}, frame('半臉傾斜特寫')],
    [{}, frame('全臉傾斜特寫')],
    [{ subjectCount: '2' }, full],
    [{ specialSubjectId: 'skeleton' }, full],
    [{ characterProfileId: 'character-rika' }, full],
    [{ fixedCompositionSetId: 'concrete-wall-chesterfield-sofa' }, full],
    [{ captureMode: 'observation', observationCapture: { version: 1, seed: 29 } }, full],
  ]) {
    assert.deepEqual(run({ ...overrides, ...choices }, framing).cards, run(overrides, framing).cards, JSON.stringify(overrides));
  }
  const preview = row => buildPage1GenerationPromptCards(getReferencePersonPreview(row.prompt));
  assert.deepEqual(preview(run(choices)), preview(run()));
});

test('explicit framing choices and the stored Grok Imagine text survive Markdown, ZIP and restore', async () => {
  for (const [framing, savedChoices, expected] of [
    [full, { subjectSizeId: 'micro', subjectPlacementId: 'bottom' }, /one-tenth of the image height.*98%/s],
    [medium, { subjectSizeId: 'small', subjectPlacementId: 'right-low' }, /lower right.*bottom edge crops her at the waist/s],
    [cowboy, { subjectSizeId: 'tiny', subjectPlacementId: 'left-low' }, /lower left.*bottom edge crops her just above her knees/s],
  ]) {
    const row = run(savedChoices, framing);
    const card = withGrokImagineForSave({ ...row.prompt, source: 'page1' });
    const imported = parseExportedMarkdownPrompt(buildMarkdownExport(card), controls, 'subject-framing');
    const restored = normalizeLocks(buildRestoreLocks(imported.selection, controls), controls);
    for (const [key, value] of Object.entries(savedChoices)) assert.equal(restored[key], value);
    assert.equal(text(buildPage1GenerationPromptCards(imported)), text(row.cards));
    assert.match(text(run(restored, framing).cards), expected);
    const zip = await createSavedCardsArchive([card], 1, 'uint8array');
    const [archived] = await parseSavedCardsArchive(zip, controls);
    for (const [key, value] of Object.entries(savedChoices)) assert.equal(archived.selection[key], value);
    assert.equal(text(buildPage1GenerationPromptCards(archived)), text(row.cards));
  }
});

test('workbench places the two manual controls after framing and pauses them outside the supported mode', () => {
  const framing = { control: controls.find(control => control.key === 'framingId'), value: full };
  const group = locks => buildPhotographyEditorModel([framing], { subjectFraming: { locks } })
    .groups.find(item => item.id === 'composition');
  const eligible = group({ subjectCount: '1', framingId: full, ...choices });
  assert.deepEqual(eligible.fields.map(item => item.control.key), ['framingId', 'subjectSizeId', 'subjectPlacementId']);
  assert.deepEqual(eligible.actionKeys, ['framingId']);
  assert.equal(eligible.fields[1].disabled, false);
  const paused = group({ subjectCount: '2', framingId: full, ...choices });
  assert.equal(paused.fields[1].disabled, true);
  assert.equal(paused.fields[1].value, 'small');
  for (const framingId of [medium, cowboy]) {
    const cropped = group({ subjectCount: '1', framingId, subjectSizeId: 'micro', subjectPlacementId: 'left-low' });
    assert.equal(cropped.fields[1].disabled, false);
    assert.equal(cropped.fields[1].value, '');
    assert.equal(cropped.fields[2].value, 'left-low');
    assert.ok(cropped.fields[2].control.options.some(option => option.id === 'right-low'));
    assert.match(cropped.fields[1].control.options.find(option => option.id === 'small').en, /visible figure.*one-third/);
    assert.match(cropped.fields[2].control.options.find(option => option.id === 'left-low').en, /lower left.*bottom edge/s);
  }
  const close = group({ subjectCount: '1', framingId: frame('半臉傾斜特寫'), ...choices });
  assert.equal(close.fields[1].disabled, true);
  assert.equal(close.fields[2].disabled, true);
});
