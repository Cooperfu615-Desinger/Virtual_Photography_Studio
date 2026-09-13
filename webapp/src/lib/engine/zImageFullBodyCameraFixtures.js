// Independent regression inputs. No production module imports this file.
import { upperSceneFixture, UPPER_SCENE_MATRIX, UPPER_SCENE_EXCLUDED, UPPER_SCENE_CONTROLS } from './zImageUpperSceneFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

export const FULL_CAMERA_ANGLES = ['平視高度鏡頭', '肩部高度鏡頭', '腰部高度鏡頭', '膝蓋高度鏡頭', '荷蘭角/傾斜 (Dutch Angle)', '地面高度鏡頭', '蟲眼視角鏡頭', '高位俯視鏡頭', '鳥瞰視角', '正上方俯視鏡頭', '全無'];
export function fullCameraFixture(angle, overrides = {}) {
  const base = upperSceneFixture('室內：日式和室', angle, '全身鏡頭 (Full Body Shot)');
  return { ...base, id: `full-camera/${angle}/${JSON.stringify(overrides)}`, seed: 'full-camera-v1', locks: { ...base.locks, ...overrides } };
}
export const FULL_CAMERA_MATRIX = FULL_CAMERA_ANGLES.flatMap((angle) =>
  ['standing', 'sitting', 'kneeling', 'squatting', 'lying'].map((poseBaseId) => fullCameraFixture(angle, {
    poseBaseId, poseArrangementId: 'model-natural-body-arrangement',
    ...(poseBaseId === 'lying' ? { poseOrientationId: 'lying-side' } : {}),
  })));
export const FULL_CAMERA_EXCLUDED = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter((f) => f.excluded)
  .flatMap((f) => FULL_CAMERA_ANGLES.map((angle) => ({ ...f, id: `full-camera/${f.id}/${angle}`, locks: {
    ...f.locks, framingId: { byZh: '全身鏡頭 (Full Body Shot)' }, angleId: { byZh: angle },
  } })));
export const FULL_CAMERA_ORBITS = ['正面 0 度', '左前 45 度', '左側 90 度', '左後 135 度', '背面 180 度', '右後 225 度', '右側 270 度', '右前 315 度']
  .flatMap((orbit) => ['蟲眼視角鏡頭', '地面高度鏡頭', '正上方俯視鏡頭'].map((angle) => fullCameraFixture(angle, { orbitId: { byZh: orbit } })));
export const FULL_CAMERA_OPTICS = ['全無', '20mm 超廣角', '85mm 中長焦 (人像鏡皇)', '魚眼鏡頭 Fisheye']
  .flatMap((lens) => ['蟲眼視角鏡頭', '地面高度鏡頭', '平視高度鏡頭'].map((angle) => fullCameraFixture(angle, { lensId: { byZh: lens } })));
export const FULL_CAMERA_REGRESSION = [
  ...FULL_CAMERA_MATRIX, ...FULL_CAMERA_EXCLUDED, ...FULL_CAMERA_ORBITS, ...FULL_CAMERA_OPTICS,
  ...UPPER_SCENE_MATRIX, ...UPPER_SCENE_EXCLUDED, ...UPPER_SCENE_CONTROLS,
];
