import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMPOSITION_VISIBILITY_BUCKETS } from './compositionVisibilityContract.js';
import {
  Z_IMAGE_TURBO_CAMERA_ORBIT_KEYS,
  buildZImageTurboCameraGeometry,
} from './zImageTurboCameraGeometry.js';

const orbit = (zh) => ({ zh });

test('Z-Image Turbo camera geometry covers all eight public orbit directions', () => {
  const cases = [
    ['正面 0 度', /directly from the front[\s\S]*chest and pelvis face the lens/i],
    ['左前 45 度', /front-left side[\s\S]*left shoulder and left hip are nearer the lens/i],
    ['左側 90 度', /facing the right edge[\s\S]*only the left side of her body[\s\S]*left shoulder fully hides her right shoulder/i],
    ['左後 135 度', /rear-left side[\s\S]*left shoulder blade and left hip are nearer the lens/i],
    ['背面 180 度', /directly from behind[\s\S]*back, rear shoulders, and rear pelvis face the lens/i],
    ['右後 225 度', /rear-right side[\s\S]*right shoulder blade and right hip are nearer the lens/i],
    ['右側 270 度', /facing the left edge[\s\S]*only the right side of her body[\s\S]*right shoulder fully hides her left shoulder/i],
    ['右前 315 度', /front-right side[\s\S]*right shoulder and right hip are nearer the lens/i],
  ];

  assert.equal(Z_IMAGE_TURBO_CAMERA_ORBIT_KEYS.length, 8);
  for (const [zh, expected] of cases) {
    assert.match(
      buildZImageTurboCameraGeometry({
        orbit: orbit(zh),
        bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
      }),
      expected,
      zh
    );
  }
});

test('Z-Image Turbo camera geometry uses only crop-visible body anchors', () => {
  const rightSide = orbit('右側 270 度');
  const face = buildZImageTurboCameraGeometry({
    orbit: rightSide,
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FACE_DETAIL,
  });
  const chest = buildZImageTurboCameraGeometry({
    orbit: rightSide,
    bucket: COMPOSITION_VISIBILITY_BUCKETS.CHEST_UP,
  });
  const medium = buildZImageTurboCameraGeometry({
    orbit: rightSide,
    bucket: COMPOSITION_VISIBILITY_BUCKETS.MEDIUM_WAIST,
  });
  const cowboy = buildZImageTurboCameraGeometry({
    orbit: rightSide,
    bucket: COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  });
  const full = buildZImageTurboCameraGeometry({
    orbit: rightSide,
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  assert.match(face, /facing the left edge[\s\S]*only the right side of her face[\s\S]*nose, lips, and chin[\s\S]*strict 90-degree lateral facial view/i);
  assert.doesNotMatch(face, /shoulder|torso|hip|leg|feet/i);
  assert.match(chest, /only the right side of her upper body[\s\S]*right shoulder fully hides her left shoulder[\s\S]*head to upper torso[\s\S]*strict 90-degree lateral body view/i);
  assert.doesNotMatch(chest, /hip|thigh|leg|feet/i);
  assert.match(medium, /right shoulder fully hides her left shoulder[\s\S]*head to waist[\s\S]*strict 90-degree lateral body view/i);
  assert.doesNotMatch(medium, /hip|thigh|leg|feet/i);
  assert.match(cowboy, /right shoulder fully hides her left shoulder[\s\S]*right hip fully hides her left hip[\s\S]*head to mid-thigh[\s\S]*strict 90-degree lateral body view/i);
  assert.doesNotMatch(cowboy, /feet/i);
  assert.match(full, /right shoulder fully hides her left shoulder[\s\S]*right hip fully hides her left hip[\s\S]*head to feet[\s\S]*strict 90-degree lateral body view/i);
});

test('left and right 90-degree side templates use mirrored image-edge and visible-side geometry', () => {
  const left = buildZImageTurboCameraGeometry({
    orbit: orbit('左側 90 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });
  const right = buildZImageTurboCameraGeometry({
    orbit: orbit('右側 270 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  assert.match(left, /facing the right edge of the image/i);
  assert.match(left, /camera sees only the left side of her body/i);
  assert.match(left, /left shoulder fully hides her right shoulder/i);
  assert.match(left, /left hip fully hides her right hip/i);
  assert.match(right, /facing the left edge of the image/i);
  assert.match(right, /camera sees only the right side of her body/i);
  assert.match(right, /right shoulder fully hides her left shoulder/i);
  assert.match(right, /right hip fully hides her left hip/i);
  assert.match(left, /strict 90-degree lateral body view/i);
  assert.match(right, /strict 90-degree lateral body view/i);
});

test('high and low camera positions use explicit camera subjects and crop-visible perspective evidence', () => {
  const highCowboy = buildZImageTurboCameraGeometry({
    angle: { zh: '高位俯視鏡頭' },
    orbit: orbit('右側 270 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.COWBOY_KNEE,
  });
  const lowFull = buildZImageTurboCameraGeometry({
    angle: { zh: '地面高度鏡頭' },
    orbit: orbit('正面 0 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  assert.match(highCowboy, /^The camera is positioned clearly above the woman and tilted downward toward her, revealing the top planes of her shoulders and waistband\./i);
  assert.doesNotMatch(highCowboy, /high angle, looking down/i);
  assert.match(lowFull, /^The camera is positioned near floor level and tilted upward toward the woman, emphasizing the upward perspective through her legs, torso, and shoulders\./i);
});

test('missing and none orbit selections do not invent camera geometry', () => {
  assert.equal(buildZImageTurboCameraGeometry({ orbit: null }), '');
  assert.equal(buildZImageTurboCameraGeometry({ orbit: orbit('全無') }), '');
});

test('dedicated special subjects use neutral camera geometry language', () => {
  const geometry = buildZImageTurboCameraGeometry({
    orbit: orbit('右側 270 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
    subjectKind: 'subject',
  });

  assert.match(geometry, /right side of the subject's body/i);
  assert.match(geometry, /subject's right shoulder[\s\S]*subject's right hip/i);
  assert.doesNotMatch(geometry, /woman|\bher\b/i);
});
