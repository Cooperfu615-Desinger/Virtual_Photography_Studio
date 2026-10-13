// 實跑 generatePrompts：33 張角色卡 × N seeds，檢查六組輸出中的成年身份、四錨點保留、內部控制語外洩。唯讀（不寫 repo）。
import fs from 'node:fs';
const E='/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine.js';
const { createEmptyLocks, createSeededRandom, generatePrompts } = await import(E);
const { CHARACTER_PROFILE_OPTIONS:O } = await import('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/lib/engine/characterProfiles.js');
const N=Number(process.argv[3]||4);
const FIELDS={gpt:'grokPrompt',z:'zImagePrompt',ai:'midjourneyPrompt',chestGpt:'chestUpPortraitPrompt',chestMj:'chestUpMjPortraitPrompt',fullBody:'fullBodyCharacterPrompt'};
const LEAK=/signature outfit locked|locked footwear state|\blocked\b|coherent facial identity|keep the original hair identity|selected pose base|permanent identity anchors|\barrangement\b|fallback|guard\b/gi;
const stats={}; const leakEx={}; let total=0;
for(const c of O.filter(o=>o.profile)){
  const anchors=c.profile.distinctiveFeatures.split(',').map(s=>s.trim().toLowerCase());
  for(let s=0;s<N;s++){
    const [r]=generatePrompts(1,{...createEmptyLocks(), characterProfileId:c.id},[],{random:createSeededRandom(`cp-${c.id}-${s}`)});
    total++;
    for(const [k,f] of Object.entries(FIELDS)){
      const t=String(r[f]||''); const st=(stats[k]??={n:0,empty:0,adult:0,anch4:0,leak:0});
      st.n++; if(!t){st.empty++;continue;}
      if(/\b20-year-old adult\b|\badult\b/i.test(t)) st.adult++;
      const low=t.toLowerCase(); if(anchors.every(a=>low.includes(a))) st.anch4++;
      const m=[...new Set((t.match(LEAK)||[]).map(x=>x.toLowerCase()))]; if(m.length){st.leak++; for(const w of m){ (leakEx[k+':'+w]??=[]).push(c.zh);} }
    }
  }
}
const out=[`## 實跑角色卡輸出檢查 (33 卡 × ${N} seeds = ${total} 次 generatePrompts，locks 只設 characterProfileId)`,'| 輸出 | 樣本 | 空值 | 含 adult | 四錨點逐字全保留 | 含控制語 |','|---|---|---|---|---|---|'];
for(const [k,s] of Object.entries(stats)) out.push(`| ${k} (${FIELDS[k]}) | ${s.n} | ${s.empty} | ${s.adult} | ${s.anch4} | ${s.leak} |`);
out.push('\n控制語命中 (輸出:詞 → 卡數):');
for(const [k,v] of Object.entries(leakEx)) out.push(`- ${k} → ${new Set(v).size} 卡 (${v.length} 次)`);
fs.writeFileSync(process.argv[2],out.join('\n')); console.log(out.join('\n'));
