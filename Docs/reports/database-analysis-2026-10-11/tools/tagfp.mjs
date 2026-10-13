// 掃描 inferLocationMeta 的英文關鍵字是否以「子字串」而非完整字詞命中（hasAny 使用 includes）
import fs from 'node:fs';
const ROOT='/Users/cooperfu/Projects/Virtual_Photography_Studio';
const src = fs.readFileSync(ROOT+'/webapp/src/lib/engine.js','utf8').split('\n');
const body = src.slice(1713, 1805).join('\n'); // inferLocationMeta
const db = JSON.parse(fs.readFileSync(ROOT+'/webapp/src/data/database.json','utf8'));
const kws = [...new Set([...body.matchAll(/'([^']+)'/g)].map(m=>m[1]).filter(k=>/^[a-z][a-z &\-é]+$/i.test(k)))];
const res=[];
for (const [cat, arr] of Object.entries(db.Locations)) for (const e of arr) {
  const hay = [e.zh,e.en,e.desc].join(' ').toLowerCase();
  for (const k of kws) { const kl=k.toLowerCase(); let idx=hay.indexOf(kl); while(idx>=0){ const before=hay[idx-1]||' ', after=hay[idx+kl.length]||' ';
      if (/[a-z]/.test(before)||/[a-z]/.test(after)) { const w = hay.slice(Math.max(0,idx-6), idx+kl.length+6); res.push({zh:e.zh, keyword:k, context:w}); break; }
      idx=hay.indexOf(kl, idx+1);} }
}
// CJK '地下' hitting '地下室'
for (const [cat, arr] of Object.entries(db.Locations)) for (const e of arr) { if (/地下室/.test(e.desc+e.zh)) res.push({zh:e.zh, keyword:'地下', context:'地下室'}); }
console.log(JSON.stringify(res,null,0).replace(/\},\{/g,'},\n{'));
fs.writeFileSync(new URL('./tagfp.json', import.meta.url), JSON.stringify(res,null,1));
