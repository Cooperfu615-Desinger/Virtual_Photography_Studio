export const SUPINE_SCENE_OVERRIDE_KEYS = Object.freeze([
  'sceneAttributeId',
  'locationId',
  'importedWorldSceneMode',
  'importedWorldSceneLabel',
  'importedWorldSceneArchitectureText',
  'zImageVisibleTextEnabled',
  'zImageVisibleTextContent',
  'zImageVisibleTextLanguage',
  'zImageVisibleTextPlacement',
  'fixedCompositionSetId',
  'fixedSetPositionId',
  'fixedSetBackgroundStateId',
  'fixedSetCaptureModeId',
  'fixedSetPerformanceStateId',
]);

export const SUPINE_SCENE_RESTORE_KEYS = Object.freeze([
  ...SUPINE_SCENE_OVERRIDE_KEYS,
]);

export const SUPINE_SCENE_NONE_LOCKS = Object.freeze({
  sceneAttributeId: 'none',
  locationId: 'none',
  importedWorldSceneMode: 'none',
  importedWorldSceneLabel: '',
  importedWorldSceneArchitectureText: '',
  zImageVisibleTextEnabled: false,
  zImageVisibleTextContent: '',
  zImageVisibleTextLanguage: 'traditional-chinese',
  zImageVisibleTextPlacement: 'background-storefront-sign',
  fixedCompositionSetId: 'none',
  fixedSetPositionId: 'none',
  fixedSetBackgroundStateId: 'none',
  fixedSetCaptureModeId: 'none',
  fixedSetPerformanceStateId: 'none',
});

export function isSupinePoseSelection(locks = {}) {
  return locks?.subjectCount === '1'
    && locks?.poseBaseId === 'lying'
    && locks?.poseOrientationId === 'lying-supine';
}

export function applySupineSceneOverride(locks = {}) {
  if (!isSupinePoseSelection(locks)) return locks;
  return {
    ...locks,
    ...SUPINE_SCENE_NONE_LOCKS,
  };
}
