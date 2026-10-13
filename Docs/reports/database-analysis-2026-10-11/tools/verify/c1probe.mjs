import { createEmptyLocks, generatePrompts, createSeededRandom } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
const [p] = generatePrompts(1, { ...createEmptyLocks(), characterProfileId: 'character-rika' }, [], { random: createSeededRandom('c1') });
console.log(Object.keys(p));
console.log((p.extraPrompts||[]).map(e=>[e.id, Object.keys(e)]));
console.log('GPT:\n', p.grokPrompt.slice(0,800));
