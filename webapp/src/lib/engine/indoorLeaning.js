import scenes from './indoorLeanScenes.json' with { type: 'json' };
import { getSpecifiedAction } from './specifiedActions.js';

const objects = {
  wall: ['牆面', 'a wall'], 'tv-wall': ['電視牆', 'the TV wall'], column: ['柱子', 'a column'],
  cabinet: ['櫃子', 'a cabinet'], bookcase: ['書櫃', 'a bookcase'],
  doorframe: ['門框', 'a doorframe'], railing: ['欄杆', 'a railing'], pole: ['直桿', 'a pole'],
};
const actions = { 'specified-standing-back-lean': 'back', 'specified-standing-shoulder-lean': 'shoulder' };
const active = value => Boolean(value && value !== 'none');
export const isIndoorLeanId = id => typeof id === 'string' && Object.hasOwn(objects, id);

/** Manual scene and action locks only: never infer or randomly choose a support. */
export function indoorLeaningModel(locks, location, cameraControls = []) {
  if (!location || locks.locationId !== location.id || locks.subjectCount !== '1'
      || locks.captureMode === 'observation' || active(locks.fixedCompositionSetId)
      || active(locks.importedWorldSceneMode) || active(locks.characterProfileId)
      || active(locks.specialSubjectId) || active(locks.actionPoseCardId)) return null;
  const action = getSpecifiedAction(locks, { cameraControls });
  const kind = actions[action?.id];
  if (!kind) return null;
  const scene = Object.hasOwn(scenes, location.id) ? scenes[location.id] : null;
  if (!scene && !(location.zh?.startsWith('室內') || (!location.zh?.startsWith('戶外') && location.meta?.tags?.includes('indoor')))) return null;
  const options = (scene?.[kind] || []).map(id => ({ id, label: objects[id][0] }));
  const selectedId = options.find(option => option.id === locks.indoorLeanId)?.id || '';
  const contact = kind === 'shoulder' ? 'one shoulder' : selectedId === 'railing' ? 'her lower back' : 'her back';
  return { action, options, selectedId,
    sentence: selectedId ? `She stands with ${contact} resting against ${objects[selectedId][1]}.` : '',
    // A lower-back contact is outside the existing medium/chest projection.
    upperVisible: selectedId !== 'railing' };
}

export function applyIndoorLean(text, model, { upperBody = false } = {}) {
  if (!model?.sentence || upperBody && !model.upperVisible) return text;
  const core = model.action.en.slice(0, -1);
  return text.startsWith(core) ? model.sentence.slice(0, -1) + text.slice(core.length) : text;
}
