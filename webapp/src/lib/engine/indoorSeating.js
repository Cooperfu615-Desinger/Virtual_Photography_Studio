import sceneSeats from './indoorSeatScenes.json' with { type: 'json' };
import outdoorScenes from './outdoorSeatScenes.json' with { type: 'json' };
import { getSpecifiedAction } from './specifiedActions.js';

const seats = {
  chair: ['椅子', 'on a chair'], stool: ['凳子', 'on a stool'], bench: ['長椅', 'on a bench'],
  sofa: ['沙發', 'on a sofa'], 'bed-edge': ['床邊', 'on the edge of the bed'], 'bed-top': ['床上', 'on the bed'],
  table: ['桌子', 'on a table'], counter: ['檯面', 'on a counter'], platform: ['講台', 'on a platform'],
  step: ['台階', 'on a step'], box: ['箱子', 'on a box'], cushion: ['坐墊', 'on a cushion'],
  mat: ['墊子', 'on a mat'], floor: ['地板', 'on the floor'],
  ground: ['地面', 'on the ground'], grass: ['草地', 'on the grass'], sand: ['沙地', 'on the sand'],
  rock: ['石頭', 'on a rock'], 'low-wall': ['矮牆', 'on a low wall'], 'lounge-chair': ['躺椅', 'on a lounge chair'],
  'deck-edge': ['平台邊', 'on the edge of the deck'], 'deck-top': ['平台上', 'on the deck'],
};

const broadSurface = ['bed-top', 'sofa', 'platform', 'cushion', 'mat', 'floor', 'ground', 'grass', 'sand', 'deck-top'];
const raisedSeat = ['chair', 'stool', 'bench', 'sofa', 'bed-edge', 'table', 'counter', 'platform', 'step', 'box', 'rock', 'low-wall', 'lounge-chair', 'deck-edge'];
const naturalSeats = Object.keys(seats);
const actionSeats = {
  'specified-sitting-natural': naturalSeats,
  'specified-sitting-forward-lean': naturalSeats,
  'specified-sitting-legs-extended': ['chair', 'bench', 'sofa', 'bed-edge', ...broadSurface.filter(id => id !== 'sofa'), 'step', 'lounge-chair', 'deck-edge'],
  'specified-sitting-cross-legged': broadSurface,
  'specified-sitting-knees-raised': broadSurface,
  'specified-sitting-slouched': ['chair', 'sofa', 'bench', 'lounge-chair'],
  'specified-sitting-leg-cross': raisedSeat,
  'specified-sitting-one-knee-up': ['bench', ...broadSurface],
  'specified-sitting-legs-to-side': ['bench', ...broadSurface],
  'specified-sitting-open-confident': raisedSeat,
};
const grounded = new Set(['specified-sitting-side-fold-back-support', 'specified-sitting-raised-right-knee',
  'specified-sitting-hug-knees', 'specified-low-seated-aloof-cats-street-mood',
  'specified-sitting-low-aloof-cats-adjustable-angle']);

const active = value => Boolean(value && value !== 'none');
export const isIndoorSeatId = id => typeof id === 'string' && Object.hasOwn(seats, id);

/** Only explicit location/action locks own a seating decision. Random results are never input here. */
export function indoorSeatingModel(locks, location, cameraControls = []) {
  if (!location || locks.locationId !== location.id
      || locks.subjectCount !== '1' || locks.captureMode === 'observation'
      || active(locks.fixedCompositionSetId) || active(locks.importedWorldSceneMode)
      || active(locks.characterProfileId) || active(locks.specialSubjectId) || active(locks.actionPoseCardId)) return null;
  const outdoor = Object.hasOwn(outdoorScenes, location.id) ? outdoorScenes[location.id] : null;
  const scene = Object.hasOwn(sceneSeats, location.id) ? sceneSeats[location.id] : outdoor?.seats || null;
  // An unreviewed indoor location can show the control without inventing furniture.
  if (!scene && !(location.zh?.startsWith('室內') || (!location.zh?.startsWith('戶外') && location.meta?.tags?.includes('indoor')))) return null;
  const action = getSpecifiedAction(locks, { cameraControls });
  const tatami = location.lyingSurface?.type === 'tatami';
  if (grounded.has(action?.id)) {
    if (outdoor) return { mode: 'ground', action, bedOnly: false,
      groundLabel: outdoor.ground === 'deck-top' ? '平台' : seats[outdoor.ground][0],
      phrase: seats[outdoor.ground][1] };
    // A close bed surface has no floor in this scene. Keep the original pose and explain the conflict.
    const bedOnly = scene?.every(id => id === 'bed-edge' || id === 'bed-top');
    return { mode: 'ground', action, bedOnly, groundLabel: tatami ? '榻榻米' : '地面',
      phrase: !scene || bedOnly ? '' : tatami ? 'on the tatami floor' : 'on the floor' };
  }
  const compatible = actionSeats[action?.id];
  if (!compatible) return { mode: 'pending' };
  const options = (scene || []).filter(id => compatible.includes(id)).map(id => {
    const [label, phrase] = seats[id];
    return id === 'floor' && tatami ? {id, label:'榻榻米', phrase:'on the tatami floor'} : {id, label, phrase};
  });
  const selected = options.find(option => option.id === locks.indoorSeatId);
  return { mode: 'choice', action, options, selectedId: selected?.id || '', phrase: selected?.phrase || '' };
}

export function applyIndoorSeat(text, model) {
  if (!model?.phrase) return text;
  if (model.mode === 'ground') return text.replaceAll('on the ground', model.phrase);
  if (model.action.id === 'specified-sitting-forward-lean')
    return text.replace(/^She sits leaning/, 'She sits ' + model.phrase + ', leaning');
  return text.replace(/^She sits(?: cross-legged| casually slumped)?/, lead => lead + ' ' + model.phrase);
}
