import fs from 'node:fs';
const E = await import('/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/lib/engine.js');
const db = JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-cooperfu-Projects-Virtual-Photography-Studio/80d8f708-6d6d-4e28-951d-26f07f8bdfff/scratchpad/verify/old/webapp/src/data/database.json','utf8'));
const negEn = Object.values(db.Negative).flat().map(i=>i.en).filter(e=>e && e.length>15);
console.log('Negative cats', Object.keys(db.Negative).length, 'entries', Object.values(db.Negative).flat().length);
let hits=0; for (let i=0;i<100;i++){ const [p]=E.generatePrompts(1,E.createEmptyLocks(),[],{random:E.createSeededRandom('neg'+i)}); const all=[p.grokPrompt,p.zImagePrompt,p.midjourneyPrompt,p.nanoBananaPrompt,...p.extraPrompts.map(e=>e.text)].join('\n'); if (negEn.some(e=>all.includes(e))) hits++; }
console.log('runs with any Negative en verbatim (n=100):', hits);
