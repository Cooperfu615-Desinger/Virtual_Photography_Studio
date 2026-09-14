import { getLockControls } from '../engine.js';
import { upperSceneFixture, UPPER_SCENE_ANGLES } from './zImageUpperSceneFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from './sceneIntegratedAssemblyFixtures.js';

export const AMBIENT_MATRIX = getLockControls().find(c => c.key === 'lightingId').options
  .filter(o => !['全無', '隨機'].includes(o.zh)).flatMap(o => UPPER_SCENE_ANGLES.flatMap(angle =>
    ['中景鏡頭 (Medium Shot)', '全身鏡頭 (Full Body Shot)'].map(frame => {
      const f = upperSceneFixture('全無', angle, frame);
      return { ...f, id: `ambient/${o.zh}/${angle}/${frame}`, seed: 'ambient-v1-20260914',
        locks: { ...f.locks, sceneAttributeId: { byZh: '未指定' }, lightingId: o.id, lightDirectionId: { byZh: '全無' } } };
    })));
export const AMBIENT_EXCLUDED = SCENE_INTEGRATED_ASSEMBLY_FIXTURES.filter(f => f.excluded);
