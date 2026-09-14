// Run only against the pre-visibility engine at 1209e18. Generated frozen data.
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { GPT_VISIBILITY_ALL } from '../webapp/src/lib/engine/gptSceneVisibilityFixtures.js';
import { runSceneFixture, digest, OUTPUT_FIELDS } from '../webapp/src/lib/engine/sceneIntegratedAssemblyTestSupport.js';
const dir = new URL('../webapp/src/lib/engine/', import.meta.url);
if (!execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim().startsWith('1209e18')) throw Error('Wrong baseline commit');
if (execFileSync('git', ['diff', '--', 'webapp/src/lib/engine.js'], { encoding: 'utf8' }).trim()) throw Error('Engine already changed');
const section = (text, name) => text.match(new RegExp(`(?:^|\\n\\n)${name}:\\n([^]*?)(?=\\n\\n[A-Z][^\\n]*:\\n|$)`))?.[1] || '';
const strip = text => text.replace(/(?:^|\n\n)(Scene|Lighting):\n[^]*?(?=\n\n[A-Z][^\n]*:\n|$)/g, '');
const results = GPT_VISIBILITY_ALL.map(runSceneFixture);
const scenes = [], lighting = [], intern = (a, s) => { let i = a.indexOf(s); if (i < 0) { i = a.length; a.push(s); } return i; };
const legacy = new Map();
function remember(r) {
  const s = section(r.outputs.grokPrompt, 'Scene');
  const key = JSON.stringify([r.selection.locationId, r.selection.framingId, s]);
  legacy.set(key, [r.selection.locationId, r.selection.framingId, s]);
}
results.forEach(remember);
for (const file of readdirSync(dir).filter(f => /Fixtures\.js$/.test(f) && !f.startsWith('gptSceneVisibility'))) {
  const mod = await import(new URL(file, dir));
  for (const list of Object.values(mod).filter(Array.isArray)) for (const f of list) {
    if (f?.locks && f.seed) {
      try { remember(runSceneFixture(f)); } catch { /* Non-PAGE1 fixture shape. */ }
    }
  }
}
const baseline = {
  commit: '1209e18dff8f540229a39d5bf17cde4d54acbf44', count: results.length,
  hashes: Object.fromEntries(OUTPUT_FIELDS.map(f => [f, digest(results.map(r => f === 'grokPrompt' ? strip(r.outputs[f]) : r.outputs[f]))])),
  selectionHash: digest(results.map(r => r.selection)), randomHash: digest(results.map(r => r.randomDraws)),
  indices: results.map(r => [intern(scenes, section(r.outputs.grokPrompt, 'Scene')), intern(lighting, section(r.outputs.grokPrompt, 'Lighting'))]),
  scenes, lighting,
};
writeFileSync(new URL('gptSceneVisibilityBaseline.json', dir), JSON.stringify(baseline, null, 2) + '\n');
writeFileSync(new URL('gptSceneVisibilityLegacyScenes.json', dir), JSON.stringify([...legacy.values()], null, 2) + '\n');
console.log({ count: results.length, scenes: scenes.length, lighting: lighting.length, legacy: legacy.size });
