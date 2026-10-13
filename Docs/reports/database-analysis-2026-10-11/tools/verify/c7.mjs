const ROOT = process.env.ROOT || '/Users/cooperfu/Projects/Virtual_Photography_Studio';
const { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls } = await import(ROOT+'/webapp/src/lib/engine.js');
const ctl = k => getLockControls().find(c=>c.key===k);
const sets = ctl('fixedCompositionSetId').options.filter(o=>o.id!=='none');
const keyNames = ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'];
for (const s of sets) { const t={}; let n=0;
  for (let i=0;i<20;i++){ const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',fixedCompositionSetId:s.id},[],{random:createSeededRandom(s.id+i)}); n++;
    const outs={...Object.fromEntries(keyNames.map(k=>[k,p[k]||''])),...Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]))};
    for (const [k,v] of Object.entries(outs)) if (/no background structure specified/i.test(v)) t[k]=(t[k]||0)+1; }
  console.log(s.zh, s.id, 'n=',n, JSON.stringify(t)); }
