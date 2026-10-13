// 用法: node stats.mjs  → 輸出 stats.json 與文字摘要
import fs from 'node:fs';
const ROOT='/Users/cooperfu/Projects/Virtual_Photography_Studio';
const db = JSON.parse(fs.readFileSync(ROOT+'/webapp/src/data/database.json','utf8'));
const wc = s => (s||'').trim().split(/\s+/).filter(Boolean).length;
const stat = arr => { const a=[...arr].sort((x,y)=>x-y); const n=a.length; if(!n) return {}; const mean=a.reduce((s,x)=>s+x,0)/n; return {n,min:a[0],p25:a[Math.floor(n*.25)],median:a[Math.floor(n/2)],p75:a[Math.floor(n*.75)],max:a[n-1],mean:+mean.toFixed(1)}; };
const out = {};
const isNone = e => e.zh==='全無' || e.en==='none';
// 1. counts + word stats
out.counts = {};
for (const g of ['Locations','CameraLighting','Regional','Negative']) {
  for (const [cat, arr] of Object.entries(db[g])) {
    const real = arr.filter(e=>!isNone(e));
    out.counts[`${g}/${cat}`] = { total: arr.length, none: arr.length-real.length, real: real.length, enWords: stat(real.map(e=>wc(e.en))), descChars: stat(real.map(e=>(e.desc||'').length)) };
  }
}
// 2. guide limits
const limits = {
 'Locations/其他專屬場景 (Other Dedicated Scenes)':[10,30],
 'CameraLighting/環境光條件 (Ambient Light Conditions)':[8,24],
 'CameraLighting/光線表現 (Light Style)':[8,24],
 'CameraLighting/景別構圖 (Framing)':[6,18],
 'CameraLighting/相機視角 (Angle)':[6,18],
 'CameraLighting/拍攝方位 (Orbit Angle)':[6,18],
 'CameraLighting/鏡頭焦段 (Focal Length)':[12,24],
 'CameraLighting/光圈 / 景深 (Aperture & Depth of Field)':[10,22],
 'CameraLighting/快門 / 動態殘影 (Shutter & Motion Blur)':[10,24],
 'CameraLighting/光學效果 (Optical Effects)':[10,26],
 'CameraLighting/底片與相機模擬 (Camera & Film Simulation)':[10,24],
 'Regional/攝影風格':[14,26],
};
out.limitViolations = {};
for (const g of ['Locations','CameraLighting','Regional']) for (const [cat, arr] of Object.entries(db[g])) {
  const key=`${g}/${cat}`; let lim = limits[key];
  arr.forEach((e,i)=>{ if(isNone(e)) return; const w=wc(e.en);
    let L=lim;
    if (!L && g==='Locations') { const solid=/horizonless seamless/.test(e.en); L = solid?[12,55]:[12,35]; }
    if (!L) return;
    if (w<L[0]||w>L[1]) (out.limitViolations[key] ||= []).push({i, zh:e.zh, words:w, limit:L});
  });
}
// 3. location prefixes per subcategory
out.locPrefix = {};
for (const [cat, arr] of Object.entries(db.Locations)) {
  const m={}; arr.forEach(e=>{ const p = isNone(e)?'全無':(e.zh.match(/^(室內|戶外|其他)：/)?.[1]||'無前綴'); m[p]=(m[p]||0)+1;}); out.locPrefix[cat]=m;
}
// 4. region keywords
const regions = {
 '日本':/japan|tokyo|shibuya|kyoto|osaka|yamanote|ryokan|tatami|shoji|engawa|izakaya|konbini|日本|日式|東京|京都|澀谷|大阪|和室|山手線|緣側|居酒屋|昭和/i,
 '香港':/hong kong|kowloon|hing kee|香港|九龍|城寨|旺角|港式|興記/i,
 '台灣':/taiwan|taipei|台灣|臺灣|台北|夜市/i,
 '韓國':/korea|seoul|韓國|首爾/i,
 '中國大陸':/shanghai|beijing|上海|北京|胡同/i,
 '東南亞':/bangkok|thai|vietnam|bali|曼谷|泰國|越南|峇里/i,
 '美國':/american|new york|nyc|los angeles|brooklyn|manhattan|美式|紐約|洛杉磯|美國/i,
 '英國':/british|london|英倫|倫敦|英國/i,
 '歐陸':/paris|french|italian|europe|mediterranean|greek|santorini|amalfi|巴黎|法式|義大利|歐洲|地中海|希臘/i,
};
out.regionHits = {}; out.regionByCat = {};
for (const [cat, arr] of Object.entries(db.Locations)) arr.forEach(e=>{ if(isNone(e))return; const h=[e.zh,e.en,e.desc].join(' '); const rs=Object.entries(regions).filter(([k,r])=>r.test(h)).map(([k])=>k); const key=rs.length?rs.join('+'):'無明確地域';
  (out.regionHits[key] ||= []).push(e.zh); out.regionByCat[cat] ||= {}; out.regionByCat[cat][key]=(out.regionByCat[cat][key]||0)+1; });
