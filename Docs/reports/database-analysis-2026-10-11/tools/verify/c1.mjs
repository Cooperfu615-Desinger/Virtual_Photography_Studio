import { createEmptyLocks, generatePrompts, createSeededRandom } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
import { CHARACTER_PROFILE_OPTIONS } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js';
const re = /\badult\b|\bwom[ae]n\b|\byears?[- ]old\b|\bfemale\b|\btwenties\b|\b[23]0s\b|\bgirl\b|\blady\b/i;
const ids = CHARACTER_PROFILE_OPTIONS.map(o=>o.id).filter(id=>id && id!=='none');
console.log('profiles', ids.length);
const SEEDS = ['s1','s2','s3'];
const tally = {};
const sample = {};
function add(k, hit, text){ tally[k] ??= {hit:0,total:0}; tally[k].total++; if(hit) tally[k].hit++; if(hit && !sample[k]) sample[k]=text.match(re)[0]+' :: '+text.slice(Math.max(0,text.search(re)-40), text.search(re)+40).replace(/\n/g,' '); }
for (const id of ids) for (const s of SEEDS) {
  const [p] = generatePrompts(1, { ...createEmptyLocks(), characterProfileId: id, subjectCount:'1' }, [], { random: createSeededRandom(s+id) });
  const ex = Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]));
  for (const [k,t] of Object.entries({gpt:p.grokPrompt, z:p.zImagePrompt, mj:p.midjourneyPrompt, ...ex})) add('card:'+k, re.test(t||''), t||'');
}
for (let i=0;i<60;i++){
  const [p] = generatePrompts(1, { ...createEmptyLocks(), subjectCount:'1' }, [], { random: createSeededRandom('plain'+i) });
  const ex = Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]));
  for (const [k,t] of Object.entries({gpt:p.grokPrompt, z:p.zImagePrompt, mj:p.midjourneyPrompt, ...ex})) add('plain:'+k, re.test(t||''), t||'');
}
console.log(tally); console.log(sample);
