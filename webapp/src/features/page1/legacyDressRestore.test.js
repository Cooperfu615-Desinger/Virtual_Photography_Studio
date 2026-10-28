import assert from 'node:assert/strict';
import test from 'node:test';
import { getLockControls, createEmptyLocks, normalizeLocks, generatePrompts, createSeededRandom } from '../../lib/engine.js';
import { buildAllNoneLocks } from './page1Selectors.js';
import { reconcilePage1SingleWardrobeLocks } from './page1WardrobeExclusivity.js';
import { transitionPage1Locks } from './lockTransitions.js';
import { buildRestoreLocks, buildMarkdownExport, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt, parseLocksFromStandardPrompt } from '../saved-cards/cardCodec.js';
import { buildWorkspaceSummary } from '../../lib/page1WorkspaceSummary.js';
const controls = getLockControls();
const options = key => controls.find(c => c.key === key).options;
const active = key => options(key).filter(o => o.id && !['none','random'].includes(o.id) && o.zh !== '全無');
const none = key => options(key).find(o => o.zh === '全無').id;
const empty = () => ({ ...buildAllNoneLocks(controls, createEmptyLocks()), subjectCount: '1', framingId: options('framingId').find(o => o.zh.includes('全身鏡頭')).id });
const legacy = () => ({ ...empty(), dressId: active('dressId')[0].id, topBottomPaletteId: active('topBottomPaletteId')[0].id });
const transition = (previous, candidate, restoringSelection = false) => transitionPage1Locks({ previousLocks: previous, candidateLocks: candidate, lockControls: controls, restoringSelection });
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('legacy-dress-restore') })[0];

test('A2 legacy dress: structured apply and storage initialization retain all 42 existing palettes', () => {
  for (const palette of active('topBottomPaletteId')) {
    const input = { ...legacy(), topBottomPaletteId: palette.id };
    for (const restored of [buildRestoreLocks(input, controls), transition(empty(), input, true), reconcilePage1SingleWardrobeLocks({ previousLocks: createEmptyLocks(), candidateLocks: normalizeLocks(input), lockControls: controls, restoringSelection: true })]) {
      assert.equal(restored.dressId, input.dressId);
      assert.equal(restored.topBottomPaletteId, palette.id);
      const p = generate(restored);
      assert.ok(p.grokPrompt.includes(palette.topColor.en));
      assert.ok(p.grokPrompt.includes(palette.bottomColor.en));
      assert.equal(p.selection.topBottomPaletteId, palette.id);
    }
  }
});

test('A2 legacy dress: unrelated updates retain palette and do not mutate input', () => {
  const input = legacy(), frozen = structuredClone(input);
  for (const patch of [{}, { seed: 91 }, { shoesColorId: 'red' }, { completeLookPaletteId: active('completeLookPaletteId')[0].id }, { framingId: options('framingId').find(o => o.zh.includes('中景鏡頭')).id }]) {
    assert.equal(transition(input, { ...input, ...patch }).topBottomPaletteId, input.topBottomPaletteId);
  }
  assert.deepEqual(input, frozen);
});

test('A2 legacy dress: explicit dress/color changes remove the old palette including none and random', () => {
  const input = legacy();
  for (const patch of [{ dressId: active('dressId')[1].id }, { dressId: none('dressId') }, { dressId: '' }, { dressColorId: 'red' }, { dressColorId: '' }]) {
    assert.equal(transition(input, { ...input, ...patch }).topBottomPaletteId, 'none');
  }
  const released = transition(input, { ...input, topBottomPaletteId: 'none' });
  assert.equal(released.dressId, input.dressId);
  assert.equal(released.dressColorId, input.dressColorId);
  assert.equal(released.topBottomPaletteId, 'none');
});

