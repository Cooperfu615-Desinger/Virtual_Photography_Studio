// Node-only regression tooling, never a production import.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { PROMPT_OUTPUT_CONTRACTS } from './promptOutputContracts.js';

export const OUTPUT_FIELDS = Object.freeze(Object.keys(PROMPT_OUTPUT_CONTRACTS));

export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined)
      .map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function digest(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(stableValue(value))).digest('hex');
}

export function materializeSceneFixture(fixture, controls = getLockControls()) {
  const locks = { ...createEmptyLocks() };
  for (const control of controls) {
    const option = control.options?.find((item) => item.zh === '全無' || item.zh === '無額外表情');
    if (option) locks[control.key] = option.id;
  }
  // All-none does not exist for some non-random preferences; retain their
  // established defaults. Inputs and their complete resolved result are pinned.
  for (const [key, selector] of Object.entries(fixture.locks)) {
    const control = controls.find((item) => item.key === key);
    assert.ok(control, `${fixture.id}: unknown control ${key}`);
    if (selector && typeof selector === 'object' && !Array.isArray(selector)) {
      assert.equal(typeof selector.byZh, 'string', `${fixture.id}.${key}: expected byZh`);
      const matches = control.options?.filter((item) => item.zh === selector.byZh) || [];
      assert.equal(matches.length, 1, `${fixture.id}.${key}: ambiguous/missing ${selector.byZh}`);
      locks[key] = matches[0].id;
    } else {
      if (control.options?.length && typeof selector === 'string' && selector !== 'random') {
        assert.equal(control.options.filter((item) => item.id === selector).length, 1,
          `${fixture.id}.${key}: unknown raw id ${selector}`);
      }
      locks[key] = Array.isArray(selector) ? [...selector] : selector;
    }
  }
  return locks;
}

export function readSceneOutputs(prompt) {
  return Object.fromEntries(OUTPUT_FIELDS.map((field) => {
    const source = PROMPT_OUTPUT_CONTRACTS[field].source;
    const value = source.kind === 'field' ? prompt[source.key]
      : prompt.extraPrompts?.find((entry) => entry.id === source.id)?.text;
    return [field, value || ''];
  }));
}

export function runSceneFixture(fixture) {
  const locks = materializeSceneFixture(fixture);
  const before = structuredClone(locks);
  const random = createSeededRandom(fixture.seed);
  let randomDraws = 0;
  const prompt = generatePrompts(1, locks, [], { random: () => { randomDraws += 1; return random(); } })[0];
  assert.deepEqual(locks, before, `${fixture.id}: generator mutated input locks`);
  return {
    prompt, outputs: readSceneOutputs(prompt), selection: stableValue(prompt.selection), randomDraws,
    inputHash: digest({ locks: before, seed: fixture.seed }),
  };
}

export function restoreBaselineSelection(baseline, entry) {
  const selection = { ...baseline.selectionBase, ...entry.selectionDelta };
  for (const key of entry.removedSelectionKeys) delete selection[key];
  return selection;
}
