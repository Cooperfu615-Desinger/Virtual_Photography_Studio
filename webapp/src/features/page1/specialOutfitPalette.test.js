import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls, normalizeLocks } from '../../lib/engine.js';
import { transitionPage1Locks } from './lockTransitions.js';
import { reconcilePage1SingleWardrobeLocks } from './page1WardrobeExclusivity.js';
import { buildAllNoneLocks } from './page1Selectors.js';
import { buildRestoreLocks, buildMarkdownExport, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../saved-cards/cardCodec.js';
import { getFullBodyImportSource, prepareCaptureEntry, importCapturePerson } from '../../lib/observationCaptureImport.js';
import { resolveCapture } from '../../lib/observationCaptureMode.js';
const controls = getLockControls();
const options = key => controls.find(c => c.key === key).options;
const concrete = key => options(key).filter(o => o.id && !['none', 'random'].includes(o.id) && o.zh !== '全無');
const item = (key, text) => options(key).find(o => o.zh.includes(text));
const empty = () => ({ ...buildAllNoneLocks(controls, createEmptyLocks()), subjectCount: '1', framingId: item('framingId', '全身鏡頭').id });
const special = () => ({ ...empty(), specialOutfitId: item('specialOutfitId', '紅色亮面膠帶').id, completeLookPaletteId: 'silver-metallic' });
const transition = (previousLocks, candidateLocks, restoringSelection = false) => transitionPage1Locks({ previousLocks, candidateLocks, restoringSelection, lockControls: controls });
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('a2-special-palette') })[0];

test('A2 all 90 single special outfits preserve all nine palettes and explicit none through manual, restore and unrelated updates', () => {
  assert.equal(concrete('specialOutfitId').length, 90);
  assert.equal(concrete('completeLookPaletteId').length, 9);
  for (const outfit of concrete('specialOutfitId')) for (const palette of options('completeLookPaletteId')) {
    const next = { ...empty(), specialOutfitId: outfit.id, completeLookPaletteId: palette.id };
    for (const [previous, candidate, restore] of [
      [{ ...next, completeLookPaletteId: 'none' }, next, false],
      [empty(), normalizeLocks(buildRestoreLocks(next, controls)), true],
      [next, { ...next, hairColorId: 'red' }, false],
    ]) assert.equal(transition(previous, candidate, restore).completeLookPaletteId, palette.id, outfit.id + palette.id);
  }
});

test('A2 preserving a special palette does not retain covered clothes, layers or accessories', () => {
  const dirty = special();
  for (const key of ['outfitPresetId', 'dressId', 'topId', 'pantsId', 'outerwearId', 'shoesId', 'headAccessoryId', 'eyewearId', 'topBottomPaletteId']) dirty[key] = concrete(key)[0].id;
  const next = transition(empty(), dirty);
  assert.equal(next.completeLookPaletteId, dirty.completeLookPaletteId);
  assert.equal(next.specialOutfitId, dirty.specialOutfitId);
  for (const control of controls.filter(c => c.section === 'wardrobe' && !['specialOutfitId', 'specialOutfitAId', 'specialOutfitBId', 'completeLookPaletteId'].includes(c.key))) {
    assert.equal(next[control.key], control.options.find(o => o.zh === '全無')?.id || '', control.key);
  }
});

test('A2 switching special outfits, explicit palette none and reload retain the intended complete-look state', () => {
  const previous = special();
  const changed = transition(previous, { ...previous, specialOutfitId: concrete('specialOutfitId')[0].id });
  assert.equal(changed.completeLookPaletteId, previous.completeLookPaletteId);
  const loaded = reconcilePage1SingleWardrobeLocks({ previousLocks: createEmptyLocks(), candidateLocks: normalizeLocks(JSON.parse(JSON.stringify(changed))), lockControls: controls });
  assert.equal(transition(loaded, { ...loaded, hairColorId: 'red' }).completeLookPaletteId, previous.completeLookPaletteId);
  assert.equal(transition(changed, { ...changed, completeLookPaletteId: 'none' }).completeLookPaletteId, 'none');
  assert.equal(transition(previous, buildAllNoneLocks(controls, previous)).completeLookPaletteId, 'none');
  const separates = transition(previous, { ...empty(), topId: concrete('topId')[0].id, completeLookPaletteId: previous.completeLookPaletteId });
  assert.equal(separates.completeLookPaletteId, 'none');
});

test('A2 duo A and B special palettes remain isolated and the other person stays intact', () => {
  for (const role of ['A', 'B']) for (const palette of concrete('completeLookPaletteId')) {
    const other = role === 'A' ? 'B' : 'A';
    const previous = { ...empty(), subjectCount: '2', ['top' + other + 'Id']: concrete('top' + other + 'Id')[0].id, ['completeLookPalette' + other + 'Id']: 'cream-neutral' };
    const next = transition(previous, { ...previous, ['specialOutfit' + role + 'Id']: concrete('specialOutfit' + role + 'Id')[0].id, ['completeLookPalette' + role + 'Id']: palette.id }, true);
    assert.equal(next['completeLookPalette' + role + 'Id'], palette.id);
    assert.equal(next['completeLookPalette' + other + 'Id'], previous['completeLookPalette' + other + 'Id']);
    assert.equal(next['top' + other + 'Id'], previous['top' + other + 'Id']);
  }
});

test('A2 JSON and complete Markdown retain original outputs and special palette after apply', () => {
  const p = generate(special());
  const json = serializeFavoritePrompt(p), before = JSON.stringify(json);
  for (const restored of [deserializeFavoritePrompt(json), parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'a2-special')]) {
    assert.equal(restored.grokPrompt, p.grokPrompt);
    assert.equal(restored.selection.completeLookPaletteId, 'silver-metallic');
    const next = transition(empty(), normalizeLocks(buildRestoreLocks(restored.selection, controls)), true);
    assert.equal(next.completeLookPaletteId, 'silver-metallic');
    assert.ok(generate(next).extraPrompts.find(x => x.id === 'full-body-character').text.includes('outfit palette: ' + options('completeLookPaletteId').find(o => o.id === 'silver-metallic').en));
  }
  assert.equal(JSON.stringify(json), before);
});

test('A2 special capture source keeps its palette and frozen reference across capture generation', () => {
  const locks = transition(empty(), special()), p = generate(locks);
  const profile = importCapturePerson(prepareCaptureEntry(resolveCapture({ seed: 41 }).profile, p));
  const person = getFullBodyImportSource(p);
  assert.equal(person.selection.completeLookPaletteId, 'silver-metallic');
  assert.deepEqual(profile.importedPerson, person);
  const frozen = JSON.stringify(person);
  const capture = generate({ ...locks, captureMode: 'observation', observationCapture: profile });
  assert.equal(capture.extraPrompts.find(x => x.id === 'full-body-character').text, person.fullBodyPrompt);
  assert.equal(JSON.stringify(person), frozen);
});

test('A2 structured dress restore retains its pair while paired-color capture accepts resolved colors', () => {
  const locks = { ...empty(), dressId: concrete('dressId')[0].id, topBottomPaletteId: concrete('topBottomPaletteId')[0].id };
  assert.equal(buildRestoreLocks(locks, controls).topBottomPaletteId, locks.topBottomPaletteId);
  assert.ok(getFullBodyImportSource(generate(locks)));
  assert.ok(getFullBodyImportSource(generate({ ...locks, topBottomPaletteId: 'none' })));
});
