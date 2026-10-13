import { createEmptyLocks, generatePrompts, createSeededRandom } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
import { CHARACTER_PROFILE_OPTIONS } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine/characterProfiles.js';
const pats = { adult:/\badult\b/i, woman:/\bwom[ae]n\b/i, yearold:/\byears?[- ]old\b/i, twenties:/\btwenties\b|\b20s\b/i, female:/\bfemale\b/i };
const ids = CHARACTER_PROFILE_OPTIONS.map(o=>o.id).filter(id=>id && id!=='none');
const t = {};
for (const id of ids) for (const s of ['s1','s2','s3']) {
  const [p] = generatePrompts(1, { ...createEmptyLocks(), characterProfileId: id, subjectCount:'1' }, [], { random: createSeededRandom(s+id) });
  const ex = Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]));
  for (const [k,txt] of Object.entries({gpt:p.grokPrompt, z:p.zImagePrompt, mj:p.midjourneyPrompt, ...ex})) {
    t[k] ??= Object.fromEntries(Object.keys(pats).map(x=>[x,0]));
    for (const [n,r] of Object.entries(pats)) if (r.test(txt)) t[k][n]++;
  }
  if (id==='character-rika' && s==='s1') { console.log('Z opening:', p.zImagePrompt.match(/[^.]*adult[^.]*\./i)?.[0]); console.log('MJ opening:', p.midjourneyPrompt.match(/[^.]*adult[^.]*\./i)?.[0]); }
}
console.log('n per output = ', ids.length*3); console.table(t);
