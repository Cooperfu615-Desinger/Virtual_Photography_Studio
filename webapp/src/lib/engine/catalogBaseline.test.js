import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OUTPUTS, compareCaptures, differences } from '../../../../scripts/lib/catalogBaseline.mjs';
import { verifySeal, captureCorpus } from '../../../../scripts/catalog_baseline.mjs';
import { withPreAllA5ReplayRoot as withPreA5ReplayRoot } from '../../../../scripts/lib/a1AdultIdentityHistoricalReplay.mjs';

function fixture() {
  const prompt = { grokPrompt: 'One.\n', zImagePrompt: 'Two.', midjourneyPrompt: 'Three.', nanoBananaPrompt: 'Four.',
    extraPrompts: [{ id: 'chest-up-portrait', text: 'Chest.' }, { id: 'full-body-character', text: 'Body.' }],
    selection: { topId: 'stable:top' }, summaryFields: { body: 'same' }, structured: { Wardrobe: [{ id: 'stable:top' }] } };
  const texts = ['One.\n', 'Two.', 'Three.', 'Four.', 'Chest.', 'Body.'];
  return { format: 'catalog-baseline-v1', cases: [{ id: 'case-a', status: 'resolved', rngCalls: 10, prompt,
    outputs: Object.fromEntries(OUTPUTS.map((key, i) => [key, { status: 'effective', text: texts[i] }])) }] };
}

test('comparator fails closed on punctuation, same-length words, cases, outputs, selections and RNG', () => {
  const mutations = [
    x => { x.cases[0].prompt.grokPrompt = 'One!\n'; },
    x => { x.cases[0].prompt.grokPrompt = 'Two.\n'; },
    x => { x.cases.pop(); },
    x => { x.cases.push(structuredClone(x.cases[0])); },
    x => { x.cases[0].status = 'UNRESOLVED'; },
    x => { x.cases[0].prompt.selection.topId = 'changed'; },
    x => { x.cases[0].prompt.structured.Wardrobe[0].id = 'changed'; },
    x => { x.cases[0].rngCalls++; },
    x => { delete x.cases[0].outputs.nanoBananaPrompt; },
    x => { delete x.cases[0].prompt.nanoBananaPrompt; },
    x => { x.cases[0].outputs.extra = { status: 'effective', text: 'extra' }; },
  ];
  for (const mutate of mutations) {
    const before = fixture(), after = fixture(); mutate(after);
    let failed = false;
    try { failed = compareCaptures(before, after).length > 0; } catch { failed = true; }
    assert.ok(failed, String(mutate));
  }
  const unresolved = fixture(); unresolved.cases[0].status = 'UNRESOLVED';
  assert.throws(() => compareCaptures(unresolved, unresolved), /unresolved/);
  const after = fixture(); after.cases[0].prompt.id = 'runtime-id'; after.cases[0].prompt.date = 'runtime-date';
  assert.deepEqual(compareCaptures(fixture(), after), []);
  assert.ok(differences({ a: 1, b: 2 }, { b: 2, a: 1 }).length, 'metadata key order is protected');
});

test('sealed A corpus replays every case, output, restoration, alias and RNG count', async () => {
  const { corpus, capture } = verifySeal();
  const actual = await withPreA5ReplayRoot(repo => captureCorpus(repo, corpus));
  const diff = compareCaptures(capture, actual);
  assert.equal(diff.length, 0, JSON.stringify(diff.slice(0, 8), null, 2));
});
