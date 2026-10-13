import { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls } from '/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js';
const ctl = k => getLockControls().find(c=>c.key===k);
const full = ctl('framingId').options.find(o=>o.zh.includes('全身')).id;
const C = '(?:black|white|red|burgundy|pink|blue|green|yellow|purple|grey|gray|brown|beige|cream|ivory|navy|gold|silver|orange|lavender|mint|coral|cyan|olive)';
const re = new RegExp(`\\b(?:light blue|neon green|royal blue)\\s+${C}\\b`, 'i');
console.log('default outfitPresetColorId=', createEmptyLocks().outfitPresetColorId, 'primary=', createEmptyLocks().outfitPresetPrimaryColorId);
const opts = ctl('outfitPresetId').options.filter(o=>o.id.includes('outfit-presets'));
for (const [colorId] of [['light-blue']]) {
  const hits=[];
  for (const o of opts) {
    const [p] = generatePrompts(1, { ...createEmptyLocks(), subjectCount:'1', outfitPresetId:o.id, outfitPresetColorId: colorId, framingId: full }, [], { random: createSeededRandom('c4b'+o.id) });
    for (const [k,t] of Object.entries({gpt:p.grokPrompt,z:p.zImagePrompt})) { const m=t.match(re); if (m) hits.push(`${o.zh} [${k}] ${m[0]}`); }
  }
  console.log('color', colorId, 'outfit presets', opts.length, 'hits', hits.length); hits.forEach(h=>console.log('  ',h));
}
// random color default
let rnd=0, rs=[]; const re2=new RegExp(`\\bwears\\s+(?:[a-z-]+\\s){0,2}?${C}\\s+${C}\\b`,'i');
for (const o of opts) for (const s of ['x','y','z']) { const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',outfitPresetId:o.id},[],{random:createSeededRandom(s+o.id)}); const m=p.grokPrompt.match(/She wears [^,]*/); if (m && new RegExp(`${C}[a-z ]*\\s${C}\\b`,'i').test(m[0].split(' ').slice(2,6).join(' '))) { rnd++; if(rs.length<8) rs.push(o.zh+': '+m[0].slice(0,70)); } }
console.log('default-random-color runs with double color in first words:', rnd, '/', opts.length*3); rs.forEach(x=>console.log('  ',x));
