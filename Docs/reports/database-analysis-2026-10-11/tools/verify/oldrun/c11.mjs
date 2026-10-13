const E = await import('/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js');
const ctl = k => E.getLockControls().find(c=>c.key===k);
for (const key of ['duoPoseId','duoPoseBaseId','duoInteractionId']) { const owners = ctl(key).options.filter(o=>(o.legacyIds||[]).includes('shoulder-lean')).map(o=>o.id+':'+o.zh); console.log(key,'owners of legacy shoulder-lean:', owners, 'direct id?', ctl(key).options.some(o=>o.id==='shoulder-lean')); }
for (const k of ['duoPoseId','duoPoseBaseId']) { const r = E.normalizeLocks({ subjectCount:'2', [k]:'shoulder-lean' }); console.log(k,'= shoulder-lean -> duoPoseId', r.duoPoseId, '| duoPoseBaseId', r.duoPoseBaseId); }
const r3 = E.normalizeLocks({ subjectCount:'2', duoInteractionId:'shoulder-lean' }); console.log('duoInteractionId=shoulder-lean -> duoPoseId', r3.duoPoseId);
for (const id of ['leaning-shoulders']) console.log(id, 'owners', ctl('duoPoseId').options.filter(o=>(o.legacyIds||[]).includes(id)).map(o=>o.id), '->', E.normalizeLocks({subjectCount:'2',duoPoseId:id}).duoPoseId);
