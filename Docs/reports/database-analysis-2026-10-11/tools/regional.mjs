// 攝影風格 en 中出現 C 區光線 / D 區快門鏡頭底片字詞的統計
import fs from 'node:fs';
const db = JSON.parse(fs.readFileSync('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json','utf8'));
const groups = {
 light: /\b(light|lit|lighting|glow|flash|direct-flash|daylight|sunlight|shadow|shadows|neon|nocturnal|low-light|backlight|haze)\b/gi,
 shutter: /\b(slow-shutter|shutter|motion blur|blur)\b/gi,
 filmGrain: /\b(film|grain|grainy|monochrome|black-and-white|wet-plate|polaroid)\b/gi,
 scene: /\b(street|studio|room|interior|city|urban|beach|forest|night|summer|everyday)\b/gi,
};
const rows=[];
for (const e of db.Regional['攝影風格']) { const h={}; for (const [g,re] of Object.entries(groups)) { const m=e.en.match(re); if(m) h[g]=[...new Set(m.map(x=>x.toLowerCase()))]; } rows.push({zh:e.zh, ...h}); }
const cnt = Object.fromEntries(Object.keys(groups).map(g=>[g, rows.filter(r=>r[g]).length]));
console.log(cnt); rows.forEach(r=>console.log(JSON.stringify(r)));
fs.writeFileSync(new URL('./regional.json', import.meta.url), JSON.stringify({cnt,rows},null,1));
