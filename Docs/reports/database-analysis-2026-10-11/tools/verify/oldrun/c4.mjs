import { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
const ctl = k => getLockControls().find(c=>c.key===k);
const full = ctl('framingId').options.find(o=>o.zh.includes('全身')).id;
const o = ctl('outfitPresetId').options.find(x=>x.zh.includes('綁帶針織寬牛仔'));
const spider = ctl('outfitPresetId').options.find(x=>x.zh.includes('Spider'));
console.log(o.id, '|', o.en);
console.log('color opts', ctl('outfitPresetColorId').options.map(x=>x.id+':'+x.zh).join(', '));
for (const ck of ['outfitPresetColorId','outfitPresetPrimaryColorId']) for (const preset of [o, spider]) {
  const lb = ctl(ck).options.find(x=>x.zh.includes('淺藍')||x.id.includes('light-blue')) || ctl(ck).options[3];
  const [p] = generatePrompts(1, { ...createEmptyLocks(), subjectCount:'1', outfitPresetId: preset.id, [ck]: lb.id, framingId: full }, [], { random: createSeededRandom('c4') });
  for (const [k,t] of Object.entries({gpt:p.grokPrompt,z:p.zImagePrompt,mj:p.midjourneyPrompt})) {
    const m = t.match(/[^.\n]*(cardigan|bodysuit|Spider)[^.\n]*/i);
    console.log(ck, preset.zh, lb.zh, k, '=>', m?.[0]?.slice(0,200));
  }
}
