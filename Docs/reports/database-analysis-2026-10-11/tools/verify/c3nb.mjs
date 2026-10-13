import { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
const ctl = k => getLockControls().find(c=>c.key===k);
for (const key of ['outfitPresetId','dressId']) { const s=new Set(); let frag=0;
  for (const o of ctl(key).options.filter(o=>!o.random && !/全無/.test(o.zh))) for (const sd of ['a','b','c']) { const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',[key]:o.id},[],{random:createSeededRandom(key+o.id+sd)}); if(/controlled by/i.test(p.nanoBananaPrompt)) s.add(o.zh); if(/dominant suit\./.test(p.nanoBananaPrompt)) frag++; }
  console.log(key,'nanoBanana leaking options',s.size,'dominant suit. frag runs',frag); }
const o = ctl('outfitPresetId').options.find(x=>x.zh.includes('綁帶針織寬牛仔'));
const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',outfitPresetId:o.id,outfitPresetColorId:'light-blue'},[],{random:createSeededRandom('c4')});
console.log('NB C4:', (p.nanoBananaPrompt.match(/light blue \w+/)||['none'])[0]);
