const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const ctl = k => E.getLockControls().find(c=>c.key===k);
for (const key of ['duoPoseId','duoPoseBaseId','duoInteractionId']) { const owners = ctl(key).options.filter(o=>(o.legacyIds||[]).includes('shoulder-lean')).map(o=>o.id+':'+o.zh); console.log(key,'owners of legacy shoulder-lean:', owners, 'direct id?', ctl(key).options.some(o=>o.id==='shoulder-lean')); }
for (const k of ['duoPoseId','duoPoseBaseId']) { const r = E.normalizeLocks({ subjectCount:'2', [k]:'shoulder-lean' }); console.log(k,'= shoulder-lean -> duoPoseId', r.duoPoseId, '| duoPoseBaseId', r.duoPoseBaseId); }
const r3 = E.normalizeLocks({ subjectCount:'2', duoInteractionId:'shoulder-lean' }); console.log('duoInteractionId=shoulder-lean -> duoPoseId', r3.duoPoseId);
for (const id of ['leaning-shoulders']) console.log(id, 'owners', ctl('duoPoseId').options.filter(o=>(o.legacyIds||[]).includes(id)).map(o=>o.id), '->', E.normalizeLocks({subjectCount:'2',duoPoseId:id}).duoPoseId);
