import { fixedSetAllowsLensVariation, isStationFixedSet } from '../../lib/engine/stationFixedComposition.js';
import { fixedSetAllowsFramingVariation } from '../../lib/engine/carriageFixedComposition.js';
import { FIXED_SCENE_MANAGED_POSE_KEYS } from '../../lib/engine/fixedScenePose.js';

// Layout scopes retain the old scene, fixed-set and lighting action boundaries.
export const SCENE_EDITOR_SCOPES = {
  space: ['sceneAttributeId', 'locationId'],
  fixed: ['fixedCompositionSetId', 'fixedSetPositionId', 'fixedSetBackgroundStateId', 'fixedSetCaptureModeId', 'fixedSetPerformanceStateId'],
  light: ['lightingId', 'lightDirectionId'],
};

export const SCENE_EDITOR_FIELD_LABELS = {
  fixedSetPositionId: '人物位置',
  fixedSetBackgroundStateId: '背景狀態',
  fixedSetCaptureModeId: '拍攝型態',
  fixedSetPerformanceStateId: '演出狀態',
};

export function getSceneEditorActionKeys(scope, positionManaged = false) {
  return (SCENE_EDITOR_SCOPES[scope] || []).filter(key =>
    !positionManaged || !FIXED_SCENE_MANAGED_POSE_KEYS.includes(key));
}

export function fixedSceneOptionMatchesSet(option, set) {
  if (!option || option.id === 'none') return true;
  if (!set) return false;
  return option.setId === set.id
    || Boolean(option.setIds?.includes(set.id))
    || Boolean(option.setGroupId && set.setGroupId && option.setGroupId === set.setGroupId);
}

export function getSceneEditorSource(locks = {}, controls = [], supineSurfaceOnly = false) {
  if (supineSurfaceOnly) return { id: 'surface', label: '支撐表面', name: '由接觸／支撐面決定場景' };
  const selected = (key) => controls.find(control => control.key === key)?.options?.find(option => option.id === locks[key]);
  const fixed = selected('fixedCompositionSetId');
  // The engine resolves a valid single-subject fixed set before PAGE3 imports.
  if (locks.subjectCount !== '2' && fixed && fixed.id !== 'none') {
    return { id: 'fixed', label: '固定構圖', name: fixed.zh };
  }
  if (locks.importedWorldSceneMode === 'architecture' && locks.importedWorldSceneArchitectureText) {
    return { id: 'imported', label: '場景建模匯入', name: locks.importedWorldSceneLabel || '未命名世界場景' };
  }
  const location = selected('locationId');
  return { id: 'space', label: '一般場景', name: location?.zh || (locks.locationId === 'none' ? '全無' : '隨機場景') };
}

export function getFixedSceneDetailKeys(set, controls = [], positionManaged = false) {
  if (!set || set.id === 'none') return [];
  const scoped = ['fixedSetPositionId', 'fixedSetBackgroundStateId'].filter(key =>
    controls.find(control => control.key === key)?.options?.some(option =>
      option.id !== 'none' && fixedSceneOptionMatchesSet(option, set)));
  return [...scoped, ...(positionManaged ? [] : ['fixedSetCaptureModeId', 'fixedSetPerformanceStateId'])];
}

export function getFixedSceneCameraStatus(set) {
  if (!set || set.id === 'none') return '';
  const managed = [];
  if (set.allowsCameraVariation === false) managed.push('拍攝視角', '環繞角度');
  else if (set.orbitMode === 'bench-front') managed.push('相機拍攝方位');
  if (!fixedSetAllowsFramingVariation(set)) managed.push('景別');
  if (!fixedSetAllowsLensVariation(set)) managed.push('焦段');
  managed.push('光學效果');
  const facing = isStationFixedSet(set) ? '；環繞設定用於調整人物面向' : '';
  return `${managed.join('、')}由此場景管理${facing}。`;
}