// 5. time / weather / light words embedded in Locations en
const lightWords = /\b(light|lights|lit|lighting|glow|glowing|sunlight|sunlit|sunset|sunrise|dusk|dawn|night|nighttime|neon|lamp|lamps|lantern|shadow|shadows|backlit|moon|moonlit|golden hour|blue hour|rain|rainy|wet|fog|foggy|mist|misty|haze|snow|snowy|overcast|cloud|clouds|sky|daylight|evening|morning|sun)\b/gi;
const dWords = /\b(\d+mm|lens|bokeh|film grain|grain|cinematic|leica|polaroid|depth of field|shallow focus|photograph|photo|shot|camera)\b/gi;
const subjWords = /\b(subject|model|woman|girl|pose|posing|sitting|standing|leaning|wearing|dress|outfit)\b/gi;
const subjective = /\b(beautiful|stunning|elegant|cinematic|atmospheric|moody|dreamy|romantic|nostalgic|aesthetic|vibe|luxurious|perfect|gorgeous|cozy|charming|magical|serene|ethereal|iconic|stylish|chic|sexy|intimate|mysterious|melancholic|poetic|nostalgia|emotional|cool)\b/gi;
const control = /\b(no|not|avoid|without|never|do not|don't|must|instead|only|specified|generating|if visible|guard|fallback)\b/gi;
const asym = /\b(symmetrical|both sides|central road|avenue|tree-lined|lined with|perfect rows|straight corridor)\b/gi;
function scan(arr, re){ const res=[]; arr.forEach((e,i)=>{ if(isNone(e))return; const m=(e.en.match(re)||[]).map(x=>x.toLowerCase()); if(m.length) res.push({i,zh:e.zh,hits:[...new Set(m)]}); }); return res; }
const allLoc = Object.entries(db.Locations).flatMap(([cat,arr])=>arr.map(e=>({...e,cat})));
out.locLightWords = scan(allLoc, lightWords);
out.locDWords = scan(allLoc, dWords);
out.locSubjWords = scan(allLoc, subjWords);
out.locSubjective = scan(allLoc, subjective);
out.locControl = scan(allLoc, control);
out.locAsym = scan(allLoc.filter(e=>/^戶外/.test(e.zh)), asym);
const CL=db.CameraLighting;
const amb=CL['環境光條件 (Ambient Light Conditions)'], ls=CL['光線表現 (Light Style)'];
out.ambSubject = scan(amb, /\b(subject|face|skin|hair|clothing|body|key light|rim light|rim|facial|shoulder)\b/gi);
out.ambSources = scan(amb, /\b(candle|candles|lamp|lamps|streetlight|streetlights|fluorescent|led|neon|bulb|lantern|visible source|beams|shafts)\b/gi);
out.ambControl = scan(amb, control);
out.lsScene = scan(ls, /\b(sky|weather|street|room|cloud|clouds|sunset|night sky|city|interior|window|leaf|branch|surfaces|wet-surface)\b/gi);
out.lsControl = scan(ls, control);
for (const [cat, arr] of Object.entries(CL)) { const r=scan(arr, subjective); if(r.length) (out.camSubjective ||= {})[cat]=r; const c=scan(arr, control); if(c.length) (out.camControl ||= {})[cat]=c; }
out.regionalControl = scan(db.Regional['攝影風格'], control);
out.regionalSubjective = scan(db.Regional['攝影風格'], subjective);
out.regionalGear = scan(db.Regional['攝影風格'], /\b(\d+mm|leica|hasselblad|polaroid|kodak|fuji|portra|film stock|lens|camera|flash|direct-flash)\b/gi);
// CJK in en, latin-only zh
out.cjkInEn = []; for (const g of ['Locations','CameraLighting','Regional','Negative']) for (const [cat, arr] of Object.entries(db[g])) arr.forEach((e,i)=>{ if(/[一-鿿]/.test(e.en)) out.cjkInEn.push({cat,i,zh:e.zh}); if(!e.desc) (out.emptyDesc ||= []).push({cat,i,zh:e.zh}); });
// duplicates zh / en
const dupe = (arr,key)=>{ const m={}; arr.forEach(e=>{ m[e[key]]=(m[e[key]]||0)+1;}); return Object.entries(m).filter(([k,v])=>v>1&&k!=='全無'&&k!=='none'); };
out.dupLocZh = dupe(allLoc,'zh'); out.dupLocEn = dupe(allLoc,'en');
// 6. shared opening across solid studios
out.solidStudioCount = allLoc.filter(e=>/horizonless seamless/.test(e.en)).length;
fs.writeFileSync(new URL('./stats.json', import.meta.url), JSON.stringify(out,null,1));
console.log(JSON.stringify(out.counts,null,0).replace(/\},"/g,'},\n"'));
console.log('limitViolations', Object.fromEntries(Object.entries(out.limitViolations).map(([k,v])=>[k,v.length])));
console.log('locPrefix', JSON.stringify(out.locPrefix));
console.log('regionByCat', JSON.stringify(out.regionByCat));
console.log('regionTotals', JSON.stringify(Object.fromEntries(Object.entries(out.regionHits).map(([k,v])=>[k,v.length]))));
for (const k of ['locLightWords','locDWords','locSubjWords','locSubjective','locControl','locAsym','ambSubject','ambSources','ambControl','lsScene','lsControl','regionalControl','regionalSubjective','regionalGear','cjkInEn','emptyDesc','dupLocZh','dupLocEn']) console.log(k, (out[k]||[]).length);
console.log('solidStudio', out.solidStudioCount);
