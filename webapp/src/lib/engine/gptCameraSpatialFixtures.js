import { FULL_CAMERA_REGRESSION, FULL_CAMERA_MATRIX } from './zImageFullBodyCameraFixtures.js';
import { GPT_VISIBILITY_ALL } from './gptSceneVisibilityFixtures.js';

export const GPT_CAMERA_SPATIAL_FIXTURES = [
  ...FULL_CAMERA_REGRESSION,
  ...FULL_CAMERA_MATRIX.flatMap(f => ['半臉傾斜特寫', '特寫鏡頭 (Close-Up)', '胸上特寫', '中景鏡頭 (Medium Shot)', '牛仔中景 (Cowboy Shot)'].map(frame => ({
    ...f, id: `gpt-spatial/${f.id}/${frame}`, locks: { ...f.locks, framingId: { byZh: frame } },
  }))),
  ...GPT_VISIBILITY_ALL,
];
