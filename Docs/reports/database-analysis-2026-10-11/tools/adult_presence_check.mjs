// 實跑：一般隨機單人 vs 角色卡，六組輸出中年齡/成人/女性身份字樣出現率。唯讀。
import fs from 'node:fs';
const { createEmptyLocks, createSeededRandom, generatePrompts } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js');
const { CHARACTER_PROFILE_OPTIONS:O } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js');
const outs=r=>({gpt:r.grokPrompt,z:r.zImagePrompt,ai:r.midjourneyPrompt,...Object.fromEntries((r.extraPrompts||[]).map(e=>[e.id,e.text]))});
const RX={adult:/\badult\b/i, age:/\b\d{2}-year-old\b/i, woman:/\b(woman|women|female)\b/i};
function run(label,mk,n){ const st={}; for(let i=0;i<n;i++){ const [r]=generatePrompts(1,mk(i),[],{random:createSeededRandom(label+i)}); for(const [k,t] of Object.entries(outs(r))){ const s=(st[k]??={n:0,empty:0,adult:0,age:0,woman:0,none:0}); s.n++; if(!t){s.empty++;continue;} let any=false; for(const [w,rx] of Object.entries(RX)) if(rx.test(t)){s[w]++;any=true;} if(!any) s.none++; } } return st; }
const cards=O.filter(o=>o.profile).map(o=>o.id);
const res={ '一般單人隨機(60)':run('plain',()=>createEmptyLocks(),60), '角色卡(33×2)':run('card',i=>({...createEmptyLocks(),characterProfileId:cards[i%33]}),66) };
const lines=['| 情境 | 輸出 | 有效樣本 | 含 adult | 含 NN-year-old | 含 woman/female | 三者皆無 |','|---|---|---|---|---|---|---|'];
for(const [l,st] of Object.entries(res)) for(const [k,s] of Object.entries(st)) lines.push(`| ${l} | ${k} | ${s.n-s.empty} | ${s.adult} | ${s.age} | ${s.woman} | ${s.none} |`);
fs.writeFileSync(process.argv[2],lines.join('\n')); console.log(lines.join('\n'));
