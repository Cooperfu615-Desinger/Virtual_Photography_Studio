import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';
import { createSeededRandom } from './engineRandom.js';
import { buildWorkspaceSummary } from './page1WorkspaceSummary.js';
import { getFullBodyImportSource, prepareCaptureEntry, importCapturePerson, normalizeImportedPerson } from './observationCaptureImport.js';
import { CAPTURE_GROUPS, resolveCapture, rerollCapture } from './observationCaptureMode.js';
import { PROMPT_OUTPUT_CONTRACTS, validatePromptOutputContract } from './engine/promptOutputContracts.js';
import { buildRestoreLocks, serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../features/saved-cards/cardCodec.js';

const controls = getLockControls();
const sourceLocks = () => ({ ...createEmptyLocks(), subjectCount: '1', characterProfileId: 'none', specialSubjectId: 'none', fixedCompositionSetId: 'none',
  framingId: controls.find(c => c.key === 'framingId').options.find(o => o.zh.startsWith('全身鏡頭')).id });
const generate = (locks, seed = 'capture-person-import') => generatePrompts(1, locks, [], { random: createSeededRandom(seed) })[0];
function imported(locks, source) {
  return { ...locks, captureMode: 'observation', observationCapture: importCapturePerson(prepareCaptureEntry(resolveCapture({}).profile, source)) };
}
const outputs = p => [p.grokPrompt, p.zImagePrompt, p.midjourneyPrompt, p.nanoBananaPrompt, ...p.extraPrompts.map(x => x.text)];

test('imported summaries omit dormant duo fields and use the same resolved person', () => {
  const locks = { ...sourceLocks(), hairColorAId: controls.find(c => c.key === 'hairColorAId').options.find(o => o.zh === '自然黑').id,
    topAId: controls.find(c => c.key === 'topAId').options.find(o => o.en !== 'none').id };
  const next = imported(locks, generate(locks));
  const person = next.observationCapture.importedPerson;
  assert.equal(person.selection.topAId, undefined);
  assert.equal(person.selection.hairColorAId, undefined);
  const actual = buildWorkspaceSummary(next, controls);
  const expected = buildWorkspaceSummary(person.selection, controls);
  assert.equal(actual.character.summary, expected.character.summary);
  assert.equal(actual.wardrobe.summary, expected.wardrobe.summary);
});

test('full-body import captures resolved data, colors and original settings without altering the source', () => {
  const locks = sourceLocks();
  const source = generate(locks);
  const before = JSON.stringify(source);
  const snapshot = getFullBodyImportSource(source);
  assert.ok(snapshot);
  assert.equal(snapshot.fullBodyPrompt, source.extraPrompts.find(x => x.id === 'full-body-character').text);
  assert.deepEqual(snapshot.wardrobe, source.structured.Wardrobe);
  assert.equal(snapshot.rawSelection.hairstyleId, locks.hairstyleId);
  assert.equal(snapshot.selection.hairstyleId, source.selection.hairstyleId);
  const next = imported(locks, source);
  const result = generate(next);
  assert.ok(result);
  assert.deepEqual(result.structured.Wardrobe, source.structured.Wardrobe);
  assert.equal(result.extraPrompts.find(x => x.id === 'full-body-character').text, snapshot.fullBodyPrompt);
  assert.equal(JSON.stringify(source), before);
});

test('capture reroll preserves imported identity, wardrobe and full-body output across seeds', () => {
  const locks = sourceLocks();
  const source = generate(locks);
  const next = imported(locks, source);
  const first = generate(next);
  for (let i = 0; i < 12; i++) {
    next.observationCapture = rerollCapture(next.observationCapture).profile;
    const result = generate(next, `other-${i}`);
    assert.deepEqual(result.structured.Character.slice(0, -1), first.structured.Character.slice(0, -1));
    assert.deepEqual(result.structured.Wardrobe, first.structured.Wardrobe);
    assert.equal(result.extraPrompts[1].text, first.extraPrompts[1].text);
  }
});

test('six outputs survive JSON, markdown and reload while dormant standard choices are preserved', () => {
  const locks = { ...sourceLocks(), poseBaseId: 'sitting' };
  const next = imported(locks, generate(locks));
  const first = generate(next);
  for (const restored of [
    normalizeLocks(JSON.parse(JSON.stringify(next))),
    normalizeLocks(buildRestoreLocks(deserializeFavoritePrompt(serializeFavoritePrompt(first)).selection, controls)),
    normalizeLocks(parseExportedMarkdownPrompt(buildMarkdownExport(first), controls, 'import-test').selection),
  ]) {
    assert.deepEqual(outputs(generate(restored)), outputs(first));
    assert.equal(restored.poseBaseId, locks.poseBaseId);
    assert.equal(restored.hairstyleId, locks.hairstyleId);
  }
  assert.deepEqual(outputs(generate({ ...next, captureMode: 'standard' })), outputs(generate(locks)));
});

test('missing source cannot generate, reimport is explicit, and unsupported sources cannot be used', () => {
  const locks = sourceLocks();
  const source = generate(locks);
  const first = imported(locks, source);
  const different = generate(locks, 'different-person');
  const prepared = prepareCaptureEntry(first.observationCapture, different);
  assert.deepEqual(prepared.importedPerson, first.observationCapture.importedPerson);
  assert.notDeepEqual(importCapturePerson(prepared).importedPerson, prepared.importedPerson);
  assert.equal(getFullBodyImportSource(generate({ ...locks, subjectCount: '2' })), null);
  assert.equal(getFullBodyImportSource(generate(first)), null);
  assert.equal(generate({ ...locks, captureMode: 'observation', observationCapture: { personSource: 'full-body' } }), undefined);
  assert.equal(getFullBodyImportSource({ ...source, structured: {} }), null);
  assert.deepEqual(importCapturePerson({ ...first.observationCapture, availablePerson: null }).importedPerson, first.observationCapture.importedPerson);
});

const byZh = (key, label) => controls.find(c => c.key === key).options.find(o => o.zh.includes(label))?.id;
function silentLocks() {
  const locks = sourceLocks();
  for (const c of controls) {
    const none = c.options?.find(o => o.zh === '全無');
    if (none && !c.required && c.key !== 'framingId') locks[c.key] = none.id;
  }
  return locks;
}

test('explicit face, skin, hair and body survive import; main GPT body omission and full-body retention remain', () => {
  const locks = silentLocks();
  for (const key of ['facialFeaturesId', 'skinDetailsId', 'hairstyleId', 'hairColorId']) {
    locks[key] = controls.find(c => c.key === key).options.find(o => o.en && o.zh !== '全無' && o.id !== 'random').id;
  }
  locks.bodyTypeId = byZh('bodyTypeId', '豐胸纖腰沙漏');
  locks.topId = byZh('topId', '領帶襯衫');
  locks.topColorId = byZh('topColorId', '紅色');
  const source = generate(locks);
  const result = generate(imported(locks, source));
  for (const item of getFullBodyImportSource(source).character.filter(item => !item.id.includes('body-type') && item.zh !== '全無')) {
    assert.ok(result.grokPrompt.toLowerCase().includes(item.en.toLowerCase()), item.zh);
  }
  assert.doesNotMatch(result.grokPrompt, /I–K cup bust/);
  assert.doesNotMatch(result.extraPrompts[0].text, /I–K cup bust/);
  assert.match(result.extraPrompts[1].text, /I–K cup bust/);
  assert.match(result.grokPrompt, /red/);
});

test('none stays silent, close-up source retains hidden clothing and source snapshots are immutable copies', () => {
  for (const framing of ['全身鏡頭', '全臉傾斜特寫']) {
    const locks = { ...silentLocks(), framingId: byZh('framingId', framing), pantsId: byZh('pantsId', '牛仔'), shoesId: byZh('shoesId', 'adizero') };
    const source = generate(locks);
    const person = getFullBodyImportSource(source);
    const next = imported({ ...locks, framingId: sourceLocks().framingId }, source);
    const result = generate(next);
    assert.deepEqual(result.structured.Wardrobe, source.structured.Wardrobe);
    assert.equal(result.extraPrompts[1].text, person.fullBodyPrompt);
    assert.equal(result.structured.Character.filter(x => /hairstyle|hair-color|facial-features/.test(x.id)).every(x => x.zh === '全無'), true);
    person.wardrobe.length = 0;
    assert.notDeepEqual(person, getFullBodyImportSource(source));
  }
});

test('imported source passes six-output contracts for every capture scene and supported framing', () => {
  const locks = { ...silentLocks(), topId: byZh('topId', '領帶襯衫'), topColorId: byZh('topColorId', '紅色'), pantsId: byZh('pantsId', '牛仔') };
  const source = generate(locks);
  for (const scene of CAPTURE_GROUPS[0].options) for (const framing of ['全身鏡頭', '中景鏡頭', '牛仔中景']) {
    const next = imported({ ...locks, framingId: byZh('framingId', framing) }, source);
    next.observationCapture = { ...next.observationCapture, selected: { scene: scene.id }, fixed: { scene: true } };
    const p = generate(next);
    for (const [field, contract] of Object.entries(PROMPT_OUTPUT_CONTRACTS)) {
      const value = contract.source.kind === 'field' ? p[contract.source.key] : p.extraPrompts.find(x => x.id === contract.source.id)?.text;
      assert.deepEqual(validatePromptOutputContract(field, value || '', { mode: 'single' }), [], `${scene.id}/${framing}/${field}`);
    }
  }
});

test('invalid imported records fail closed and card selection cannot leak into imported identity', () => {
  const locks = silentLocks();
  const next = imported(locks, generate(locks));
  const card = controls.find(c => c.key === 'characterProfileId').options.find(o => o.specialSubject === 'character-profile');
  assert.deepEqual(outputs(generate({ ...next, characterProfileId: card.id })), outputs(generate(next)));
  for (const invalid of [null, {}, { ...next.observationCapture.importedPerson, version: 99 }, { ...next.observationCapture.importedPerson, wardrobe: ['bad'] }]) {
    assert.equal(normalizeImportedPerson(invalid), null);
    assert.equal(generate({ ...next, observationCapture: { ...next.observationCapture, importedPerson: invalid } }), undefined);
  }
});
