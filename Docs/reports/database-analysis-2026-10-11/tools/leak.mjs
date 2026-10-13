// 檢查控制語（no background structure specified / without generating a stage venue / if visible / no paper roll 等）是否出現在實際輸出
import fs from 'node:fs';
const E = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const controls = E.getLockControls(); const opt=k=>controls.find(c=>c.key===k).options;
const byZh=(k,z)=>opt(k).find(o=>o.zh===z).id;
const cases = [
 ['室內：純潔白幕','高調純白攝影棚'],['室內：純潔白幕','柔霧美妝攝影棚'],['室內：深邃黑幕','舞台演出燈光'],['室內：精品飯店房間','室內窗邊日光'],['戶外：蘇荷區招牌下','城市夜間混合光'],
];
const PHR = ['no background structure specified','without generating a stage venue','if visible','where visible','no paper roll','no light stands','no studio equipment','no wall corner','as a visible device','as a physical object','as physical objects','isolated subject'];
const report=[];
for (const [l,a] of cases) {
  const locks = {...E.createEmptyLocks(), locationId: byZh('locationId',l), lightingId: byZh('lightingId',a), subjectCount:'1'};
  const rnd = E.createSeededRandom(11);
  const [r] = E.generatePrompts(1, locks, [], {random:rnd});
  const outs = {};
  for (const [k,v] of Object.entries(r)) if (typeof v==='string' && v.length>80) outs[k]=v;
  (r.derivedPrompts||r.derived||[]).forEach?.(d=>{ if(d?.text) outs['derived:'+(d.id||d.label)]=d.text; });
  const hits = {};
  for (const [k,v] of Object.entries(outs)) { const h = PHR.filter(p=>v.toLowerCase().includes(p)); if (h.length) hits[k]=h; }
  report.push({location:l, ambient:a, outputs:Object.keys(outs), hits});
}
fs.writeFileSync(new URL('./leak.json', import.meta.url), JSON.stringify(report,null,1));
console.log(JSON.stringify(report,null,1));
