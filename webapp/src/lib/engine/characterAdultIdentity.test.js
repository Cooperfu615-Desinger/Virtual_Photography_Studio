import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHARACTER_PROFILE_OPTIONS } from './characterProfiles.js';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { getFullBodyImportSource } from '../observationCaptureImport.js';
import { resolveCapture, rerollCapture } from '../observationCaptureMode.js';
import { serializeFavoritePrompt, deserializeFavoritePrompt, buildMarkdownExport, parseExportedMarkdownPrompt } from '../../features/saved-cards/cardCodec.js';

const cards = CHARACTER_PROFILE_OPTIONS.filter(c => c.profile);
const controls = getLockControls();
const full = controls.find(c => c.key === 'framingId').options.find(o => o.zh.startsWith('全身鏡頭')).id;
const generate = locks => generatePrompts(1, locks, [], { random: createSeededRandom('a1-adult-identity') })[0];
const locksFor = id => ({ ...createEmptyLocks(), characterProfileId: id, framingId: full });
const gptTexts = p => [p.grokPrompt, ...p.extraPrompts.map(x => x.text)];
const lead = card => card.profile.identityAndBody.split(' with ')[0].replace(/^a /, 'A ') + '.';

for (const mode of ['full-default', 'selected-layers']) test(`33 cards retain source adult identity once in three PAGE1 GPT outputs (${mode})`, () => {
  assert.equal(cards.length, 33);
  for (const card of cards) {
    const p = generate({ ...locksFor(card.id), characterCardWardrobeMode: mode });
    assert.equal(gptTexts(p).length, 3);
    for (const text of gptTexts(p)) {
      const expected = lead(card);
      assert.equal(text.split(expected).length - 1, 1, `${card.id}: missing/duplicated adult source`);
      assert.ok(text.indexOf(expected) < text.indexOf('Facial geometry:'), card.id);
      assert.ok(!text.includes(card.profile.identityAndBody + '.'), 'do not repeat whole legacy identity');
      for (const anchor of card.profile.distinctiveFeatures.split(', ')) assert.ok(text.toLowerCase().includes(anchor.toLowerCase()), `${card.id}: ${anchor}`);
      if (text === p.grokPrompt || text === p.extraPrompts[1].text) assert.ok(text.toLowerCase().includes(card.profile.body.toLowerCase()), card.id + ' body');
    }
  }
});

test('card capture keeps adult identity through rerolls, JSON and Markdown without enabling full-body import', () => {
  const source = generate(locksFor('character-eleanor'));
  assert.equal(getFullBodyImportSource(source), null, 'card reference is not an ordinary import source');
  const capture = { ...resolveCapture({ seed: 41 }).profile, personSource: 'card' };
  for (const profile of [capture, rerollCapture(capture).profile]) {
    const result = generate({ ...locksFor('character-eleanor'), captureMode: 'observation', observationCapture: profile });
    for (const text of gptTexts(result)) assert.ok(text.includes('A 20-year-old adult demonic woman.'));
    const decoded = deserializeFavoritePrompt(serializeFavoritePrompt(result));
    const markdown = parseExportedMarkdownPrompt(buildMarkdownExport(result), controls, 'a1-test');
    assert.deepEqual(gptTexts(decoded), gptTexts(result)); assert.equal(markdown.grokPrompt, result.grokPrompt);
  }
});

test('historical inverse rejects missing, duplicate and altered patches while retaining unrelated code', async () => {
  const { readFileSync } = await import('node:fs');
  const { preA1EngineSource, A1_AFTER, A1_BEFORE } = await import('../../../../scripts/lib/a1AdultIdentityHistoricalReplay.mjs');
  const source = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
  assert.throws(() => preA1EngineSource(source.replace(A1_AFTER, A1_BEFORE)), /requires/);
  assert.throws(() => preA1EngineSource(source + A1_AFTER), /requires/);
  assert.throws(() => preA1EngineSource(source.replace(A1_AFTER, A1_AFTER.replace('20-year-old', '21-year-old'))), /requires/);
  assert.throws(() => preA1EngineSource(source + A1_BEFORE), /mixed/);
  assert.ok(preA1EngineSource(source + '\n// unrelated future edit\n').endsWith('// unrelated future edit\n'));
});

test('both real GPT builder bodies preserve legacy-only, missing and unsupported identity sources', async () => {
  const { readFileSync } = await import('node:fs');
  const { preA1EngineSource } = await import('../../../../scripts/lib/a1AdultIdentityHistoricalReplay.mjs');
  const current = readFileSync(new URL('../engine.js', import.meta.url), 'utf8');
  // Exercise private builder bodies without adding a production testing export or mutating frozen catalog data.
  const build = (source, name) => {
    const start = source.indexOf(`function ${name}(`);
    const end = source.indexOf('\n}', start) + 2;
    assert.ok(start > 0 && end > start);
    return new Function('isCharacterProfileSubject', 'buildCharacterCardProfileGroups', 'ensureTerminalPeriod', 'cleanCharacterProfileGroupText', 'buildCharacterCardHairVariantText', 'filterCompleteLookPromptForFraming', `return (${source.slice(start, end)});`)(
      () => true, subject => subject.profile, value => value ? value + '.' : '', value => String(value || '').trim(), () => '', value => value,
    );
  };
  for (const name of ['buildGptCharacterProfileSubjectBlock', 'buildGptFullBodyCharacterProfileSubjectBlock']) {
    const before = build(preA1EngineSource(current), name), after = build(current, name);
    for (const profile of [
      { identityAndBody: 'a 20-year-old adult East Asian woman with original body' },
      { facialGeometry: 'original face', identityAndBody: '' },
      { facialGeometry: 'original face', identityAndBody: 'a portrait subject with no authored age' },
    ]) {
      const subject = { zh: 'test-only', profile };
      assert.equal(after(subject), before(subject));
    }
  }
});
