import { getLockControls } from '../engine.js';
import { upperSceneFixture } from './zImageUpperSceneFixtures.js';
import { FULL_CAMERA_ANGLES } from './zImageFullBodyCameraFixtures.js';
import { AMBIENT_MATRIX, AMBIENT_EXCLUDED } from './ambientLightFixtures.js';

export const GPT_VISIBILITY_MATRIX = getLockControls().find(c => c.key === 'locationId').options
  // Keep the frozen pre-addition matrix stable; new scenes have their own prompt fixtures.
  .filter(o => /^(室內|戶外)：/.test(o.zh) && o.zh !== '室內：多色塊撞色背景').flatMap(o => FULL_CAMERA_ANGLES.flatMap(angle =>
    ['半臉傾斜特寫', '中景鏡頭 (Medium Shot)', '全身鏡頭 (Full Body Shot)'].map(frame =>
      upperSceneFixture(o.zh, angle, frame))));
export const GPT_VISIBILITY_ALL = [...GPT_VISIBILITY_MATRIX, ...AMBIENT_MATRIX, ...AMBIENT_EXCLUDED];