test('A2 legacy dress: restoration still clears conflicting separates; manual separates clear dress and old pair', () => {
  const input = { ...legacy(), topId: active('topId')[0].id, pantsId: active('pantsId')[0].id, outerwearId: active('outerwearId')[0].id };
  const restored = buildRestoreLocks(input, controls);
  assert.equal(restored.topBottomPaletteId, input.topBottomPaletteId);
  assert.equal(restored.topId, none('topId')); assert.equal(restored.pantsId, none('pantsId'));
  assert.equal(restored.outerwearId, input.outerwearId);
  const separated = transition(legacy(), { ...legacy(), topId: input.topId });
  assert.equal(separated.dressId, none('dressId')); assert.equal(separated.topBottomPaletteId, 'none');
  assert.equal(separated.topId, input.topId);
  const manual = transition({ ...empty(), topBottomPaletteId: input.topBottomPaletteId }, legacy());
  assert.equal(manual.topBottomPaletteId, 'none');
});

test('A2 legacy dress: preset and special takeover, explicit new paired selection and invalid palette retain policy', () => {
  const input = legacy();
  for (const key of ['outfitPresetId','specialOutfitId']) {
    const next = transition(input, { ...input, [key]: active(key)[0].id });
    assert.equal(next.topBottomPaletteId, 'none'); assert.equal(next.dressId, none('dressId'));
  }
  const next = transition(input, { ...input, topBottomPaletteId: active('topBottomPaletteId')[1].id });
  assert.equal(next.dressId, none('dressId')); assert.equal(next.topBottomPaletteId, active('topBottomPaletteId')[1].id);
  for (const id of ['', 'random', 'unknown-palette']) assert.equal(buildRestoreLocks({ ...input, topBottomPaletteId: id }, controls).topBottomPaletteId, 'none');
});

test('A2 legacy dress: JSON and shared Markdown snapshot preserve original outputs through apply and re-save', () => {
  const p = generate(legacy());
  for (const restored of [deserializeFavoritePrompt(serializeFavoritePrompt(p)), parseExportedMarkdownPrompt(buildMarkdownExport(p), controls, 'restored')]) {
    for (const key of ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt','extraPrompts']) assert.deepEqual(restored[key], p[key]);
    const locks = transition(empty(), buildRestoreLocks(restored.selection, controls), true);
    const regenerated = generate(locks);
    assert.equal(regenerated.selection.topBottomPaletteId, p.selection.topBottomPaletteId);
    assert.equal(regenerated.grokPrompt, p.grokPrompt);
    assert.equal(deserializeFavoritePrompt(serializeFavoritePrompt(regenerated)).selection.topBottomPaletteId, p.selection.topBottomPaletteId);
  }
});

test('A2 legacy dress: duo A/B fields survive and dormant single state returns without crossing roles', () => {
  const input = { ...legacy(), subjectCount: '2', dressAId: active('dressAId')[1].id, dressBId: active('dressBId')[2].id, topBottomPaletteAId: active('topBottomPaletteAId')[1].id, topBottomPaletteBId: active('topBottomPaletteBId')[2].id };
  const restored = buildRestoreLocks(input, controls), back = transition(restored, { ...restored, subjectCount: '1' });
  for (const key of ['dressAId','dressBId','topBottomPaletteAId','topBottomPaletteBId']) { assert.equal(restored[key], input[key]); assert.equal(back[key], input[key]); }
  assert.equal(back.topBottomPaletteId, input.topBottomPaletteId);
});

test('A2 legacy dress: prose follow-up restores canonical dress and exact palette', () => {
  const p = generate(legacy()), parsed = buildRestoreLocks(parseLocksFromStandardPrompt(p.grokPrompt, controls).locks, controls);
  assert.equal(parsed.topBottomPaletteId, legacy().topBottomPaletteId); assert.equal(parsed.dressId, legacy().dressId); assert.equal(parsed.outfitPresetId, none('outfitPresetId'));
});

test('A2 legacy dress: workspace summary names the retained palette only for the applicable single state', () => {
  assert.ok(buildWorkspaceSummary(legacy(), controls).wardrobe.summary.includes('連身配色：' + active('topBottomPaletteId')[0].zh));
  assert.ok(!buildWorkspaceSummary({ ...legacy(), subjectCount: '2' }, controls).wardrobe.summary.includes('連身配色：'));
});
