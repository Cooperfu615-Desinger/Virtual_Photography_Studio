// PAGE3 world scenes 統計，並與 PAGE1 Locations 名稱/城市重疊比對
import fs from 'node:fs';
const P = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/page3WorldScenes.js');
const db = JSON.parse(fs.readFileSync('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json','utf8'));
const W = P.WORLD_SCENE_LOCATIONS, SP = P.SPECIAL_SCENE_LOCATIONS || [];
const byCountry={}, byCity={}; W.forEach(w=>{ byCountry[w.country]=(byCountry[w.country]||0)+1; byCity[w.city]=(byCity[w.city]||0)+1; });
console.log('world', W.length, 'special', SP.length, 'generic', W.filter(w=>w.generic).length);
console.log('byCountry', byCountry); console.log('byCity', byCity);
console.log('exports', Object.keys(P));
const loc = Object.values(db.Locations).flat();
const cityKeys = { Taipei:/台北|西門町|taipei|ximending/i, 'Hong Kong':/香港|九龍|kowloon|hong kong|廟街|興記/i, Tokyo:/東京|澀谷|新宿|目黑|八公|shibuya|kabukicho|meguro|tokyo/i, Osaka:/大阪|道頓堀|osaka|dotonbori/i, Seoul:/首爾|seoul|hongdae|seongsu/i, London:/倫敦|蘇荷|brick lane|shoreditch|camden|soho|london|mews/i, Paris:/孚日|瑪黑|paris|marais|vosges/i, 'New York':/曼哈頓|manhattan|new york/i, Rome:/羅馬|rome/i, Shanghai:/法租界|shanghai|french concession/i, 'Los Angeles':/洛杉磯|los angeles/i, Hallstatt:/hallstatt/i };
const overlap = {};
for (const [city, re] of Object.entries(cityKeys)) { const p1 = loc.filter(e=>re.test(e.zh+' '+e.en)).map(e=>e.zh); const p3 = W.filter(w=>re.test([w.city,w.district,w.locationName,w.labelZh].join(' '))).map(w=>w.labelZh); overlap[city]={page1:p1.length, page3:p3.length, p3names:p3}; }
console.log(JSON.stringify(overlap,null,1));
const sample = W[0]; console.log('fields', Object.keys(sample));
const avgGuards = W.reduce((s,w)=>s+(w.realismGuards||[]).length,0)/W.length; console.log('avg realismGuards', avgGuards.toFixed(2));
const guardsAvoid = W.flatMap(w=>w.realismGuards||[]).filter(g=>/^avoid|^do not|^no /i.test(g)).length; console.log('guards starting avoid/no', guardsAvoid, 'of', W.flatMap(w=>w.realismGuards||[]).length);
fs.writeFileSync(new URL('./page3.json', import.meta.url), JSON.stringify({count:W.length, special:SP.length, byCountry, byCity, overlap},null,1));
console.log('SP sample', JSON.stringify(SP[0]).slice(0,400));
