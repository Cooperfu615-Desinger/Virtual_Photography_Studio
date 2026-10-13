// Locations en 中的「守門語」片語（as a physical object 等）數量與是否進入實際輸出
import fs from 'node:fs';
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const c=E.getLockControls(); const locs=c.find(x=>x.key==='locationId').options.filter(l=>l.zh!=='全無');
const RE=/as (?:a )?(?:visible|physical) (?:objects?|device|details?)|isolated subject|no [a-z]+(?: [a-z]+)?(?=,|$)/gi;
const rows=[]; const outHits={gpt:0,z:0,mj:0,'chest-up-portrait':0,'chest-up-mj-portrait':0,'full-body-character':0};
for (const l of locs) { const m=l.en.match(RE); if(!m) continue; const phr=[...new Set(m)];
  const [r]=E.generatePrompts(1,{...E.createEmptyLocks(), subjectCount:'1', locationId:l.id},[],{random:E.createSeededRandom(2)});
  const outs={gpt:r.grokPrompt,z:r.zImagePrompt,mj:r.midjourneyPrompt}; (r.extraPrompts||[]).forEach(x=>outs[x.id]=x.text);
  const where={}; for (const [k,v] of Object.entries(outs)) { const h=phr.filter(p=>v.toLowerCase().includes(p.toLowerCase())); if(h.length){where[k]=h.length; outHits[k]=(outHits[k]||0)+1;} }
  rows.push({zh:l.zh, phrases:phr.length, sample:phr.slice(0,3), where}); }
console.log('locations with guard phrases:', rows.length); console.log('locations leaking at least one phrase, per output:', outHits);
rows.slice(0,40).forEach(r=>console.log(r.zh, r.phrases, JSON.stringify(r.sample), JSON.stringify(r.where)));
fs.writeFileSync(new URL('./guardphrases.json', import.meta.url), JSON.stringify({outHits,rows},null,1));
