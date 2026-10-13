import { createEmptyLocks, getLockControls, getSceneDependentOptions, generatePrompts, createSeededRandom } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
const locs = getLockControls().find(c=>c.key==='locationId').options.filter(l=>!/全無/.test(l.zh));
const allLight = getLockControls().find(c=>c.key==='lightingId').options;
console.log('ALL lighting:', allLight.map(o=>o.zh).join(', '));
const studios = locs.filter(l=>l.id.includes('studio-sets'));
for (const s of studios) {
  const lo = getSceneDependentOptions([], { ...createEmptyLocks(), locationId:s.id }).lightingOptions.map(o=>o.zh).filter(z=>z!=='全無');
  console.log(s.zh, '| tags:', (s.meta.tags||[]).filter(t=>/studio|set/.test(t)).join(','), '| n=', lo.length, '|', lo.join(','));
}
