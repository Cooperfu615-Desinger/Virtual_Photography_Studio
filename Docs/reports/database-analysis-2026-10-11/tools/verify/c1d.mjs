import { createEmptyLocks, generatePrompts, createSeededRandom } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
import { CHARACTER_PROFILE_OPTIONS } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js';
const [p0] = generatePrompts(1, { ...createEmptyLocks(), characterProfileId:'character-rika' }, [], { random: createSeededRandom('x') });
console.log(Object.keys(p0), (p0.extraPrompts||[]).map(e=>e.id));
const nbKey = Object.keys(p0).find(k=>/nano|banana/i.test(k));
let hit=0,n=0;
for (const o of CHARACTER_PROFILE_OPTIONS) { if(!o.id||o.id==='none') continue; for (const s of ['s1','s2','s3']) { const [p]=generatePrompts(1,{...createEmptyLocks(),characterProfileId:o.id,subjectCount:'1'},[],{random:createSeededRandom(s+o.id)}); const t = nbKey? p[nbKey] : (p.extraPrompts.find(e=>/nano|banana/i.test(e.id))?.text||''); n++; if(/\badult\b/i.test(t)) hit++; } }
console.log('nanoBanana key', nbKey, 'adult hits', hit, '/', n);
