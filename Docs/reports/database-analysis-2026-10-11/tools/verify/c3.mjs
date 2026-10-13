import { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls } from '/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
const ctl = k => getLockControls().find(c=>c.key===k);
const full = ctl('framingId').options.find(o=>o.zh.includes('全身')).id;
const leakRe = /controlled by|color selection|contrast palette|outfit primary color|outfit contrast color/i;
const fragRe = /\b(?:dominant|main|secondary|tonal|contrast)\s+(?:suit|satin|fabric|color|jersey|knit|silk|latex|uniform|tulle)?\s*[.;]/i;
const outs = p => ({gpt:p.grokPrompt, z:p.zImagePrompt, mj:p.midjourneyPrompt, ...Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]))});
function run(key, colorKey, label){
  const opts = ctl(key).options.filter(o=>!o.random && !/全無/.test(o.zh) && o.id!=='random');
  const leakOpts=new Set(), fragOpts=new Set(), byOut={}, samples=[];
  for (const o of opts) for (const s of ['a','b','c']) for (const fr of [null, full]) {
    const locks = { ...createEmptyLocks(), subjectCount:'1', [key]: o.id };
    if (fr) locks.framingId = fr;
    const [p] = generatePrompts(1, locks, [], { random: createSeededRandom(label+o.id+s+fr) });
    for (const [k,t] of Object.entries(outs(p))) {
      if (leakRe.test(t)) { leakOpts.add(o.zh); byOut[k]=(byOut[k]||0)+1; if (samples.length<6) { const i=t.search(leakRe); samples.push(`${k} | ${o.zh} | ...${t.slice(Math.max(0,i-60),i+50).replace(/\n/g,' ')}`);} }
      const fm = t.match(fragRe); if (fm) { fragOpts.add(o.zh+' ['+k+'] '+t.slice(Math.max(0,fm.index-40),fm.index+fm[0].length).replace(/\n/g,' ')); }
    }
  }
  console.log(`== ${label}: options=${opts.length}, leaking options=${leakOpts.size}, leaks by output=`, byOut);
  samples.forEach(s=>console.log('  ',s));
  console.log('  frag hits', fragOpts.size); [...fragOpts].slice(0,10).forEach(s=>console.log('   F',s));
}
run('outfitPresetId', null, 'outfit');
run('dressId', null, 'dress');
