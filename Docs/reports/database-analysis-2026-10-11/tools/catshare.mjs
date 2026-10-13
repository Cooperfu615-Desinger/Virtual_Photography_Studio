// 隨機模式下各 Locations 子類實際抽中比例（讀 randsim 結果）
import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json','utf8'));
const t = JSON.parse(fs.readFileSync(new URL('./randsim_2000_20261011.json', import.meta.url)));
const cat = {}; for (const [c,a] of Object.entries(db.Locations)) a.forEach(e=>cat[e.zh]=c);
const share={}; let tot=0; for (const [z,n] of Object.entries(t.location)) { const c=cat[z]||'(其他)'; share[c]=(share[c]||0)+n; tot+=n; }
const prefix={}; for (const [z,n] of Object.entries(t.location)) { const p=(z.match(/^(室內|戶外|其他)/)||['?'])[0]; prefix[p]=(prefix[p]||0)+n; }
console.log(Object.fromEntries(Object.entries(share).map(([k,v])=>[k, `${v} (${(v/tot*100).toFixed(1)}%)`])), prefix, tot);
