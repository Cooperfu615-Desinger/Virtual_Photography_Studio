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
    ['左側 90 度', /woman's left side[\s\S]*near left shoulder visually overlaps the far right shoulder/i],
    ['左後 135 度', /rear-left side[\s\S]*left shoulder blade and left hip are nearer the lens/i],
    ['背面 180 度', /directly from behind[\s\S]*back, rear shoulders, and rear pelvis face the lens/i],
    ['右後 225 度', /rear-right side[\s\S]*right shoulder blade and right hip are nearer the lens/i],
    ['右側 270 度', /woman's right side[\s\S]*near right shoulder visually overlaps the far left shoulder/i],
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

  assert.match(face, /nose, lips, and chin[\s\S]*strict 90-degree right facial profile/i);
  assert.doesNotMatch(face, /shoulder|torso|hip|leg|feet/i);
  assert.match(chest, /near right shoulder visually overlaps the far left shoulder[\s\S]*upper torso[\s\S]*strict 90-degree right-side profile/i);
  assert.doesNotMatch(chest, /hip|thigh|leg|feet/i);
  assert.match(medium, /near right shoulder visually overlaps the far left shoulder[\s\S]*ribcage and waist[\s\S]*strict 90-degree right-side profile/i);
  assert.doesNotMatch(medium, /hip|thigh|leg|feet/i);
  assert.match(cowboy, /near right shoulder visually overlaps the far left shoulder[\s\S]*near right hip visually overlaps the far left hip[\s\S]*torso, pelvis, and thighs[\s\S]*strict 90-degree right-side profile/i);
  assert.doesNotMatch(cowboy, /feet/i);
  assert.match(full, /near right shoulder visually overlaps the far left shoulder[\s\S]*near right hip visually overlaps the far left hip[\s\S]*torso, pelvis, legs, and feet[\s\S]*strict 90-degree right-side profile/i);
});

test('left and right 90-degree side templates use mirrored near-far overlap geometry', () => {
  const left = buildZImageTurboCameraGeometry({
    orbit: orbit('左側 90 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });
  const right = buildZImageTurboCameraGeometry({
    orbit: orbit('右側 270 度'),
    bucket: COMPOSITION_VISIBILITY_BUCKETS.FULL_BODY,
  });

  assert.match(left, /near left shoulder visually overlaps the far right shoulder/i);
  assert.match(left, /near left hip visually overlaps the far right hip/i);
  assert.match(left, /strict 90-degree left-side profile/i);
  assert.match(right, /near right shoulder visually overlaps the far left shoulder/i);
  assert.match(right, /near right hip visually overlaps the far left hip/i);
  assert.match(right, /strict 90-degree right-side profile/i);
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

  assert.match(geometry, /subject's right side/i);
  assert.match(geometry, /subject's near right shoulder[\s\S]*subject's near right hip/i);
  assert.doesNotMatch(geometry, /woman|\bher\b/i);
});
