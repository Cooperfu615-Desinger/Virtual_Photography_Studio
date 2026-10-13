const ROOT = process.env.ROOT || '/Users/cooperfu/Projects/Virtual_Photography_Studio';
const { createEmptyLocks, generatePrompts, createSeededRandom, getLockControls, getSceneDependentOptions } = await import(ROOT+'/webapp/src/lib/engine.js');
const ctl = k => getLockControls().find(c=>c.key===k);
const lights = ctl('lightingId').options.filter(o=>/攝影棚/.test(o.zh));
const sets = ctl('fixedCompositionSetId').options.filter(o=>o.id!=='none');
const keyNames = ['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'];
for (const s of sets) { const allowed = getSceneDependentOptions([], {...createEmptyLocks(),fixedCompositionSetId:s.id}).lightingOptions.map(o=>o.zh); const row=[];
  for (const L of lights) { const t={}; for (let i=0;i<5;i++){ const [p]=generatePrompts(1,{...createEmptyLocks(),subjectCount:'1',fixedCompositionSetId:s.id,lightingId:L.id},[],{random:createSeededRandom(s.id+L.id+i)});
    const outs={...Object.fromEntries(keyNames.map(k=>[k,p[k]||''])),...Object.fromEntries((p.extraPrompts||[]).map(e=>[e.id,e.text]))};
    for (const [k,v] of Object.entries(outs)) if (/no background structure specified/i.test(v)) t[k]=(t[k]||0)+1; }
    row.push(`${L.zh}[offered:${allowed.includes(L.zh)}] ${JSON.stringify(t)}`); }
  console.log(s.zh, '|', row.join(' || ')); }
