import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { getLockControls } from '../engine.js';
import { resolveCapture } from '../observationCaptureMode.js';
import { UPPER_BODY_STATE_PARIS, upperBodyStateLocks, upperBodyStateOption, runUpperBodyStateCase, upperBodyStateRow, upperBodyStateHash } from './specifiedActionUpperBodyStateFixtures.js';

export const UPPER_BODY_STATE_BATCH2 = Object.freeze([
  ['specified-sitting-forward-lean', 'She is seated.', 'Her upper body leans slightly forward.'],
  ['specified-sitting-slouched', 'She is seated.', 'Her upper body slouches loosely and heavily with dropped shoulders and a relaxed torso.'],
  ['specified-sitting-open-confident', 'She is seated.', 'Her upper body is open and relaxed, her torso upright and her shoulders at ease.'],
  ['specified-squatting-natural', 'She is squatting.', 'Her upper body leans gently forward with relaxed shoulders.'],
  ['specified-squatting-compact', 'She is squatting.', 'Her upper body is softly gathered with a gentle forward lean and relaxed shoulders.'],
  ['specified-squatting-forward-lean', 'She is squatting.', 'Her upper body leans gently forward from the hips with relaxed shoulders and neck.'],
].map(([id, prefix, previousUpper]) => Object.freeze({ id, prefix, previousUpper })));

const targetIds = new Set(UPPER_BODY_STATE_BATCH2.map(action => action.id));
const controls = getLockControls();
export { UPPER_BODY_STATE_PARIS, upperBodyStateLocks, upperBodyStateOption, runUpperBodyStateCase, upperBodyStateRow, upperBodyStateHash };

export function upperBodyStateBatch2Cases() {
  const cases = [];
  const add = (key, patch, target = false) => cases.push({ key, target,
    seed: 'pose-upper-body-state-batch2/' + key, locks: upperBodyStateLocks(patch) });
  for (const action of UPPER_BODY_STATE_BATCH2) {
    for (const framing of controls.find(control => control.key === 'framingId').options) {
      for (const imported of [false, true]) {
        add(`${action.id}/${framing.zh}/${imported ? 'paris' : 'general'}`, {
          specifiedActionId:action.id, framingId:framing.id,
          ...(imported ? UPPER_BODY_STATE_PARIS : {locationId:upperBodyStateOption('locationId', '戶外：森林步道')}),
        }, true);
      }
    }
    const gestureId = action.id.includes('squatting') ? 'gesture-squat-both-hands-cheeks' : 'gesture-collarbone';
    for (const framing of ['中景鏡頭 (Medium Shot)', '胸上特寫', '頭部主導近景']) {
      add(`${action.id}/${framing}/gesture-head`, {specifiedActionId:action.id,
        framingId:upperBodyStateOption('framingId', framing), gestureId, gazeId:'gaze-camera',
        headPostureId:'head-slight-tilt', ...UPPER_BODY_STATE_PARIS}, true);
    }
    for (const [mode, patch] of [
      ['duo', {subjectCount:'2'}],
      ['fixed-position', {fixedCompositionSetId:'japan-carriage-rush-hour', fixedSetPositionId:'carriage-crowd-seated'}],
      ['observation', {captureMode:'observation', observationCapture:resolveCapture({seed:27}).profile, characterProfileId:controls.find(control => control.key === 'characterProfileId').options.find(option => option.specialSubject === 'character-profile').id}],
    ]) add(`${action.id}/${mode}`, {specifiedActionId:action.id,
      framingId:upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)'), ...patch});
  }
  for (const action of SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(action => !targetIds.has(action.id))) {
    for (const framing of ['全身鏡頭 (Full Body Shot)', '中景鏡頭 (Medium Shot)']) {
      add(`protected/${action.id}/${framing}`, {specifiedActionId:action.id, framingId:upperBodyStateOption('framingId', framing)});
    }
  }
  add('protected/no-action', {specifiedActionId:'none', framingId:upperBodyStateOption('framingId', '中景鏡頭 (Medium Shot)')});
  return cases;
}

export function upperBodyStateBatch2SourceRows() {
  return SPECIFIED_ACTION_CONCRETE_OPTIONS.map(action => ({id:action.id, source:JSON.parse(JSON.stringify(action))}));
}
