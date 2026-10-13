import { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
const ctl = k => getLockControls().find(c=>c.key===k);
const full = ctl('framingId').options.find(o=>o.zh.includes('全身')).id;
const leakRe = /controlled by/i;
for (const key of ['outfitPresetId','dressId']) {
  const opts = ctl(key).options.filter(o=>!o.random && !/全無/.test(o.zh) && o.id!=='random');
  const per={gpt:new Set(),z:new Set(),mj:new Set()}; const zs=[];
  for (const o of opts) for (const s of ['a','b','c']) for (const fr of [null, full]) {
    const locks = { ...createEmptyLocks(), subjectCount:'1', [key]: o.id }; if (fr) locks.framingId=fr;
    const [p] = generatePrompts(1, locks, [], { random: createSeededRandom(key+o.id+s+fr) });
    for (const [k,t] of Object.entries({gpt:p.grokPrompt,z:p.zImagePrompt,mj:p.midjourneyPrompt})) if (leakRe.test(t)) per[k].add(o.zh);
    if (leakRe.test(p.zImagePrompt) && zs.length<20) zs.push(o.zh);
  }
  console.log(key, 'opts', opts.length, Object.fromEntries(Object.entries(per).map(([k,v])=>[k,v.size])), 'Z leaking:', [...per.z]);
}
