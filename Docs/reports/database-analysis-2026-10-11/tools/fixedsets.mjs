// 固定構圖場景（含車站/車廂）下環境光與光線表現的過濾情況
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls(); const sets = controls.find(c=>c.key==='fixedCompositionSetId').options;
for (const s of sets) { if (s.zh==='全無') continue; const r = E.getSceneDependentOptions([], {fixedCompositionSetId:s.id, subjectCount:'1'}); const l=r.lightingOptions.filter(x=>x.zh!=='全無').map(x=>x.zh); console.log(s.zh, '| ambient', l.length, '| dirs', r.lightDirectionOptions.filter(x=>x.zh!=='全無').length, l.includes('高調純白攝影棚')?'含高調純白攝影棚':'', l.includes('雪地冷光')?'含雪地冷光':''); }
