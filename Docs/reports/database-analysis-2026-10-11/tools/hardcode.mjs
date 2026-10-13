// 統計各 catalog 條目的 zh 標籤 / 唯一 ID 在程式碼（非測試）中被硬寫引用的次數 → 衡量改名/插入成本
import fs from 'node:fs'; import path from 'node:path';
const ROOT='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src';
const files=[]; const walk=d=>{ for (const f of fs.readdirSync(d)) { const p=path.join(d,f); const s=fs.statSync(p); if (s.isDirectory()) walk(p); else if (/\.(js|jsx)$/.test(f) && !/\.test\.|TestSupport/.test(f)) files.push(p);} }; walk(ROOT);
const src = Object.fromEntries(files.map(f=>[f, fs.readFileSync(f,'utf8')]));
const db = JSON.parse(fs.readFileSync(ROOT+'/data/database.json','utf8'));
const groups = { Locations: Object.values(db.Locations).flat(), 環境光: db.CameraLighting['環境光條件 (Ambient Light Conditions)'], 光線表現: db.CameraLighting['光線表現 (Light Style)'], 攝影風格: db.Regional['攝影風格'], 底片: db.CameraLighting['底片與相機模擬 (Camera & Film Simulation)'], 光學: db.CameraLighting['光學效果 (Optical Effects)'] };
const out={};
for (const [g, arr] of Object.entries(groups)) { let referenced=0, refs=0; const fileset=new Set(); const top=[];
  for (const e of arr) { if (e.zh==='全無') continue; const needle = `'${e.zh}'`, needle2=`"${e.zh}"`; let c=0; for (const [f,s] of Object.entries(src)) { if (f.endsWith('database.json')) continue; const n=s.split(needle).length-1 + s.split(needle2).length-1; if(n){c+=n; fileset.add(path.relative(ROOT,f));} } if(c){referenced++; refs+=c; top.push([e.zh,c]);} }
  top.sort((a,b)=>b[1]-a[1]); out[g]={entries:arr.filter(e=>e.zh!=='全無').length, referencedByLabel:referenced, totalLiteralRefs:refs, files:[...fileset], top:top.slice(0,5)}; }
console.log(JSON.stringify(out,null,1));
fs.writeFileSync(new URL('./hardcode.json', import.meta.url), JSON.stringify(out,null,1));
