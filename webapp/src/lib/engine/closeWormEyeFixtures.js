import { fullCameraFixture } from './zImageFullBodyCameraFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';
export const CLOSE_WORM_FRAMES = ['中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)'];
export const CLOSE_WORM_CASES = CLOSE_WORM_FRAMES.flatMap(frame =>
  ['standing', 'sitting', 'kneeling', 'squatting', 'lying'].flatMap(pose =>
    ['正面 0 度', '左側 90 度', '背面 180 度'].map(orbit => ({
      ...fullCameraFixture('蟲眼視角鏡頭', { framingId: { byZh: frame }, poseBaseId: pose,
        poseArrangementId: 'model-natural-body-arrangement',
        ...(pose === 'lying' ? { poseOrientationId: 'lying-side' } : {}), orbitId: { byZh: orbit } }),
      expectedKind: pose === 'standing' ? (frame === CLOSE_WORM_FRAMES[0] ? 'medium' : 'cowboy') : 'neutral',
    }))));
export const CLOSE_WORM_EXCLUDED = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter(f => f.excluded)
  .flatMap(f => CLOSE_WORM_FRAMES.map(frame => ({ ...f, id: `close-worm/${f.id}/${frame}`,
    locks: { ...f.locks, framingId: { byZh: frame }, angleId: { byZh: '蟲眼視角鏡頭' } } })));
