import { createEmptyLocks, getLockControls, generatePrompts, createSeededRandom } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
const locs = getLockControls().find(c=>c.key==='locationId').options;
const light = getLockControls().find(c=>c.key==='lightingId').options;
const [p0] = generatePrompts(1, createEmptyLocks(), [], { random: createSeededRandom('k') });
console.log('selection keys sample', Object.keys(p0.selection).filter(k=>/light|location/i.test(k)), p0.selection.lightingId);
for (const name of ['純潔白幕','漸層打光背景','多色塊撞色背景','鏡面地板攝影棚']) {
  const loc = locs.find(l=>l.zh.includes(name)); const t={};
  for (let i=0;i<200;i++){ const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',locationId:loc.id},[],{random:createSeededRandom(name+i)}); const lid=p.selection.lightingId; const z=(light.find(o=>o.id===lid)||{zh:String(lid)}).zh; t[z]=(t[z]||0)+1; }
  const daylight = Object.entries(t).filter(([k])=>/日光|天光|窗|餘光|滲入/.test(k)).reduce((a,[,v])=>a+v,0);
  console.log(name, 'n=200 daylight/window-type:', daylight, JSON.stringify(t));
}
