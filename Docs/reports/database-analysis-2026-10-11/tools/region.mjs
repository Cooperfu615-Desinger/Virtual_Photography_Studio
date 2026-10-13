// 修正版地域分類（以 zh 標籤 + en 地名判定；修正 法租界=上海、Soho=倫敦、廟街=香港 等）
import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json','utf8'));
const R = [
 ['日本', /日本|日式|和室|女高生|澀谷|八公|目黑川|道頓堀|心齋橋|歌舞伎町|山手線|緣側|榻榻米|辦公室茶水間|社區自動販賣機|辦公大樓人行道|電車車廂|japan|tokyo|shibuya|kabukicho|osaka|ryokan|tatami/i],
 ['香港', /九龍|興記|廟街|kowloon|hong kong/i],
 ['台灣', /台北|西門町|taipei/i],
 ['韓國', /首爾|seoul/i],
 ['中國大陸(上海)', /法租界|french concession|shanghai/i],
 ['英國', /英倫|倫敦|英式|蘇荷|Brick Lane|Shoreditch|Camden|mews|london|british|soho/i],
 ['法國', /孚日|瑪黑|paris|marais|vosges/i],
 ['義大利', /羅馬|\brome\b/i],
 ['奧地利', /hallstatt|奧地利/i],
 ['美國', /美式|曼哈頓|洛杉磯|american|manhattan|los angeles|diner|new york/i],
];
const rows=[]; const tot={}; const byCat={};
for (const [cat, arr] of Object.entries(db.Locations)) for (const e of arr) { if (e.zh==='全無') continue; const h=e.zh+' '+e.en; const hit=R.find(([k,re])=>re.test(h)); const k=hit?hit[0]:'無明確地域'; tot[k]=(tot[k]||0)+1; (byCat[cat] ||= {})[k]=(byCat[cat][k]||0)+1; rows.push([e.zh,k]); }
console.log(tot); console.log(JSON.stringify(byCat));
console.log(rows.filter(r=>r[1]==='美國'||r[1]==='英國').map(r=>r.join(':')).join(' | '));
fs.writeFileSync(new URL('./region.json', import.meta.url), JSON.stringify({tot,byCat,rows},null,1));
