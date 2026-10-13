import { createEmptyLocks, generatePrompts, createSeededRandom } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
const pats = { adult:/\badult\b/i, woman:/\bwom[ae]n\b/i, yearold:/\byears?[- ]old\b/i, female:/\bfemale\b/i };
const t={};
for (let i=0;i<60;i++){
  const [p] = generatePrompts(1, { ...createEmptyLocks(), subjectCount:'1' }, [], { random: createSeededRandom('plain'+i) });
  const ex = Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]));
  for (const [k,txt] of Object.entries({gpt:p.grokPrompt, ...ex})) { t[k] ??= Object.fromEntries(Object.keys(pats).map(x=>[x,0])); for (const [n,r] of Object.entries(pats)) if (r.test(txt)) t[k][n]++; }
  if(i===0) console.log(p.grokPrompt.match(/Subject:\n[^\n]*/)?.[0]);
}
console.table(t);
