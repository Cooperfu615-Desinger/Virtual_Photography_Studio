const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls(); const o=k=>controls.find(c=>c.key===k).options;
const set = o('fixedCompositionSetId').find(s=>s.zh==='高級飯店落地窗都市夜景');
const tally={};
for (const amb of o('lightingId')) { const locks={...E.createEmptyLocks(), subjectCount:'1', fixedCompositionSetId:set.id, lightingId:amb.id}; const [r]=E.generatePrompts(1, locks, [], {random:E.createSeededRandom(9)}); const got=(r.structured.Lighting||[])[0]?.zh; tally[got]=(tally[got]||0)+1; }
console.log('鎖定 37 種環境光後實際輸出的環境光分佈:', tally);
