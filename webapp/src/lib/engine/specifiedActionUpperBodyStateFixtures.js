import { createHash } from 'node:crypto';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
import { buildPage1GenerationPromptCards } from '../page1PromptOutputs.js';
import { buildPage1WorldSceneArchitecture } from '../page3WorldScene.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';

// Batch 1 only. Existing nonempty sitting/squatting fragments belong to batch 2.
export const UPPER_BODY_STATE_BATCH1 = Object.freeze([
  ...['legs-extended', 'cross-legged', 'knees-raised', 'leg-cross', 'one-knee-up', 'legs-to-side']
    .map(key => Object.freeze({ id: `specified-sitting-${key}`, upper: 'She is seated.' })),
  Object.freeze({ id: 'specified-squatting-wide-knee', upper: 'She is squatting. Her torso inclines gently forward.' }),
]);

const targetIds = new Set(UPPER_BODY_STATE_BATCH1.map(action => action.id));
const controls = getLockControls();
export const upperBodyStateOption = (key, zh) => {
  const option = controls.find(control => control.key === key)?.options?.find(item => item.zh === zh);
  if (!option) throw new Error(`Unknown upper-body-state fixture option ${key}/${zh}`);
  return option.id;
};

export function upperBodyStateLocks(patch = {}) {
  const locks = createEmptyLocks();
  for (const control of controls) {
    const none = control.options?.find(option => option.zh === '全無' || option.zh === '無額外表情');
    if (none) locks[control.key] = none.id;
  }
  return { ...locks, subjectCount: '1', aspectRatio: '9:16', fixedCompositionSetId: 'none',
    angleId: upperBodyStateOption('angleId', '平視高度鏡頭'), ...patch };
}

const paris = buildPage1WorldSceneArchitecture({ sceneMode: 'street-only', worldLocation: 'paris-trocadero-eiffel-steps' });
export const UPPER_BODY_STATE_PARIS = Object.freeze({ importedWorldSceneMode: 'architecture',
  importedWorldSceneLabel: paris.label, importedWorldSceneArchitectureText: paris.text });

export function upperBodyStateCases() {
  const cases = [];
  const add = (key, patch, target = false) => cases.push({ key,
    locks: upperBodyStateLocks(patch), target, seed: `pose-upper-body-state-batch1/${key}` });
  for (const action of UPPER_BODY_STATE_BATCH1) {
    for (const framing of controls.find(control => control.key === 'framingId').options) {
      for (const imported of [false, true]) {
        add(`${action.id}/${framing.zh}/${imported ? 'paris' : 'general'}`, {
          specifiedActionId: action.id, framingId: framing.id,
          ...(imported ? UPPER_BODY_STATE_PARIS : { locationId: upperBodyStateOption('locationId', '戶外：森林步道') }),
        }, true);
      }
    }
    const gestureId = action.id.includes('squatting') ? 'gesture-squat-both-hands-cheeks' : 'gesture-collarbone';
    for (const framing of ['中景鏡頭 (Medium Shot)', '胸上特寫']) {
      add(`${action.id}/${framing}/gesture-head`, { specifiedActionId: action.id,
        framingId: upperBodyStateOption('framingId', framing), gestureId, headPostureId: 'head-slight-tilt',
        gazeId: 'gaze-camera', ...UPPER_BODY_STATE_PARIS }, true);
    }
    for (const [mode, patch] of [
      ['duo', { subjectCount: '2' }],
      ['fixed-position', { fixedCompositionSetId: 'japan-carriage-rush-hour', fixedSetPositionId: 'carriage-crowd-seated' }],
    ]) add(`${action.id}/${mode}`, { specifiedActionId: action.id,
      framingId: upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)'), ...patch });
  }
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(item => !targetIds.has(item.id))) {
    for (const framing of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)']) {
      add(`protected/${action.id}/${framing}`, { specifiedActionId: action.id,
        framingId: upperBodyStateOption('framingId', framing) });
    }
  }
  add('protected/no-action', { specifiedActionId: 'none', framingId: upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)') });
  return cases;
}

export function runUpperBodyStateCase(fixture) {
  let draws = 0;
  const random = createSeededRandom(fixture.seed);
  const prompt = generatePrompts(1, fixture.locks, [], { random: () => { draws += 1; return random(); } })[0];
  if (!prompt) throw new Error(`Upper-body-state fixture did not generate: ${fixture.key}`);
  return { prompt, cards: buildPage1GenerationPromptCards(prompt), draws };
}

export const upperBodyStateHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function upperBodyStateRow(result) {
  const { prompt, cards, draws } = result;
  const { id, date, grokPrompt: _gpt, zImagePrompt: _z, midjourneyPrompt: _mj, nanoBananaPrompt: _nano, extraPrompts, ...resolved } = prompt;
  if (!id || !date || !extraPrompts || !cards.length) throw new Error('Incomplete prompt fixture');
  return { resolved: upperBodyStateHash({ resolved, draws }),
    outputs: Object.fromEntries(cards.map(card => [card.id, upperBodyStateHash(card.value)])) };
}

export function upperBodyStateSourceRows() {
  return SPECIFIED_ACTION_CONCRETE_OPTIONS.map(source => {
    const action = structuredClone(source);
    if (targetIds.has(action.id)) {
      delete action.upperBodyEn;
      delete action.meta.upperBodyOmitted;
      delete action.meta.upperBodyOmittedFramings;
      delete action.meta.projectionByBucket.chestUp;
      delete action.meta.projectionByBucket.mediumWaist;
    }
    return { id: action.id, hash: upperBodyStateHash(action) };
  });
}
