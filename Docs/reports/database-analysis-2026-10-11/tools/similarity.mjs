// 以 en 欄位計算 TF-IDF cosine 與 token Jaccard，列出各分類最相近的條目對
import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json','utf8'));
const STOP = new Set('a an the and or of on in at to with by for from as into across along near under over behind one two its is are be any'.split(' '));
const tok = s => (s.toLowerCase().match(/[a-z0-9][a-z0-9\-']*/g)||[]).filter(w=>!STOP.has(w));
function analyze(name, items, topN=10){
  const docs = items.map(e=>tok(e.en)); const N=docs.length; const df={};
  docs.forEach(d=>new Set(d).forEach(w=>df[w]=(df[w]||0)+1));
  const vec = docs.map(d=>{ const tf={}; d.forEach(w=>tf[w]=(tf[w]||0)+1); const v={}; let n=0; for(const w in tf){ v[w]=tf[w]*Math.log((N+1)/(df[w]+1)+1); n+=v[w]**2;} n=Math.sqrt(n)||1; for(const w in v) v[w]/=n; return v;});
  const pairs=[];
  for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){ let c=0; for(const w in vec[i]) if(vec[j][w]) c+=vec[i][w]*vec[j][w];
    const A=new Set(docs[i]),B=new Set(docs[j]); let inter=0; A.forEach(w=>{if(B.has(w))inter++;}); const jac=inter/(A.size+B.size-inter||1);
    pairs.push({a:items[i].zh,b:items[j].zh,cos:+c.toFixed(3),jac:+jac.toFixed(3)}); }
  pairs.sort((x,y)=>y.cos-x.cos);
  const hist = {'>=0.8':0,'0.6-0.8':0,'0.4-0.6':0}; pairs.forEach(p=>{ if(p.cos>=0.8) hist['>=0.8']++; else if(p.cos>=0.6) hist['0.6-0.8']++; else if(p.cos>=0.4) hist['0.4-0.6']++; });
  return {name, n:N, pairCount:pairs.length, hist, top:pairs.slice(0,topN)};
}
const none = e=>e.zh==='全無'||e.en==='none';
const allLoc = Object.values(db.Locations).flat().filter(e=>!none(e));
const solid = e=>/horizonless seamless/.test(e.en);
const CL = db.CameraLighting;
const results = [
  analyze('Locations（排除 12 條無縫色場模板）', allLoc.filter(e=>!solid(e)), 15),
  analyze('Locations 無縫色場模板 12 條', allLoc.filter(solid), 3),
  analyze('環境光條件', CL['環境光條件 (Ambient Light Conditions)'].filter(e=>!none(e)), 10),
  analyze('光線表現', CL['光線表現 (Light Style)'].filter(e=>!none(e)), 10),
  analyze('底片與相機模擬', CL['底片與相機模擬 (Camera & Film Simulation)'].filter(e=>!none(e)), 8),
  analyze('光學效果', CL['光學效果 (Optical Effects)'].filter(e=>!none(e)), 6),
  analyze('攝影風格', db.Regional['攝影風格'], 6),
  analyze('鏡頭焦段', CL['鏡頭焦段 (Focal Length)'].filter(e=>!none(e)), 4),
];
fs.writeFileSync(new URL('./similarity.json', import.meta.url), JSON.stringify(results,null,1));
for (const r of results){ console.log(`\n## ${r.name} n=${r.n} pairs=${r.pairCount} hist=${JSON.stringify(r.hist)}`); r.top.forEach(p=>console.log(`  ${p.cos}\tjac ${p.jac}\t${p.a}  <->  ${p.b}`)); }
// zh family clusters (共同前綴)
const fam = {}; allLoc.forEach(e=>{ const z=e.zh.replace(/^(室內|戶外|其他)：/,''); const m=z.match(/^(廢棄水泥工廠|地下排洪道|廢棄校舍|廢棄商場|高樓建築骨架|木造圖書館|洗衣店|九龍城寨|興記煲仔飯店|新宿歌舞伎町|蘇荷區|法租界|羅馬老城|曼哈頓|澀谷站前|電車車廂|孚日廣場|首爾|廢棄(手術室|病房|藥品室|診療室))/); if(m){ const k=m[1].startsWith('廢棄')&&/手術室|病房|藥品室|診療室/.test(m[1])?'廢棄醫療':m[1]; (fam[k] ||= []).push(z);} });
console.log('\n## 同地點家族（zh 共同前綴）'); let tot=0; for (const [k,v] of Object.entries(fam).sort((a,b)=>b[1].length-a[1].length)){ tot+=v.length; console.log(' ',k, v.length); } console.log('  total in families', tot, 'of', allLoc.length);
fs.writeFileSync(new URL('./families.json', import.meta.url), JSON.stringify(fam,null,1));
