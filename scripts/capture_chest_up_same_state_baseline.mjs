// Run only when reviewing an intentional chest contract change. Pass a clean
// pre-change checkout to prove the other four outputs, selections and RNG match.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runSceneFixture } from '../webapp/src/lib/engine/sceneIntegratedAssemblyTestSupport.js';
import { measureChestUpRevision } from '../webapp/src/lib/engine/chestUpSameStateTestSupport.js';
import { AMBIENT_MATRIX, AMBIENT_EXCLUDED } from '../webapp/src/lib/engine/ambientLightFixtures.js';
import { GPT_CAMERA_SPATIAL_FIXTURES } from '../webapp/src/lib/engine/gptCameraSpatialFixtures.js';
import { CLOSE_WORM_CASES, CLOSE_WORM_EXCLUDED } from '../webapp/src/lib/engine/closeWormEyeFixtures.js';
import { GPT_VISIBILITY_ALL } from '../webapp/src/lib/engine/gptSceneVisibilityFixtures.js';
import { FULL_CAMERA_REGRESSION } from '../webapp/src/lib/engine/zImageFullBodyCameraFixtures.js';
import { SCENE_DETAIL_PRIORITY_REGRESSION } from '../webapp/src/lib/engine/zImageSceneDetailPriorityFixtures.js';
import { UPPER_SCENE_MATRIX, UPPER_SCENE_EXCLUDED, UPPER_SCENE_CONTROLS } from '../webapp/src/lib/engine/zImageUpperSceneFixtures.js';
import { UPPER_SCENE_EXTENSION_REGRESSION } from '../webapp/src/lib/engine/zImageUpperSceneExtensionFixtures.js';
import { SCENE_INTEGRATED_ASSEMBLY_FIXTURES } from '../webapp/src/lib/engine/sceneIntegratedAssemblyFixtures.js';

assert.ok(process.argv[2], 'Pass the pre-change checkout root');
const { runSceneFixture: runBefore } = await import(pathToFileURL(resolve(process.argv[2], 'webapp/src/lib/engine/sceneIntegratedAssemblyTestSupport.js')));
const groups = {
  ambient: AMBIENT_MATRIX,
  camera: GPT_CAMERA_SPATIAL_FIXTURES,
  worm: [...GPT_CAMERA_SPATIAL_FIXTURES, ...CLOSE_WORM_CASES, ...CLOSE_WORM_EXCLUDED],
  visibility: GPT_VISIBILITY_ALL,
  fullCamera: FULL_CAMERA_REGRESSION,
  sceneDetail: SCENE_DETAIL_PRIORITY_REGRESSION,
  upperScene: [...UPPER_SCENE_MATRIX, ...UPPER_SCENE_EXCLUDED, ...UPPER_SCENE_CONTROLS],
  upperExtension: UPPER_SCENE_EXTENSION_REGRESSION,
  ...Object.fromEntries(AMBIENT_EXCLUDED.map(f => [`ambient-excluded:${f.id}`, [f]])),
  ...Object.fromEntries(SCENE_INTEGRATED_ASSEMBLY_FIXTURES.map(f => [`scene:${f.id}`, [f]])),
};
const cache = new Map();
const result = { version: 1, purpose: 'Chest-only revision; protected outputs, selections and random draws verified against pre-change checkout', groups: {} };
for (const [name, fixtures] of Object.entries(groups)) {
  const pairs = fixtures.map(f => {
    const key = JSON.stringify([f.seed, f.locks]);
    if (!cache.has(key)) cache.set(key, { before: runBefore(f), after: runSceneFixture(f) });
    return cache.get(key);
  });
  const before = measureChestUpRevision(pairs.map(r => r.before));
  const after = measureChestUpRevision(pairs.map(r => r.after));
  for (const key of ['count', 'protectedHash', 'selectionHash', 'randomHash']) assert.equal(after[key], before[key], `${name}: ${key}`);
  result.groups[name] = after;
  console.log(`${name}: ${fixtures.length} cases, protected state unchanged`);
}
writeFileSync(new URL('../webapp/src/lib/engine/chestUpSameStateBaseline.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
