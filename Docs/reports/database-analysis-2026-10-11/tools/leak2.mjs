const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls(); const opt=k=>controls.find(c=>c.key===k).options;
const byZh=(k,z)=>opt(k).find(o=>o.zh===z).id;
const [l,a]=process.argv.slice(2);
const locks = {...E.createEmptyLocks(), locationId: byZh('locationId',l), lightingId: a?byZh('lightingId',a):'', subjectCount:'1'};
const [r] = E.generatePrompts(1, locks, [], {random:E.createSeededRandom(11)});
console.log(Object.keys(r));
const flat=[]; const walk=(o,p)=>{ if(typeof o==='string'&&o.length>60) flat.push([p,o]); else if(o&&typeof o==='object') for(const [k,v] of Object.entries(o)) if(!['structured','selection'].includes(k)) walk(v,p+'.'+k); }; walk(r,'');
for (const [p,s] of flat) { const re=/(no [a-z ]{3,30}|if visible|where visible|without [a-z ]{3,30}|as a visible device|as a physical object|as physical objects|isolated subject)/gi; const m=s.match(re); console.log(p, s.length, m?[...new Set(m)].join(' | '):''); }
if (process.argv[4]) for (const [p,s] of flat) if (p.includes(process.argv[4])) console.log('\n'+p+'\n'+s);
