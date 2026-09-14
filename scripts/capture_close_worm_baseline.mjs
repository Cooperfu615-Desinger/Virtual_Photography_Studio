import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { GPT_CAMERA_SPATIAL_FIXTURES } from '../webapp/src/lib/engine/gptCameraSpatialFixtures.js';
import { CLOSE_WORM_CASES, CLOSE_WORM_EXCLUDED } from '../webapp/src/lib/engine/closeWormEyeFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from '../webapp/src/lib/engine/sceneIntegratedAssemblyTestSupport.js';
const target = new URL('../webapp/src/lib/engine/closeWormEyeBaseline.json', import.meta.url);
if (existsSync(target)) throw Error('Refusing to overwrite baseline');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!commit.startsWith('b74a432')) throw Error('Wrong checkpoint');
if (execFileSync('git', ['diff', 'HEAD', '--', 'webapp/src/lib/engine.js', 'webapp/src/lib/engine/gptCameraSpatial.js'], { encoding: 'utf8' }).trim()) throw Error('Renderer changed');
const rows = [...GPT_CAMERA_SPATIAL_FIXTURES, ...CLOSE_WORM_CASES, ...CLOSE_WORM_EXCLUDED].map(runSceneFixture);
writeFileSync(target, JSON.stringify({ commit, count: rows.length,
  hashes: Object.fromEntries(OUTPUT_FIELDS.map(f => [f, digest(rows.map(r => r.outputs[f]))])),
  selections: digest(rows.map(r => r.selection)), random: digest(rows.map(r => r.randomDraws)),
}, null, 2) + '\n');
console.log({ count: rows.length });
