// 2026-10-14 Cooper 核准完全移除 MJ 胸上特寫（extraPrompts id `chest-up-mj-portrait`）。
// 本檔是移除後「不存在」的明確回歸：引擎各模式不再產生、PAGE1 卡片與 DLL 來源不再列出、
// F 參數即時更新只改主 MJ 尾綴。既有 Saved Cards 資料不刪除，只是不再顯示。
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { PROMPT_OUTPUT_CONTRACTS, validatePromptOutputContract } from './promptOutputContracts.js';
import { REPRESENTATIVE_PROMPT_FIXTURES } from './representativePromptFixtures.js';
import { buildPage1DllPromptSources, buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { attachMidjourneySettingsToPrompt } from '../../features/page1/midjourneyParameterState.js';
import { deserializeFavoritePrompt, serializeFavoritePrompt } from '../../features/saved-cards/cardCodec.js';

const REMOVED_ID = 'chest-up-mj-portrait';
const REMOVED_FIELD = 'chestUpMjPortraitPrompt';
const controls = getLockControls();

function fixtureLocks(fixture) {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    if (/^(bodyType|hairStylingState)[AB]?Id$|^outerwear[AB]?OpeningId$|^eyewear[AB]?PlacementId$|^sceneAttributeId$/.test(control.key)) continue;
    const none = control.options?.find(entry => entry.zh === '全無' || entry.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  for (const [key, selector] of Object.entries(fixture.locks)) {
    if (typeof selector === 'string' || Array.isArray(selector)) { locks[key] = selector; continue; }
    const option = controls.find(control => control.key === key)?.options?.find(entry => entry.zh === selector.byZh);
    assert.ok(option, `${fixture.id}.${key}: ${selector.byZh}`);
    locks[key] = option.id;
  }
  return locks;
}

function assertNoRemovedOutput(prompt, label) {
  assert.ok(Array.isArray(prompt.extraPrompts), `${label}: extraPrompts`);
  assert.equal(prompt.extraPrompts.some(entry => entry.id === REMOVED_ID), false, `${label}: engine extraPrompts`);
  assert.equal(Object.hasOwn(prompt, REMOVED_FIELD), false, `${label}: prompt field`);
  for (const cards of [buildPage1GenerationPromptCards(prompt), buildPage1DllPromptSources(prompt)]) {
    assert.equal(cards.some(entry => entry.id === REMOVED_ID), false, `${label}: PAGE1 card / DLL source`);
    assert.equal(cards.some(entry => /MJ 胸上/.test(`${entry.title || ''}${entry.label || ''}`)), false, `${label}: PAGE1 label`);
  }
}

test('MJ chest-up has no public output contract', () => {
  assert.equal(Object.hasOwn(PROMPT_OUTPUT_CONTRACTS, REMOVED_FIELD), false);
  assert.equal(validatePromptOutputContract(REMOVED_FIELD, 'any text', { mode: 'single' })[0]?.code, 'unknown-contract');
});

test('ordinary single, duo, character card, fixed composition and other representative modes never emit MJ chest-up', () => {
  const required = ['normal-single', 'duo', 'character-card', 'fixed-composition', 'special-outfit', 'pose-composer-canonical', 'full-body-reference'];
  for (const id of required) assert.ok(REPRESENTATIVE_PROMPT_FIXTURES.some(fixture => fixture.id === id), id);
  for (const fixture of REPRESENTATIVE_PROMPT_FIXTURES) {
    const [prompt] = generatePrompts(1, fixtureLocks(fixture), [], { random: createSeededRandom(fixture.seed) });
    assertNoRemovedOutput(prompt, fixture.id);
    if (fixture.mode === 'single') {
      assert.deepEqual(prompt.extraPrompts.map(entry => entry.id), ['chest-up-portrait', 'full-body-character'], fixture.id);
    } else {
      assert.deepEqual(prompt.extraPrompts, [], fixture.id);
    }
  }
  for (const subjectCount of ['1', '2']) {
    for (let index = 0; index < 20; index += 1) {
      const [prompt] = generatePrompts(1, { ...createEmptyLocks(), subjectCount }, [],
        { random: createSeededRandom(`mj-chest-removal-${subjectCount}-${index}`) });
      assertNoRemovedOutput(prompt, `random/${subjectCount}/${index}`);
    }
  }
});

test('PAGE1 cards and DLL sources hide a legacy saved MJ chest-up entry without deleting the saved data', () => {
  const [current] = generatePrompts(1, { ...createEmptyLocks(), subjectCount: '1' }, [], { random: createSeededRandom('mj-chest-removal-legacy') });
  const legacyEntry = { id: REMOVED_ID, label: 'MJ 胸上特寫照', text: 'Legacy saved MJ chest-up text --v 8.2 --ar 4:5 --raw --s 25 --c 0 --w 0 --sd' };
  const legacy = { ...current, extraPrompts: [current.extraPrompts[0], legacyEntry, ...current.extraPrompts.slice(1)] };
  const expectedIds = ['gpt', 'grok', 'ai', 'nano-banana-2.1', 'chest-up-portrait', 'full-body-character'];
  assert.deepEqual(buildPage1GenerationPromptCards(legacy).map(entry => entry.id), expectedIds);
  assert.deepEqual(buildPage1DllPromptSources(legacy).map(entry => entry.id), expectedIds);
  assert.deepEqual(buildPage1GenerationPromptCards(legacy), buildPage1GenerationPromptCards(current));
  assert.deepEqual(buildPage1DllPromptSources(legacy), buildPage1DllPromptSources(current));
  const restored = deserializeFavoritePrompt(serializeFavoritePrompt({ ...legacy, source: 'page1' }));
  assert.deepEqual(restored.extraPrompts.find(entry => entry.id === REMOVED_ID), legacyEntry);
});

test('live F settings change only the main MJ tail', () => {
  const [prompt] = generatePrompts(1, { ...createEmptyLocks(), subjectCount: '1' }, [], { random: createSeededRandom('mj-chest-removal-f') });
  const settings = { mjVersionId: 'v8-1', mjAspectRatio: '16:9', mjRawMode: 'standard', mjStylize: 500, mjChaos: 30, mjWeirdness: 42, mjResolution: 'hd' };
  const before = structuredClone(prompt);
  const updated = attachMidjourneySettingsToPrompt(prompt, settings);
  assert.deepEqual(prompt, before);
  assert.match(updated.midjourneyPrompt, /--v 8\.1 --ar 16:9 --s 500 --c 30 --w 42 --hd$/);
  assert.notEqual(updated.midjourneyPrompt, prompt.midjourneyPrompt);
  const { midjourneyPrompt: _updatedMj, selection: _updatedSelection, ...updatedRest } = updated;
  const { midjourneyPrompt: _sourceMj, selection: _sourceSelection, ...sourceRest } = prompt;
  assert.deepEqual(updatedRest, sourceRest);
  assert.equal(updated.extraPrompts, prompt.extraPrompts);
  assertNoRemovedOutput(updated, 'live F');

  const legacyEntry = { id: REMOVED_ID, label: 'MJ 胸上特寫照', text: 'Legacy saved text --v 8.2 --ar 4:5 --raw --s 25 --c 0 --w 0 --sd' };
  const legacy = { ...prompt, extraPrompts: [...prompt.extraPrompts, legacyEntry] };
  assert.deepEqual(attachMidjourneySettingsToPrompt(legacy, settings).extraPrompts, legacy.extraPrompts);
});
