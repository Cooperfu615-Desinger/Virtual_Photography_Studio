// 掃 36 環境光 × 代表場景，統計各輸出出現條件式控制語（if visible / no background structure specified / without generating）的次數
import fs from 'node:fs';
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const c=E.getLockControls(); const o=k=>c.find(x=>x.key===k).options;
const PH=/if visible|no background structure specified|without generating a stage venue/gi;
const tally={}; const examples=[];
for (const amb of o('lightingId')) { if (amb.zh==='全無') continue;
  const r0=E.getSceneDependentOptions([], {lightingId:amb.id});
  const loc = o('locationId').find(l=>l.zh!=='全無' && E.getSceneDependentOptions([], {locationId:l.id}).lightingOptions.some(x=>x.id===amb.id));
  const [r]=E.generatePrompts(1,{...E.createEmptyLocks(), subjectCount:'1', locationId:loc.id, lightingId:amb.id},[],{random:E.createSeededRandom(4)});
  if ((r.structured.Lighting||[])[0]?.id!==amb.id) continue;
  const outs={gpt:r.grokPrompt, z:r.zImagePrompt, mj:r.midjourneyPrompt}; (r.extraPrompts||[]).forEach(x=>outs[x.id]=x.text);
  for (const [k,v] of Object.entries(outs)) { const m=v.match(PH); if (m) { tally[k]=(tally[k]||0)+1; if (examples.length<6) examples.push([amb.zh, loc.zh, k, [...new Set(m)].join('|')]); } }
}
console.log(tally); console.log(examples);
fs.writeFileSync(new URL('./mjleak.json', import.meta.url), JSON.stringify({tally,examples},null,1));
