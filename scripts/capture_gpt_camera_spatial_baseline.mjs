// Freeze only before wiring the renderer. Never rewrite historical snapshots.
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { GPT_CAMERA_SPATIAL_FIXTURES } from '../webapp/src/lib/engine/gptCameraSpatialFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from '../webapp/src/lib/engine/sceneIntegratedAssemblyTestSupport.js';
const dir = new URL('../webapp/src/lib/engine/', import.meta.url);
if (!execFileSync('git', ['rev-parse', '--short', 'HEAD'], {encoding:'utf8'}).trim().startsWith('17cc411')) throw Error('Wrong checkpoint');
if (execFileSync('git', ['diff', '--', 'webapp/src/lib/engine.js'], {encoding:'utf8'}).trim()) throw Error('Engine changed');
const section = t => t.match(/(?:^|\n\n)Composition:\n([^]*?)(?=\n\n[A-Z][^\n]*:\n|$)/)?.[1] || '';
const results = GPT_CAMERA_SPATIAL_FIXTURES.map(runSceneFixture);
const originals = new Map();
function remember(r) {
  const row = [r.selection.angleId, r.selection.framingId, r.selection.poseBaseId, section(r.outputs.grokPrompt)];
  originals.set(JSON.stringify(row), row);
}
results.forEach(remember);
for (const file of readdirSync(dir).filter(f=>/Fixtures\.js$/.test(f) && !f.startsWith('gptCameraSpatial'))) {
  const mod = await import(new URL(file, dir));
  for (const list of Object.values(mod).filter(Array.isArray)) for (const f of list) if (f?.locks && f.seed) {
    try { remember(runSceneFixture(f)); } catch { /* Other fixture shapes. */ }
  }
}
writeFileSync(new URL('gptCameraSpatialBaseline.json',dir), JSON.stringify({
  commit:'17cc41150652e1e46981a0a4832f6cd556d9a977', count:results.length,
  hashes:Object.fromEntries(OUTPUT_FIELDS.map(f=>[f,digest(results.map(r=>r.outputs[f]))])),
  selectionHash:digest(results.map(r=>r.selection)), randomHash:digest(results.map(r=>r.randomDraws)),
  originals:[...originals.values()],
},null,2)+'\n');
console.log({count:results.length,originals:originals.size});
