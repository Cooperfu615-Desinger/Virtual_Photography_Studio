import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { getLockControls } from '../engine.js';
import { PHONE_SELFIE_ID, COMPANION_ORBIT_ID } from './phoneCapture.js';
import { resolveCapture } from '../observationCaptureMode.js';
import indoorScenes from './indoorKneelScenes.json' with {type:'json'};
import outdoorScenes from './outdoorKneelScenes.json' with {type:'json'};
import { UPPER_BODY_STATE_PARIS, upperBodyStateLocks, upperBodyStateOption, runUpperBodyStateCase, upperBodyStateRow, upperBodyStateHash } from './specifiedActionUpperBodyStateFixtures.js';

export const UPPER_BODY_STATE_BATCH3 = Object.freeze([
  ['seiza', 'She is kneeling with her torso upright.', ''],
  ['wide', 'She is kneeling with her torso upright.', ''],
  ['forward-lean', 'She is kneeling. Her torso leans forward from the hips.', 'Her torso leans forward from the hips.'],
  ['upright-poised', 'She is kneeling. Her upper body is tall and relaxed.', 'Her upper body is tall and relaxed.'],
  ['side-sit', 'She is kneeling with her torso relaxed and upright.', ''],
  ['one-knee-forward', 'She is half-kneeling.', ''],
].map(([key, upper, previousUpper]) => Object.freeze({id:'specified-kneeling-' + key, upper, previousUpper})));
export const UPPER_BODY_STATE_BATCH3_SCENES = Object.freeze({...indoorScenes, ...outdoorScenes});
const targets = new Set(UPPER_BODY_STATE_BATCH3.map(action => action.id));
// The new adjustable cat pose has its own coverage, after the immutable batch3
// evidence. Exclude exactly that addition, retaining every other current action.
const batch3Actions = SPECIFIED_ACTION_CONCRETE_OPTIONS.filter(action=>action.id!=='specified-sitting-low-aloof-cats-adjustable-angle');
const controls = getLockControls();
export { UPPER_BODY_STATE_PARIS, upperBodyStateLocks, upperBodyStateOption, runUpperBodyStateCase, upperBodyStateRow, upperBodyStateHash };

export function upperBodyStateBatch3Cases() {
  const cases = [];
  const add = (key, patch, target = false) => cases.push({key, target, seed:'pose-upper-body-state-batch3/' + key, locks:upperBodyStateLocks(patch)});
  for (const action of UPPER_BODY_STATE_BATCH3) {
    for (const frame of controls.find(control => control.key === 'framingId').options) for (const imported of [false,true]) {
      add(action.id + '/' + frame.zh + '/' + (imported ? 'paris' : 'general'), {
        specifiedActionId:action.id, framingId:frame.id,
        ...(imported ? UPPER_BODY_STATE_PARIS : {locationId:upperBodyStateOption('locationId','戶外：森林步道')}),
      }, true);
    }
    for (const frame of ['中景鏡頭 (Medium Shot)','胸上特寫','頭部主導近景']) {
      for (const [suffix, extra] of [
        ['gesture-head',{gestureId:'gesture-collarbone',gazeId:'gaze-camera',headPostureId:'head-slight-tilt'}],
        ['phone',{gestureId:'gesture-collarbone',propId:PHONE_SELFIE_ID,gazeId:'gaze-camera'}],
        ['phone-companion',{gestureId:'gesture-collarbone',propId:PHONE_SELFIE_ID,orbitId:COMPANION_ORBIT_ID}],
      ]) add(action.id + '/' + frame + '/' + suffix, {specifiedActionId:action.id, framingId:upperBodyStateOption('framingId',frame), ...UPPER_BODY_STATE_PARIS, ...extra}, true);
    }
    for (const [mode,patch] of [
      ['duo',{subjectCount:'2'}],
      ['fixed-position',{fixedCompositionSetId:'japan-carriage-rush-hour',fixedSetPositionId:'carriage-crowd-seated'}],
      ['observation',{captureMode:'observation',observationCapture:resolveCapture({seed:27}).profile,characterProfileId:controls.find(control=>control.key==='characterProfileId').options.find(option=>option.specialSubject==='character-profile').id}],
    ]) add(action.id + '/' + mode,{specifiedActionId:action.id,framingId:upperBodyStateOption('framingId','中景鏡頭 (Medium Shot)'),...patch});
  }
  for (const action of batch3Actions.filter(action=>!targets.has(action.id))) {
    for (const frame of ['全身鏡頭 (Full Body Shot)','中景鏡頭 (Medium Shot)','胸上特寫','頭部主導近景']) {
      add('protected/' + action.id + '/' + frame,{specifiedActionId:action.id,framingId:upperBodyStateOption('framingId',frame)});
    }
  }
  add('protected/no-action',{specifiedActionId:'none',framingId:upperBodyStateOption('framingId','中景鏡頭 (Medium Shot)')});
  return cases;
}

/** Every reviewed indoor/outdoor scene, each offered surface plus unspecified, every action and framing. */
export function* upperBodyStateBatch3SupportCases() {
  for (const [locationId,surfaces] of Object.entries(UPPER_BODY_STATE_BATCH3_SCENES)) for (const target of UPPER_BODY_STATE_BATCH3) {
    for (const frame of controls.find(control=>control.key==='framingId').options) for (const surface of ['',...surfaces]) {
      const key = [locationId,target.id,frame.id,surface||'unspecified'].join('/');
      yield {key,target:true,seed:'pose-upper-body-state-batch3-support/' + key,locks:upperBodyStateLocks({locationId,specifiedActionId:target.id,framingId:frame.id,...(surface?{indoorKneelId:surface}:{})})};
    }
  }
}

export function upperBodyStateBatch3SourceRows() {
  return batch3Actions.map(action=>({id:action.id,source:JSON.parse(JSON.stringify(action))}));
}

/** Undo only this batch's approved source addition; preserve every other public word. */
export function batch3PreviousProjection(text, target) {
  if (target.previousUpper) return text.replace('She is kneeling. ', '');
  const stem = target.upper.replace(/\.$/, '');
  return text.replace(stem + ', ', 'She has ').replace(target.upper, '');
}
export function batch3ComparableText(text) {
  // A formerly empty GPT pose section may now exist, and paragraph separators
  // change when an empty source becomes a sentence. All public words remain sealed.
  return text.replaceAll('Pose and Composition:', '').replace(/\s+/g, ' ').trim();
}
