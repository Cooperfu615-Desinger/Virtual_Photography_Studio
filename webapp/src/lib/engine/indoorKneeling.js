import indoorScenes from './indoorKneelScenes.json' with {type:'json'};
import outdoorScenes from './outdoorKneelScenes.json' with {type:'json'};
import {getSpecifiedAction} from './specifiedActions.js';

const scenes = {...indoorScenes, ...outdoorScenes};
const surfaces = {
  'bed-top':['床上','on the bed'], floor:['地板','on the floor'], tatami:['榻榻米','on the tatami floor'],
  carpet:['地毯','on the carpet'], mat:['墊子','on a mat'], ground:['地面','on the ground'],
  sofa:['沙發','on a sofa'], 'reading-table':['閱讀桌','on a reading table'], bench:['長椅','on a bench'],
  'deck-top':['平台','on a platform'], step:['台階','on a step'], walkway:['走道','on the walkway'],
  board:['木板','on a wooden board'], box:['箱子','on a box'], stool:['凳子','on a stool'],
  grass:['草地','on the grass'], chair:['椅子','on a chair'], 'lounge-chair':['躺椅','on a lounge chair'],
  sand:['沙地','on the sand'], rock:['石頭','on a rock'],
  aisle:['走道','on the aisle floor'], 'train-seat':['椅子','on a train seat'],
};
const actions = new Set(['seiza','wide','forward-lean','upright-poised','side-sit','one-knee-forward'].map(key=>'specified-kneeling-'+key));
const active = value => Boolean(value && value !== 'none');
export const isIndoorKneelId = id => typeof id === 'string' && Object.hasOwn(surfaces,id);

/** Only reviewed, explicitly selected scenes and six free-hand actions own a surface. */
export function indoorKneelingModel(locks,location,cameraControls=[]) {
  if (!location || locks.locationId !== location.id || !Object.hasOwn(scenes,location.id)
      || locks.subjectCount !== '1' || locks.captureMode === 'observation'
      || active(locks.fixedCompositionSetId) || active(locks.importedWorldSceneMode)
      || active(locks.characterProfileId) || active(locks.specialSubjectId) || active(locks.actionPoseCardId)) return null;
  const action=getSpecifiedAction(locks,{cameraControls});
  if (!actions.has(action?.id)) return null;
  const options=scenes[location.id].map(id=>({id,label:surfaces[id][0]}));
  const selectedId=options.find(option=>option.id===locks.indoorKneelId)?.id || '';
  return {action,options,selectedId,phrase:selectedId?surfaces[selectedId][1]:''};
}

/** Replace only the reviewed action's contact words, never appended hand/prop sources. */
export function applyIndoorKneel(text,model) {
  if (!model?.phrase || !text) return text;
  const {action,phrase}=model;
  if (['specified-kneeling-seiza','specified-kneeling-side-sit'].includes(action.id))
    return text.replace(/^She kneels in /,'She kneels '+phrase+' in ');
  if (action.id==='specified-kneeling-one-knee-forward')
    return text.replace('one knee grounded','one knee resting '+phrase);
  const knees=text.replace('both knees grounded','both knees resting '+phrase);
  return action.id==='specified-kneeling-wide'
    ? knees.replace('her hips resting on the ground between her legs','her hips resting '+phrase+' between her legs') : knees;
}
